import { Satellite } from './Satellite'
import * as THREE from 'three'
import { LINE_SIZE, EARTH_RADIUS_KM, DISTANCE_TO_EARTH_FOR_COLLISION } from './common/constants'
import { shiftLeft } from './common/utils'
import ThreeGlobe from 'three-globe'
import { Time } from './Time'
import { NUM_OF_STEPS_ORBIT, TIME_INTERVAL_ORBIT } from './common/constants'

export class Orbit {
  public satellite: Satellite
  private line: THREE.Line | null = null
  private lineGeometry: THREE.BufferGeometry | null = null
  private lineMaterial: THREE.LineBasicMaterial
  private lineCounter = 0
  private time: Time
  private linePoints: { x: number; y: number; z: number }[] = []
  private lastUpdate = new Date()
  private numOfUpdates = 0
  private upcoming: boolean
  private crashing = false

  private globe: ThreeGlobe
  get globeRadius() {
    return this.globe.getGlobeRadius()
  }

  constructor(
    sat: Satellite,
    scene: THREE.Scene,
    time: Time,
    upcoming: boolean,
    globe: ThreeGlobe
  ) {
    this.satellite = sat
    this.time = time
    this.upcoming = upcoming
    this.globe = globe

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 'white'
    })

    this.lineGeometry = new THREE.BufferGeometry()
    this.lineMaterial = lineMaterial

    const positions = new Float32Array(LINE_SIZE * 3)
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.lineGeometry.setDrawRange(0, LINE_SIZE)
    this.line = new THREE.Line(this.lineGeometry, lineMaterial)
    if (upcoming) {
      this.generateLinePoints()
    }
    scene.add(this.line)
  }

  generateLinePoints() {
    this.linePoints = this.satellite.propagateOrbit(
      this.time.time,
      NUM_OF_STEPS_ORBIT,
      TIME_INTERVAL_ORBIT,
      this.globeRadius
    )
    const positions = this.line?.geometry.attributes.position.array
    if (!positions || !this.line) return
    for (const pos of this.linePoints) {
      positions[this.lineCounter++] = pos.x
      positions[this.lineCounter++] = pos.y
      positions[this.lineCounter++] = pos.z
    }
    this.lineGeometry?.setDrawRange(0, this.lineCounter / 3)
    this.line.geometry.attributes.position.needsUpdate = true
    this.lastUpdate = new Date(+this.time.time)
    this.earthCrushCheck()
  }

  updateLine(globe: ThreeGlobe) {
    if (!this.line || !this.lineGeometry) return
    if (this.upcoming) {
      const elapsed_time = +this.time.time - +this.lastUpdate
      for (let i = 0; i < elapsed_time / TIME_INTERVAL_ORBIT - this.numOfUpdates; i++) {
        let positions = this.line.geometry.attributes.position.array
        //Shift left is simular to a pop from a list.
        //Removes first item and shifts all the others.
        positions = shiftLeft(positions)
        positions = shiftLeft(positions)
        positions = shiftLeft(positions)
        this.lineCounter -= 3

        const newPos: any = this.satellite.propagateNoUpdate(
          new Date(+this.time.time + NUM_OF_STEPS_ORBIT * TIME_INTERVAL_ORBIT),
          this.globeRadius
        )

        positions[this.lineCounter++] = newPos.x
        positions[this.lineCounter++] = newPos.y
        positions[this.lineCounter++] = newPos.z

        this.lineGeometry.setDrawRange(0, this.lineCounter / 3)
        this.line.geometry.attributes.position.needsUpdate = true
        this.numOfUpdates++
      }
    } else {
      const satPositions = this.satellite.realPosition
      if (!satPositions) return
      const lineCoords = globe.getCoords(
        satPositions.lat,
        satPositions.lng,
        (satPositions.alt / EARTH_RADIUS_KM) * 3
      )

      let positions = this.line.geometry.attributes.position.array
      if (this.lineCounter > LINE_SIZE) {
        //Shift left is simular to a pop from a list.
        //Removes first item and shifts all the others.
        positions = shiftLeft(positions)
        positions = shiftLeft(positions)
        positions = shiftLeft(positions)
        this.lineCounter -= 3
      }
      positions[this.lineCounter++] = lineCoords.x
      positions[this.lineCounter++] = lineCoords.y
      positions[this.lineCounter++] = lineCoords.z

      this.lineGeometry.setDrawRange(0, this.lineCounter / 3)
      this.line.geometry.attributes.position.needsUpdate = true
    }
  }

  // Checks if orbit is too low in atmosphere or hits the ground
  private earthCrushCheck() {
    this.crashing = false
    let idx = 0
    for (const point of this.linePoints) {
    if (idx++ % 10 !== 0) continue
      if (!point || !point.x || !point.y || !point.z) continue

      const { altitude } = this.globe.toGeoCoords(point)
      if (altitude * EARTH_RADIUS_KM < DISTANCE_TO_EARTH_FOR_COLLISION) {
        this.crashing = true
      }
    }
    if (this.crashing) {
      this.lineMaterial.color.setHex(0xff0000)
    } else {
      this.lineMaterial.color.setHex(0xffffff)
    }
  }

  recalculate() {
    this.lineCounter = 0
    this.generateLinePoints()
  }

  removeLine(scene: THREE.Scene) {
    if (this.line && this.lineGeometry) {
      scene.remove(this.line)
      this.lineGeometry.setDrawRange(0, 0)
      this.lineCounter = 0
    }
  }

  getLine() {
    return this.line
  }
}
