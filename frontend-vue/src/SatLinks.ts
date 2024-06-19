import * as THREE from 'three'
import { Satellite } from './Satellite'
import { LINE_SIZE, MAX_LINE_SIZE_LINKS } from './common/constants'

export class AllSatLinks {
  private line: THREE.Line | null = null
  private lineGeometry: THREE.BufferGeometry | null = null

  private pathLines: THREE.Line | null = null
  private pathGeometry: THREE.BufferGeometry | null = null

  private allSatLinks: SatLinks[] = []
  private scene: THREE.Scene

  private path: {
    xyzPosition: {
      x: number
      y: number
      z: number
    }
  }[] = []

  get linePoints() {
    return this.allSatLinks.map((link) => link.linePoints)
  }

  constructor(scene: THREE.Scene) {
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true
    })

    this.lineGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_LINE_SIZE_LINKS * 3)
    const colors = new Float32Array(MAX_LINE_SIZE_LINKS * 4)

    const color = new THREE.Color(0x00ff00)
    for (let i = 0; i < MAX_LINE_SIZE_LINKS; i++) {
      colors[i * 4] = color.r
      colors[i * 4 + 1] = color.g
      colors[i * 4 + 2] = color.b
      colors[i * 4 + 3] = 0
    }

    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
    this.lineGeometry.setDrawRange(0, MAX_LINE_SIZE_LINKS)
    this.line = new THREE.Line(this.lineGeometry, lineMaterial)

    const pathLineMaterial = new THREE.LineBasicMaterial({
      //   vertexColors: true,
      //   transparent: true,
      linewidth: 2,
      color: 0xff0000
    })

    this.pathGeometry = new THREE.BufferGeometry()
    const pathPositions = new Float32Array(LINE_SIZE * 3)
    this.pathGeometry.setAttribute('position', new THREE.BufferAttribute(pathPositions, 3))
    this.pathGeometry.setDrawRange(0, LINE_SIZE)
    this.pathLines = new THREE.Line(this.pathGeometry, pathLineMaterial)

    this.pathLines.renderOrder = 0
    this.line.renderOrder = 1

    scene.add(this.line)
    scene.add(this.pathLines)
    this.scene = scene
  }

  addSatLink(link: SatLinks) {
    this.allSatLinks.push(link)
  }

  setPath(sat: { xyzPosition: { x: number; y: number; z: number } }[]) {
    this.path = sat
  }

  private update() {
    this.allSatLinks.forEach((link) => {
      link.updateSatelliteConnections()
    })
  }

  render() {
    if (!this.line || !this.lineGeometry) return
    this.update()

    const positions = this.line?.geometry.attributes.position.array
    const colors = this.line?.geometry.attributes.color.array
    if (!positions || !this.line || !colors) return
    let lineCounter = 0
    let colorIndex = 0

    // Start at the center
    positions[lineCounter++] = 0
    positions[lineCounter++] = 0
    positions[lineCounter++] = 0
    colorIndex += 4

    for (const arr of this.linePoints) {
      let start = colorIndex
      for (const pos of arr) {
        positions[lineCounter++] = pos.x
        positions[lineCounter++] = pos.y
        positions[lineCounter++] = pos.z
        colors[colorIndex + 3] = 1
        colorIndex += 4
      }
      //   The line from and to the center must have opacity 0 to not show them.
      colors[colorIndex - 1] = 0
      colors[start + 3] = 0
      positions[lineCounter++] = 0
      positions[lineCounter++] = 0
      positions[lineCounter++] = 0
      colorIndex += 4
    }

    // End at the center
    positions[lineCounter++] = 0
    positions[lineCounter++] = 0
    positions[lineCounter++] = 0
    colorIndex += 4

    this.lineGeometry.setDrawRange(0, lineCounter / 3)
    this.line.geometry.attributes.position.needsUpdate = true
    this.line.geometry.attributes.color.needsUpdate = true

    this.renderPath()
  }

  private renderPath() {
    if (!this.pathLines || !this.pathGeometry) return

    if (this.path.length === 0) {
      this.pathGeometry.setDrawRange(0, 0)
      return
    }

    const positions = this.pathLines.geometry.attributes.position.array
    if (!positions) return

    let lineCounter = 0
    for (const sat of this.path) {
      positions[lineCounter++] = sat.xyzPosition.x
      positions[lineCounter++] = sat.xyzPosition.y
      positions[lineCounter++] = sat.xyzPosition.z
    }

    this.pathGeometry.setDrawRange(0, lineCounter / 3)
    this.pathLines.geometry.attributes.position.needsUpdate = true
  }

  destroy() {
    if (this.line) {
      this.scene.remove(this.line)
      this.line.remove()
    }

    if (this.lineGeometry) {
      this.lineGeometry.setDrawRange(0, 0)
      this.lineGeometry.dispose()
    }

    if (this.pathLines) {
      this.scene.remove(this.pathLines)
      this.pathLines.remove()
    }

    if (this.pathGeometry) {
      this.pathGeometry.setDrawRange(0, 0)
      this.pathGeometry.dispose()
    }

    this.allSatLinks = []
    this.line = null
    this.lineGeometry = null
    this.pathLines = null
    this.pathGeometry = null
  }
}

export class SatLinks {
  public satellite: Satellite
  private satellites: Satellite[] = []
  public linePoints: { x: number; y: number; z: number }[] = []

  constructor(sat: Satellite) {
    this.satellite = sat
  }

  setSatelliteConnections(sats: Satellite[]) {
    this.satellites = sats
    this.updateSatelliteConnections()
  }

  updateSatelliteConnections() {
    if (!this.satellite.xyzPosition) return

    this.linePoints = []
    this.linePoints.push(this.satellite.xyzPosition)

    // Get coordinates of the connections
    this.satellites.forEach((sat) => {
      if (!sat.xyzPosition) return

      this.linePoints.push(this.satellite.xyzPosition)
      this.linePoints.push(sat.xyzPosition)
    })
  }
}