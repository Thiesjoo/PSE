/**
 * This file contains the web worker script for calculating adjacency lists for satellites based on their geographical coordinates.
 */

import { DISTANCE_FOR_SATELLITES } from '@/common/constants'
import { GeoCoords, calculateDistance } from '@/common/utils'

// Interface for the message to calculate adjacency list
export interface CalculateAdjList {
  event: 'calculate'
  data: Record<number, GeoCoords>
  start: number
  end: number
}

// Interface for the response message with the calculated adjacency list
export interface CalculateAdjListResponse {
  event: 'calculate-res'
  data: Record<number, number[]>
}

// Event listener for messages received by the worker
onmessage = (event) => {
  const type = event.data as CalculateAdjList
  switch (type.event) {
    case 'calculate':
      // Prepare the response object
      const res = {
        event: 'calculate-res',
        data: {} as Record<number, number[]>
      } satisfies CalculateAdjListResponse

      // Extract the relevant portion of the data based on start and end indices
      const data = Object.entries(type.data)

      // Calculate adjacency list for each satellite within the specified range
      for (const [satId, coords] of data.slice(type.start, type.end)) {
        res.data[+satId] = data
          .filter((sats) => {
            return calculateDistance(coords, sats[1]) < DISTANCE_FOR_SATELLITES
          })
          .map(([id]) => +id)
      }

      // Post the response message with the calculated adjacency list
      postMessage(res)
      break
  }
}
