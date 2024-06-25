import logging
import os

from django.http import HttpResponse, HttpRequest, JsonResponse

from satellite_app.cron import pull_special_interest_satellites
from satellite_app.models import Satellite, MinorCategory

from django.views.decorators.cache import cache_page

from rest_framework.decorators import api_view

from dotenv import load_dotenv
load_dotenv()

# Logger for endpoint calls. See logs/views.log
views_logger = logging.getLogger('views')

# Default caching lengths (in seconds)
DEFAULT_SATELLITES_CACHING_LENGTH = 3600
DEFAULT_STANDARD_CACHING_LENGTH = 300

# Retrieves the caching lengths from
# environment variables
SATELLITES_CACHING_LENGTH = int(os.getenv(
    'SATELLITES_CACHING_LENGTH',
    DEFAULT_SATELLITES_CACHING_LENGTH))
STANDARD_CACHING_LENGTH = int(os.getenv(
    'STANDARD_CACHING_LENGTH',
    DEFAULT_STANDARD_CACHING_LENGTH))


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
             'country': sat.country,
             'categories': [cat.minor_category for
                            cat in sat.minor_categories.all()],
             'classification': sat.classification,
             } for sat in satellites]


@cache_page(SATELLITES_CACHING_LENGTH)
@api_view(['GET'])
def index(request: HttpRequest):
    """
    Main filter endpoint. This endpoint lets the caller retrieve a number
    of satellites with optional parameter 'filter' which filters
    satellites on specific categories.
    """
    # Retrieve the query parameters
    query_params = request.GET

    # Retrieve the filtered categories, if any were given
    filter = query_params.get('filter', '')
    filter_elements = [element.strip() for element in filter.split(',')]

    # Logging
    views_logger.info("Endpoint 'index' was called with filter elements "
                      + str(filter_elements) + ".")

    # Retrieve the category objects corresponding to the enum values
    categories = MinorCategory.objects.filter(
        minor_category__in=filter_elements)

    # By default, all satellites will be retrieved. Otherwise,
    # the filter will be applied.
    if len(categories) == 0:
        sats = Satellite.objects.prefetch_related("minor_categories").all()
    else:
        sats = Satellite.objects.prefetch_related("minor_categories").filter(minor_categories__in=categories)

    resp = serializedSatellites(sats)
    # Returns a JSON-serialized list of the fetched satellites
    return JsonResponse({'satellites': resp})


@cache_page(STANDARD_CACHING_LENGTH)
@api_view(['GET'])
def categories(request: HttpRequest):
    """
    Endpoint for fetching all satellite categories.
    """
    views_logger.info("Endpoint 'categories' was called.")
    cats = MinorCategory.objects.all()

    catList = [cat.minor_category for cat in cats]
    return JsonResponse({'categories': catList})


@cache_page(STANDARD_CACHING_LENGTH)
@api_view(['GET'])
def launch_years(request: HttpRequest):
    """
    Endpoint for fetching all known launch years of
    the satellites.
    """
    views_logger.info("Endpoint 'launch_years' was called.")
    distinct_launch_years = Satellite.objects.values('launch_year').distinct()
    launch_years_list = [ly['launch_year'] for ly in distinct_launch_years]
    return JsonResponse({'launch_years': launch_years_list})


@cache_page(STANDARD_CACHING_LENGTH)
@api_view(['GET'])
def countries(request: HttpRequest):
    """
    Endpoint for fetching all known
    countries/affiliations of the satellites.
    """
    views_logger.info("Endpoint 'countries' was called.")
    distinct_countries = Satellite.objects.values('country').distinct()
    countries_list = [c['country'] for c in distinct_countries]
    return JsonResponse({'countries': countries_list})


# NOTE: This is to be removed
def pull(request: HttpRequest):
    views_logger.info("Endpoint 'pull' was called; now forcefully"
                      + " pulling data from the external API")
    pull_special_interest_satellites()
    return HttpResponse("Pulled special interest satellites")
