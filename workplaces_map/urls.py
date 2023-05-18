from django.urls import path
from django.contrib import admin
from . import views

app_name = 'workplaces_map'

urlpatterns = [
    path('', views.index, name='index'),
    path('data/locations/', views.locations_data, name='locations_data'),
    path('data/locations/<str:location_id>/floorplans/', views.floorplan_data, name='floorplan_data'),
    path('data/locations/<str:location_id>/floorplans/<str:floorplan_id>/save_rooms/', views.save_room_data, name='save_room_data'),
    path('data/locations/<str:location_id>/floorplans/<str:floorplan_id>/get_rooms/', views.room_data, name='room_data'),
    path('data/locations/<str:location_id>/floorplans/<str:floorplan_id>/rooms/<str:room_id>/', views.room_detail_data, name='room_detail_data'),
]
