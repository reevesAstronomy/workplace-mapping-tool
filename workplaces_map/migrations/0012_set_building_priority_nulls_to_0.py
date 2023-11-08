# Generated by Django 3.2.18 on 2023-11-07 05:36
from django.db import migrations, models

def update_priority(apps, schema_editor):
    ExtendedLocation = apps.get_model('workplaces_map', 'ExtendedLocation')
    # Update all null values to 0
    ExtendedLocation.objects.filter(building_priority__isnull=True).update(building_priority=0)

class Migration(migrations.Migration):

    dependencies = [
        ('workplaces_map', '0011_alter_extendedlocation_building_priority'),
    ]

    operations = [
        migrations.RunPython(update_priority),
    ]
