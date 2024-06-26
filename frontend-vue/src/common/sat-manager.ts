/**
 * This file contains the SatManager class, which is responsible for managing the satellite data 
 * and filters used in the satellite tracking application. It handles fetching satellite data 
 * and filter categories, applying filters to the satellite data, and updating the simulation 
 * with the filtered satellite data.
 */

import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import { fetchTLEInformation, getAllCategories } from '@/api/ourApi'
import { reactive, watch } from 'vue'
import { MAX_SATS_TO_RENDER } from './constants'

export interface Filter {
  name: string
  selected: boolean
  min_launch_year: number
  max_launch_year: number
}

/**
 * Checks if a satellite fulfills a given filter criteria
 * @param sat - The satellite object to be checked
 * @param filter - The filter criteria
 * @param ignoreSelected - Boolean to ignore the selected property of the filter
 * @returns Boolean indicating if the satellite fulfills the filter criteria
 */
function satFulfillsFilter(sat: Satellite, filter: Filter, ignoreSelected = false) {
  if (ignoreSelected) {
    return sat.categories.includes(filter.name)
  }

  // True if the launch year of the satellite falls within the range selected by the filter
  const within_launch_year_range =
    sat.launch_year >= filter.min_launch_year && sat.launch_year <= filter.max_launch_year

  return sat.categories.includes(filter.name) && within_launch_year_range && filter.selected
}

// Define the SatManager class
export class SatManager {
  allSatellites: Satellite[] = []
  allFilters: string[] = []
  currentFilters: Filter[] = reactive([])

  count: Record<Filter['name'], number> = {}

  simulation!: ThreeSimulation

  // Constructor initializes the SatManager with a simulation instance
  constructor(simulation: ThreeSimulation) {
    this.simulation = simulation
  }

  // Retrieves the filtered satellites based on current filters
  private get filteredSatellites(): Satellite[] {
    return this.allSatellites
      .filter((sat) => {
        return this.currentFilters.some((filter) => satFulfillsFilter(sat, filter))
      })
      .slice(0, MAX_SATS_TO_RENDER)
  }

  // Initializes the SatManager by fetching satellites and filters, and setting up watchers
  public async init() {
    await this.fetchSatellites()
    await this.fetchFilters()
    this.initWatch()
    this.updateSatellites()

    this.currentFilters.forEach((filter) => {
      this.count[filter['name']] = this.allSatellites.filter((sat) =>
        satFulfillsFilter(sat, filter, true)
      ).length
    })
  }

  // Fetches satellite data from the API
  private async fetchSatellites() {
    const data = await fetchTLEInformation()
    this.allSatellites = Satellite.fromOurApiData(data)
  }

  // Fetches filter categories from the API
  private async fetchFilters() {
    this.allFilters = await getAllCategories()

    this.allFilters.forEach((filter) => {
      this.currentFilters.push({
        name: filter,
        selected: true,
        min_launch_year: this.launchYearBounds[0],
        max_launch_year: this.launchYearBounds[1]
      })
    })
  }

  // Sets up a watcher to update satellites when filters change
  private initWatch() {
    watch(
      this.currentFilters,
      (() => {
        this.updateSatellites()
      }).bind(this)
    )
  }

  // Updates the simulation with the filtered satellites
  public updateSatellites() {
    this.simulation.removeAllSatellites()
    this.simulation.addSatellites(this.filteredSatellites)
  }

  // Deselects all filters
  public selectNone() {
    this.currentFilters.forEach((filter) => {
      filter.selected = false
    })
  }

  // Selects all filters
  public selectAll() {
    this.currentFilters.forEach((filter) => {
      filter.selected = true
    })
  }

  /**
   * Retrieves the earliest and latest launch years of all the satellites.
   */
  public get launchYearBounds(): number[] {
    this.allSatellites.sort((a, b) => a.launch_year - b.launch_year)
    this.allSatellites = this.allSatellites.filter((sat) => sat.launch_year !== -1)
    return [
      this.allSatellites[0].launch_year,
      this.allSatellites[this.allSatellites.length - 1].launch_year
    ]
  }
}
