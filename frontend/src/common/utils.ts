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
} from "satellite.js";
import { EARTH_RADIUS_KM } from "./constants";

export interface SatInformation {
    name: string;
    satrec: SatRec;
}

/**
 * Parse TLE data to satellite information object
 * @param tleString
 * @returns
 */
export function parseTLEListToSat(tleString: string): SatInformation[] {
    const tleData = tleString
        .replace(/\r/g, "")
        .split(/\n(?=[^12])/)
        .map((tle) => tle.split("\n"));
    return tleData.map(([name, tleLine1, tleLine2]) => ({
        satrec: twoline2satrec(tleLine1, tleLine2),
        name: name.trim().replace(/^0 /, ""),
    }));
}

export function propagate1Sat(sat: SatInformation, time: Date, gmst: GMSTime) {
    const eci = propagate(sat.satrec, time);
    if (eci.position) {
        const gdPos = eciToGeodetic(eci.position as EciVec3<Kilometer>, gmst);

        return {
            lat: degreesLat(gdPos.latitude),
            lng: degreesLong(gdPos.longitude),
            alt: (gdPos.height / EARTH_RADIUS_KM) * 3,
            id: sat.satrec.satnum,
        };
    } else {
        // console.warn(`No position data for satellite. ${sat.name}`);
        return {};
    }
}
