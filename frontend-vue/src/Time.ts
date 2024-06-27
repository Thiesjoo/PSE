/**
 * This file contains the Time class, which manages the current time in a simulation and allows for time manipulation
 * with a speed multiplier. It also supports adding and removing event listeners that respond to time changes.
 */
import * as THREE from 'three'
import { Ref, ref } from 'vue'

let currentRef = 0

// Define the Time class
export class Time {
  private currentTime: Date // Stores the current time
  public multiplier: Ref<number> = ref(1) // Speed multiplier for time progression
  private clock: THREE.Clock = new THREE.Clock() // THREE.js clock to track elapsed time

  private listeners = new Map<number, (param: String) => void>() // Map of event listeners

  get time() {
    return this.currentTime
  }

  // Constructor initializes the Time class with a start time
  constructor(startTime: Date) {
    this.currentTime = startTime
  }

  // Sets the current time and notifies all listeners
  setTime(time: Date) {
    this.currentTime = time

    for (const [, listener] of this.listeners) {
      listener("Time")
    }
  }

  // Sets the speed multiplier and notifies all listeners
  setSpeed(speed: number) {
    this.multiplier.value = speed

    for (const [, listener] of this.listeners) {
      listener("Speed")
    }
  }

  // Steps the current time forward based on the elapsed time and speed multiplier
  step() {
    const delta = this.clock.getDelta()
    this.currentTime = new Date(+this.currentTime + this.multiplier.value * 1000 * delta)
  }

  // Adds an event listener that is called on time updates and returns a reference number
  addEventListener(listener: (param: String) => void) {
    this.listeners.set(++currentRef, listener)
    return currentRef
  }

  // Removes an event listener based on the reference number
  removeEventListener(ref: number) {
    this.listeners.delete(ref)
  }
}
