from django.shortcuts import render

# Create your views here.

from django.http import HttpResponse, HttpRequest, JsonResponse

from satellite_app.cron import pull_special_interest_satellites
from satellite_app.models import Satellite, MinorCategory

# def index(request: HttpRequest):
#     all_satellites = Satellite.objects.all()
#     return HttpResponse(all_satellites, content_type="text/plain")

from rest_framework.decorators import api_view
from rest_framework.response import Response

"""
Transforms the list of satellites into json format
"""
def serializedSatellites(satellites):
    return [{'name': sat.name,
            'line1': sat.line1, 
            'line2': sat.line2, 
            'catalog_number': sat.satellite_catalog_number,
            'launch_year': sat.launch_year,
            'epoch_year': sat.epoch_year,
            'epoch': sat.epoch,
            'revolutions': sat.revolutions,
            'revolutions_per_day': sat.revolutions_per_day,
            'categories': [cat.minor_category for cat in sat.minor_categories.all()]
            } for sat in satellites]

@api_view(['GET'])
def index(request: HttpRequest):
    query_params = request.GET.keys()

    # Retrieve the MinorCategory objects corresponding to the enum values
    categories = MinorCategory.objects.filter(minor_category__in=query_params)
    
    # By default, all satellites will be retrieved.
    if len(categories) == 0:
        sats = Satellite.objects.all()
    else:
        sats = Satellite.objects.filter(minor_categories__in=categories)#[:100]

    return JsonResponse({'satellites': serializedSatellites(sats)})

def pull(request: HttpRequest):
    print("PULLING SPECIAL INTEREST SATELLITES VIA ENDPOINT")
    pull_special_interest_satellites()
    return HttpResponse("Pulled special interest satellites")