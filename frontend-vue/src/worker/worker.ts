

import * as satellite from 'satellite.js';


export interface SatRecDump {
    event: "init";
    satrec: any;
}

export interface Calculate {
    event: "calculate";
    time: Date;
}
export interface CalculateResponse {
    event: "calculate-res";
    position: any
}

let counter = 0;
const data = {} as { [key: number]: any };

onmessage = (event) => {
    const type = event.data.event as "init" | "calculate";

    if (type === "init") {
        const { satrec } = event.data as SatRecDump;
        data[counter] = satrec;
        counter += 1;
    } else if (type === "calculate") {
        const { time } = event.data as Calculate;
        for (let i = 0; i < counter; i++) {
            const satrec = data[i];
            const positionAndVelocity = satellite.propagate(satrec, time);
            const gmst = satellite.gstime(time);
            const positionEci = positionAndVelocity.position;
            if (!positionEci) {
                continue;
            }
            //@ts-ignore
            const positionEcf = satellite.eciToEcf(positionEci, gmst);
            postMessage({
                event: "calculate-res",
                position: positionEcf
            } as CalculateResponse);
        }
    }

}
