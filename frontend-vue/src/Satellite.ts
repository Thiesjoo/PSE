import type { EciVec3, GMSTime, Kilometer, PositionAndVelocity, SatRec } from 'satellite.js'
import { degreesLat, degreesLong, twoline2satrec, propagate, eciToGeodetic } from 'satellite.js'
import type { Group } from 'three'

import * as THREE from 'three'
import {
  EARTH_RADIUS_KM,
  SAT_COLOR,
  SAT_COLOR_HOVER,
  SAT_COLOR_SELECTED,
  SAT_SIZE,
  SAT_SIZE_CLICK
} from './common/constants'
import { reactive } from 'vue'

let cacheMeshes: { [key: string]: any } = {}

export class Satellite {
  public name!: string
  public satData!: SatRec
  public currentPosition: PositionAndVelocity | null = null
  public realPosition = reactive({ lat: 0, lng: 0, alt: 0 })
  public realSpeed = reactive({ x: 0, y: 0, z: 0 })

  get id(): string {
    return this.satData.satnum
  }

  constructor() {}

  public static fromMultipleTLEs(data: string): Satellite[] {
    const tles = data.replace(/\r/g, '').split(/\n(?=[^12])/)

    return tles.map((tle) => {
      const sat = new Satellite()
      sat.fromTLE(tle)
      return sat
    })
  }

  public fromTLE(tle: string) {
    const tleArray = tle.split('\n')
    this.name = tleArray[0]
    this.satData = twoline2satrec(tleArray[1], tleArray[2])
  }

  public fromTLEArray(tle: [string, string, string]) {
    this.name = tle[0]
    this.satData = twoline2satrec(tle[1], tle[2])
  }

  // TODO: public fromGosia(.....)

  // TODO: Waarom 2 tijden?
  public propagate(time: Date, gmsTime: GMSTime): Object {
    const eci = propagate(this.satData, time)
    this.currentPosition = eci;

    if (eci.position) {
      const gdPos = eciToGeodetic(eci.position as EciVec3<Kilometer>, gmsTime)

      this.realPosition.lat = degreesLat(gdPos.latitude)
      this.realPosition.lng = degreesLong(gdPos.longitude)
      this.realPosition.alt = gdPos.height

      return {
        lat: degreesLat(gdPos.latitude),
        lng: degreesLong(gdPos.longitude),
        alt: (gdPos.height / EARTH_RADIUS_KM) * 3,
        id: this.id
      }
    } else {
      return {}
    }
  }

  public render(selected: boolean, hover: boolean, globeRadius: number): Group {
    if (cacheMeshes['satGeometry'] === undefined) {
      cacheMeshes['satGeometry'] = new THREE.OctahedronGeometry(
        (SAT_SIZE * globeRadius) / EARTH_RADIUS_KM / 2,
        0
      )
    }

    if (cacheMeshes['satMaterialClick'] === undefined) {
      cacheMeshes["satMaterialClick"] = new THREE.MeshLambertMaterial({
        transparent: true,
        opacity: 0.0001
      })
    }
 
    if (cacheMeshes['satClickArea'] === undefined) {
      cacheMeshes['satClickArea'] = new THREE.OctahedronGeometry(
        (SAT_SIZE_CLICK * globeRadius) / EARTH_RADIUS_KM / 2,
        5
      )
    }

    const satGeometry = cacheMeshes['satGeometry']
    
    let color = SAT_COLOR
    if (selected) {
        color = SAT_COLOR_SELECTED
    } else if (hover) {
        color = SAT_COLOR_HOVER
    }
    
    if (cacheMeshes['satMaterial' + color] === undefined) {
        cacheMeshes['satMaterial' + color] = new THREE.MeshLambertMaterial({
            color,
            transparent: true,
            opacity: 0.7
        })
    }
    
    const satMaterialClick = cacheMeshes['satMaterialClick']
    const satClickArea = cacheMeshes['satClickArea']

    const satMaterial = cacheMeshes['satMaterial' + color]
    const sat = new THREE.Mesh(satGeometry, satMaterial)
    const satClick = new THREE.Mesh(satClickArea, satMaterialClick)


    const group = new THREE.Group()
    group.add(sat)
    group.add(satClick)

    group.userData = { satellite: this.id }
    sat.userData = { satellite: this.id }
    satClick.userData = { satellite: this.id }

    return group
  }
}
