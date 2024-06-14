
import { Satellite } from "@/Satellite";
import MyWorkerImplementation from "./worker?worker"
import { SatRecDump } from "./worker";


export function trials() {

    const sat = new Satellite();
    sat.fromTLE(`ISS (ZARYA)
1 25544U 98067A   21110.52300000  .00001234  00000-0  31943-4 0  9999
2 25544  51.6445  86.4206 0002317  85.1914 274.9470 15.48981817274889`)

    console.log("here", new URL('./worker/worker.ts', import.meta.url))
    for (let i = 0; i < 10; i++) {
        const worker = new MyWorkerImplementation();
        
        worker.onmessage = ({ data }) => {
            console.log(data);
        };
    
        worker.postMessage({
            event: "init",
            satrec: sat.satData
        } as SatRecDump);


        function send() {
            worker.postMessage({
                event: "calculate",
                time: new Date()
            });

        }
        setInterval(send, 100);
    }

    return {"data": "data"}
}