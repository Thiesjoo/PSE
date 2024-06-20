import { GeoCoords, calculateDistance } from '@/common/utils'

export interface CalculateAdjList {
  event: 'calculate'
  data: Record<string, GeoCoords>
}

export interface CalculateAdjListResponse {
  event: 'calculate-res'
  data: Record<string, string[]>
}

onmessage = (event) => {
  const type = event.data as CalculateAdjList
  switch (type.event) {
    case 'calculate':
      const res = {
        event: 'calculate-res',
        data: {} as Record<string, string[]>
      } satisfies CalculateAdjListResponse

      console.log('Calculating adj list')
      console.time("adjlist")

      for (const [satId, coords] of Object.entries(type.data)) {
        res.data[satId] = Object.entries(type.data)
          .filter(([id, otherCoords]) => {
            return calculateDistance(coords, otherCoords) < 650
          })
          .map(([id]) => id)
      }
      console.timeEnd("adjlist")
      
      postMessage(res)
      break
  }
}
