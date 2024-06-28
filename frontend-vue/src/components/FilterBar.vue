<!--
  FilterBar is a component that allows the user to filter the satellites
  based on their category. The user can select multiple categories and
  the satellites that belong to the selected categories will be displayed.
  The user can also filter the satellites based on their launch year.

  The component consists of two main parts:
  - The category filter: The user can select multiple categories from the
    list of categories. The satellites that belong to the selected categories
    will be displayed.
  - The launch year filter: The user can filter the satellites based on their
-->

<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { Filter, SatManager } from '@/common/sat-manager'
import FilterItem from './FilterItem.vue'
import GenericItem from './GenericItem.vue'
import InfoPopup from './InfoPopup.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import VueSlider from 'vue-slider-component'
import { computed, ref, watch } from 'vue'
import LeftInfoBlock from './LeftInfoBlock.vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const manager = new SatManager(props.simulation)
await manager.init()

// Get the filters from the SatManager
const filters = manager.currentFilters

// Create a filter map for easy access by name
const filterMap = filters.reduce(
  (acc, filter) => {
    acc[filter.name] = filter
    return acc
  },
  {} as Record<string, Filter>
)

// Keeps track of whether sats without launch year should be included
let include_sats_without_launch_year = ref(true)

const LAUNCH_YEAR_BOUNDS = manager.launchYearBounds

// Boundary launch years
const FIRST_LAUNCH_YEAR = LAUNCH_YEAR_BOUNDS[0]
const MOST_RECENT_LAUNCH_YEAR = LAUNCH_YEAR_BOUNDS[1]

// Stores the slider values
const slider_values = ref([FIRST_LAUNCH_YEAR, MOST_RECENT_LAUNCH_YEAR])

// Iteratively updates the launch year
// range on every filter.
const updateLaunchYearFilter = () => {
  filters.forEach((filter) => {
    filter.min_launch_year = slider_values.value[0]
    filter.max_launch_year = slider_values.value[1]
  })
}

// Initial update of the launch year filter
updateLaunchYearFilter()

// Keeps track of whether or not to keep advanced filters on
const advancedFilters = ref(false)
filters[2].selected = false
filters[0].selected = false

// List of 'generic' categories containing smaller
// categories. These six 'generics' are the six main
// categories.
const generics = ref([
  {
    name: 'Weather',
    filters: [filterMap['Weather']],
    icon: '/filter-icons/weather2.svg'
  },
  {
    name: 'Navigational',
    filters: [
      filterMap['GNSS'],
      filterMap['GPS Operational'],
      filterMap['Glonass Operational'],
      filterMap['Galileo'],
      filterMap['Beidou']
    ],
    icon: '/filter-icons/navigation.svg'
  },
  {
    name: 'Communication',
    filters: [filterMap['Starlink'], filterMap['OneWeb']],
    icon: '/filter-icons/communication2.svg'
  },
  {
    name: 'Space Stations',
    filters: [filterMap['Space Stations']],
    icon: '/filter-icons/space_station.svg'
  },
  {
    name: 'Science',
    filters: [
      filterMap['Space and Earth Science'],
      filterMap['Geodetics'],
      filterMap['Engineering'],
      filterMap['NOAA'],
      filterMap['Earth Resources'],
      filterMap['ARGOS Data Collection System'],
      filterMap['Planet']
    ],
    icon: '/filter-icons/science.svg'
  },
  {
    name: 'Other',
    filters: [
      filterMap['Search & Rescue (SARSAT)'],
      filterMap['Disaster Monitoring'],
      filterMap['Spire'],
      filterMap['Active Geosynchronous'],
      filterMap['Iridium'],
      filterMap['Intelsat'],
      filterMap['Swarm'],
      filterMap['Amateur Radio']
    ],
    icon: '/filter-icons/other.svg'
  }
])
</script>

