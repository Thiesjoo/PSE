from django.contrib import admin

# Register your models here.
from .models import Satellite, MinorCategory

admin.site.register(Satellite)
admin.site.register(MinorCategory)