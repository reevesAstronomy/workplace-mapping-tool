from django.db import models
# from django.contrib.postgres.fields import JSONField
from django.db.models import JSONField
from django_loci.models import FloorPlan

class Room(models.Model):
    floorplan = models.ForeignKey(FloorPlan, on_delete=models.CASCADE, related_name='rooms')
    geometry = JSONField() # a given room's polygon geometry






# # Deleted this but wanted to keep it in the comments for now to see its example fields
# class Room(models.Model):
#     floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='rooms')
#     label = models.CharField(max_length=255)
#     polygon_data = JSONField()  # Store polygon data as JSON
#     staff_count = models.IntegerField()
#     visited = models.BooleanField(default=False)
#     visited_date = models.DateField(null=True, blank=True)
#     notes = models.TextField(blank=True)
#     target_status = models.BooleanField(default=False)
#     last_talked_to = models.DateField(null=True, blank=True)
#
#     def __str__(self):
#         return f'{self.floor} - {self.label}'
