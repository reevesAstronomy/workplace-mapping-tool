from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django_loci.models import Location, FloorPlan
# from .models import Building, Floor, Room
# from .forms import BuildingForm, FloorForm, RoomForm

def index(request):
    return render(request, 'index.html')

def locations_data(request):
    # locations = Location.objects.values().exclude('geometry')
    locations = Location.objects.values('id', 'created', 'modified', 'name', 'type', 'is_mobile', 'address')
    return JsonResponse(list(locations), safe=False)

def floorplan_data(request, location_id):
    floorplans = FloorPlan.objects.filter(location_id=location_id).values()
    return JsonResponse(list(floorplans), safe=False)

# Rest of your views will need to be updated to use Location and FloorPlan as well.


# from django.shortcuts import render, get_object_or_404, redirect
# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from .models import Building, Floor, Room
# from .forms import BuildingForm, FloorForm, RoomForm
# from django_loci.models import Location
#
#
# def index(request):
#     return render(request, 'index.html')
#
# def buildings_data(request):
#     buildings = Location.objects.values()
#     print("buildings list:", buildings)
#     return JsonResponse(list(buildings), safe=False)
#
# def floor_data(request, building_id):
#     floors = Floor.objects.filter(building_id=building_id).values()
#     return JsonResponse(list(floors), safe=False)
#
# def buildings_map(request):
#     buildings = Building.objects.all()
#     return render(request, 'workplaces_map/buildings_map.html', {'buildings': buildings})
#
# def building_detail(request, building_id):
#     building = get_object_or_404(Building, pk=building_id)
#     floors = building.floors.all()
#     return render(request, 'workplaces_map/building_detail.html', {'building': building, 'floors': floors})
#
# def floor_detail(request, floor_id):
#     floor = get_object_or_404(Floor, pk=floor_id)
#     rooms = floor.rooms.all()
#     return render(request, 'workplaces_map/floor_detail.html', {'floor': floor, 'rooms': rooms})
#
# def room_detail(request, room_id):
#     room = get_object_or_404(Room, pk=room_id)
#     if request.method == 'POST':
#         form = RoomForm(request.POST, instance=room)
#         if form.is_valid():
#             form.save()
#             return redirect('floor_detail', floor_id=room.floor.id)
#     else:
#         form = RoomForm(instance=room)
#     return render(request, 'workplaces_map/room_detail.html', {'form': form, 'room': room})
#
# def create_room(request, floor_id):
#     floor = get_object_or_404(Floor, pk=floor_id)
#     if request.method == 'POST':
#         form = RoomForm(request.POST)
#         if form.is_valid():
#             room = form.save(commit=False)
#             room.floor = floor
#             room.save()
#             return JsonResponse({'status': 'success', 'room_id': room.id})
#         else:
#             return JsonResponse({'status': 'error', 'errors': form.errors})
#     else:
#         form = RoomForm()
#     return render(request, 'workplaces_map/create_room.html', {'form': form, 'floor': floor})
#
# @csrf_exempt
# def create_building(request):
#     if request.method == 'POST':
#         form = BuildingForm(request.POST)
#         if form.is_valid():
#             building = form.save()
#             return JsonResponse({'status': 'success', 'building_id': building.id})
#     return JsonResponse({'status': 'error'})
#
# @csrf_exempt
# def delete_building(request, building_id):
#     if request.method == 'POST':
#         building = get_object_or_404(Building, id=building_id)
#         building.delete()
#         return JsonResponse({'status': 'success'})
#     return JsonResponse({'status': 'error'})
