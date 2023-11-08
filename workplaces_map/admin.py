from django.contrib import admin
from .models import Room, TextInput, ExtendedLocation

# Register your models here.
admin.site.register(Room)
admin.site.register(TextInput)
admin.site.register(ExtendedLocation)
