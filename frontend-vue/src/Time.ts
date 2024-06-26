import * as THREE from 'three'
import { Ref, ref } from 'vue'

export class Time {
  private currentTime: Date
  public multiplier: Ref<number> = ref(1)
  private clock: THREE.Clock = new THREE.Clock()

  private listeners = new Set<() => void>()

  get time() {
    return this.currentTime
  }

  constructor(startTime: Date) {
    this.currentTime = startTime
  }

  setTime(time: Date) {
    this.currentTime = time

    for (const listener of this.listeners) {
      listener()
    }
  }

  setSpeed(speed: number) {
    this.multiplier.value = speed

    for (const listener of this.listeners) {
      listener()
    }
  }

  step() {
    const delta = this.clock.getDelta()
    this.currentTime = new Date(+this.currentTime + this.multiplier.value * 1000 * delta)
  }

  addEventListener(listener: () => void) {
    this.listeners.add(listener)
  }

  removeEventListener(listener: () => void) {
    this.listeners.delete(listener)
  }
}
