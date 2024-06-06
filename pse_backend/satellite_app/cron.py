from tletools import TLE

from satellite_app.models import Satellite

import requests

# For ease of use
SATAFF = Satellite.AffiliationChoices

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

def pull_satellites(category, affiliation):
    
    Satellite.objects.filter(affiliation=affiliation).delete()

    #NOTE: Use this when testing to avoid spamming the API:
    # data_lines = ['ISS (ZARYA)',
    #                '1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927',
    #                '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537']

    request_source = determine_request_source(affiliation)

    res = requests.get(request_source)
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
        launch_year = str(tle.int_desig)[:2]
        launch_year = int(('20' if int(launch_year) <= 24  else '19') + launch_year)

        # Creates a new satellite and saves it
        sat = Satellite(name=tle.name, line1=tleData[1], line2=tleData[2], satellite_catalog_number=tle.norad,
                         classification=tle.classification, launch_year=launch_year, epoch_year=tle.epoch_year, 
                         epoch=tle.epoch_day, revolutions=tle.rev_num, revolutions_per_day=tle.n,
                           category=category, affiliation=affiliation)
        sat.save()


def pull_special_interest_satellites():
    cat = Satellite.CategoryChoices.SPECIAL_INTEREST
    pull_satellites(cat, SATAFF.LAST_30_DAYS)
    pull_satellites(cat, SATAFF.SPACE_STATIONS)
    pull_satellites(cat, SATAFF.ACTIVE)
    pull_satellites(cat, SATAFF.ANALYST_SATELLITES)

def pull_weather_and_earth_satellites():
    cat = Satellite.CategoryChoices.WEATHER_AND_EARTH
    pull_satellites(cat, SATAFF.WEATHER)
    pull_satellites(cat, SATAFF.NOAA)
    pull_satellites(cat, SATAFF.EARTH_RESOURCES)
    pull_satellites(cat, SATAFF.SEARCH_AND_RESCUE)
    pull_satellites(cat, SATAFF.DISASTER_MONITORING)
    pull_satellites(cat, SATAFF.ARGOS)
    pull_satellites(cat, SATAFF.PLANET)
    pull_satellites(cat, SATAFF.SPIRE)

def pull_communications_satellites():
    cat = Satellite.CategoryChoices.COMMUNICATIONS
    pull_satellites(cat, SATAFF.ACTIVE_GEOSYNCHRONOUS)
    pull_satellites(cat, SATAFF.STARLINK)
    pull_satellites(cat, SATAFF.IRIDIUM)
    pull_satellites(cat, SATAFF.INTELSAT)
    pull_satellites(cat, SATAFF.SWARM)
    pull_satellites(cat, SATAFF.AMATEUR_RADIO)

def pull_navigation_satellites():
    cat = Satellite.CategoryChoices.NAVIGATION
    pull_satellites(cat, SATAFF.GNSS)
    pull_satellites(cat, SATAFF.GPS)
    pull_satellites(cat, SATAFF.GLONASS)
    pull_satellites(cat, SATAFF.GALILEO)
    pull_satellites(cat, SATAFF.BEIDOU)

def pull_scientific_satellites():
    cat = Satellite.CategoryChoices.SCIENTIFIC
    pull_satellites(cat, SATAFF.SPACE_AND_EARTH)
    pull_satellites(cat, SATAFF.GEODETICS)
    pull_satellites(cat, SATAFF.ENGINEERING)
    pull_satellites(cat, SATAFF.EDUCATION)