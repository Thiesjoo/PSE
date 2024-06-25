<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { SatManager } from '@/common/sat-manager'
import FilterItem from './FilterItem.vue'
import InfoPopup from './InfoPopup.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import VueSlider from 'vue-slider-component'
import { ref } from 'vue'
import LeftInfoBlock from './LeftInfoBlock.vue'

const props = defineProps<{
  simulation: ThreeSimulation
}>()

const manager = new SatManager(props.simulation)
await manager.init()

// Get the filters from the SatManager
const filters = manager.currentFilters

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

updateLaunchYearFilter()
</script>

<template>
  <LeftInfoBlock :open="true">
    <div class="flex">
      <h2>Category filter</h2>
      <i>
        Some satellites are in multiple categories. They will be shown in all categories they belong
        to.</i
      >
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

      <div class="launch-year-filter-block">
        <label
          >{{
            t('FilteringLaunchYear1') +
            slider_values[0] +
            t('FilteringLaunchYear2') +
            slider_values[1]
          }}.
        </label>
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

        <input
          type="checkbox"
          id="include_without_launch_year"
          v-model="include_sats_without_launch_year"
          hidden
        />
        <label for="include_without_launch_year" hidden
          >Include satellites without launch year</label
        >
      </div>
    </div>
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
  max-height: 100%;
  color: $main_text;

  padding-top: 2em;
  padding-right: 1.5em;
  padding-left: 1.5em;

  button {
    margin: 5px 0;
    background-color: $button_background_box;
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

.launch-year-filter-block {
  margin-bottom: 30px;
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
      "NOAA_description": "The NOAA Satellite and Information Service provides timely access to global environmental data from satellites and other sources to monitor and understand our dynamic Earth. We manage the Nation's operational environmental satellites and deliver data and information services such as Earth system monitoring and official assessments of the environment. (source)",
      "Earth Resources": "Earth Resources",
      "Earth Resources_description": "Satellites which are equipped with a high-resolution Earth observation system.",
      "Search & Rescue (SARSAT)": "Search & Rescue (SARSAT)",
      "Search & Rescue (SARSAT)_description": "Used for GPS data",
      "Disaster Monitoring": "Disaster Monitoring",
      "Disaster Monitoring_description": "Establish a remote sensing infrastructure for disaster mitigation",
      "ARGOS Data Collection System": "ARGOS Data Collection System",
      "ARGOS Data Collection System_description": "Satellites which carry the ARGOS Advanced Data Collection System",
      "Planet": "Planet",
      "Planet_description": "Flock is a satellite constellation of CubeSats dedicated to Earth Observations using a fleet of small satellites to generate high-resolution images of Earth achieving resolutions of three to five meters",
      "Spire": "Spire",
      "Spire_description": "The Low Earth Multi-Use Receiver (LEMUR) is Spire’s 3U CubeSat platform used to track maritime, aviation, and weather activity from space.",
      "Active Geosynchronous": "Active Geosynchronous",
      "Active Geosynchronous_description": "A geosynchronous satellite is a satellite in geosynchronous orbit, with an orbital period the same as the Earth's rotation period. Geostationary satellites have the unique property of remaining permanently fixed in exactly the same position in the sky as viewed from any fixed location on Earth.",
      "Starlink": "Starlink",
      "Starlink_description": "Satellites used for the Starlink network.",
      "Iridium": "Iridium",
      "Iridium_description": "Iridium is a global satellite communications company, providing access to reliable voice and data services anywhere on Earth.",
      "Intelsat": "Intelsat",
      "Intelsat_description": "The Intelsat Professional Satellite Services group supports commercial and government satellite programs through the entire operational lifecycle, including space and ground services.",
      "Swarm": "Swarm",
      "Swarm_description": "To provide communication for IOT devices.",
      "Amateur Radio": "Amateur Radio",
      "Amateur Radio_description": "Collection of satellites that carry instruments that are created by amateurs, like universities.",
      "GNSS": "GNSS",
      "GNSS_description": "Satellites used to deliver locational data.",
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
      "Geodetics_description": "Passive satellites with no moving parts. These carried 60 retroreflectors, which reflect back lasers sent by ground stations to pinpoint the orbit of the satellite. The small mass of these satellite’s means that their orbits are influenced by slight changes in Earth’s gravitational fields and these small adjustments to their orbits can be detected. The causes of the slight gravitational changes, oceanic tides and Earth's structure.",
      "Engineering": "Engineering",
      "Engineering_description": "Satellites which are used to test technologies.",

      "Unselect All": "Unselect All",
      "Select All": "Select All",

      "FilteringLaunchYear1": "Filtering on launches from ",
      "FilteringLaunchYear2": " to "
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
      "NOAA_description": "De NOAA Satellite and Information Service biedt tijdige toegang tot wereldwijde milieugegevens van satellieten en andere bronnen om onze dynamische aarde te monitoren en te begrijpen. We beheren de operationele milieusatellieten van de natie en leveren data- en informatiediensten zoals aardesysteemmonitoring en officiële beoordelingen van het milieu. (bron)",
      "Earth Resources": "Aardse Bronnen",
      "Earth Resources_description": "Satellieten die zijn uitgerust met een hoogwaardig aardobservatiesysteem.",
      "Search & Rescue (SARSAT)": "Zoek & Redding (SARSAT)",
      "Search & Rescue (SARSAT)_description": "Gebruikt voor GPS-gegevens",
      "Disaster Monitoring": "Rampmonitoring",
      "Disaster Monitoring_description": "Het opzetten van een infrastructuur voor aardobservatie voor rampenbeperking",
      "ARGOS Data Collection System": "ARGOS Gegevensverzamelsysteem",
      "ARGOS Data Collection System_description": "Satellieten die het ARGOS Advanced Data Collection System dragen",
      "Planet": "Planeet",
      "Planet_description": "Flock is een satellietconstellatie van CubeSats gewijd aan aardobservaties, waarbij een vloot van kleine satellieten wordt gebruikt om beelden met hoge resolutie van de aarde te genereren met resoluties van drie tot vijf meter.",
      "Spire": "Spire",
      "Spire_description": "Het Low Earth Multi-Use Receiver (LEMUR) is Spire's 3U CubeSat-platform dat wordt gebruikt om maritieme, luchtvaart- en weersactiviteit vanuit de ruimte te volgen.",
      "Active Geosynchronous": "Actieve Geosynchrone",
      "Active Geosynchronous_description": "Een geosynchrone satelliet is een satelliet in een geosynchrone baan, met een omlooptijd die hetzelfde is als de rotatieperiode van de aarde. Geostationaire satellieten hebben de unieke eigenschap dat ze permanent op precies dezelfde positie aan de hemel blijven vanuit elk vast punt op aarde.",
      "Starlink": "Starlink",
      "Starlink_description": "Satellieten gebruikt voor het Starlink-netwerk.",
      "Iridium": "Iridium",
      "Iridium_description": "Iridium is een wereldwijd satellietcommunicatiebedrijf dat betrouwbare spraak- en datadiensten overal op aarde biedt.",
      "Intelsat": "Intelsat",
      "Intelsat_description": "De Intelsat Professional Satellite Services-groep ondersteunt commerciële en overheids-satellietprogramma's gedurende de gehele operationele levenscyclus, inclusief ruimte- en gronddiensten.",
      "Swarm": "Swarm",
      "Swarm_description": "Om communicatie voor IoT-apparaten te bieden.",
      "Amateur Radio": "Amateurradio",
      "Amateur Radio_description": "Verzameling van satellieten die instrumenten dragen die door amateurs zijn gemaakt, zoals universiteiten.",
      "GNSS": "GNSS",
      "GNSS_description": "Satellieten gebruikt om locatiegegevens te leveren.",
      "GPS Operational": "GPS Operationeel",
      "GPS Operational_description": "Satellieten die worden gebruikt voor GPS-gegevens. Satellieten zijn eigendom van de VS.",
      "Glonass Operational": "Glonass Operationeel",
      "Glonass Operational_description": "Satellieten die worden gebruikt voor het GLONASS-satellietnavigatiesysteem. Satellieten zijn eigendom van Rusland.",
      "Galileo": "Galileo",
      "Galileo_description": "Satellieten die worden gebruikt voor GPS-gegevens. Satellieten zijn eigendom van de Europese Unie.",
      "Beidou": "Beidou",
      "Beidou_description": "Satellieten die worden gebruikt voor GPS-gegevens. Satellieten zijn eigendom van China.",
      "Space and Earth Science": "Ruimte- en Aarde Wetenschap",
      "Space and Earth Science_description": "Satellieten die worden gebruikt voor wetenschap die alleen in de ruimte kan worden uitgevoerd.",
      "Geodetics": "Geodetica",
      "Geodetics_description": "Passieve satellieten zonder bewegende onderdelen. Deze droegen 60 retroreflectoren, die lasers die door grondstations worden gestuurd, terugkaatsen om de baan van de satelliet nauwkeurig te bepalen. De kleine massa van deze satellieten betekent dat hun banen worden beïnvloed door kleine veranderingen in de zwaartekrachtvelden van de aarde en deze kleine aanpassingen aan hun banen kunnen worden gedetecteerd. De oorzaken van de lichte zwaartekrachtsveranderingen, oceanische getijden en de structuur van de aarde.",
      "Engineering": "Techniek",
      "Engineering_description": "Satellieten die worden gebruikt om technologieën te testen.",

      "Unselect All": "Deselecteer alles",
      "Select All": "Selecteer alles",

      "FilteringLaunchYear1": "Filteren op lanceringen van ",
      "FilteringLaunchYear2": " tot "
  }
}
</i18n>
