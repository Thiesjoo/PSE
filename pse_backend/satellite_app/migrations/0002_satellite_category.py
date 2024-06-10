# Generated by Django 5.0.6 on 2024-06-06 12:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('satellite_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='satellite',
            name='category',
            field=models.CharField(choices=[('None', 'None'), ("Last 30 Days' Launches", 'Last 30 Days'), ('Space Stations', 'Space Stations'), ('Active Satellites', 'Active'), ('Analyst Satellites', 'Analyst Satellites'), ('Weather', 'Weather'), ('NOAA', 'Noaa'), ('Earth Resources', 'Earth Resources'), ('Search & Rescue (SARSAT)', 'Search And Rescue'), ('Disaster Monitoring', 'Disaster Monitoring'), ('ARGOS Data Collection System', 'Argos'), ('Planet', 'Planet'), ('Spire', 'Spire'), ('Active Geosynchronous', 'Active Geosynchronous'), ('Starlink', 'Starlink'), ('Iridium', 'Iridium'), ('Intelsat', 'Intelsat'), ('Swarm', 'Swarm'), ('Amateur Radio', 'Amateur Radio'), ('GNSS', 'Gnss'), ('GPS Operational', 'Gps'), ('Glonass Operational', 'Glonass'), ('Galileo', 'Galileo'), ('Beidou', 'Beidou'), ('Space and Earth Science', 'Space And Earth'), ('Geodetics', 'Geodetics'), ('Engineering', 'Engineering'), ('Education', 'Education')], default='None', max_length=45),
        ),
    ]