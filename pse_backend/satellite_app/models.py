from django.db import models

# Create your models here.    

class Satellite(models.Model):
    name = models.CharField(max_length=24) # <-- dit is de 'title line (optional)'
    line1 = models.CharField(max_length=69)
    line2 = models.CharField(max_length=69)
    satellite_catalog_number = models.IntegerField(primary_key=True)
    launch_year = models.IntegerField() #max_length=4
    epoch_year = models.IntegerField() #max_length=4
    epoch = models.FloatField()
    revolutions = models.IntegerField()
    revolutions_per_day = models.FloatField()

    class ClassificationChoices(models.TextChoices):
        # U: unclassified, C: classified, S: secret
        UNCLASSIFIED = "U"
        CLASSIFIED = "C"
        SECRET = "S"

    class CategoryChoices(models.TextChoices):
        NONE = "None"
        SPECIAL_INTEREST = "Special interest Satellites"
        WEATHER_AND_EARTH = "Weather & Earth Resources Satellites"
        COMMUNICATIONS = "Communications Satellites"
        NAVIGATION = "Navigation Satellites"
        SCIENTIFIC = "Scientific Satellites"

        """
        Dingen waar je extra op wilt kunnen filteren:
        -Starlink
        -Search And Rescue
        -Disaster monitoring
        -Active
        -Space stations
        -De categorieen van navigatie-satellieten (e.g. GPS, GLONASS, etc)
        """

    class AffiliationChoices(models.TextChoices):
        NONE = "None"

        # Special interest types:
        LAST_30_DAYS = "Last 30 Days' Launches"
        SPACE_STATIONS = "Space Stations"
        ACTIVE = "Active Satellites"
        ANALYST_SATELLITES = "Analyst Satellites"

        # Weather and earth types:
        WEATHER = "Weather"
        NOAA = "NOAA"
        #GOES = "GOES"
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

        # Navigation types:
        GNSS = "GNSS"
        GPS = "GPS Operational"
        GLONASS = "Glonass Operational"
        GALILEO = "Galileo"
        BEIDOU = "Beidou"

        #Scientific types:
        SPACE_AND_EARTH = "Space and Earth Science"
        GEODETICS = "Geodetics"
        ENGINEERING = "Engineering"
        EDUCATION = "Education"

    category = models.CharField(max_length=45, choices=CategoryChoices.choices, default=CategoryChoices.NONE)
    affiliation = models.CharField(max_length=45, choices=AffiliationChoices.choices, default=AffiliationChoices.NONE)
    classification = models.CharField(max_length=1, choices=ClassificationChoices.choices, default=ClassificationChoices.UNCLASSIFIED)

    def __str__(self) -> str:
        return self.name   # <-- currently hardcoded to displaying just the name, change later
    
    # def isStarlinkSatellite(self) -> bool:
    #     "STARLINK" in self.name


# class Question(models.Model):
#     question_text = models.CharField(max_length=200)
#     pub_date = models.DateTimeField("date published")


# class Choice(models.Model):
#     question = models.ForeignKey(Question, on_delete=models.CASCADE)
#     choice_text = models.CharField(max_length=200)
#     votes = models.IntegerField(default=0)
