import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, Http404, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.serializers import serialize
from django.contrib.gis.geos import GEOSGeometry
from django.forms.models import model_to_dict
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from .forms import LoginForm, TextInputForm
from django_loci.models import Location, FloorPlan
from .models import Room, TextInput

def user_login(request):
    if request.method == "POST":
        form = LoginForm(request.POST)
        if form.is_valid():
            cd = form.cleaned_data
            user = authenticate(request, username=cd['username'], password=cd['password'])
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return redirect('workplaces_map:index')
                else:
                    return HttpResponse('Disabled account')
            else:
                return HttpResponse('Invalid login')
    else:
        form = LoginForm()
    return render(request, 'login.html', {'form': form})

def index(request):
    if not request.user.is_authenticated:
        return redirect('workplaces_map:user_login')
    return render(request, 'index.html')

@login_required
def locations_data(request):
    # locations = Location.objects.values().exclude('geometry')
    locations = Location.objects.values('id', 'created', 'modified', 'name', 'type', 'is_mobile', 'address')
    return JsonResponse(list(locations), safe=False)

@login_required
def floorplan_data(request, location_id):
    floorplans = FloorPlan.objects.filter(location_id=location_id).values()
    return JsonResponse(list(floorplans), safe=False)

@csrf_exempt
def save_room_data(request, location_id, floorplan_id):
    if request.method == 'POST':
        try:
            geometry_data = json.loads(request.body)
            floorplan = FloorPlan.objects.get(id=floorplan_id, location_id=location_id)
            geometry = GEOSGeometry(json.dumps(geometry_data))
            room = Room(floorplan=floorplan, geometry=geometry)  # Pass the GEOS geometry object instead of the dictionary
            room.save()

            # Serialize the Room object using Django's serialize function
            # This function returns a string, so we need to convert it back to a dictionary
            room_data = serialize('json', [room])
            room_data = json.loads(room_data)[0]  # Convert the serialized data back to a dictionary

            # Rename 'pk' to 'id' for consistency
            room_data['fields']['id'] = room_data['pk']
            del room_data['pk']

            return JsonResponse({'status': 'success', 'room': room_data}, status=200)
        except (json.JSONDecodeError, KeyError, FloorPlan.DoesNotExist):
            return JsonResponse({'status': 'failure', 'error': 'Invalid data or floorplan not found'}, status=400)
    else:
        return JsonResponse({'status': 'failure', 'error': 'Invalid request method'}, status=400)

@login_required
def add_unique_ids_to_geojson(geojson_string):
    geojson_data = json.loads(geojson_string)
    for feature in geojson_data['features']:
        feature['id'] = str(feature['properties']['id'])
    return json.dumps(geojson_data)

import datetime

@login_required
def room_data(request, location_id, floorplan_id):
    rooms = Room.objects.filter(floorplan__id=floorplan_id)
    geojson_data = {
        'type': 'FeatureCollection',
        'features': []
    }

    for room in rooms:
        serialized_geometry = json.loads(serialize('geojson', [room], fields=('geometry',)))
        room_dict = model_to_dict(room, fields=('id', 'room_name', 'room_type', 'workers_count', 'last_contacted', 'follow_up_needed', 'notes'))
        room_dict['geometry'] = serialized_geometry['features'][0]['geometry'] if serialized_geometry['features'] else None
        if room_dict['last_contacted']:
            room_dict['last_contacted'] = room_dict['last_contacted'].strftime("%Y-%m-%d")
        geojson_feature = {
            'type': 'Feature',
            'properties': room_dict,
            'geometry': room_dict['geometry']
        }
        geojson_data['features'].append(geojson_feature)

    return HttpResponse(json.dumps(geojson_data), content_type='application/json')


@csrf_exempt
def room_detail_data(request, location_id, floorplan_id, room_id):
    """
    A GET request will return the details of the specified room, and a POST request
    will update the room's details. If a POST request provides a new value for a
    room detail, that detail will be updated. Otherwise, the detail will remain
    unchanged.
    """
    try:
        room = Room.objects.get(id=room_id, floorplan_id=floorplan_id)
    except Room.DoesNotExist:
        raise Http404("Room does not exist")

    if request.method == 'GET':
        # Return the room details as properties of a GeoJSON feature
        room_data = serialize('geojson', [room], geometry_field='geometry', fields=('id', 'room_name', 'room_type', 'workers_count', 'last_contacted', 'follow_up_needed', 'notes'))
        return HttpResponse(room_data, content_type='application/json')

    elif request.method == 'POST':
        # Update the room details
        data = json.loads(request.body)
        room.room_name = data.get('room_name', room.room_name) if data.get('room_name', room.room_name) != '' else ''
        room.room_type = data.get('room_type', room.room_type) if data.get('room_type', room.room_type) != '' else 'OF'
        workers_count = data.get('workers_count', room.workers_count)
        room.workers_count = None if workers_count == '' else int(workers_count)
        last_contacted = data.get('last_contacted', room.last_contacted)
        room.last_contacted = None if last_contacted == '' else last_contacted
        room.follow_up_needed = data.get('follow_up_needed', room.follow_up_needed)
        room.notes = data.get('notes', room.notes) if data.get('notes', room.notes) != '' else ''
        # if 'geometry' in data:
        #     room.geometry = GEOSGeometry(json.dumps(data['geometry']))
        room.save()
        return JsonResponse({'status': 'success'}, status=200)
    elif request.method == 'DELETE':
        room.delete()
        return JsonResponse({'status': 'success'}, status=200)
    else:
        return JsonResponse({'status': 'failure', 'error': 'Invalid request method'}, status=400)

def room_types(request):
    if request.method == 'GET':
        return JsonResponse(dict(Room.ROOM_TYPES), safe=False)
    else:
        return JsonResponse({'status': 'failure', 'error': 'Invalid request method'}, status=400)

### ### ###
@login_required
def text_input(request):
    if request.method == 'POST':
        form = TextInputForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('workplaces_map:text_input')

    else:
        form = TextInputForm()

    previous_entries = TextInput.objects.all().order_by('-created_at')
    return render(request, 'text_input.html', {'form': form, 'previous_entries': previous_entries})
