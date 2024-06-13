import * as THREE from 'three'
import { Ref, ref } from 'vue';

export class Time {
  private currentTime: Date
  public multiplier: Ref<number> = ref(1);
  private clock: THREE.Clock = new THREE.Clock()

  get time() {
    return this.currentTime
  }

  constructor(startTime: Date) {
    this.currentTime = startTime
  }

  setTime(time: Date) {
    this.currentTime = time
  }

  setSpeed(speed: number) {
    this.multiplier.value = speed
  }

  step() {
    const delta = this.clock.getDelta()
    this.currentTime = new Date(+this.currentTime + this.multiplier.value * 1000 * delta)
  }
}
