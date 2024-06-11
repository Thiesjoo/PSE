from django.core.management.base import BaseCommand
from satellite_app.models import Satellite, MinorCategory

import requests

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
        
        self.stdout.write(self.style.SUCCESS('Successfully generated minor categories in the database.'))
