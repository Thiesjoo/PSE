import * as THREE from 'three'
import { Satellite, polar2Cartesian } from './Satellite'
import { LINE_SIZE, MAX_LINE_SIZE_LINKS } from './common/constants'
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
import { Graph } from './Graph'
import { ThreeSimulation } from './Sim'

export class AllSatLinks {
  private line: THREE.Line | null = null
  private lineGeometry: THREE.BufferGeometry | null = null

  private pathLines: MeshLine | null = null
  private pathGeometry: MeshLineGeometry | null = null

  private allSatLinks: SatLinks[] = []
  private scene: THREE.Scene

  public hideConnections = true
  private graph: Graph
  private sim: ThreeSimulation

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

  constructor(scene: THREE.Scene, graph: Graph, simulation: ThreeSimulation) {
    this.graph = graph
    this.sim = simulation

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

    //@ts-ignore
    const pathLineMaterial = new MeshLineMaterial({
      color: new THREE.Color('blue'),
      lineWidth: 1
    })

    this.pathGeometry = new MeshLineGeometry()
    this.pathLines = new MeshLine(this.pathGeometry, pathLineMaterial)

    scene.add(this.line)
    scene.add(this.pathLines)

    this.pathLines.renderOrder = -1
    this.line.renderOrder = 1

    this.scene = scene
    this.sim.addAllSatLinks(this)
  }

  private addSatLink(link: SatLinks) {
    this.allSatLinks.push(link)
  }

  private removeAllSatLinks() {
    this.allSatLinks = []
  }

  setPath(path: { xyzPosition: { x: number; y: number; z: number } }[]) {
    this.path = path
  }

  private update() {
    this.allSatLinks.forEach((link) => {
      link.updateSatelliteConnections()
    })
  }

  render() {
    if (!this.line || !this.lineGeometry) return
    const colors = this.line.geometry.attributes.color.array

    if (this.graph.finishCreateGraph(this.sim.getSatellites())) {
      this.removeAllSatLinks()
      Object.values(this.graph.adjList).forEach((values) => {
        const satLink = new SatLinks(values.sat)
        satLink.setSatelliteConnections(values.connections)
        this.addSatLink(satLink)
        if (this.graph.goalPos && this.graph.startPos) {
          this.setPath([
            {
              xyzPosition: polar2Cartesian(
                this.graph.goalPos.lat,
                this.graph.goalPos.lng,
                this.graph.goalPos.alt,
                this.sim.globe.getGlobeRadius()
              )
            },
            ...this.graph.path.map((node) => {
              return node.sat
            }),
            {
              xyzPosition: polar2Cartesian(
                this.graph.startPos.lat,
                this.graph.startPos.lng,
                this.graph.startPos.alt,
                this.sim.globe.getGlobeRadius()
              )
            }
          ]);
        }

        
      })
    }

    if (!this.hideConnections) {
      this.update()
      const positions = this.line.geometry.attributes.position.array
      let lineCounter = 0
      let colorIndex = 0

      // Start at the center
      positions[lineCounter++] = 0
      positions[lineCounter++] = 0
      positions[lineCounter++] = 0
      colorIndex += 4

      for (const arr of this.linePoints) {
        const start = colorIndex
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
      }

      // End at the center
      positions[lineCounter++] = 0
      positions[lineCounter++] = 0
      positions[lineCounter++] = 0
      colorIndex += 4

      this.lineGeometry.setDrawRange(0, lineCounter / 3)
      this.line.geometry.attributes.position.needsUpdate = true
      this.line.geometry.attributes.color.needsUpdate = true
    } else {
      this.lineGeometry.setDrawRange(0, 0)
    }

    this.renderPath()
  }

  private renderPath() {
    if (!this.pathLines || !this.pathGeometry) return

    this.pathGeometry.setPoints(
      this.path.map(
        (sat) => new THREE.Vector3(sat.xyzPosition.x, sat.xyzPosition.y, sat.xyzPosition.z)
      )
    )
    this.pathGeometry.setDrawRange(0, this.path.length * 10)
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
