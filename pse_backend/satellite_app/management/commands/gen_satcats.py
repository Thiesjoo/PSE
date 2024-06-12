from django.core.management.base import BaseCommand
from satellite_app.models import Satellite, MinorCategory

# For ease of use
SATAFF = MinorCategory.MinorCategoryChoices

"""
Description: This command-script populates the database with rows of all
 minor categories used in our application. These categories are
 then used by the satellites to describe their nature.
"""


class Command(BaseCommand):
    help = 'Run custom script'

    def handle(self, *args, **kwargs):

        # Special Interest
        self._save_minor_categories([
            SATAFF.LAST_30_DAYS, SATAFF.SPACE_STATIONS, SATAFF.ACTIVE, SATAFF.ANALYST_SATELLITES
            print('test')
        ])

        # Weather and Earth
        self._save_minor_categories([
            SATAFF.WEATHER,
            SATAFF.NOAA,
            SATAFF.EARTH_RESOURCES,
            SATAFF.SEARCH_AND_RESCUE,
            SATAFF.DISASTER_MONITORING,
            SATAFF.ARGOS,
            SATAFF.PLANET,
            SATAFF.SPIRE
        ])

        # Communication
        self._save_minor_categories([
            SATAFF.ACTIVE_GEOSYNCHRONOUS,
            SATAFF.STARLINK,
            SATAFF.IRIDIUM,
            SATAFF.INTELSAT,
            SATAFF.SWARM,
            SATAFF.AMATEUR_RADIO
        ])

        # Navigation
        self._save_minor_categories([
            SATAFF.GNSS,
            SATAFF.GPS,
            SATAFF.GLONASS,
            SATAFF.GALILEO,
            SATAFF.BEIDOU
        ])

        # Scientific
        self._save_minor_categories([
            SATAFF.SPACE_AND_EARTH,
            SATAFF.GEODETICS,
            SATAFF.ENGINEERING,
            SATAFF.EDUCATION
        ])

        self.stdout.write(self.style.SUCCESS(
            'Successfully generated minor categories in the database.'))

    def _save_minor_categories(self, minor_categories):
        """
        Save a list of minor categories to the database.
        """
        for minor in minor_categories:
            mincat = MinorCategory(minor_category=minor)
            mincat.save()
