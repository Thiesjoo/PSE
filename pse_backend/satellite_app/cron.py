from tletools import TLE
from satellite_app.models import Satellite, MinorCategory
import requests
import logging

#TODO: (DONE) Add a filter endpoint for the frontend
#TODO: Add logging for the cronjobs
#TODO: Clean up the code, refactor the repeatable stuff
#TODO: write clear documentation (comments & the readme)
#TODO: add a 'limit' parameter to the filter endpoint
#TODO: Maak nieuw pull-request
#TODO: 'setup sample data' command toevoegen
#TODO: Add testing stuff (e.g. pytest)

cron_logger = logging.getLogger('cron')

# For ease of use
SATAFF = MinorCategory.MinorCategoryChoices

def determine_request_source(affiliation):
    API_URL = 'https://celestrak.org/NORAD/elements/gp.php?'

    # Do not delete for any reason. Copy/pasting 
    # all this info was torture to me.
    match affiliation:
        # Special interest
        case SATAFF.LAST_30_DAYS:
            request_source = API_URL + 'GROUP=last-30-days&FORMAT=tle'
        case SATAFF.SPACE_STATIONS:
            request_source = API_URL + 'GROUP=stations&FORMAT=tle'
        case SATAFF.ACTIVE:
            request_source = API_URL + 'GROUP=active&FORMAT=tle'
        case SATAFF.ANALYST_SATELLITES:
            request_source = API_URL + 'GROUP=analyst&FORMAT=tle'

        # Weather and earth
        case SATAFF.WEATHER:
            request_source = API_URL + 'GROUP=weather&FORMAT=tle'
        case SATAFF.NOAA:
            request_source = API_URL + 'GROUP=noaa&FORMAT=tle'
        case SATAFF.EARTH_RESOURCES:
            request_source = API_URL + 'GROUP=resource&FORMAT=tle'
        case SATAFF.SEARCH_AND_RESCUE:
            request_source = API_URL + 'GROUP=sarsat&FORMAT=tle'
        case SATAFF.DISASTER_MONITORING:
            request_source = API_URL + 'GROUP=dmc&FORMAT=tle'
        case SATAFF.ARGOS:
            request_source = API_URL + 'GROUP=argos&FORMAT=tle'
        case SATAFF.PLANET:
            request_source = API_URL + 'GROUP=planet&FORMAT=tle'
        case SATAFF.SPIRE:
            request_source = API_URL + 'GROUP=spire&FORMAT=tle'

        # Communication
        case SATAFF.ACTIVE_GEOSYNCHRONOUS:
            request_source = API_URL + 'GROUP=geo&FORMAT=tle'
        case SATAFF.STARLINK:
            request_source = API_URL + 'GROUP=starlink&FORMAT=tle'
        case SATAFF.IRIDIUM:
            request_source = API_URL + 'GROUP=iridium&FORMAT=tle'
        case SATAFF.INTELSAT:
            request_source = API_URL + 'GROUP=intelsat&FORMAT=tle'
        case SATAFF.SWARM:
            request_source = API_URL + 'GROUP=swarm&FORMAT=tle'
        case SATAFF.AMATEUR_RADIO:
            request_source = API_URL + 'GROUP=amateur&FORMAT=tle'

        # Navigation
        case SATAFF.GNSS:
            request_source = API_URL + 'GROUP=gnss&FORMAT=tle'
        case SATAFF.GPS:
            request_source = API_URL + 'GROUP=gps-ops&FORMAT=tle'
        case SATAFF.GLONASS:
            request_source = API_URL + 'GROUP=glo-ops&FORMAT=tle'
        case SATAFF.GALILEO:
            request_source = API_URL + 'GROUP=galileo&FORMAT=tle'
        case SATAFF.BEIDOU:
            request_source = API_URL + 'GROUP=beidou&FORMAT=tle'

        # Scientific
        case SATAFF.SPACE_AND_EARTH:
            request_source = API_URL + 'GROUP=science&FORMAT=tle'
        case SATAFF.GEODETICS:
            request_source = API_URL + 'GROUP=geodetic&FORMAT=tle'
        case SATAFF.ENGINEERING:
            request_source = API_URL + 'GROUP=engineering&FORMAT=tle'
        case SATAFF.EDUCATION:
            request_source = API_URL + 'GROUP=education&FORMAT=tle'
    return request_source

