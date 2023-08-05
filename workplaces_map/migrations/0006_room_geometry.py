# Generated by Django 3.2.19 on 2023-05-18 02:51

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('workplaces_map', '0005_remove_room_geometry'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='geometry',
            field=django.contrib.gis.db.models.fields.GeometryField(default='POINT(0 0)', srid=4326),
            preserve_default=False,
        ),
    ]