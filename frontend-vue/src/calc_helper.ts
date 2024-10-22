/**
 * This file contains utility functions for working with satellite orbits, including functions to update the epoch,
 * calculate the number of revolutions per day, calculate mean motion in radians per minute, and calculate satellite height.
 */

// Updates the epoch to the current date and time in the format YYDDD.DDDDDDDD
export function epochUpdate() {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = +now - +start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000
  const day = Math.floor(diff / (1000 * 60 * 60 * 24))
  const seconds = now.getSeconds() + now.getMinutes() * 60 + now.getHours() * 3600
  const day_fraction = (seconds / 86400).toFixed(8).slice(1)

  // Formatting
  return year + (day + parseFloat(day_fraction)).toFixed(8).padStart(12, '0')
}

// Calculates the number of revolutions per day for a satellite given the semi-major axis
export function calculateRevolutionPerDay(a: number) {
  const GRAVITATIONAL_PARAM = 3.986004418e14 // m^3/s^2
  const mean_motion = Math.sqrt(GRAVITATIONAL_PARAM / a ** 3)
  const revolutions_per_day = (mean_motion * 86400) / (2 * Math.PI)

  return revolutions_per_day.toFixed(8)
}

// Calculates the mean motion in radians per minute given the semi-major axis
export function calculateMeanMotionRadPerMin(a: number): number {
  const GRAVITATIONAL_PARAM = 3.986004418e14 // m^3/s^2
  const mean_motion = Math.sqrt(GRAVITATIONAL_PARAM / a ** 3)
  const rad_per_minute = mean_motion * 60

  return +rad_per_minute
}

// Calculates the height of a satellite given the mean motion in radians per minute
export function calculateHeight(no: number): number {
  const GRAVITATIONAL_PARAM = 3.986004418e14 // m^3/s^2
  const a = Math.cbrt(GRAVITATIONAL_PARAM * (60 / no) ** 2)
  const height = a / 1000 - 6371

  return +height.toFixed(0)
}