<template>
  <LeftInfoBlock :open="!props.simulation.mobile.value" class="left-info-block">
    <h2>{{ t('Category filter') }}</h2>
    <p>{{ t('Multiple filters') }}</p>

    <div class="flex" v-if="advancedFilters">
      <div class="filter-block">
        <FilterItem v-for="filter in filters" :key="filter.name" v-model="filter.selected">
          {{ t(filter.name) }} - {{ manager.count[filter.name] }}
          <InfoPopup>
            {{ t(filter.name + '_description') }}
          </InfoPopup>
        </FilterItem>
      </div>

      <button @click="manager.selectNone()">{{ t('Unselect All') }}</button>
      <button @click="manager.selectAll()">{{ t('Select All') }}</button>
    </div>

    <div v-else class="flex">
      <div class="generic-block">
        <GenericItem
          v-for="(generic, index) in generics"
          :key="generic.name"
          v-model="generic.filters"
          :align-left="index % 2 != 0"
          :index="index"
          :icon="generic.icon"
          :name="generic.name"
        >
        </GenericItem>
      </div>
    </div>

    <input
      class="C"
      type="checkbox"
      @click="advancedFilters = !advancedFilters"
      :checked="advancedFilters"
      id="advanced-filter-checkbox"
    />
    <label for="advanced-filter-checkbox" id="advanced-filtering-label">{{
      t('Advanced filtering')
    }}</label>
    <h2 class="launch-title">{{ t('Launch year filter') }}</h2>
    <p>{{ t('Drag the slider to filter satellites by their launch year.') }}</p>

    <div class="launch-year-filter-block">
      <label
        >{{
          t('FilteringLaunchYear1') +
          slider_values[0] +
          t('FilteringLaunchYear2') +
          slider_values[1]
        }}.
      </label>
      <input
        type="checkbox"
        id="include_without_launch_year"
        v-model="include_sats_without_launch_year"
        hidden
      />
      <label for="include_without_launch_year" hidden>Include satellites without launch year</label>
    </div>
    <vue-slider
      v-model="slider_values"
      :min="FIRST_LAUNCH_YEAR"
      :max="MOST_RECENT_LAUNCH_YEAR"
      :min-range="1"
      :enable-cross="false"
      :tooltip="'always'"
      :tooltip-placement="['bottom', 'bottom']"
      :lazy="true"
      id="launch-year-slider"
      v-on:drag-end="updateLaunchYearFilter"
    />
  </LeftInfoBlock>
</template>

<style lang="scss">
@import '@/common/colors.scss';
@import '@/common/scrollbar.scss';

$disabledOpacity: 0.5 !default;

$bgColor: $slider_bar !default;
$railBorderRadius: 15px !default;

$dotShadow: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.32) !default;
$dotShadowFocus: 0px 0px 1px 2px rgba($slider_button, 0.36) !default;
$dotBgColor: $slider_button !default;
$dotBgColorDisable: #ccc !default;
$dotBorderRadius: 50% !default;

$tooltipBgColor: $slider_text_background !default;
$tooltipColor: $slider_text !default;
$tooltipBorderRadius: 5px !default;
$tooltipPadding: 2px 5px !default;
$tooltipMinWidth: 20px !default;
$tooltipArrow: 5px !default;
$tooltipFontSize: 14px !default;

$stepBorderRadius: 50% !default;
$stepBgColor: rgba(0, 0, 0, 0.16) !default;

$labelFontSize: 14px !default;

@mixin triangle($size, $color, $direction) {
  height: 0;
  width: 0;
  @if ($direction==top) or ($direction==bottom) or ($direction==right) or ($direction==left) {
    border-color: transparent;
    border-style: solid;
    border-width: $size;
    @if $direction==top {
      border-bottom-color: $color;
    } @else if $direction==right {
      border-left-color: $color;
    } @else if $direction==bottom {
      border-top-color: $color;
    } @else if $direction==left {
      border-right-color: $color;
    }
  }
}

@mixin arrow($size, $color) {
  &::after {
    content: '';
    position: absolute;
  }

  &-top {
    &::after {
      top: 100%;
      left: 50%;
      transform: translate(-50%, 0);
      @include triangle($size, $color, bottom);
    }
  }

  &-bottom {
    &::after {
      bottom: 100%;
      left: 50%;
      transform: translate(-50%, 0);
      @include triangle($size, $color, top);
    }
  }

  &-left {
    &::after {
      left: 100%;
      top: 50%;
      transform: translate(0, -50%);
      @include triangle($size, $color, right);
    }
  }

  &-right {
    &::after {
      right: 100%;
      top: 50%;
      transform: translate(0, -50%);
      @include triangle($size, $color, left);
    }
  }
}

/* component style */
.vue-slider-disabled {
  opacity: $disabledOpacity;
  cursor: not-allowed;
}

/* rail style */
.vue-slider-rail {
  background-color: $bgColor;
  border-radius: $railBorderRadius;
}

/* process style */
.vue-slider-process {
  background-color: $slider_bar;
  border-radius: $railBorderRadius;
}

