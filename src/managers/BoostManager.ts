import * as THREE from 'three'
import type { Cassette } from '../entities/Cassette'
import type { Shelf } from '../entities/Shelf'
import type { ShelfSlot } from '../entities/ShelfSlot'

const HIGHLIGHT_DURATION_S = 15
function sameSeries(a: Cassette, b: Cassette): boolean {
  return a.genreId === b.genreId && a.seriesIndex === b.seriesIndex && a.title === b.title
}
export type BoostHudState =
  | { kind: 'locked' }
  | { kind: 'ready'; charges: number }
  | { kind: 'active'; secondsLeft: number; charges: number }

export class BoostManager {
  private charges = 0
  private timeLeft = 0
  private readonly awardedSlots = new Set<ShelfSlot>()
  private readonly markers = new Map<Cassette, THREE.Mesh>()
  private readonly markerParent = new THREE.Group()
  private readonly markerGeometry = new THREE.RingGeometry(0.22, 0.34, 32)
  private readonly markerMaterial = new THREE.MeshBasicMaterial({ color: 0x66ff88,
    transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide })
  private readonly worldPosition = new THREE.Vector3()

  constructor(scene: THREE.Scene) { scene.add(this.markerParent) }

  reset(): void {
    this.clearMarkers()
    this.charges = this.timeLeft = 0
    this.awardedSlots.clear()
  }

  getHudState(): BoostHudState {
    if (this.timeLeft > 0) return { kind: 'active', secondsLeft: this.timeLeft, charges: this.charges }
    return this.charges > 0 ? { kind: 'ready', charges: this.charges } : { kind: 'locked' }
  }

  /** Each cell awards one charge once, including cells completed during an active skill. */
  checkShelvesAfterPlace(shelves: readonly Shelf[]): void {
    for (const shelf of shelves) {
      for (const slot of shelf.slots) {
        if (!slot.isFull || this.awardedSlots.has(slot)) continue
        this.awardedSlots.add(slot)
        this.charges++
      }
    }
  }

  tryActivateSeriesHighlight(held: Cassette | null, cassettes: readonly Cassette[]): boolean {
    if (!held || (this.timeLeft <= 0 && this.charges === 0)) return false
    const targets = cassettes.filter(c => c !== held && !c.held && !c.placed && sameSeries(c, held))
    if (targets.length === 0) return false
    if (this.timeLeft <= 0) {
      this.charges--
      this.timeLeft = HIGHLIGHT_DURATION_S
    }
    // Retargeting preserves the remaining time and never consumes another charge.
    this.clearMarkers()
    for (const cassette of targets) {
      cassette.setSeriesBoostHighlight(true)
      const ring = new THREE.Mesh(this.markerGeometry, this.markerMaterial)
      ring.rotation.x = -Math.PI / 2
      ring.renderOrder = 50
      cassette.mesh.getWorldPosition(this.worldPosition)
      ring.position.set(this.worldPosition.x, 0.025, this.worldPosition.z)
      this.markerParent.add(ring)
      this.markers.set(cassette, ring)
    }
    return true
  }

  onCassettePicked(cassette: Cassette): void {
    cassette.setSeriesBoostHighlight(false)
    const marker = this.markers.get(cassette)
    if (marker) this.markerParent.remove(marker)
    this.markers.delete(cassette)
  }

  update(dt: number): void {
    if (this.timeLeft <= 0) return
    for (const cassette of this.markers.keys()) {
      if (cassette.held || cassette.placed) this.onCassettePicked(cassette)
    }
    this.timeLeft = Math.max(0, this.timeLeft - dt)
    if (this.timeLeft === 0) this.clearMarkers()
  }

  private clearMarkers(): void {
    for (const cassette of this.markers.keys()) cassette.setSeriesBoostHighlight(false)
    this.markerParent.clear()
    this.markers.clear()
  }
}
