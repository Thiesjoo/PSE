
import { Satellite } from "@/Satellite";
import MyWorkerImplementation from "./worker?worker"
import { SatRecDump, WorkerMessage, WorkerResponse } from "./worker";
import { AMT_OF_WORKERS } from "@/common/constants";
import { GMSTime } from "satellite.js";


export class WorkerManager {
    private workers: Worker[] = [];
    private count: number[] = [];
    private satellites: Satellite[] = [];

    private received = 0;

    private finished = true;
    private results = new Float64Array(0);
    private speedResults = new Float64Array(0);

    private currentHash = 0;

    constructor() {
        this.initWorkers();
    }

    private initWorkers() {
        for (let i = 0; i < AMT_OF_WORKERS; i++) {
            const worker = new MyWorkerImplementation();
            worker.onmessage = (evt: any) => this.onMessage(evt.data);
            this.workers.push(worker);
            this.count.push(0);
        }
    }

    private sendMsg(idx: number, msg: WorkerMessage) {
        this.workers[idx].postMessage(msg);
    }

    public reset() {
        this.workers.forEach((worker, idx) => {
            this.sendMsg(idx, { event: "reset" });
        });
        this.done()
        this.satellites = [];
        this.currentHash++; 
    }

    public addSatellites(satellites: Satellite[]) {
        // You cannot add a single satellite, as the workers are already initialized
        this.reset();

        this.satellites = satellites;
        const blocks = Math.floor(this.satellites.length / AMT_OF_WORKERS);
        for (let i = 0; i < AMT_OF_WORKERS; i++) {
            const start = i * blocks;
            const end = i === AMT_OF_WORKERS - 1 ? this.satellites.length : (i + 1) * blocks;
            // console.log(`Worker ${i}: `, start, end)
            const data = this.satellites.slice(start, end).map((sat, idx) => ({ ...sat.satData, idx: start + idx }));
            this.sendMsg(i, { event: "add", satrec: data, workerIndex: i});
            this.count[i] = start;
        }
    }


    public startPropagate(time: Date, gmsTime: GMSTime) {
        if (this.received !== 0) {
            console.error("Received is not 0, we are still processing an old one");
            return;
        }

        if (!this.finished) {
            console.error("We are not finished with the previous calculation");
            return;
        }

        this.results = new Float64Array(this.satellites.length * 3);
        this.speedResults = new Float64Array(this.satellites.length);
        this.finished = false;
        this.workers.forEach((worker, idx) => {
            this.sendMsg(idx, { event: "calculate", time, gmsTime, hash: this.currentHash});
        });
    }


    public finishPropagate(time: Date, gmsTime: GMSTime) {
        if (this.finished) {
            for (let i = 0; i < this.satellites.length; i++) {
                const idx = i * 3;
                this.satellites[i].realPosition.lat = this.results[idx]
                this.satellites[i].realPosition.lng = this.results[idx + 1]
                this.satellites[i].realPosition.alt = this.results[idx + 2];
                this.satellites[i].realSpeed.value = this.speedResults[i];
            }

            this.startPropagate(time, gmsTime);
            return true;
        }
        return false;
    }


    private done() {
        this.received = 0;
        this.finished = true;
    }


    private onMessage(event: WorkerResponse) {
        switch (event.event) {
            case "calculate-res":
                const {buffer, workerIndex, hash} = event.data;
                if (hash !== this.currentHash) {
                    console.error("Hashes do not match, out of sync");
                    return;
                }

                this.received++;
                this.results.set(buffer, this.count[workerIndex] * 3);
                this.speedResults.set(event.data.speedBuffer, this.count[workerIndex]);
                
                if (this.received === AMT_OF_WORKERS) {
                    this.done();
                }
                break;
        }
    }
}