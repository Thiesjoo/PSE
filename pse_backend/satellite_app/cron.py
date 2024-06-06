from tletools import TLE

from satellite_app.models import Satellite

import requests

def satellite_data_pull():

    Satellite.objects.all().delete()

    #NOTE: Use this when testing to avoid spamming the API:
    # data_lines = ['ISS (ZARYA)',
    #                '1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927',
    #                '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537']

    res = requests.get('https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle')
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
                         epoch=tle.epoch_day, revolutions=tle.rev_num, revolutions_per_day=tle.n)
        sat.save()
