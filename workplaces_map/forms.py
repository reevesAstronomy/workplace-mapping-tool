from django import forms
from .models import Building, Floor, Room

class BuildingForm(forms.ModelForm):
    class Meta:
        model = Building
        fields = ['name', 'latitude', 'longitude']

class FloorForm(forms.ModelForm):
    class Meta:
        model = Floor
        fields = ['building', 'floor_number', 'floor_plan_image']

class RoomForm(forms.ModelForm):
    class Meta:
        model = Room
        fields = [
            'floor', 'label', 'polygon_data', 'staff_count', 'visited', 'visited_date',
            'notes', 'target_status', 'last_talked_to'
        ]

