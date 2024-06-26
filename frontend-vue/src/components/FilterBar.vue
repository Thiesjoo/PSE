<script setup lang="ts">
import { ThreeSimulation } from '@/Sim'
import { Filter, SatManager } from '@/common/sat-manager'
import FilterItem from './FilterItem.vue'
import GenericItem from './GenericItem.vue'
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

// Initial update of the launch year filter
updateLaunchYearFilter()

// Keeps track of whether or not to keep advanced filters on
const advancedFilters = ref(false)
filters[2].selected = false
filters[0].selected = false

console.log(filters)

//NOTE: Yes this is hardcoded ugly but I'm too lazy atm
const generics = ref([
  {
    name: 'Weather',
    filters: [filters[3]],
    icon: '/filter-icons/weather2.svg'
  },
  {
    name: 'Navigational',
    // Just everything navigation related
    filters: [filters[18], filters[19], filters[20], filters[21], filters[22]],
    icon: '/filter-icons/navigation.svg'
  },
  {
    name: 'Communication',
    filters: [filters[12], filters[17]],
    icon: '/filter-icons/communication2.svg'
  },
  {
    name: 'Space Stations',
    filters: [filters[1]],
    icon: '/filter-icons/space_station.svg'
  },
  {
    name: 'Science',
    // In order: geodetics, engineering, NOAA,
    // Earth Resources, ARGOSS, Planet
    filters: [
      filters[23],
      filters[24],
      filters[25],
      filters[4],
      filters[5],
      filters[8],
      filters[9]
    ],
    icon: '/filter-icons/science.svg'
  },
  {
    name: 'Other',
    // Literally everything
    filters: [
      filters[6],
      filters[7],
      filters[10],
      filters[11],
      filters[13],
      filters[14],
      filters[15],
      filters[16]
    ],
    icon: '/filter-icons/other.svg'
  }
])
</script>

<template>
  <LeftInfoBlock :open="true" class="left-info-block">
    <h2>Category filter</h2>
    <i>
      Some satellites are in multiple categories. They will be shown in all categories they belong
      to.</i
    >

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
      class="advanced-filtering-checkbox"
      type="checkbox"
      @click="advancedFilters = !advancedFilters"
      :checked="advancedFilters"
      id="advanced-filter-checkbox"
    />
    <label for="advanced-filter-checkbox" id="advanced-filtering-label">Advanced filtering</label>

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

.advanced-filtering-checkbox {
  margin-top: 20px;
  margin-right: 5px;
}

.advanced-filtering-label {
  font-family: 'Tomorrow';
}

.launch-year-filter-block {
  margin-top: 20px;
  margin-bottom: 10px;
}

#include_without_launch_year {
  margin-top: 5px;
  margin-right: 5px;
}
</style>
