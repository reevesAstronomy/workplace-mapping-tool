from django import forms
from .models import Room, TextInput #Building, Floor,

# class BuildingForm(forms.ModelForm):
#     class Meta:
#         model = Building
#         fields = ['name', 'latitude', 'longitude']

# class FloorForm(forms.ModelForm):
#     class Meta:
#         model = Floor
#         fields = ['building', 'floor_number', 'floor_plan_image']

# class RoomForm(forms.ModelForm):
#     class Meta:
#         model = Room
#         fields = [
#             'floor', 'label', 'polygon_data', 'staff_count', 'visited', 'visited_date',
#             'notes', 'target_status', 'last_talked_to'
#         ]

class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)

class TextInputForm(forms.ModelForm):
    class Meta:
        model = TextInput
        fields = ['name', 'notes', 'is_mapped']

class IsMappedForm(forms.ModelForm):
    is_mapped = forms.BooleanField(required=False)

    class Meta:
        model = TextInput
        fields = ['is_mapped']
