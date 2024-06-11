import * as THREE from 'three';

export class Time {
    private currentTime: Date;
    private multiplier: number = 1;
    private clock: THREE.Clock = new THREE.Clock();


    get time() {
        return this.currentTime;
    }


    constructor(startTime: Date) {
        this.currentTime = startTime
    }


    setTime(time: Date) {
        this.currentTime = time
    }

    setSpeed(speed: number) {
        this.multiplier = speed;
    }

    step() {
        const delta = this.clock.getDelta();
        this.currentTime = new Date(+this.currentTime + (this.multiplier * 1000) * delta);
    }
}