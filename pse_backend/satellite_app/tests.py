"""
In this file, the tests for the backend are defined.
The tests are as follows:
- EndpointsTestCase: Tests all the endpoints in views.py using static 'fixture'
    data. Django uses this as a test-database.
- test_main_endpoint_all_satellites: Tests whether the main endpoint can be
    used to retrieve all satellites.
- test_main_endpoint_specific_categories: Tests whether the main endpoint can be used to
    retrieve specific categories of satellites.
- test_categories_endpoint: Tests whether the categories endpoint works as
    intended (i.e. fetching all existing categories from the database).
- test_launch_years_endpoint: Tests whether the launch years endpoint works as
    intended
- test_countries_endpoint: Tests whether the countries endpoint works as
    intended

Can be run with:
    python3 manage.py test
"""

import json
import random
from django.test import TestCase
from django.core.management import call_command



class EndpointsTestCase(TestCase):
    """
    Tests all the endpoints in views.py using static 'fixture'
    data. Django uses this as a test-database.
    """

    # Load the satellites fixture
    fixtures = ['satellite_fixture.json']

    def setUp(self):
        """
        Load category fixture as an extra fixture
        """

        call_command('loaddata', 'category_fixture.json')

    def test_main_endpoint_all_satellites(self):
        """
        Tests whether the main endpoint can be
        used to retrieve all satellites.
        """

        response_all_satellites = self.client.get('/satellite_app/')
        self.assertEqual(
            response_all_satellites.status_code,
            200,
            "The /satellite_app/ endpoint did not return OK status!")

        response_json = json.loads(response_all_satellites.content)

        satellites_amount = len(response_json['satellites'])

        CORRECT_SATELLITES_AMOUNT = 10344  # <- Based on the mock data

        self.assertEqual(
            satellites_amount,
            CORRECT_SATELLITES_AMOUNT,
            "Number of fetched satellites is wrong!")

    def test_main_endpoint_specific_categories(self):
        """
        Tests whether the main endpoint can be used to
        retrieve specific categories of satellites.
        """

        response_some_satellites = self.client.get(
            '/satellite_app/', {'filter': 'Space Stations, Starlink'})
        self.assertEqual(
            response_some_satellites.status_code,
            200,
            "The /satellite_app?... endpoint did not return OK status!")
        response_json = json.loads(response_some_satellites.content)

        satellites_list = response_json['satellites']

        # Pick a random satellite, check if its categories are correct
        for _ in range(3):
            random_satellite = random.choice(satellites_list)
            self.assertTrue(
                ('Space Stations' in random_satellite['categories']) or (
                    'Starlink' in random_satellite['categories']),
                "Satellite does not have the right categories!")

        satellites_amount = len(satellites_list)
        CORRECT_SATELLITES_AMOUNT = 6120  # <- Based on the mock data

        # Check if the exact correct amount of satellites were fetched
        self.assertEqual(
            satellites_amount,
            CORRECT_SATELLITES_AMOUNT,
            "Number of fetched satellites is wrong!")

    def test_categories_endpoint(self):
        """
        Tests whether the categories endpoint works as
        intended (i.e. fetching all existing categories
        from the database).
        """

        response_categories = self.client.get('/satellite_app/categories')
        response_json = json.loads(response_categories.content)
        categories_amount = len(response_json['categories'])
        CORRECT_CATEGORIES_AMOUNT = 27  # <- Based on the mock data
        self.assertEqual(
            categories_amount,
            CORRECT_CATEGORIES_AMOUNT,
            "The fetched amount of categories is not correct!")
        self.assertEqual(categories_amount,
                         len(set(response_json['categories'])),
                         "There are duplicate categories!")

    def test_launch_years_endpoint(self):
        """
        Tests whether the launch years endpoint works as
        intended
        """

        response_launch_years = self.client.get('/satellite_app/launch_years')
        response_json = json.loads(response_launch_years.content)
        launch_years_amount = len(response_json['launch_years'])
        CORRECT_LAUNCH_YEARS_AMOUNT = 63  # <- Based on the mock data
        self.assertEqual(
            launch_years_amount,
            CORRECT_LAUNCH_YEARS_AMOUNT,
            "The fetched amount of launch years is not correct!")
        self.assertEqual(launch_years_amount,
                         len(set(response_json['launch_years'])),
                         "There are duplicate launch years!")

    def test_countries_endpoint(self):
        """
        Tests whether the countries endpoint works as
        intended
        """

        response_countries = self.client.get('/satellite_app/countries')
        response_json = json.loads(response_countries.content)
        countries_amount = len(response_json['countries'])
        CORRECT_COUNTRIES_AMOUNT = 89  # <- Based on the mock data
        self.assertEqual(
            countries_amount,
            CORRECT_COUNTRIES_AMOUNT,
            "The fetched amount of countries is not correct!")
        self.assertEqual(countries_amount,
                         len(set(response_json['countries'])),
                         "There are duplicate countries!")
