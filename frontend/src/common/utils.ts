import {
    SatRec,
    twoline2satrec,
    propagate,
    eciToGeodetic,
    degreesLat,
    degreesLong,
    GMSTime,
    Kilometer,
    EciVec3,
} from 'satellite.js';
import { EARTH_RADIUS_KM } from './constants';
import { TypedArray } from 'three';
import * as THREE from 'three';

export interface SatInformation {
    name: string;
    satrec: SatRec;
}

export interface SatPosition {
    lat: number;
    lng: number;
    alt: number;
    realAlt: number;
    id: string;
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
        .map(tle => tle.split('\n'));
    return tleData.map(([name, tleLine1, tleLine2]) => ({
        satrec: twoline2satrec(tleLine1, tleLine2),
        name: name.trim().replace(/^0 /, ''),
    }));
}

export function propagate1Sat(
    sat: SatInformation,
    time: Date,
    gmst: GMSTime
): Record<string, never> | SatPosition {
    const eci = propagate(sat.satrec, time);
    if (eci.position) {
        const gdPos = eciToGeodetic(eci.position as EciVec3<Kilometer>, gmst);

        return {
            lat: degreesLat(gdPos.latitude),
            lng: degreesLong(gdPos.longitude),
            alt: (gdPos.height / EARTH_RADIUS_KM) * 3,
            realAlt: gdPos.height,
            id: sat.satrec.satnum,
        };
    } else {
        // console.warn(`No position data for satellite. ${sat.name}`);
        return {};
    }
}

export const shiftLeft = (collection: TypedArray, steps = 1) => {
    collection.set(collection.subarray(steps));
    collection.fill(0, -steps);
    return collection;
};

export const loadTexture = async (url: string): Promise<THREE.Texture> => {
    const textureLoader = new THREE.TextureLoader();
    return new Promise(resolve => {
        textureLoader.load(url, texture => {
            resolve(texture);
        });
    });
};
