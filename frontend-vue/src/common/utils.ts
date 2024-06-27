/**
 * This file contains utility functions and types for handling satellite data and calculations.
 * It provides functionality for parsing TLE data, propagating satellite positions,
 * shifting elements in a typed array, loading textures, rounding numbers, and calculating
 * distances between geographical coordinates. These utilities are essential for the
 * performance and accuracy of satellite tracking and visualization applications.
 */
import {
  SatRec,
  twoline2satrec,
  propagate,
  eciToGeodetic,
  degreesLat,
  degreesLong,
  GMSTime,
  Kilometer,
  EciVec3
} from 'satellite.js'
import { EARTH_RADIUS_KM } from './constants'
import { TypedArray } from 'three'
import * as THREE from 'three'

export interface SatInformation {
  name: string
  satrec: SatRec
}

export interface SatPosition {
  lat: number
  lng: number
  alt: number
  realAlt: number
  id: string
}

export type GeoCoords = {
  lat: number
  lng: number
  alt: number
}

/**
 * Parse TLE data to satellite information object
 * @param tleString - The TLE data as a string
 * @returns Array of satellite information objects
 */
export function parseTLEListToSat(tleString: string): SatInformation[] {
  const tleData = tleString
    .replace(/\r/g, '')
    .split(/\n(?=[^12])/)
    .map((tle) => tle.split('\n'))
  return tleData.map(([name, tleLine1, tleLine2]) => ({
    satrec: twoline2satrec(tleLine1, tleLine2),
    name: name.trim().replace(/^0 /, '')
  }))
}

/**
 * Propagate a single satellite's position
 * @param sat - Satellite information object
 * @param time - Date object representing the time of propagation
 * @param gmst - GMSTime object for the given time
 * @returns Satellite position object or an empty object if no position data
 */
export function propagate1Sat(
  sat: SatInformation,
  time: Date,
  gmst: GMSTime
): Record<string, never> | SatPosition {
  const eci = propagate(sat.satrec, time)
  if (eci.position) {
    const gdPos = eciToGeodetic(eci.position as EciVec3<Kilometer>, gmst)

    return {
      lat: degreesLat(gdPos.latitude),
      lng: degreesLong(gdPos.longitude),
      alt: (gdPos.height / EARTH_RADIUS_KM) * 3,
      realAlt: gdPos.height,
      id: sat.satrec.satnum
    }
  } else {
    return {}
  }
}

/**
 * Shifts elements in a typed array to the left by a given number of steps
 * @param collection - The typed array to be shifted
 * @param steps - The number of steps to shift (default is 1)
 * @returns The shifted typed array
 */
export const shiftLeft = (collection: TypedArray, steps = 1) => {
  collection.set(collection.subarray(steps))
  collection.fill(0, -steps)
  return collection
}

/**
 * Loads a texture from a given URL
 * @param url - The URL of the texture
 * @returns A promise that resolves to the loaded texture
 */
export const loadTexture = async (url: string): Promise<THREE.Texture> => {
  const textureLoader = new THREE.TextureLoader()
  return new Promise((resolve) => {
    textureLoader.load(url, (texture) => {
      resolve(texture)
    })
  })
}

/**
 * Rounds a number to a specified number of decimal places
 * @param num - The number to round
 * @param digits - The number of decimal places
 * @returns The rounded number
 */
export const rounded = (num: number, digits: number) => {
  const factor = Math.pow(10, digits)
  return Math.round(num * factor) / factor
}

/**
 * Converts degrees to radians
 * @param degrees - The degrees to convert
 * @returns The radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculates the distance between two geographical coordinates
 * @param coords1 - The first set of coordinates
 * @param coords2 - The second set of coordinates
 * @returns The distance between the two coordinates
 */
export function calculateDistance(coords1: GeoCoords, coords2: GeoCoords): number {
  const lat1Rad = toRadians(coords1.lat)
  const lon1Rad = toRadians(coords1.lng)
  const lat2Rad = toRadians(coords2.lat)
  const lon2Rad = toRadians(coords2.lng)

  const alt1 = coords1.alt + EARTH_RADIUS_KM
  const alt2 = coords2.alt + EARTH_RADIUS_KM

  const distance = Math.sqrt(
    alt1 ** 2 +
      alt2 ** 2 -
      2 *
        alt1 *
        alt2 *
        (Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon1Rad - lon2Rad) +
          Math.sin(lat1Rad) * Math.sin(lat2Rad))
  )

  return distance
}
