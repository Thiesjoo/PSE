from django.shortcuts import render

# Create your views here.

from django.http import HttpResponse

import requests



def index(request):

    res = requests.get('https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle')

    # Pak elke 3 lijnen
    # Bij 1e van de 3: pak de naam van de satellite
    # Bij 2e van de 3: pak de 1e line
    # Bij 3e van de 3:
    #       - pak de 2e line
    #       - pak de filter properties (met tletools library?)
    #       - sla het op in de database (dus een nieuw Satellite entry met beide de twee TLE lines en de fitler properties)


    # Later: move deze code naar een cronjob omgeving die het bijv. 1 keer per dag uitvoerd

    name = ''
    filter_properties = ''
    data_lines = res.text.split('\n') # All data from Celestrak, line by line
    

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

    # For every TLE in the 'tles' list:
    # Extract the properties to filter on
    # ...
    # Create a new object to place in the database
    # ...    

    return HttpResponse(res, content_type="text/plain")
