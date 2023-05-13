# Generated by Django 3.2.18 on 2023-05-12 05:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('workplaces_map', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='floor',
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name='floor',
            name='building',
        ),
        migrations.RemoveField(
            model_name='room',
            name='floor',
        ),
        migrations.DeleteModel(
            name='Building',
        ),
        migrations.DeleteModel(
            name='Floor',
        ),
        migrations.DeleteModel(
            name='Room',
        ),
    ]