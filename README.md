# PSE
Leuk projectje bouwen!

Link naar [google drive map](https://drive.google.com/drive/folders/1FpHyVIV6NC2sPYABwjx2wBPIRNmxGxJo?usp=drive_link).

## Installation instructions frontend

Clone this repository and run the following commands in the terminal:

```bash
cd frontend
npm install
npm run dev
```

## Backend manual
Fetching satellite data directly from external API's can be slow and cumbersome due to the many separate endpoints. Furthermore, API keys (if any) cannot be present in the front-end due to security risks. This project aims to prevent these issues through the use of a backend application made using the Django framework. Using this backend, users can rely on a single endpoint to make high-speed API calls to fetch satellites with filter criteria and a limit on the amount of satellites to fetch.

A Satellite object fetched from the database consists of the following data:
| Attribute          | Description        |
|--------------------|--------------------|
| `name`             | Name of the satellite. |
| `line1` | Line 1 of the TLE. |
| `line2` | Line 2 of the TLE. |
| `satellite_catalog_number` | Catalog number. This is also its unique ID. |
| `launch_year` | The year it launched. |
| `epoch_year` | Year that the TLE was recorded. |
| `epoch` | Specific day and time that the TLE was recorded. |
| `revolutions` | Total amount of revolutions this Satellite has taken at the time of the TLE recording. |
| `revolutions_per_day` | The amount of revolutions this satellite travels per day. |
| `country` | The country or countries that this satellite is associated with. |
| `categories` | The categories (see below) that this satellite belongs to. |
| `classification` | Can be either `U` (unclassified), `C` (classified) or `S` (secret). |

### User guide
The API contains multiple endpoints. The main endpoint can be reached via the URI:
```
/satellite_app
```

By default, a fixed amount of satellites from all categories are fetched with a default limit of 1000. To pick a specific limit, use the `limit` parameter. For instance, to set a limit of 400:
```
/satellite_app?limit=400
```

To filter on specific satellite categories, use the `filter` parameter and list each category separated by a comma, e.g.:
```
/satellite_app?limit=400&filter=Space Stations, Starlink, Galileo
```
* Note: Don't pay heed to spaces in the category names. This is OK.

#### Full list of filter categories:

| Special Interest         |
|--------------------------|
| Last 30 Days' Launches   |
| Space Stations           |
| Active Satellites        |
| Analyst Satellites       |


| Weather and Earth            |
|------------------------------|
| Weather                      |
| NOAA                         |
| Earth Resources              |
| Search & Rescue (SARSAT)     |
| Disaster Monitoring          |
| ARGOS Data Collection System |
| Planet                       |
| Spire                        |


| Communications         |
|------------------------|
| Active Geosynchronous  |
| Starlink               |
| Iridium                |
| Intelsat               |
| Swarm                  |
| Amateur Radio          |


| Navigational |
|-----------------------|
| GNSS |
| GPS Operational |
| Glonass Operational |
| Galileo |
| Beidou |


| Scientific |
|-----------------------|
| Space and Earth Science |
| Geodetics |
| Engineering |
| Education |

* Note that you can only filter on *minor* categories (e.g. you can't filter on 'Communications').

#### Other endpoints
Below are some other useful endpoints:

To fetch all existing categories:
```
/satellite_app/categories
```

To fetch all launch years:
```
/satellite_app/launch_years
```

To fetch all countries with associated satellites:
```
/satellite_app/countries
```

#### List of special country codes
The country codes will mostly be 2 letter ISO 3166-1 alpha-2 codes. There are some exceptions
|Country code|Meaning|
|------------|-------|
|INT|Multiple countries, use internation flag of earth|
|XX/YY|Two countries launched a satellite together|
|UNK|Unkown, use a question mark|
|EU|For the european union|

### Development & setup guide

To setup the backend, make sure to follow all the steps below:

First, create a .env file in the root folder. In there, paste the following contents:
```.env
SECRET_KEY=<your secret key>
DEBUG=<'true' or 'false' depending on whether it's in a production or development environment>
```
Then, install the dependencies listed in requirements.txt.

Then, navigate to the `pse_backend` directory and run the following commands to generate the database:
```
python3 manage.py makemigrations
python3 manage.py migrate
```

Since the satellite categories are stored as actual rows in the database, we need to generate these. To do this, run the following command:
```
python3 manage.py gen_satcats
```

The backend makes use of the django-crontab package to handle certain cronjobs. For these to work however, we need to tell the crontab package to use them. To do this, enter the following command to add our cronjobs:
```
python3 manage.py crontab add
```

To make sure they were added correctly, you can run the `show` command:
```
python3 manage.py crontab show
```

Before we can run the server, we need to create a superuser account so that we can always log into our database and see our data. To do this, run the following command and follow the steps prompted from there:
```
python3 manage.py createsuperuser
```

Finally, to start the server, run the following command:
```
python3 manage.py runserver
```

Your instance of the backend should now be running. Make sure to read the section below about logging too to understand how to track the servers' activities.

#### Logs
There are two main activities that are logged:
1. **Cronjob activities**: Everytime a cronjob is activated on the server to fetch some satellite data from an external source. This is especially important because these crons are performed at nighttimes, and tracking these activities would be near impossible without logging them. If anything goes wrong during fetching or creating satellites, the logs will show where and when.
2. **API calls**: API calls that are made to the backend (from the front-end, presumably). This helps us keep track of how many, and from where, and at which times, API calls are made. 

While these logs are printed to the console, they are also stored in logging files as `cron.log` and `views.log` respectively. They are located at `pse_backend/logs/`.