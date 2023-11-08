# signals.py in your Django app

from django.db.models.signals import post_save
from django.dispatch import receiver
from django_loci.models import Location
from .models import ExtendedLocation

@receiver(post_save, sender=Location)
def create_or_update_extended_location(sender, instance, created, **kwargs):
    if created:
        ExtendedLocation.objects.create(location=instance)
    else:
        instance.extended.save()
