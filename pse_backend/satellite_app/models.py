from django.db import models

# Create your models here.


class Satellite(models.Model):
    name = models.CharField(max_length=24) # <-- dit is de 'title line (optional)'
    line1 = models.CharField(max_length=69)
    line2 = models.CharField(max_length=69)
    satellite_catalog_number = models.IntegerField()
    classification = models.CharField(max_length=1)
    launch_year = models.IntegerField() #max_length=4
    epoch_year = models.IntegerField() #max_length=4
    epoch = models.FloatField()
    revolutions = models.IntegerField()
    revolutions_per_day = models.FloatField()

    def __str__(self) -> str:
        return self.name   # <-- currently hardcoded to displaying just the name, change later
    
    def isStarlinkSatellite(self) -> bool:
        "STARLINK" in self.name


# class Question(models.Model):
#     question_text = models.CharField(max_length=200)
#     pub_date = models.DateTimeField("date published")


# class Choice(models.Model):
#     question = models.ForeignKey(Question, on_delete=models.CASCADE)
#     choice_text = models.CharField(max_length=200)
#     votes = models.IntegerField(default=0)
