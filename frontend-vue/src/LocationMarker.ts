/**
 * This file contains the LocationMarker class, which is responsible for creating and managing a marker at a specific
 * geographical location on a Three.js globe.
 */
import { GeoCoords } from './common/utils'
import * as THREE from 'three'
import ThreeGlobe from 'three-globe'

// Define the LocationMarker class
export class LocationMarker {
  private coords: GeoCoords // Stores the geographical coordinates of the marker
  private scene: THREE.Scene // Three.js scene to add the marker to
  private globe: ThreeGlobe // ThreeGlobe instance to convert geo coordinates to 3D coordinates
  private marker: THREE.Mesh | null = null // Three.js mesh for the marker

  // Constructor initializes the LocationMarker with coordinates, scene, and globe
  constructor(coords: GeoCoords, scene: THREE.Scene, globe: ThreeGlobe) {
    this.coords = coords
    this.scene = scene
    this.globe = globe
  }

  // Renders the marker on the globe at the specified coordinates
  render() {
    this.marker = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )

    const { lat, lng, alt } = this.coords
    const { x, y, z } = this.globe.getCoords(lat, lng, alt)
    this.marker.position.set(x, y, z)

    this.scene.add(this.marker)
  }

  // Returns the geographical coordinates of the marker
  getCoords() {
    return this.coords
  }

  // Removes the marker from the scene
  remove() {
    if (this.marker !== null) {
      this.scene.remove(this.marker)
    }
  }
}
