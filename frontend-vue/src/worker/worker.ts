import { EARTH_RADIUS_KM } from '@/common/constants'
import * as satellite from 'satellite.js'

export interface Reset {
  event: 'reset'
}

export interface SatRecDump {
  event: 'add'
  satrec: (satellite.SatRec & {
    idx: number
  })
}

export interface Calculate {
  event: 'calculate'
  time: Date
  gmsTime: satellite.GMSTime
}

export type WorkerMessage = Reset | SatRecDump | Calculate

export interface CalculateResponse {
  event: 'calculate-res'
  // TODO: Dit kan in principe ook zo'n array zijn.
  data: {
    data: {
        idx: number
        pos: {
          lat: number
          lng: number
          alt: number
        }
        spd: {
          x: number
          y: number
          z: number
        }
    }[],
    buffer: Float32Array
  }
}

export type WorkerResponse = CalculateResponse;


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

let mySatellites: (satellite.SatRec & { idx: number })[] = []
// TODO: Uit init methode halen
let globeRadius = 100;

onmessage = (event) => {
  const type = event.data.event;
  switch (type) {
    case 'reset':
      mySatellites = []
      break

    case 'add':
      const { satrec } = event.data as SatRecDump
        mySatellites.push(satrec)
      break

    case 'calculate':
      const { time, gmsTime } = event.data as Calculate
      const res: CalculateResponse = {
        event: 'calculate-res',
        data: {
            data: [],
            buffer: new Float32Array(mySatellites.length * 3)
        }
      }

      mySatellites.forEach((sat) => {
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

        const pos = polar2Cartesian(
            resultData.pos.lat,
            resultData.pos.lng,
            (resultData.pos.alt / EARTH_RADIUS_KM) * 3,
            globeRadius
          )


        res.data.buffer[sat.idx * 3] = pos.x
        res.data.buffer[sat.idx * 3 + 1] = pos.y
        res.data.buffer[sat.idx * 3 + 2] = pos.z
            
        res.data.data.push(resultData)
      })

      postMessage(res)
      break
  }
}
