import * as THREE from 'three'
import { Satellite, polar2Cartesian } from './Satellite'
import { MAX_LINE_SIZE_LINKS, PATH_GENERAL_COLOR, PATH_START_COLOR } from './common/constants'
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
import { Graph } from './Graph'
import { ThreeSimulation } from './Sim'

export class AllSatLinks {
  private line: THREE.Line | null = null
  private lineGeometry: THREE.BufferGeometry | null = null

  private pathLines: [MeshLine, MeshLine, MeshLine] | null = null
  private pathGeometry: [MeshLineGeometry, MeshLineGeometry, MeshLineGeometry] | null = null

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

    const color = new THREE.Color(0x696969)
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
      color: new THREE.Color(PATH_GENERAL_COLOR),
      lineWidth: 1
    })

    //@ts-ignore
    const pathStartAndEndMaterial = new MeshLineMaterial({
      color: new THREE.Color(PATH_START_COLOR),
      lineWidth: 1
    })

    this.pathGeometry = [new MeshLineGeometry(), new MeshLineGeometry(), new MeshLineGeometry()]
    this.pathLines = [
      new MeshLine(this.pathGeometry[0], pathStartAndEndMaterial),
      new MeshLine(this.pathGeometry[1], pathLineMaterial),
      new MeshLine(this.pathGeometry[2], pathStartAndEndMaterial)
    ]

    scene.add(this.line)
    this.pathLines.forEach((pathLine) => {
      scene.add(pathLine)
      pathLine.renderOrder = -1
    })

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
        if (this.graph.goalPos && this.graph.startPos && this.graph.calculatePath) {
          this.setPath([
            {
              xyzPosition: polar2Cartesian(
                this.graph.startPos.lat,
                this.graph.startPos.lng,
                this.graph.startPos.alt,
                this.sim.getGlobeRadius()
              )
            },
            ...this.graph.path.map((node) => {
              return node.sat
            }),
            {
              xyzPosition: polar2Cartesian(
                this.graph.goalPos.lat,
                this.graph.goalPos.lng,
                this.graph.goalPos.alt,
                this.sim.getGlobeRadius()
              )
            }
          ])
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

    const startPath = this.path.slice(0, 2)
    const path = this.path.slice(1, this.path.length - 1)
    const endPath = this.path.slice(this.path.length - 2, this.path.length)
    this.pathGeometry[0].setPoints(
      startPath.map(
        (sat) => new THREE.Vector3(sat.xyzPosition.x, sat.xyzPosition.y, sat.xyzPosition.z)
      )
    )

    this.pathGeometry[1].setPoints(
      path.map((sat) => new THREE.Vector3(sat.xyzPosition.x, sat.xyzPosition.y, sat.xyzPosition.z))
    )

    this.pathGeometry[2].setPoints(
      endPath.map(
        (sat) => new THREE.Vector3(sat.xyzPosition.x, sat.xyzPosition.y, sat.xyzPosition.z)
      )
    )

    this.pathGeometry.forEach((pathGeometry) => {
      pathGeometry.setDrawRange(0, this.path.length * 10)
    })
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
      this.pathLines.forEach((pathLine) => {
        this.scene.remove(pathLine)
        pathLine.remove()
      })
    }

    if (this.pathGeometry) {
      this.pathGeometry.forEach((pathGeometry) => {
        pathGeometry.setDrawRange(0, 0)
        pathGeometry.dispose()
      })
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
