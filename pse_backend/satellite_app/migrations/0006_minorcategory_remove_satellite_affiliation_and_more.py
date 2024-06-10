# Generated by Django 5.0.6 on 2024-06-07 14:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('satellite_app', '0005_alter_satellite_classification'),
    ]

    operations = [
        migrations.CreateModel(
            name='MinorCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('minor_category', models.CharField(choices=[('None', 'None'), ("Last 30 Days' Launches", 'Last 30 Days'), ('Space Stations', 'Space Stations'), ('Active Satellites', 'Active'), ('Analyst Satellites', 'Analyst Satellites'), ('Weather', 'Weather'), ('NOAA', 'Noaa'), ('Earth Resources', 'Earth Resources'), ('Search & Rescue (SARSAT)', 'Search And Rescue'), ('Disaster Monitoring', 'Disaster Monitoring'), ('ARGOS Data Collection System', 'Argos'), ('Planet', 'Planet'), ('Spire', 'Spire'), ('Active Geosynchronous', 'Active Geosynchronous'), ('Starlink', 'Starlink'), ('Iridium', 'Iridium'), ('Intelsat', 'Intelsat'), ('Swarm', 'Swarm'), ('Amateur Radio', 'Amateur Radio'), ('GNSS', 'Gnss'), ('GPS Operational', 'Gps'), ('Glonass Operational', 'Glonass'), ('Galileo', 'Galileo'), ('Beidou', 'Beidou'), ('Space and Earth Science', 'Space And Earth'), ('Geodetics', 'Geodetics'), ('Engineering', 'Engineering'), ('Education', 'Education')], default='None', max_length=45)),
            ],
        ),
        migrations.RemoveField(
            model_name='satellite',
            name='affiliation',
        ),
        migrations.RemoveField(
            model_name='satellite',
            name='category',
        ),
        migrations.AddField(
            model_name='satellite',
            name='minor_categories',
            field=models.ManyToManyField(related_name='satellites', to='satellite_app.minorcategory'),
        ),
    ]