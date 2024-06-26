import { Satellite } from './Satellite'
import { GeoCoords, calculateDistance } from './common/utils'

import AdjListWorker from '@/worker/workerAdjencencyList?worker'
import { CalculateAdjList, CalculateAdjListResponse } from './worker/workerAdjencencyList'
import { AMT_OF_WORKERS } from './common/constants'
import { reactive, Reactive } from 'vue'
type Node = {
  sat: Satellite
  connections: Satellite[]
  fScore: number
  gScore: number
  hScore: number
  parent: Node | null
}

export class Graph {
  public adjList: Record<number, Node> = {}
  private tmpAdjList: Record<number, Node> = {}
  private finished = true
  private worker: Worker[]
  private received = 0
  public goalPos: GeoCoords | null = null
  public startPos: GeoCoords | null = null
  public calculatePath: boolean = false
  public path: Reactive<Node[]> = reactive([])

  constructor() {
    this.worker = Array.from({ length: AMT_OF_WORKERS }, () => new AdjListWorker())

    this.worker.forEach((worker) => {
      worker.onmessage = (event) => {
        this.workerResponse(event.data)
      }
    })
  }

  private calculateDistanceSat(sat1: Satellite, sat2: Satellite) {
    return calculateDistance(sat1.realPosition, sat2.realPosition)
  }

  startCreateGraph(satellites: Satellite[]) {
    if (!this.finished) {
      return
    }

    this.finished = false
    this.tmpAdjList = satellites.reduce(
      (acc, sat) => {
        acc[sat.numericalId] = {
          sat: sat,
          connections: [],
          fScore: Infinity,
          gScore: Infinity,
          hScore: Infinity,
          parent: null
        }
        return acc
      },
      {} as Record<number, Node>
    )

    const data = satellites.reduce(
      (acc, sat) => {
        acc[sat.numericalId] = sat.realPosition
        return acc
      },
      {} as Record<number, GeoCoords>
    )

    this.worker.forEach((worker, i) => {
      const start = Math.floor((i * satellites.length) / AMT_OF_WORKERS)
      const end = Math.floor(((i + 1) * satellites.length) / AMT_OF_WORKERS)
      const msg = {
        event: 'calculate',
        data,
        start,
        end
      } satisfies CalculateAdjList

      worker.postMessage(msg)
    })
  }

  private workerResponse(event: CalculateAdjListResponse) {
    const data = event.data
    for (const [satId, connections] of Object.entries(data)) {
      this.tmpAdjList[+satId].connections = connections.map((id) => this.tmpAdjList[id].sat)
    }
    this.received++

    if (this.received === AMT_OF_WORKERS) {
      this.finished = true
    }
  }

  finishCreateGraph(satellites: Satellite[]) {
    if (this.finished) {
      this.adjList = this.tmpAdjList
      this.received = 0
      if (this.calculatePath && this.goalPos && this.startPos) {
        const firstSat = this.findClosestSat(this.startPos)
        const secondSat = this.findClosestSat(this.goalPos)
        if (firstSat && secondSat) {
          this.findPath(firstSat, secondSat)
        }
      }
      this.startCreateGraph(satellites)
      return true
    }

    return false
  }

  findNode(sat: Satellite) {
    return this.adjList[sat.numericalId]
  }

  popLowestScore(nodeList: Node[]) {
    let lowestNum = Infinity
    let lowestNode = null
    for (const node of nodeList) {
      if (node.fScore < lowestNum) {
        lowestNum = node.fScore
        lowestNode = node
      }
    }
    if (lowestNode) {
      const index = nodeList.indexOf(lowestNode)
      nodeList.splice(index, 1)
    }
    return lowestNode
  }

  findPath(sat1: Satellite, sat2: Satellite) {
    const startNode = this.findNode(sat1)
    const goalNode = this.findNode(sat2)
    if (!startNode || !goalNode) {
      return
    }

    const openList = [startNode]
    const closedList: Node[] = []

    startNode.fScore = 0
    startNode.gScore = 0
    startNode.hScore = 0

    let counter = 0

    while (openList.length > 0 && counter < 10000) {
      let current = this.popLowestScore(openList)
      if (!current) return

      closedList.push(current)

      if (current === goalNode) {
        const path = []
        while (current?.parent != null) {
          path.push(current)
          current = current.parent
        }
        this.path.length = 0
        this.path.push(...path.reverse())

        return path
      }

      for (const sat of current.connections) {
        const connectingNode = this.findNode(sat)
        if (!connectingNode) return
        if (closedList.includes(connectingNode)) {
          continue
        }
        const newGScore =
          current.gScore + this.calculateDistanceSat(current.sat, connectingNode.sat)
        const newHScore = this.calculateDistanceSat(connectingNode.sat, goalNode.sat)
        const newFScore = newGScore + newHScore
        if (!openList.includes(connectingNode) || newFScore < connectingNode.fScore) {
          connectingNode.gScore = newGScore
          connectingNode.hScore = newHScore
          connectingNode.fScore = newFScore
          connectingNode.parent = current
          if (!openList.includes(connectingNode)) {
            openList.push(connectingNode)
          }
        }
      }
      counter++
    }
  }

  findClosestSat(coords: GeoCoords) {
    let closest = Infinity
    let closestNode: Node | null = null

    for (const node of Object.values(this.adjList)) {
      const distance = calculateDistance(coords, node.sat.realPosition)
      if (distance < closest) {
        closest = distance
        closestNode = node
      }
    }
    if (closestNode) {
      return closestNode.sat
    }
  }

  setGoalPos(coords: GeoCoords) {
    this.goalPos = coords
  }

  setStartPos(coords: GeoCoords) {
    this.startPos = coords
  }
}
