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
  }[]
}

export type WorkerResponse = CalculateResponse;

let mySatellites: (satellite.SatRec & { idx: number })[] = []

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
        data: []
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
        res.data.push({
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
        })
      })

      postMessage(res)
      break
  }
}
