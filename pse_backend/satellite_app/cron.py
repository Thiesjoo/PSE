import os
from pathlib import Path
from tletools import TLE
from satellite_app.models import Satellite, MinorCategory
import requests
import logging
import csv

"""
File description:
Contains several cronjobs responsible for fetching different categories of
satellites. To see how these cronjobs are scheduled, go to 'CRONJOBS' in
settings.py.
"""

# Sets up the logger (see /logs/cron.logs)
cron_logger = logging.getLogger('cron')

# For ease of use
SATCAT = MinorCategory.MinorCategoryChoices


def determine_request_source(category):
    """
    Returns a URL corresponding to the given satellite
    category. Calling this URL will fetch the
    satellites of that category.
    """

    # The source of our data
    API_URL = 'https://celestrak.org/NORAD/elements/gp.php?'

    # Do not delete for any reason. Copy/pasting
    # all this info was torture to me.
    match category:
        # Special interest
        case SATCAT.LAST_30_DAYS:
            request_source = API_URL + 'GROUP=last-30-days&FORMAT=tle'
        case SATCAT.SPACE_STATIONS:
            request_source = API_URL + 'GROUP=stations&FORMAT=tle'
        case SATCAT.ACTIVE:
            request_source = API_URL + 'GROUP=active&FORMAT=tle'

        # Weather and earth
        case SATCAT.WEATHER:
            request_source = API_URL + 'GROUP=weather&FORMAT=tle'
        case SATCAT.NOAA:
            request_source = API_URL + 'GROUP=noaa&FORMAT=tle'
        case SATCAT.EARTH_RESOURCES:
            request_source = API_URL + 'GROUP=resource&FORMAT=tle'
        case SATCAT.SEARCH_AND_RESCUE:
            request_source = API_URL + 'GROUP=sarsat&FORMAT=tle'
        case SATCAT.DISASTER_MONITORING:
            request_source = API_URL + 'GROUP=dmc&FORMAT=tle'
        case SATCAT.ARGOS:
            request_source = API_URL + 'GROUP=argos&FORMAT=tle'
        case SATCAT.PLANET:
            request_source = API_URL + 'GROUP=planet&FORMAT=tle'
        case SATCAT.SPIRE:
            request_source = API_URL + 'GROUP=spire&FORMAT=tle'

        # Communication
        case SATCAT.ACTIVE_GEOSYNCHRONOUS:
            request_source = API_URL + 'GROUP=geo&FORMAT=tle'
        case SATCAT.STARLINK:
            request_source = API_URL + 'GROUP=starlink&FORMAT=tle'
        case SATCAT.IRIDIUM:
            request_source = API_URL + 'GROUP=iridium&FORMAT=tle'
        case SATCAT.INTELSAT:
            request_source = API_URL + 'GROUP=intelsat&FORMAT=tle'
        case SATCAT.SWARM:
            request_source = API_URL + 'GROUP=swarm&FORMAT=tle'
        case SATCAT.AMATEUR_RADIO:
            request_source = API_URL + 'GROUP=amateur&FORMAT=tle'

        # Navigation
        case SATCAT.GNSS:
            request_source = API_URL + 'GROUP=gnss&FORMAT=tle'
        case SATCAT.GPS:
            request_source = API_URL + 'GROUP=gps-ops&FORMAT=tle'
        case SATCAT.GLONASS:
            request_source = API_URL + 'GROUP=glo-ops&FORMAT=tle'
        case SATCAT.GALILEO:
            request_source = API_URL + 'GROUP=galileo&FORMAT=tle'
        case SATCAT.BEIDOU:
            request_source = API_URL + 'GROUP=beidou&FORMAT=tle'

        # Scientific
        case SATCAT.SPACE_AND_EARTH:
            request_source = API_URL + 'GROUP=science&FORMAT=tle'
        case SATCAT.GEODETICS:
            request_source = API_URL + 'GROUP=geodetic&FORMAT=tle'
        case SATCAT.ENGINEERING:
            request_source = API_URL + 'GROUP=engineering&FORMAT=tle'

    return request_source


