import { GeoCoords } from './common/utils'
import * as THREE from 'three'
import ThreeGlobe from 'three-globe'

export class LocationMarker {
  private coords: GeoCoords
  private scene: THREE.Scene
  private globe: ThreeGlobe
  private marker: THREE.Mesh | null = null

  constructor(coords: GeoCoords, scene: THREE.Scene, globe: ThreeGlobe) {
    this.coords = coords
    this.scene = scene
    this.globe = globe
  }

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

  getCoords() {
    return this.coords
  }

  remove() {
    if (this.marker !== null) {
      this.scene.remove(this.marker)
    }
  }
}
