from django.urls import path
from django.contrib import admin
from . import views

app_name = 'workplaces_map'

urlpatterns = [
    path('', views.index, name='index'),
    path('data/locations/', views.locations_data, name='locations_data'),
    path('data/locations/<str:location_id>/floorplans/', views.floorplan_data, name='floorplan_data'),
    # other paths...
]


# urlpatterns = [
#     path('', views.index, name='index'),
#     # path('', views.buildings_map, name='buildings_map'),
#     path('data/buildings/', views.buildings_data, name='buildings_data'),
#     path('data/buildings/<int:building_id>/floors/', views.floor_data, name='floor_data'),
#     path('building/<int:building_id>/', views.building_detail, name='building_detail'),
#     path('floor/<int:floor_id>/', views.floor_detail, name='floor_detail'),
#     path('room/<int:room_id>/', views.room_detail, name='room_detail'),
#     path('floor/<int:floor_id>/create-room/', views.create_room, name='create_room'),
#     path('create-building/', views.create_building, name='create_building'),
#     path('building/<int:building_id>/delete/', views.delete_building, name='delete_building'),
# ]
