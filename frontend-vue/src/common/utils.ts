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
 * @param tleString
 * @returns
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
    // console.warn(`No position data for satellite. ${sat.name}`);
    return {}
  }
}

export const shiftLeft = (collection: TypedArray, steps = 1) => {
  collection.set(collection.subarray(steps))
  collection.fill(0, -steps)
  return collection
}

export const loadTexture = async (url: string): Promise<THREE.Texture> => {
  const textureLoader = new THREE.TextureLoader()
  return new Promise((resolve) => {
    textureLoader.load(url, (texture) => {
      resolve(texture)
    })
  })
}
export const rounded = (num: number, digits: number) => {
  const factor = Math.pow(10, digits)
  return Math.round(num * factor) / factor
}



function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}


export function calculateDistance(coords1: GeoCoords, coords2: GeoCoords): number {
    const lat1Rad = toRadians(coords1.lat);
    const lon1Rad = toRadians(coords1.lng);
    const lat2Rad = toRadians(coords2.lat);
    const lon2Rad = toRadians(coords2.lng);

    // Haversine formula
    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = EARTH_RADIUS_KM * c;

    return distance;
}
