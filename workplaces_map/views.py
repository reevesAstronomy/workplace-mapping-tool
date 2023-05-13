import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django_loci.models import Location, FloorPlan
from .models import Room

def index(request):
    return render(request, 'index.html')

def locations_data(request):
    # locations = Location.objects.values().exclude('geometry')
    locations = Location.objects.values('id', 'created', 'modified', 'name', 'type', 'is_mobile', 'address')
    return JsonResponse(list(locations), safe=False)

def floorplan_data(request, location_id):
    floorplans = FloorPlan.objects.filter(location_id=location_id).values()
    return JsonResponse(list(floorplans), safe=False)

@csrf_exempt
def save_room_data(request, location_id, floorplan_id):

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            floorplan = FloorPlan.objects.get(id=floorplan_id, location_id=location_id)
            room = Room(floorplan=floorplan, geometry=data)
            room.save()
            return JsonResponse({'status': 'success'}, status=200)
        except (json.JSONDecodeError, FloorPlan.DoesNotExist):
            return JsonResponse({'status': 'failure', 'error': 'Invalid data or floorplan not found'}, status=400)
    else:
        return JsonResponse({'status': 'failure', 'error': 'Invalid request method'}, status=400)

def room_data(request, location_id, floorplan_id):
    rooms = Room.objects.filter(floorplan_id=floorplan_id).values()
    return JsonResponse(list(rooms), safe=False)