.left-info-block {
  padding: 20px;
  padding-top: 30px;

  h2 {
    font-family: 'Tomorrow';
    font-size: 2em;
    text-align: center;
  }

  .launch-title {
    margin-top: 20px;
  }

  p {
    font-family: 'Tomorrow';
    font-size: 1.2em;
    text-align: center;
  }

  .yearfilter {
    margin-top: 20px;
  }
}

/* mark style */
.vue-slider-mark {
  z-index: 4;

  &:first-child,
  &:last-child {
    .vue-slider-mark-step {
      display: none;
    }
  }

  @at-root &-step {
    width: 100%;
    height: 100%;
    border-radius: $stepBorderRadius;
    background-color: $stepBgColor;

    &-active {
    }
  }

  @at-root &-label {
    font-size: $labelFontSize;
    white-space: nowrap;

    &-active {
    }
  }
}

/* dot style */
.vue-slider-dot {
  @at-root &-handle {
    cursor: pointer;
    width: 100%;
    height: 100%;
    border-radius: $dotBorderRadius;
    background-color: $dotBgColor;
    box-sizing: border-box;
    box-shadow: $dotShadow;

    @at-root &-focus {
      box-shadow: $dotShadowFocus;
    }
    @at-root &-disabled {
      cursor: not-allowed;
      background-color: $dotBgColorDisable;
    }
  }

  @at-root &-tooltip {
    @at-root &-inner {
      font-size: $tooltipFontSize;
      white-space: nowrap;
      padding: $tooltipPadding;
      min-width: $tooltipMinWidth;
      text-align: center;
      color: $tooltipColor;
      border-radius: $tooltipBorderRadius;
      border-color: $tooltipBgColor;
      background-color: $tooltipBgColor;
      box-sizing: content-box;
      @include arrow($tooltipArrow, inherit);
    }
  }

  @at-root &-tooltip-wrapper {
    opacity: 0;
    transition: all 0.3s;
    @at-root &-show {
      opacity: 1;
    }
  }
}

.flex {
  display: flex;
  flex-direction: column;
  max-height: 55vh;
  color: $main_text;
  padding-top: 20px;

  button {
    margin: 5px 0;
    background-color: rgba(61, 61, 109, 0.671);
    color: $main_text;
    border: 1px solid $button_border_box;
    border-radius: 5px;
    padding: 5px;
    cursor: pointer;
  }
}

.filter-block {
  max-height: 60vh;
  overflow-y: scroll;
  position: relative;

  .more {
    z-index: 100;
    position: absolute;
    bottom: 0;
    left: 0;
  }
}

.generic-block {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  border-radius: 5%;
  margin-top: 15px;
}

.C {
  margin-top: 20px;
  margin-right: 5px;
}

.advanced-filtering-label {
  font-family: 'Tomorrow';
}

.launch-year-filter-block {
  margin-top: 20px;
  margin-bottom: 10px;
  text-align: center;

  label {
    font-family: 'Tomorrow';
  }
}

