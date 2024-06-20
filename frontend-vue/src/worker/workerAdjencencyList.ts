import { DISTANCE_FOR_SATELLITES } from '@/common/constants'
import { GeoCoords, calculateDistance } from '@/common/utils'

export interface CalculateAdjList {
  event: 'calculate'
  data: Record<number, GeoCoords>,
  start: number,
  end: number
}

export interface CalculateAdjListResponse {
  event: 'calculate-res'
  data: Record<number, number[]>
}

onmessage = (event) => {
  const type = event.data as CalculateAdjList
  switch (type.event) {
    case 'calculate':
      const res = {
        event: 'calculate-res',
        data: {} as Record<number, number[]>
      } satisfies CalculateAdjListResponse
      const data= Object.entries(type.data);

      for (const [satId, coords] of data.slice(type.start, type.end)) {
        res.data[+satId] = data
          .filter(([id, otherCoords]) => {
            return calculateDistance(coords, otherCoords) < DISTANCE_FOR_SATELLITES
          })
          .map(([id]) => +id)
      }
      postMessage(res)
      break
  }
}
