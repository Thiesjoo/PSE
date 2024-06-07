from django.core.management.base import BaseCommand
from satellite_app.models import Satellite, MinorCategory

# For ease of use
SATAFF = MinorCategory.MinorCategoryChoices

from django.core.management.base import BaseCommand

#TODO: Make belows' uglyass code shorter

class Command(BaseCommand):
    help = 'Run custom script'

    def handle(self, *args, **kwargs):
        
        # Special interest
        mincat = MinorCategory(minor_category=SATAFF.LAST_30_DAYS)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.SPACE_STATIONS)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.ACTIVE)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.ANALYST_SATELLITES)
        mincat.save()

        # Weather and earth
        mincat = MinorCategory(minor_category=SATAFF.WEATHER)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.NOAA)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.EARTH_RESOURCES)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.SEARCH_AND_RESCUE)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.DISASTER_MONITORING)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.ARGOS)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.PLANET)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.SPIRE)
        mincat.save()

        # Communication
        mincat = MinorCategory(minor_category=SATAFF.ACTIVE_GEOSYNCHRONOUS)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.STARLINK)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.IRIDIUM)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.INTELSAT)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.SWARM)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.AMATEUR_RADIO)
        mincat.save()

        # Navigation
        mincat = MinorCategory(minor_category=SATAFF.GNSS)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.GPS)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.GLONASS)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.GALILEO)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.BEIDOU)
        mincat.save()

        # Scientific
        mincat = MinorCategory(minor_category=SATAFF.SPACE_AND_EARTH)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.GEODETICS)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.ENGINEERING)
        mincat.save()
        mincat = MinorCategory(minor_category=SATAFF.EDUCATION)
        mincat.save()
        
        self.stdout.write(self.style.SUCCESS('Successfully generated minor categories in the database.'))
