# Generated by Django 3.2.18 on 2023-09-20 20:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workplaces_map', '0008_rename_rooms_visited_textinput_notes'),
    ]

    operations = [
        migrations.AddField(
            model_name='textinput',
            name='is_mapped',
            field=models.BooleanField(default=False),
        ),
    ]