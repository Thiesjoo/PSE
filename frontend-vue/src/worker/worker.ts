/**
 * This file is single handedly responsible for the performance of our satellite tracking application.
 * It is a web worker that calculates the position of satellites in real time.
 *
 * The main thread (Sim.ts) sends messages to this worker to calculate the position of satellites.
 * This is done (almost) every frame, and data is transported back to the main thread in 1 big array.
 *
 */

import * as satellite from 'satellite.js'

export interface Reset {
  event: 'reset'
}

export interface SatRecDump {
  event: 'add'
  satrec: (satellite.SatRec & {
    idx: number
  })[]
  workerIndex: number
}

export interface Calculate {
  event: 'calculate'
  time: Date
  gmsTime: satellite.GMSTime
  hash: number
}

export type WorkerMessage = Reset | SatRecDump | Calculate

export interface CalculateResponse {
  event: 'calculate-res'
  data: {
    buffer: Float32Array
    speedBuffer: Float32Array
    workerIndex: number
    hash: number
  }
}

export type WorkerResponse = CalculateResponse

let mySatellites: (satellite.SatRec & { idx: number })[] = []
let myWorkerIndex = -1

onmessage = (event) => {
  const type = event.data.event
  switch (type) {
    case 'reset':
      mySatellites = []
      break

    case 'add':
      const { satrec, workerIndex } = event.data as SatRecDump
      mySatellites = satrec
      myWorkerIndex = workerIndex

      break

    case 'calculate':
      const { time, gmsTime, hash } = event.data as Calculate
      const res: CalculateResponse = {
        event: 'calculate-res',
        data: {
          buffer: new Float32Array(mySatellites.length * 3),
          speedBuffer: new Float32Array(mySatellites.length),
          workerIndex: myWorkerIndex,
          hash
        }
      }

      mySatellites.forEach((sat, indexInArray) => {
        const eci = satellite.propagate(sat, time)
        if (!eci.position) {
          return
        }
        const gdPos = satellite.eciToGeodetic(
          eci.position as satellite.EciVec3<satellite.Kilometer>,
          gmsTime
        )

        const vel = eci.velocity as satellite.EciVec3<satellite.Kilometer>
        const resultData = {
          idx: sat.idx,
          pos: {
            lat: satellite.degreesLat(gdPos.latitude),
            lng: satellite.degreesLong(gdPos.longitude),
            alt: gdPos.height
          },
          spd: {
            x: vel.x,
            y: vel.y,
            z: vel.z
          }
        }

        res.data.buffer[indexInArray * 3] = resultData.pos.lat
        res.data.buffer[indexInArray * 3 + 1] = resultData.pos.lng
        res.data.buffer[indexInArray * 3 + 2] = resultData.pos.alt

        res.data.speedBuffer[indexInArray] = Math.sqrt(
          resultData.spd.x ** 2 + resultData.spd.y ** 2 + resultData.spd.z ** 2
        )
      })

      postMessage(res)
      break
  }
}
