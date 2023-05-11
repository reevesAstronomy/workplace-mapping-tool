from django.db import models
# from django.contrib.postgres.fields import JSONField
from django.db.models import JSONField

### WARNING! I didn't end up really using these below. Room might be useful if I instead connect it to a FloorPlan database object

class Building(models.Model):
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return self.name

class Floor(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='floors')
    floor_number = models.IntegerField()
    floor_plan_image = models.ImageField()#upload_to='floorplans/')

    class Meta:
        unique_together = ('building', 'floor_number')

    def __str__(self):
        return f'{self.building.name} - Floor {self.floor_number}'

class Room(models.Model):
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='rooms')
    label = models.CharField(max_length=255)
    polygon_data = JSONField()  # Store polygon data as JSON
    staff_count = models.IntegerField()
    visited = models.BooleanField(default=False)
    visited_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    target_status = models.BooleanField(default=False)
    last_talked_to = models.DateField(null=True, blank=True)

    def __str__(self):
        return f'{self.floor} - {self.label}'