def pull_satellites(category, category_object):
    """
    Pulls satellites of a given category from the source
    and puts them into our database as 'Satellite' objects.
    'category' is a string containing the name of the
    category, while 'category_object' is an actual
    category database row. The string is used to fetch the
    URL corresponding to that category while the database
    row is used to establish a foreign-key relationship
    between a satellite and a category.
    """

    cron_logger.info("Pulling sattelites of category '" + category + "'")

    # Retrieve the database URL
    request_source = determine_request_source(category)

    # Make the request
    res = requests.get(request_source)

    # In case something goes wrong, log it
    if res.status_code != 200:
        cron_logger.warning('Did not get an OK message from external API.'
                            + ' Status code: ' + res.status_code + '\n')

    # All data from Celestrak, split line-by-line
    data_lines = res.text.splitlines()

    # Some utility variables to process the lines
    tles = []
    current_name = ''
    current_line1 = ''
    counter = 0

    # Processes the fetched data and fills the 'tles' list with tles
    for line in data_lines:
        line = line.replace('\r', '')
        line = line.strip()

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

    # For every TLE in 'tles', use the 'tletools' library to retrieve
    # important bits of data of it and create a new satellite
    # object in the database.
    for tleData in tles:
        tle = TLE.from_lines(tleData[0], tleData[1], tleData[2])

        # TODO: Change this hardcoded behaviour in the future. The way
        # it decides whether it's 21th century or 20th century is pretty bad.
        launch_year_last_two_digits = str(tle.int_desig)[:2]
        if launch_year_last_two_digits != '':
            launch_year = int(str(tle.int_desig)[:2])

            # BUGFIX (11-6-2024): If it's a post-2000's year, it needs
            # to decide whether it's in the 2000's or not. That way, it can
            # decide whether or not to add 2 zeroes. This bugfix should
            # ensure that. If there are still problems related to the launch
            # year, this is where you should look.
            if launch_year > 9 and launch_year <= 24:
                launch_year_prefix = '20'
            elif launch_year <= 24:
                launch_year_prefix = '200'
            else:
                launch_year_prefix = '19'

            launch_year = launch_year_prefix + str(launch_year)
        else:
            # When the launch year is unknown, we pick -1
            launch_year = -1

        try:
            try:
                # If the satellite already exists, simply update its properties
                sat = Satellite.objects.get(satellite_catalog_number=tle.norad)
                sat.name = tle.name
                sat.line1 = tleData[1]
                sat.line2 = tleData[2]
                sat.satellite_catalog_number = tle.norad
                sat.classification = tle.classification
                sat.launch_year = launch_year
                sat.epoch_year = tle.epoch_year
                sat.epoch = tle.epoch_day
                sat.revolutions = tle.rev_num
                sat.revolutions_per_day = tle.n

                sat.minor_categories.add(category_object)
                sat.save()
                # Voeg een row toe aan de tussentabel
            except Satellite.DoesNotExist:
                # Does the Satellite not exist? Then create a new satellite and
                # save it
                sat = Satellite(
                    name=tle.name,
                    line1=tleData[1],
                    line2=tleData[2],
                    satellite_catalog_number=tle.norad,
                    classification=tle.classification,
                    launch_year=launch_year,
                    epoch_year=tle.epoch_year,
                    epoch=tle.epoch_day,
                    revolutions=tle.rev_num,
                    revolutions_per_day=tle.n)
                # <- Yes, it is necessary to do this twice. Do not remove.
                sat.save()
                sat.minor_categories.add(category_object)
                sat.save()
        except Exception as e:
            cron_logger.error("Could not create or update satellite after"
                              + " fetching data. Full exception: " + str(e))


def pull_special_interest_satellites():
    """
    Cronjob method. Pulls all special interest satellites.
    """

    cron_logger.info("Pulling 'Special Interest' satellites"
                     + " from the external API.")

    mincat = MinorCategory.objects.get(minor_category=SATCAT.LAST_30_DAYS)
    pull_satellites(SATCAT.LAST_30_DAYS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.SPACE_STATIONS)
    pull_satellites(SATCAT.SPACE_STATIONS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.ACTIVE)
    pull_satellites(SATCAT.ACTIVE, mincat)

    cron_logger.info("Succesfully pulled 'Special Interest' satellites.")


def pull_weather_and_earth_satellites():
    """
    Cronjob method. Pulls all 'weather and earth' type satellites.
    """

    cron_logger.info("Pulling 'Weather and Earth' satellites"
                     + " from the external API.")

    mincat = MinorCategory.objects.get(minor_category=SATCAT.WEATHER)
    pull_satellites(SATCAT.WEATHER, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.NOAA)
    pull_satellites(SATCAT.NOAA, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.EARTH_RESOURCES)
    pull_satellites(SATCAT.EARTH_RESOURCES, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.SEARCH_AND_RESCUE)
    pull_satellites(SATCAT.SEARCH_AND_RESCUE, mincat)

    mincat = MinorCategory.objects.get(
        minor_category=SATCAT.DISASTER_MONITORING)
    pull_satellites(SATCAT.DISASTER_MONITORING, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.ARGOS)
    pull_satellites(SATCAT.ARGOS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.PLANET)
    pull_satellites(SATCAT.PLANET, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.SPIRE)
    pull_satellites(SATCAT.SPIRE, mincat)

    cron_logger.info("Succesfully pulled 'Weather and Earth' satellites.")


