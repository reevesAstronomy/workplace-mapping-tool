from django.apps import AppConfig


class WorkplacesMapConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'workplaces_map'

    def ready(self):
        import workplaces_map.signals
