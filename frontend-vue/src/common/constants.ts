export const EARTH_RADIUS_KM = 6371 // km
export const SAT_SIZE = 75 // km
export const SAT_SIZE_CLICK = 2.5 * SAT_SIZE // km
export const SAT_COLOR = 'white'
export const SAT_COLOR_HOVER = '#FFD700'
export const SAT_COLOR_SELECTED = '#FF4500'
export const LINE_SIZE = 12_000
export const MAX_LINE_SIZE_LINKS = 600_000
export const MAX_CAMERA_DISTANCE = 5000
export const MIN_CAMERA_DISTANCE = 150
export const IDLE_TIME = 5 * 60 * 1000 // 5 minutes
export const NUM_DIGITS = 3 // Number of digits after the decimal point in the satellite popup

// TODO: Dit is het maximale aantal satellieten dat uberhaup gerenderd kan worden. Misschien hoger maken?
// API returned er nu 10329.
// Het hoger zetten zorgt er wel voor dat er meer satellieten gerenderd worden, en dus de performance omlaag gaat.
export const MAX_SATS_TO_RENDER = 12_000

export const TIME_INTERVAL_ORBIT = 1000
export const NUM_OF_STEPS_ORBIT = 10000
export const AMT_OF_WORKERS = 4 // Used for both adjlist and sat positions
export const DISTANCE_FOR_SATELLITES = 650 // km
