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

      console.log('Calculating adj list')
      console.time("adjlist")

      const data= Object.entries(type.data);

      for (const [satId, coords] of data.slice(type.start, type.end)) {
        res.data[+satId] = data
          .filter(([id, otherCoords]) => {
            return calculateDistance(coords, otherCoords) < 650
          })
          .map(([id]) => +id)
      }
      console.timeEnd("adjlist")
      
      postMessage(res)
      break
  }
}