def pull_communications_satellites():
    """
    Cronjob method. Pulls all communications type satellites.
    """

    cron_logger.info("Pulling 'Communications' satellites"
                     + " from the external API.")

    mincat = MinorCategory.objects.get(
        minor_category=SATCAT.ACTIVE_GEOSYNCHRONOUS)
    pull_satellites(SATCAT.ACTIVE_GEOSYNCHRONOUS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.STARLINK)
    pull_satellites(SATCAT.STARLINK, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.IRIDIUM)
    pull_satellites(SATCAT.IRIDIUM, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.INTELSAT)
    pull_satellites(SATCAT.INTELSAT, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.SWARM)
    pull_satellites(SATCAT.SWARM, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.AMATEUR_RADIO)
    pull_satellites(SATCAT.AMATEUR_RADIO, mincat)

    cron_logger.info("Succesfully pulled 'Communications' satellites.")


def pull_navigation_satellites():
    """
    Cronjob method. Pulls all navigational-type satellites.
    """

    cron_logger.info("Pulling 'Navigation' satellites"
                     + " from the external API.")

    mincat = MinorCategory.objects.get(minor_category=SATCAT.GNSS)
    pull_satellites(SATCAT.GNSS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.GPS)
    pull_satellites(SATCAT.GPS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.GLONASS)
    pull_satellites(SATCAT.GLONASS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.GALILEO)
    pull_satellites(SATCAT.GALILEO, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.BEIDOU)
    pull_satellites(SATCAT.BEIDOU, mincat)

    cron_logger.info("Succesfully pulled 'Navigation' satellites.")


def pull_scientific_satellites():
    """
    Cronjob method. Pulls all scientific satellites.
    """

    cron_logger.info("Pulling 'Scientific' satellites"
                     + " from the external API.")

    mincat = MinorCategory.objects.get(minor_category=SATCAT.SPACE_AND_EARTH)
    pull_satellites(SATCAT.SPACE_AND_EARTH, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.GEODETICS)
    pull_satellites(SATCAT.GEODETICS, mincat)

    mincat = MinorCategory.objects.get(minor_category=SATCAT.ENGINEERING)
    pull_satellites(SATCAT.ENGINEERING, mincat)

    cron_logger.info("Succesfully pulled 'Scientific' satellites.")


def pull_country_names():
    """
    Cronjob. Uses a local country_codes CSV file in combination with a
    catalogue of nearly all existing satellites to assign country codes
    to every satellite in our database.
    """

    cron_logger.info("Starting 'pull_country_names' cronjob: pulling all " +
                     "country names and assigning them to stored satellites.")

    DIR = Path(__file__).resolve().parent
    codes_path = os.path.join(DIR, 'util', 'country_codes.csv')

    try:
        mydict = {}

        with open(codes_path, mode='r') as infile:
            reader = csv.reader(infile)
            mydict = {rows[0]: rows[2] for rows in reader}

        cron_logger.info("Loaded country data.")
        csv_data = requests.get('https://celestrak.org/pub/satcat.csv')
        if csv_data.status_code != 200:
            cron_logger.error(
                "Could not fetch 'satcat' data from Celestrak source." +
                " Most likely, this server has been temporarily " +
                "blocked due to excessive API calls. Response code: " +
                str(
                    csv_data.status_code) +
                ".")
            return
        else:
            csv_data = csv_data.text.splitlines()
            cron_logger.info("Retrieved catalogue number data from server.")
    except Exception as e:
        cron_logger.error(e)

    # Counter for the number of satellites for which a country code could be
    # found
    found_satellites = 0

    # Counter for the number of satellites for which a country code could be
    # found
    unfound_satellites = 0

    # Delete the first line since it's just the header, not data
    csv_data.pop(0)

    # Line by line, go through the satellite catalogue data, extract the
    # country code, and assign it to the corresponding satellite in our
    #  database (if any). Note that it is expected behaviour for not all
    # satellites to be found (i.e. the exception below does not indicate
    # unintended behaviour).
    for line in csv_data:

        # Checks if the end of the CSV has been reached
        if line == '':
            break

        split_line = line.split(',')

        try:
            sat = Satellite.objects.get(satellite_catalog_number=split_line[2])
            sat.country = mydict[split_line[5]]
            sat.save()
            found_satellites += 1
        except Satellite.DoesNotExist:
            unfound_satellites += 1

    cron_logger.info(
        "Assigned country data to a total of " +
        str(found_satellites) +
        " satellites.")
    cron_logger.info(
        "Could not find " +
        str(unfound_satellites) +
        " satellites to assign country data to.")
    cron_logger.info("Done assigning satellites to country data.")
