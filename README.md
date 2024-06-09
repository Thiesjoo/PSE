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
Fetching satellite data directly from external API's can be slow and cumbersome due to the many separate endpoints. Furthermore, API keys (if any) cannot be present in the front-end due to security risks. This project aims to solve these issues through the use of a backend application made using the Django framework. Using this backend, users can make high-speed API calls to fetch satellites with filter criteria and a limit on the amount of satellites to fetch.

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
| `categories` | The categories (see below) that this satellite belongs to. |
| `classification` | Can be either `U` (unclassified), `C` (classified) or `S` (secret). |

### User guide
The API contains a single generalized endpoint that can be reached via the URI:
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


### Developer guide

To setup the stuff...