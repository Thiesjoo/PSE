from django.db import models

# Create your models here.

from django.db import models


class TLE(models.Model):
    line1 = models.CharField(max_length=200)
    line2 = models.CharField(max_length=200)

class Satellite(models.Model):
    question = models.ForeignKey(TLE, on_delete=models.CASCADE)
    name = models.CharField(max_length=200) # <-- dit is de 'title line (optional)'

# class Question(models.Model):
#     question_text = models.CharField(max_length=200)
#     pub_date = models.DateTimeField("date published")


# class Choice(models.Model):
#     question = models.ForeignKey(Question, on_delete=models.CASCADE)
#     choice_text = models.CharField(max_length=200)
#     votes = models.IntegerField(default=0)
