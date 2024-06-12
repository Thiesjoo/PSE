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
import { API_TLE_DATA } from './api/ourApi'
import { renderLimit } from './common/sat-manager'

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
let cacheMeshes: { [key: string]: any } = {}

export function constructSatelliteMesh(globeRadius: number): THREE.InstancedMesh {
  if (cacheMeshes['satGeometry'] === undefined) {
    cacheMeshes['satGeometry'] = new THREE.OctahedronGeometry(
      (SAT_SIZE * globeRadius) / EARTH_RADIUS_KM / 2,
      0
    )
  }

  let color = SAT_COLOR
  if (cacheMeshes['satMaterial' + color] === undefined) {
    cacheMeshes['satMaterial' + color] = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 0.7
    })
  }

  if (cacheMeshes['satMaterialClick'] === undefined) {
    cacheMeshes['satMaterialClick'] = new THREE.MeshLambertMaterial({
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

  const satMaterialClick = cacheMeshes['satMaterialClick']
  const satClickArea = cacheMeshes['satClickArea']

  const satMaterial = cacheMeshes['satMaterial' + color]
  const sat = new THREE.InstancedMesh(satGeometry, satMaterial, renderLimit)
  sat.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  sat.userData = { satellite: 'een satelliet' }

  return sat
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
    scale: new THREE.Vector3(1, 1, 1), 
  }

  private currentColor = SAT_COLOR

  get id(): string {
    return this.satData.satnum
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
  public propagate(time: Date, gmsTime: GMSTime, index: number, frame: number) {
    if (!this.currentPosition || frame === -1 || index % 60 === frame) {
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
  }

  public setColor(color: string, index: number, mesh: THREE.InstancedMesh) {
    this.currentColor = color;
    mesh.setColorAt(index, new THREE.Color(color));
    if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
    }
  }

  public updatePositionOfMesh(mesh: THREE.InstancedMesh, index: number, globeRadius: number) {
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

    mesh.setMatrixAt(index, this.threeData.matrix)
    mesh.instanceMatrix.needsUpdate = true
  }
}
