
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

    private promiseResolve: any;

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
        this.satellites = [];
    }

    public addSatellite(satellite: Satellite, idx: number) {
        if (idx !== this.satellites.length) {
            throw new Error("Desync between worker manager + sim")
        }

        this.satellites.push(satellite);
        // find the worker with the least amount of satellites
        let minIdx = 0;
        let min = this.count[0];
        for (let i = 1; i < this.count.length; i++) {
            if (this.count[i] < min) {
                min = this.count[i];
                minIdx = i;
            }
        }

        this.sendMsg(minIdx, { event: "add", satrec: {...satellite.satData, idx} });
        this.count[minIdx]++;
    }


    public propagate(time: Date, gmsTime: GMSTime) {
        if (this.received !== 0) {
            console.error("Received is not 0");
            return;
        }

        return new Promise((resolve) => {
            this.promiseResolve = resolve;
            this.workers.forEach((worker, idx) => {
                this.sendMsg(idx, { event: "calculate", time, gmsTime });
            });
        });
    }

    private done() {
        this.received = 0;

        if (this.promiseResolve) {
            this.promiseResolve();
            this.promiseResolve = null;
        } else {
            console.error("Promise not resolved, but done")
        }
    }


    private onMessage(event: WorkerResponse) {
        switch (event.event) {
            case "calculate-res":
                const positionData = event.data;

                positionData.forEach((data) => {
                    const satellite = this.satellites[data.idx];
                    const { lat, lng, alt } = data.pos;
                    const { x, y, z } = data.spd;


                    satellite.realPosition.alt = alt;
                    satellite.realPosition.lat = lat;
                    satellite.realPosition.lng = lng;

                    satellite.realSpeed.x = x;
                    satellite.realSpeed.y = y;
                    satellite.realSpeed.z = z;
                });

                this.received++;
                if (this.received === AMT_OF_WORKERS) {
                    this.done();
                }
                break;
        }
    }
}