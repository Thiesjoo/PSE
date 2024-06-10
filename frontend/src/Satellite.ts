import type { EciVec3, GMSTime, Kilometer, PositionAndVelocity, SatRec } from "satellite.js";
import  { degreesLat, degreesLong, twoline2satrec, propagate, eciToGeodetic } from "satellite.js";
import type { Group } from "three";

import * as THREE from "three";
import { EARTH_RADIUS_KM, SAT_COLOR, SAT_COLOR_HOVER, SAT_COLOR_SELECTED, SAT_SIZE, SAT_SIZE_CLICK } from "./common/constants";

export class Satellite {
    private name!: string;
    private satData!: SatRec;
    public currentPosition: PositionAndVelocity | null = null;

    get id(): string {
        return this.satData.satnum;
    }

    constructor() {}

    public fromTLE(tle: string) {
        const tleArray = tle.split("\n");
        this.name = tleArray[0];
        this.satData = twoline2satrec(tleArray[1], tleArray[2]);
    }

    public fromTLEArray(tle: [string, string, string]) {
        this.name = tle[0];
        this.satData = twoline2satrec(tle[1], tle[2]);
    }

    // TODO: public fromGosia(.....)


    // TODO: Waarom 2 tijden?
    public propagate(time: Date, gmsTime: GMSTime): Object {
        const eci = propagate(this.satData, time);
        this.currentPosition = eci;

        if (eci.position) {
            const gdPos = eciToGeodetic(eci.position as EciVec3<Kilometer>, gmsTime);
    
            return {
                lat: degreesLat(gdPos.latitude),
                lng: degreesLong(gdPos.longitude),
                alt: (gdPos.height / EARTH_RADIUS_KM) * 3,
                realAlt: gdPos.height,
                id: this.id,
            };
        } else {
            return {};
        }
    }

    public render(selected: boolean, hover: boolean, globeRadius: number): Group {
        const satGeometry = new THREE.OctahedronGeometry(
            (SAT_SIZE * globeRadius) / EARTH_RADIUS_KM / 2,
            0
        );

        const satClickArea = new THREE.OctahedronGeometry(
            (SAT_SIZE_CLICK * globeRadius) / EARTH_RADIUS_KM / 2,
            5
        );

        let color = SAT_COLOR;
        if (selected) {
            color = SAT_COLOR_SELECTED;
        } else if (hover) {
            color = SAT_COLOR_HOVER;
        }

        const satMaterial = new THREE.MeshLambertMaterial({
            color,
            transparent: true,
            opacity: 0.7,
        });

        const satMaterialClick = new THREE.MeshLambertMaterial({
            transparent: true,
            opacity: 0,
        });

        const sat = new THREE.Mesh(satGeometry, satMaterial);
        const clickSat = new THREE.Mesh(satClickArea, satMaterialClick);

        const group = new THREE.Group();
        group.add(sat);
        group.add(clickSat);

        group.userData = { satellite: this.id };
        sat.userData = { satellite: this.id };
        clickSat.userData = { satellite: this.id };

        return group;
    } 
}