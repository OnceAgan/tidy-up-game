import * as THREE from 'three'
import type { Cassette } from '../entities/Cassette'
import type { Shelf } from '../entities/Shelf'

const HIGHLIGHT_DURATION_S = 15

function sameSeries(a: Cassette, b: Cassette): boolean {
  return a.genreId === b.genreId && a.seriesIndex === b.seriesIndex && a.title === b.title
}

export type BoostHudState =
  | { kind: 'locked' }
  | { kind: 'ready' }
  | { kind: 'active'; secondsLeft: number }

export class BoostManager {
  private chargeReady = false
  private active = false
  private timeLeft = 0
  private readonly awardedShelfKeys = new Set<number>()
  private readonly boosted: Cassette[] = []
  private readonly floorMarkers: THREE.Mesh[] = []
  private readonly markerParent = new THREE.Group()

  constructor(scene: THREE.Scene) {
    scene.add(this.markerParent)
  }

  getHudState(): BoostHudState {
    if (this.active) {
      return { kind: 'active', secondsLeft: Math.max(0, this.timeLeft) }
    }
    if (this.chargeReady) return { kind: 'ready' }
    return { kind: 'locked' }
  }

  /** После установки кассеты — проверить, не заполнилась ли категория впервые */
  checkShelvesAfterPlace(shelves: Shelf[]): void {
    for (const shelf of shelves) {
      if (!shelf.isCategoryComplete()) continue
      if (this.awardedShelfKeys.has(shelf.colorIndex)) continue
      this.awardedShelfKeys.add(shelf.colorIndex)
      this.chargeReady = true
    }
  }

  tryActivateSeriesHighlight(held: Cassette | null, cassettes: readonly Cassette[]): boolean {
    if (!held || !this.chargeReady || this.active) return false

    this.chargeReady = false
    this.active = true
    this.timeLeft = HIGHLIGHT_DURATION_S

    for (const c of cassettes) {
      if (c === held || c.placed || c.held) continue
      if (!sameSeries(c, held)) continue
      c.setSeriesBoostHighlight(true)
      this.boosted.push(c)
      this.addFloorMarker(c)
    }

    return true
  }

  update(dt: number): void {
    if (!this.active) return
    this.timeLeft -= dt
    if (this.timeLeft <= 0) {
      this.endHighlight()
    }
  }

  private endHighlight(): void {
    for (const c of this.boosted) {
      c.setSeriesBoostHighlight(false)
    }
    this.boosted.length = 0

    for (const m of this.floorMarkers) {
      this.markerParent.remove(m)
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
    }
    this.floorMarkers.length = 0

    this.active = false
    this.timeLeft = 0
  }

  private addFloorMarker(cassette: Cassette): void {
    const geo = new THREE.RingGeometry(0.22, 0.34, 32)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x66ff88,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(geo, mat)
    ring.rotation.x = -Math.PI / 2
    ring.renderOrder = 50

    const pos = new THREE.Vector3()
    cassette.mesh.getWorldPosition(pos)
    ring.position.set(pos.x, 0.025, pos.z)
    this.markerParent.add(ring)
    this.floorMarkers.push(ring)
  }
}
