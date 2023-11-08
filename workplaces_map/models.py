from django.db import models
from django.db.models import JSONField
from django_loci.models import FloorPlan, Location
from django.contrib.gis.db import models

class ExtendedLocation(models.Model):
    # Link to the original Location model
    location = models.OneToOneField(Location, on_delete=models.CASCADE, related_name='extended')

    # Your custom integer field
    building_priority = models.IntegerField(default=0)

    # You can add any other fields or methods you need here

    def __str__(self):
        return f"Extended {self.location}"

class Room(models.Model):
    ROOM_TYPES = [
        ('OF', 'Office'),
        ('LA', 'Lab'),
        ('LO', 'Lounge'),
        ('PO', 'Posterboard'),
    ]

    floorplan = models.ForeignKey(FloorPlan, on_delete=models.CASCADE, related_name='rooms')
    geometry = models.GeometryField()  # a given room's polygon geometry
    room_name = models.CharField(max_length=200, default='Unnamed Room')  # Room name
    room_type = models.CharField(max_length=2, choices=ROOM_TYPES)  # Room type
    workers_count = models.IntegerField(null=True, blank=True)  # Number of applicable workers
    last_contacted = models.DateField(null=True, blank=True)  # Date last contacted
    follow_up_needed = models.BooleanField(default=False)  # Follow-up need
    notes = models.TextField(blank=True)  # Notes

class TextInput(models.Model):
    name = models.CharField(max_length=100)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_mapped = models.BooleanField(default=False)
