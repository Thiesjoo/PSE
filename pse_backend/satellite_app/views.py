import logging

from django.http import HttpResponse, HttpRequest, JsonResponse

from satellite_app.cron import pull_special_interest_satellites
from satellite_app.models import Satellite, MinorCategory

from rest_framework.decorators import api_view
from rest_framework.response import Response

views_logger = logging.getLogger('views')

# The default limit of satellites that will be fetched
#  through the main endpoint. Since there are over 
# 10K satellites in the database, this is required.
DEFAULT_SATELLITE_LIMIT = 1000

def serializedSatellites(satellites):
    """
    Transforms a given list of satellites
    into JSON format.
    """
    return [{'name': sat.name,
            'line1': sat.line1, 
            'line2': sat.line2, 
            'catalog_number': sat.satellite_catalog_number,
            'launch_year': sat.launch_year,
            'epoch_year': sat.epoch_year,
            'epoch': sat.epoch,
            'revolutions': sat.revolutions,
            'revolutions_per_day': sat.revolutions_per_day,
            'categories': [cat.minor_category for cat in sat.minor_categories.all()],
            'classification': sat.classification
            } for sat in satellites]

@api_view(['GET'])
def index(request: HttpRequest):
    """
    Main filter endpoint. This endpoint lets the caller retrieve a number 
    of satellites with optional parameters 'limit' (which limits the 
    amount of fetched satellites), and 'filter' which filters 
    satellites on specific categories.
    """

    # Retrieve the query parameters
    query_params = request.GET

    # Retrieve the 'limit' argument, if any was given
    limit = int(query_params.get('limit', DEFAULT_SATELLITE_LIMIT))

    # Retrieve the filtered categories, if any were given
    filter = query_params.get('filter' , '')
    filter_elements = [element.strip() for element in filter.split(',')]

    # Logging
    views_logger.info("Endpoint 'index' was called with filter elements "
                       + str(filter_elements) + " and a limit of '"
                         + str(limit) + "'.")

    # Retrieve the category objects corresponding to the enum values
    categories = MinorCategory.objects.filter(minor_category__in=filter_elements)
    
    # By default, all satellites will be retrieved. Otherwise, 
    # the filter will be applied.
    if len(categories) == 0:
        sats = Satellite.objects.all()[:limit]
    else:
        sats = Satellite.objects.filter(minor_categories__in=categories)[:limit]

    # Returns a JSON-serialized list of the fetched satellites
    return JsonResponse({'satellites': serializedSatellites(sats)})

@api_view(['GET'])
def categories(request: HttpRequest):
    """
    Endpoint for fetching all satellite categories.
    """
    cats = MinorCategory.objects.all()
    catList = [cat.minor_category for cat in cats]
    return JsonResponse({'categories': catList})

@api_view(['GET'])
def launch_years(request: HttpRequest):
    """
    Endpoint for fetching all known launch years of the satellites.
    """
    distinct_launch_years = Satellite.objects.values('launch_year').distinct()
    launch_years_list = [ly['launch_year'] for ly in distinct_launch_years]
    return JsonResponse({'launch_years': launch_years_list})

@api_view(['GET'])
def countries(request: HttpRequest):
    """
    Endpoint for fetching all known countries/affiliations of the satellites.
    NOTE: This endpoint is currently just speculative and is made at a time
      where countries haven't been fully implemented yet in the database.
    """
    distinct_countries = Satellite.objects.values('country').distinct()
    countries_list = [c['country'] for c in distinct_countries] # <- This line might not be necessary
    return JsonResponse({'countries': countries_list})

#NOTE: This is to be removed
def pull(request: HttpRequest):
    views_logger.info("Endpoint 'pull' was called; now forcefully"
                       + " pulling data from the external API")
    pull_special_interest_satellites()
    return HttpResponse("Pulled special interest satellites")