"""
Django models for the satellite_app app.
The following models are defined:
- MinorCategory: A model for satellite categories.
- Satellite: A model for satellite data.
"""

from django.db import models


class MinorCategory(models.Model):
    """
    Category model. Has a single attribute
    storing a satellite category.
    """
    class Meta:
        verbose_name_plural = 'Minor Categories'

    class MinorCategoryChoices(models.TextChoices):

        NONE = "None"

        # Special interest types:
        LAST_30_DAYS = "Last 30 Days' Launches"
        SPACE_STATIONS = "Space Stations"
        ACTIVE = "Active Satellites"

        # Weather and earth types:
        WEATHER = "Weather"
        NOAA = "NOAA"
        # GOES = "GOES"
        EARTH_RESOURCES = "Earth Resources"
        SEARCH_AND_RESCUE = "Search & Rescue (SARSAT)"
        DISASTER_MONITORING = "Disaster Monitoring"
        ARGOS = "ARGOS Data Collection System"
        PLANET = "Planet"
        SPIRE = "Spire"

        # Communications types:
        ACTIVE_GEOSYNCHRONOUS = "Active Geosynchronous"
        STARLINK = "Starlink"
        IRIDIUM = "Iridium"
        INTELSAT = "Intelsat"
        SWARM = "Swarm"
        AMATEUR_RADIO = "Amateur Radio"
        ONEWEB = "OneWeb"

        # Navigation types:
        GNSS = "GNSS"
        GPS = "GPS Operational"
        GLONASS = "Glonass Operational"
        GALILEO = "Galileo"
        BEIDOU = "Beidou"

        # Scientific types:
        SPACE_AND_EARTH = "Space and Earth Science"
        GEODETICS = "Geodetics"
        ENGINEERING = "Engineering"

    minor_category = models.CharField(
        max_length=45,
        choices=MinorCategoryChoices.choices,
        default=MinorCategoryChoices.NONE)


class Satellite(models.Model):
    """
    Satellite model. Contains the information of a satellite
    in the form of both a TLE and individual data.
    """
    name = models.CharField(max_length=24)
    line1 = models.CharField(max_length=69)
    line2 = models.CharField(max_length=69)
    satellite_catalog_number = models.IntegerField(primary_key=True)
    launch_year = models.IntegerField(db_index=True)  # max_length=4
    epoch_year = models.IntegerField()  # max_length=4
    epoch = models.FloatField()
    revolutions = models.IntegerField()
    revolutions_per_day = models.FloatField()
    country = models.CharField(
        max_length=5,
        blank=True,
        default='',
        db_index=True)

    minor_categories = models.ManyToManyField(
        MinorCategory, related_name='satellites', db_index=True)

    class ClassificationChoices(models.TextChoices):
        # U: unclassified, C: classified, S: secret
        UNCLASSIFIED = "U"
        CLASSIFIED = "C"
        SECRET = "S"

    classification = models.CharField(
        max_length=1,
        choices=ClassificationChoices.choices,
        default=ClassificationChoices.UNCLASSIFIED)

    def __str__(self) -> str:
        return self.name + '\n' + self.line1 + '\n' + self.line2 + '\n'
