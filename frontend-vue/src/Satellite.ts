import type { EciVec3, GMSTime, Kilometer, PositionAndVelocity, SatRec } from 'satellite.js'
import { degreesLat, degreesLong, eciToGeodetic, propagate, twoline2satrec } from 'satellite.js'
import * as THREE from 'three'
import { reactive } from 'vue'
import * as satellite from 'satellite.js'
import { API_TLE_DATA } from './api/ourApi'
import {
  EARTH_RADIUS_KM,
  SAT_COLOR,
  SAT_SIZE,
  SAT_SIZE_CLICK,
  MAX_SATS_TO_RENDER
} from './common/constants'

function polar2Cartesian(lat: number, lng: number, relAltitude: number, globeRadius: number) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((90 - lng) * Math.PI) / 180
  const r = globeRadius * (1 + relAltitude)
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta)
  }
}

export type SatelliteMeshes = {
  sat: THREE.InstancedMesh
  satClick: THREE.InstancedMesh
}

export function constructSatelliteMesh(globeRadius: number): SatelliteMeshes {
  const satGeometry = new THREE.OctahedronGeometry(
    (SAT_SIZE * globeRadius) / EARTH_RADIUS_KM / 2,
    0
  )

  const satMaterial = new THREE.MeshLambertMaterial({
    color: SAT_COLOR,
    transparent: true,
    opacity: 0.7
  })

  const satClickMaterial = new THREE.MeshLambertMaterial({
    opacity: 0,
    transparent: true
  })

  //   simple square for click detection
  const satClickArea = new THREE.BoxGeometry(
    (SAT_SIZE_CLICK * globeRadius) / EARTH_RADIUS_KM,
    (SAT_SIZE_CLICK * globeRadius) / EARTH_RADIUS_KM,
    (SAT_SIZE_CLICK * globeRadius) / EARTH_RADIUS_KM
  )

  const sat = new THREE.InstancedMesh(satGeometry, satMaterial, MAX_SATS_TO_RENDER)
  const satClick = new THREE.InstancedMesh(satClickArea, satClickMaterial, MAX_SATS_TO_RENDER)
  satClick.renderOrder = 2

  sat.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  satClick.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  sat.userData = { satellite: 'een satelliet' }
  satClick.userData = { satellite: 'een satelliet' }

  const colorThree = new THREE.Color(SAT_COLOR)
  for (let i = 0; i < MAX_SATS_TO_RENDER; i++) {
    sat.setColorAt(i, colorThree)
  }

  return {
    sat,
    satClick
  }
}

export class Satellite {
  public name!: string
  public satData!: SatRec
  public country!: string
  public categories!: string[]
  public currentPosition: PositionAndVelocity | null = null
  public realPosition = reactive({ lat: 0, lng: 0, alt: 0 })
  public realSpeed = reactive({ x: 0, y: 0, z: 0 })

  private threeData = {
    matrix: new THREE.Matrix4(),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3(1, 1, 1)
  }

  get id(): string {
    return this.satData.satnum
  }

  get firstRender(): boolean {
    return this.currentPosition === null
  }

  public static fromMultipleTLEs(data: string): Satellite[] {
    const tles = data.replace(/\r/g, '').split(/\n(?=[^12])/)

    return tles.map((tle) => {
      const sat = new Satellite()
      sat.fromTLE(tle)
      return sat
    })
  }

  public static fromOurApiData(data: API_TLE_DATA[]): Satellite[] {
    return data.map((satJSON) => {
      const sat = new Satellite()
      sat.fromTLEArray([satJSON.name, satJSON.line1, satJSON.line2])
      sat.country = satJSON.country
      sat.categories = satJSON.categories

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
  public propagate(time: Date, gmsTime: GMSTime) {
    const eci = propagate(this.satData, time)
    this.currentPosition = eci

    if (eci.position && eci.velocity) {
      const gdPos = eciToGeodetic(eci.position as EciVec3<Kilometer>, gmsTime)

      this.realPosition.lat = degreesLat(gdPos.latitude)
      this.realPosition.lng = degreesLong(gdPos.longitude)
      this.realPosition.alt = gdPos.height

      const vel = eci.velocity as EciVec3<Kilometer>
      this.realSpeed.x = vel.x
      this.realSpeed.y = vel.y
      this.realSpeed.z = vel.z
    }
  }

  public propagateNoUpdate(time: Date, globeRadius: number): Object {
    const eci = propagate(this.satData, time)

    if (eci.position && eci.velocity) {
      const gdPos = eciToGeodetic(eci.position as EciVec3<Kilometer>, satellite.gstime(time))
      let realPosition = { lat: 0, lng: 0, alt: 0 }
      realPosition.lat = degreesLat(gdPos.latitude)
      realPosition.lng = degreesLong(gdPos.longitude)
      realPosition.alt = gdPos.height

      const cartesianPosition = polar2Cartesian(
        realPosition.lat,
        realPosition.lng,
        (realPosition.alt / EARTH_RADIUS_KM) * 3,
        globeRadius
      )
      return cartesianPosition
    }
    return {}
  }

  public propagateOrbit(time: Date, numOfPoints: number, timeInterval: number, globeRadius: number): any {
    let result: Object[] = []
    for (let i = 0; i < numOfPoints; i++){
      const newTime = new Date(+time + i * timeInterval)
      result.push(this.propagateNoUpdate(newTime, globeRadius))
    }
    return result;
  }

  public setColor(color: string, index: number, mesh: SatelliteMeshes) {
    mesh.sat.setColorAt(index, new THREE.Color(color))
    if (mesh.sat.instanceColor) {
      mesh.sat.instanceColor.needsUpdate = true
    }
  }

  public updatePositionOfMesh(mesh: SatelliteMeshes, index: number, globeRadius: number) {
    const pos = polar2Cartesian(
      this.realPosition.lat,
      this.realPosition.lng,
      (this.realPosition.alt / EARTH_RADIUS_KM) * 3,
      globeRadius
    )

    this.threeData.matrix.compose(
      new THREE.Vector3(pos.x, pos.y, pos.z),
      this.threeData.quaternion,
      this.threeData.scale
    )

    mesh.sat.setMatrixAt(index, this.threeData.matrix)
    mesh.sat.instanceMatrix.needsUpdate = true
    mesh.satClick.setMatrixAt(index, this.threeData.matrix)
    mesh.satClick.instanceMatrix.needsUpdate = true
  }
}
