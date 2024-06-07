from django.shortcuts import render

# Create your views here.

from django.http import HttpResponse, HttpRequest

from satellite_app.cron import pull_special_interest_satellites
from satellite_app.models import Satellite

def index(request: HttpRequest):
    all_satellites = Satellite.objects.all()
    return HttpResponse(all_satellites, content_type="text/plain")

def pull(request: HttpRequest):
    pull_special_interest_satellites()
    return HttpResponse("Pulled special interest satellites")