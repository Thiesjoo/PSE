import { Satellite } from './Satellite'
import * as THREE from 'three'
import { LINE_SIZE, EARTH_RADIUS_KM } from './common/constants'
import { shiftLeft } from './common/utils'
import ThreeGlobe from 'three-globe'
import { Time } from './Time'

export class Orbit {
  private satellite: Satellite
  private line: THREE.Line | null = null
  private lineGeometry: THREE.BufferGeometry | null = null
  private lineCounter = 0
  private time: Time;
  private linePoints: Object[] = [];

  constructor(sat: Satellite, scene: THREE.Scene, time: Time) {
    this.satellite = sat
    this.time = time;

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 'white'
    })

    this.lineGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(LINE_SIZE * 3)
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.lineGeometry.setDrawRange(0, LINE_SIZE)
    this.line = new THREE.Line(this.lineGeometry, lineMaterial)
    scene.add(this.line)
  }

  generateLinePoints() {
    this.linePoints = this.satellite.propagateOrbit(this.time.time, 1000, 100);
  }

  generateNewLinePoint() {}

  updateLine(globe: ThreeGlobe) {
    if (!this.line || !this.lineGeometry) return

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