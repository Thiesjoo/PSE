import { Satellite } from '@/Satellite'
import { ThreeSimulation } from '@/Sim'
import { API_TLE_DATA, fetchTLEInformation, getAllCategories } from '@/api/ourApi'
import { reactive, watch } from 'vue'

export interface Filter {
  name: string
  selected: boolean
}

// TODO: Instanced mesh limit
export const renderLimit = 1000;

function satFulfillsFilter(sat: Satellite, filter: Filter, ignoreSelected = false) {
  if (ignoreSelected) {
    return sat.categories.includes(filter.name)
  }
  return sat.categories.includes(filter.name) && filter.selected
}

export class SatManager {
  allSatellites: Satellite[] = []
  allFilters: string[] = []
  currentFilters: Filter[] = reactive([])

  count: Record<Filter['name'], number> = {}

  simulation!: ThreeSimulation

  constructor(simulation: ThreeSimulation) {
    this.simulation = simulation
  }

  private get filteredSatellites(): Satellite[] {
    return this.allSatellites.filter((sat) => {
      return this.currentFilters.some((filter) => satFulfillsFilter(sat, filter))
    }).slice(0, renderLimit)
  }

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

  private async fetchSatellites() {
    const data = await fetchTLEInformation()
    this.allSatellites = Satellite.fromOurApiData(data)
  }

  private async fetchFilters() {
    this.allFilters = await getAllCategories()

    this.allFilters.forEach((filter) => {
      this.currentFilters.push({ name: filter, selected: true })
    })
  }

  private initWatch() {
    watch(
      this.currentFilters,
      (() => {
        this.updateSatellites()
      }).bind(this)
    )
  }

  private updateSatellites() {
    this.simulation.removeAllSatellites()
    this.simulation.addSatellites(this.filteredSatellites)
  }

  public selectNone() {
    this.currentFilters.forEach((filter) => {
      filter.selected = false
    })
  }

  public selectAll() {
    this.currentFilters.forEach((filter) => {
      filter.selected = true
    })
  }
}
