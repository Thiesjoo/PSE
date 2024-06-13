export const EARTH_RADIUS_KM = 6371 // km
export const SAT_SIZE = 75 // km
export const SAT_SIZE_CLICK = 2.5 * SAT_SIZE // km
export const SAT_COLOR = 'palegreen'
export const SAT_COLOR_HOVER = '#FFD700'
export const SAT_COLOR_SELECTED = '#FF4500'
export const LINE_SIZE = 10000
export const MAX_CAMERA_DISTANCE = 700
export const MIN_CAMERA_DISTANCE = 0

// TODO: Dit is het maximale aantal satellieten dat uberhaup gerenderd kan worden. Misschien hoger maken?
// API returned er nu 10329.
// Het hoger zetten zorgt er wel voor dat er meer satellieten gerenderd worden, en dus de performance omlaag gaat.
export const MAX_SATS_TO_RENDER = 12_000;

export const MAX_PROPAGATES_PER_FRAME = 1000;
if (MAX_PROPAGATES_PER_FRAME * 60 < MAX_SATS_TO_RENDER) {
  console.warn(
    'MAX_PROPAGATES_PER_FRAME * 60 < renderLimit, satellieten worden niet allemaal binnen 1 seconde geupdate. Kan leiden tot onverwacht gedrag.'
  )
}
