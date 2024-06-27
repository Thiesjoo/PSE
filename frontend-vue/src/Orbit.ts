/**
 * This file contains the Orbit class, which is responsible for drawing the orbit of a satellite.
 *
 * There are two types of orbits: upcoming and past. The upcoming orbit is the orbit that the satellite will follow in the future.
 */
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
  private upcoming: boolean // Indicates if the orbit is the future or past orbit
  private crashing = false
  private scene: THREE.Scene

  private listenerRef: number | undefined // Reference to the event listener
  private reset: number = 0

  private globe: ThreeGlobe // Globe object from ThreeGlobe
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
    this.scene = scene

    // Create line material with white color
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 'white'
    })

    // Initialize line geometry and material
    this.lineGeometry = new THREE.BufferGeometry()
    this.lineMaterial = lineMaterial

    // Create a Float32Array to store positions
    const positions = new Float32Array(LINE_SIZE * 3)
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.lineGeometry.setDrawRange(0, LINE_SIZE)
    this.line = new THREE.Line(this.lineGeometry, lineMaterial)
    if (upcoming) {
      this.generateLinePoints() // Generate initial line points if the orbit is upcoming
    }
    scene.add(this.line) // Add the line to the scene

    this.listenerRef = this.time.addEventListener(this.recalculate.bind(this)) // Add event listener for time updates
  }

  // Generate line points for the orbit path
  private generateLinePoints() {
    if (this.upcoming) {
      this.linePoints = this.satellite.propagateOrbit(
        // Propagate the satellite's position to get the orbit path
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
      this.earthCrushCheck() // Check for possible collisions with Earth
    }
  }

  // Update the line based on the satellite's position
  updateLine(globe: ThreeGlobe) {
    if (!this.line || !this.lineGeometry) {
      if (this.upcoming) return
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 'white'
      })

      // Initialize line geometry and material
      this.lineGeometry = new THREE.BufferGeometry()
      this.lineMaterial = lineMaterial

      // Create a Float32Array to store positions
      const positions = new Float32Array(LINE_SIZE * 3)
      this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      this.lineGeometry.setDrawRange(0, LINE_SIZE)
      this.line = new THREE.Line(this.lineGeometry, lineMaterial)
      if (this.upcoming) {
        this.generateLinePoints() // Generate initial line points if the orbit is upcoming
      }
      this.scene.add(this.line) // Add the line to the scene
      this.listenerRef = this.time.addEventListener(this.recalculate.bind(this)) // Add event listener for time updates
    }
    if (this.upcoming) {
      const elapsed_time = +this.time.time - +this.lastUpdate
      for (let i = 0; i < elapsed_time / TIME_INTERVAL_ORBIT - this.numOfUpdates; i++) {
        let positions = this.line.geometry.attributes.position.array
        // Shift left is similar to a pop from a list. Removes first item and shifts all the others.
        positions = shiftLeft(positions)
        positions = shiftLeft(positions)
        positions = shiftLeft(positions)
        this.lineCounter -= 3

        const newPos = this.satellite.propagateNoUpdate(
          new Date(+this.time.time + NUM_OF_STEPS_ORBIT * TIME_INTERVAL_ORBIT),
          this.globeRadius,
          false
        )

        positions[this.lineCounter++] = newPos.x
        positions[this.lineCounter++] = newPos.y
        positions[this.lineCounter++] = newPos.z

        this.lineGeometry.setDrawRange(0, this.lineCounter / 3)
        this.line.geometry.attributes.position.needsUpdate = true
        this.numOfUpdates++
      }
    } else {
      let lineCoords
      if (this.reset > 0) {
        this.reset--
        return
      } else {
        console.log('Updating line')
        const satPositions = this.satellite.realPosition
        if (!satPositions) return
        lineCoords = globe.getCoords(
          satPositions.lat,
          satPositions.lng,
          satPositions.alt / EARTH_RADIUS_KM
        )
      }

      let positions = this.line.geometry.attributes.position.array
      if (this.lineCounter > LINE_SIZE) {
        // Shift left is similar to a pop from a list. Removes first item and shifts all the others.
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
      if (altitude * EARTH_RADIUS_KM < DISTANCE_TO_EARTH_FOR_COLLISION / 3) {
        this.crashing = true
      }
    }
    if (this.crashing) {
      this.lineMaterial.color.setHex(0xff0000) // Change line color to red if crashing
    } else {
      this.lineMaterial.color.setHex(0xffffff) // Keep line color white if not crashing
    }
  }

  // Recalculate the orbit path
  recalculate() {
    console.log('Recalculating orbit path')
    this.reset = 20

    if (this.upcoming) {
      this.lineCounter = 0
      this.numOfUpdates = 0
      this.generateLinePoints()
    } else {
      this.removeLine(this.scene)
    }
  }

  // Remove the line from the scene
  removeLine(scene: THREE.Scene) {
    if (this.line && this.lineGeometry) {
      scene.remove(this.line)
      this.lineGeometry.setDrawRange(0, 0)
      this.lineCounter = 0

      if (this.listenerRef != undefined) {
        this.time.removeEventListener(this.listenerRef) // Remove the event listener
      }
    }
    this.line = null
    this.lineGeometry = null
  }

  // Get the line object
  getLine() {
    return this.line
  }
}