#include_without_launch_year {
  margin-top: 5px;
  margin-right: 5px;
}
</style>
<i18n>
{
  "en": {
      "Last 30 Days' Launches": "Last 30 Days' Launches",
      "Last 30 Days' Launches_description": "All satellite launches in the past 30 days",
      "Space Stations": "Space Stations",
      "Space Stations_description": "A space station is a satellite which remains in orbit and hosts humans for extended periods of time.",
      "Active Satellites": "Active Satellites",
      "Active Satellites_description": "All satellites that are still in use.",
      "Weather": "Weather",
      "Weather_description": "Satellites used for weather forecasting",
      "NOAA": "NOAA",
      "NOAA_description": "The NOAA Satellite and Information Service provides access to environmental data to monitor Earth.",
      "Earth Resources": "Earth Resources",
      "Earth Resources_description": "Satellites which are equipped with a high-resolution Earth observation system.",
      "Search & Rescue (SARSAT)": "Search & Rescue (SARSAT)",
      "Search & Rescue (SARSAT)_description": "Used to determine the location on earth.",
      "Disaster Monitoring": "Disaster Monitoring",
      "Disaster Monitoring_description": "Establish a remote sensing infrastructure for disaster warning and mitigation",
      "ARGOS Data Collection System": "ARGOS Data Collection System",
      "ARGOS Data Collection System_description": "Satellites which carry the ARGOS Advanced Data Collection System, which contains a lot of different information of the Earth.",
      "Planet": "Planet",
      "Planet_description": "Satellites dedicated to Earth Observations using a fleet of small satellites to generate high-resolution images of Earth achieving resolutions of three to five meters",
      "Spire": "Spire",
      "Spire_description": "Satellites that track maritime, aviation, and weather activity from space.",
      "Active Geosynchronous": "Active Geosynchronous",
      "Active Geosynchronous_description": "A geosynchronous satellite has the unique property of remaining permanently fixed in exactly the same position in the sky as viewed from any fixed location on Earth.",
      "Starlink": "Starlink",
      "Starlink_description": "Satellites used for the Starlink network.",
      "Iridium": "Iridium",
      "Iridium_description": "Satellites providing access to reliable voice and data services anywhere on Earth.",
      "Intelsat": "Intelsat",
      "Intelsat_description": "Satellites for commercial and government programs with different usecases.",
      "Swarm": "Swarm",
      "Swarm_description": "Satellites which provide communication for IOT devices.",
      "Amateur Radio": "Amateur Radio",
      "Amateur Radio_description": "Collection of satellites that carry instruments that are created by amateurs, like universities.",
      "GNSS": "GNSS",
      "GNSS_description": "Satellites used to deliver locational data. Different location systems: gps, glonass, galileo, and beidou are all GNSS satellites.",
      "GPS Operational": "GPS Operational",
      "GPS Operational_description": "Satellites that are used for GPS data. Satellites are owned by the USA.",
      "Glonass Operational": "Glonass Operational",
      "Glonass Operational_description": "Satellites which are used for GLONASS satellite navigation system. Satellites are owned by Russia.",
      "Galileo": "Galileo",
      "Galileo_description": "Satellites that are used for GPS data. Satellites are owned by the European Union.",
      "Beidou": "Beidou",
      "Beidou_description": "Satellites that are used for GPS data. Satellites are owned by China.",
      "Space and Earth Science": "Space and Earth Science",
      "Space and Earth Science_description": "Satellites that are used for the Science which can only be done in space.",
      "Geodetics": "Geodetics",
      "Geodetics_description": "Passive satellites with no moving parts. They carry retroreflectors, which reflect back lasers sent by ground stations to pinpoint the orbit of the satellite. These satellite’s are influenced by slight changes in Earth’s gravitational fields and these small adjustments to their orbits can be detected. This can be used to measure slight gravitational changes, oceanic tides and Earth's structure.",
      "Engineering": "Engineering",
      "Engineering_description": "Satellites which are used to test technologies.",

      "Unselect All": "Unselect All",
      "Select All": "Select All",

      "FilteringLaunchYear1": "Filtering on launches from ",
      "FilteringLaunchYear2": " to ",
      "Category filter": "Category filter",
      "Multiple filters": "Click on the buttons below to see the satellites that belong to each category. You can also find more information about indiviual satellites by clicking on the satellite.",
      "Advanced filtering": "Advanced filtering",
      "Navigational": "Navigational",
      "Communication": "Communication",
      "Science": "Science",
      "Other": "Other",
      "Launch year filter" : "Launch year filter",
      "Drag the slider to filter satellites by their launch year.": "Drag the slider to filter satellites by their launch year.",
  },
  "nl": {
      "Last 30 Days' Launches": "Laatste 30 Dagen Lanceringen",
      "Last 30 Days' Launches_description": "Alle satellietlanceringen in de afgelopen 30 dagen",
      "Space Stations": "Ruimtestations",
      "Space Stations_description": "Een ruimtestation is een satelliet die in een baan om de aarde blijft en mensen voor langere tijd huisvest.",
      "Active Satellites": "Actieve Satellieten",
      "Active Satellites_description": "Alle satellieten die nog in gebruik zijn.",
      "Weather": "Weer",
      "Weather_description": "Satellieten gebruikt voor weersvoorspelling",
      "NOAA": "NOAA",
      "NOAA_description": "De NOAA Satellite and Information Service biedt toegang tot milieugegevens om de aarde te monitoren.",
      "Earth Resources": "Aardse Bronnen",
      "Earth Resources_description": "Satellieten die zijn uitgerust met een hoogwaardig aardobservatiesysteem.",
      "Search & Rescue (SARSAT)": "Zoek & Redding (SARSAT)",
      "Search & Rescue (SARSAT)_description": "Wordt gebruikt om de locatie te bepalen op aarde.",
      "Disaster Monitoring": "Rampmonitoring",
      "Disaster Monitoring_description": "Wordt gebruikt voor het voorspellen en monitoren van rampen.",
      "ARGOS Data Collection System": "ARGOS Gegevensverzamelsysteem",
      "ARGOS Data Collection System_description": "Satellieten die het ARGOS Advanced Data Collection System dragen, die veel verschillende informatie over de aarde bevat.",
      "Planet": "Planeet",
      "Planet_description": "Satellieten die de aarde observeren, waarbij veel kleine satellieten worden gebruikt om beelden met hoge resolutie van de aarde te genereren met resoluties van drie tot vijf meter.",
      "Spire": "Spire",
      "Spire_description": "Satellieten die gebruikt worden om maritieme, luchtvaart- en weersactiviteit vanuit de ruimte te volgen.",
      "Active Geosynchronous": "Actieve Geosynchrone",
      "Active Geosynchronous_description": "Een geosynchrone satelliet is een satelliet die de unieke eigenschap hebben dat ze permanent op precies dezelfde positie aan de hemel blijven vanuit elk vast punt op aarde.",
      "Starlink": "Starlink",
      "Starlink_description": "Satellieten gebruikt voor het Starlink-netwerk.",
      "Iridium": "Iridium",
      "Iridium_description": "Satellieten die spraak- en datadiensten overal op aarde bieden.",
      "Intelsat": "Intelsat",
      "Intelsat_description": "Satellieten voor commerciële en overheidsprogramma's met verschillende doeleinden.",
      "Swarm": "Swarm",
      "Swarm_description": "Satellieten die communicatie voor IoT-apparaten bieden.",
      "Amateur Radio": "Amateurradio",
      "Amateur Radio_description": "Verzameling van satellieten die instrumenten dragen die door amateurs zijn gemaakt, zoals universiteiten.",
      "GNSS": "GNSS",
      "GNSS_description": "Satellieten gebruikt om locatiegegevens te leveren. Verschillende locatiesystemen: gps, glonass, galileo en beidou zijn allemaal GNSS-satellieten.",
      "GPS Operational": "GPS Operationeel",
      "GPS Operational_description": "Satellieten die worden gebruikt voor GPS-gegevens. Satellieten zijn eigendom van de VS.",
      "Glonass Operational": "Glonass Operationeel",
      "Glonass Operational_description": "Satellieten die worden gebruikt voor het GLONASS-satellietnavigatiesysteem. Satellieten zijn eigendom van Rusland.",
      "Galileo": "Galileo",
      "Galileo_description": "Satellieten die worden gebruikt voor GPS-gegevens. Satellieten zijn eigendom van de Europese Unie.",
      "Beidou": "Beidou",
      "Beidou_description": "Satellieten die worden gebruikt voor GPS-gegevens. Satellieten zijn eigendom van China.",
      "Space and Earth Science": "Ruimte- en Aarde Wetenschap",
      "Space and Earth Science_description": "Satellieten die worden gebruikt voor wetenschap die alleen in de ruimte kan worden plaatsvinden.",
      "Geodetics": "Geodesie",
      "Geodetics_description": "Passieve satellieten zonder bewegende onderdelen. Deze satellieten dragen retroreflectoren, die lasers van grondstations terugkaatsen om de baan van de satelliet te bepalen. Deze satellieten worden beïnvloed door kleine veranderingen in de zwaartekrachtvelden van de aarde en deze kleine aanpassingen aan hun baan kunnen worden gedetecteerd. Dit kan worden gebruikt om kleine zwaartekrachtveranderingen, oceanische getijden en de structuur van de aarde te meten.",
      "Engineering": "Techniek",
      "Engineering_description": "Satellieten die worden gebruikt om technologieën te testen.",

      "Unselect All": "Deselecteer alles",
      "Select All": "Selecteer alles",

      "FilteringLaunchYear1": "Filteren op lanceringen van ",
      "FilteringLaunchYear2": " tot ",
      "Category filter": "Categorie filter",
      "Multiple filters": "Klik op de knoppen hieronder om de satellieten te zien die tot elke categorie behoren. Je kunt ook meer informatie vinden over individuele satellieten door op de satelliet te klikken.",
      "Advanced filtering": "Geavanceerd filteren",
      "Navigational": "Navigatie",
      "Communication": "Communicatie",
      "Science": "Wetenschap",
      "Other": "Overig",
      "Launch year filter" : "Lanceerjaar filter",
      "Drag the slider to filter satellites by their launch year.": "Sleep de slider om satellieten te filteren op hun lanceerjaar.",
  }
}
</i18n>
