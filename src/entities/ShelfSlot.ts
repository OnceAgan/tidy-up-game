import * as THREE from 'three'
import { Interactable } from './Interactable'
import { CASSETTE_SIZE, type Cassette } from './Cassette'
import { PARTS_PER_SERIES } from '../data/cassetteCatalog'
import { shelfSectionWidth, SHELF_DEPTH } from './cassettePlacement'
import type { Shelf } from './Shelf'

export class ShelfSlot extends Interactable {
  readonly kind = 'slot' as const
  readonly colorIndex: number
  readonly shelf: Shelf
  readonly mesh: THREE.Mesh
  readonly cassettes: Cassette[] = []

  constructor(shelf: Shelf, colorIndex: number) {
    super()
    this.shelf = shelf
    this.colorIndex = colorIndex
    const sectionW = shelfSectionWidth()
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sectionW, CASSETTE_SIZE.h + 0.02, SHELF_DEPTH * 0.88),
      new THREE.MeshBasicMaterial({
        visible: false,
      }),
    )
    this.mesh.userData.interactable = this
  }

  /** Серия, закреплённая за ячейкой после первой кассеты */
  get assignedSeries(): number | null {
    return this.cassettes[0]?.seriesIndex ?? null
  }

  get isEmpty(): boolean {
    return this.cassettes.length === 0
  }

  get isFull(): boolean {
    return this.cassettes.length >= PARTS_PER_SERIES
  }

  hasPart(part: number): boolean {
    return this.cassettes.some((c) => c.part === part)
  }

  accepts(cassette: Cassette): boolean {
    if (cassette.colorIndex !== this.colorIndex) return false
    if (this.isFull) return false
    if (this.hasPart(cassette.part)) return false

    const assigned = this.assignedSeries
    if (assigned !== null) {
      return cassette.seriesIndex === assigned
    }

    return !this.shelf.isSeriesAssigned(cassette.seriesIndex)
  }

  addCassette(cassette: Cassette): void {
    this.cassettes.push(cassette)
  }

  protected applyHighlight(_on: boolean): void {
    // Ячейки невидимы — подсветка не нужна
  }
}