def pull_satellites(affiliation, minor_category_row):

    cron_logger.info("Pulling sattelites of category '" + affiliation + "'")
    
    #NOTE: Use this when testing to avoid spamming the API:
    # data_lines = ['ISS (ZARYA)',
    #                '1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927',
    #                '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537']

    request_source = determine_request_source(affiliation)

    res = requests.get(request_source)

    if res.status_code != 200:
        cron_logger.warning('Did not get an OK message from external API.'
                           + ' Status code: ' + res.status_code + '\n')

    data_lines =  res.text.splitlines()         # All data from Celestrak, line by line

    tles = []
    current_name = ''
    current_line1 = ''

    counter = 0

    # Processes the fetched data and fills the 'tles' list with tles
    for line in data_lines:
        line = line.replace('\r', '')
        line = line.strip()
        # print(line)

        if counter == 0:
            current_name = line
            counter += 1
        elif counter == 1:
            current_line1 = line
            counter += 1
        elif counter == 2:
            current_line2 = line

            tles.append([current_name, current_line1, current_line2])

            counter = 0
    
    # For every TLE in 'tles', use the 'tletools' library to retrieve important bits
    # of data of it and create a new satellite object in the database.
    for tleData in tles:
        tle = TLE.from_lines(tleData[0], tleData[1], tleData[2])

        # TODO: Change this hardcoded behaviour in the future. The way it decides 
        # whether it's 21th century or 20th century is pretty bad.

        launch_year_last_two_digits = str(tle.int_desig)[:2]
        if launch_year_last_two_digits != '':
            launch_year = int(str(tle.int_desig)[:2])
            launch_year = int(('20' if int(launch_year) <= 24  else '19') + str(launch_year))
        else:
            launch_year = -1
        
        try:
            try:
                sat = Satellite.objects.get(satellite_catalog_number=tle.norad)
                sat.name = tle.name
                sat.line1=tleData[1]
                sat.line2=tleData[2]
                sat.satellite_catalog_number=tle.norad
                sat.classification=tle.classification
                sat.launch_year=launch_year
                sat.epoch_year=tle.epoch_year
                sat.epoch=tle.epoch_day
                sat.revolutions=tle.rev_num
                sat.revolutions_per_day=tle.n

                sat.minor_categories.add(minor_category_row)
                sat.save()
                # Voeg een row toe aan de tussentabel
            except Satellite.DoesNotExist:
                # Creates a new satellite and saves it
                sat = Satellite(name=tle.name, line1=tleData[1], line2=tleData[2], satellite_catalog_number=tle.norad,
                         classification=tle.classification, launch_year=launch_year, epoch_year=tle.epoch_year, 
                         epoch=tle.epoch_day, revolutions=tle.rev_num, revolutions_per_day=tle.n)
                sat.save()
                sat.minor_categories.add(minor_category_row)
                sat.save()
        except Exception as e:
            cron_logger.error("Could not create or update satellite after"
                               + " fetching data. Full exception: " + str(e))

def pull_special_interest_satellites():
    cron_logger.info("Pulling 'Special Interest' satellites"
                      + " from the external API.")

    mincat = MinorCategory.objects.get(minor_category=SATAFF.LAST_30_DAYS)
    pull_satellites(SATAFF.LAST_30_DAYS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.SPACE_STATIONS)
    pull_satellites(SATAFF.SPACE_STATIONS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.ACTIVE)
    pull_satellites(SATAFF.ACTIVE, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.ANALYST_SATELLITES)
    pull_satellites(SATAFF.ANALYST_SATELLITES, mincat)

    cron_logger.info("Succesfully pulled 'Special Interest' satellites.'")


def pull_weather_and_earth_satellites():
    cron_logger.info("Pulling 'Weather and Earth' satellites"
                      + " from the external API.")
        
    mincat = MinorCategory.objects.get(minor_category=SATAFF.WEATHER)
    pull_satellites(SATAFF.WEATHER, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.NOAA)
    pull_satellites(SATAFF.NOAA, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.EARTH_RESOURCES)
    pull_satellites(SATAFF.EARTH_RESOURCES, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.SEARCH_AND_RESCUE)
    pull_satellites(SATAFF.SEARCH_AND_RESCUE, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.DISASTER_MONITORING)
    pull_satellites(SATAFF.DISASTER_MONITORING, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.ARGOS)
    pull_satellites(SATAFF.ARGOS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.PLANET)
    pull_satellites(SATAFF.PLANET, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.SPIRE)
    pull_satellites(SATAFF.SPIRE, mincat)

    cron_logger.info("Succesfully pulled 'Weather and Earth' satellites.'")


def pull_communications_satellites():
    cron_logger.info("Pulling 'Communications' satellites"
                      + " from the external API.")
    
    mincat = MinorCategory.objects.get(minor_category=SATAFF.ACTIVE_GEOSYNCHRONOUS)
    pull_satellites(SATAFF.ACTIVE_GEOSYNCHRONOUS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.STARLINK)
    pull_satellites(SATAFF.STARLINK, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.IRIDIUM)
    pull_satellites(SATAFF.IRIDIUM, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.INTELSAT)
    pull_satellites(SATAFF.INTELSAT, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.SWARM)
    pull_satellites(SATAFF.SWARM, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.AMATEUR_RADIO)
    pull_satellites(SATAFF.AMATEUR_RADIO, mincat)

    cron_logger.info("Succesfully pulled 'Communications' satellites.'")


def pull_navigation_satellites():
    cron_logger.info("Pulling 'Navigation' satellites"
                      + " from the external API.")
    
    mincat = MinorCategory.objects.get(minor_category=SATAFF.GNSS)
    pull_satellites(SATAFF.GNSS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.GPS)
    pull_satellites(SATAFF.GPS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.GLONASS)
    pull_satellites(SATAFF.GLONASS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.GALILEO)
    pull_satellites(SATAFF.GALILEO, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.BEIDOU)
    pull_satellites(SATAFF.BEIDOU, mincat)

    cron_logger.info("Succesfully pulled 'Navigation' satellites.'")


def pull_scientific_satellites():
    cron_logger.info("Pulling 'Scientific' satellites"
                      + " from the external API.")
    
    mincat = MinorCategory.objects.get(minor_category=SATAFF.SPACE_AND_EARTH)
    pull_satellites(SATAFF.SPACE_AND_EARTH, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.GEODETICS)
    pull_satellites(SATAFF.GEODETICS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.ENGINEERING)
    pull_satellites(SATAFF.ENGINEERING, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATAFF.EDUCATION)
    pull_satellites(SATAFF.EDUCATION, mincat)

    cron_logger.info("Succesfully pulled 'Scientific' satellites.'")