import * as THREE from 'three'
import { Interactable } from './Interactable'
import { CASSETTE_SIZE, type Cassette } from './Cassette'
import { PARTS_PER_SERIES } from '../data/cassetteCatalog'
import { shelfSectionWidth, SHELF_DEPTH } from './cassettePlacement'
import type { Shelf } from './Shelf'
import { createSeriesLabelTexture } from '../env/coverArt'

export class ShelfSlot extends Interactable {
  readonly kind = 'slot' as const
  readonly colorIndex: number
  readonly shelf: Shelf
  readonly mesh: THREE.Mesh
  readonly cassettes: Cassette[] = []
  private readonly seriesLabel: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>

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
    this.seriesLabel = new THREE.Mesh(new THREE.PlaneGeometry(sectionW - 0.012, 0.075),
      new THREE.MeshBasicMaterial())
    this.seriesLabel.position.set(0, CASSETTE_SIZE.h / 2 + 0.038, SHELF_DEPTH / 2 - 0.015)
    this.seriesLabel.visible = false
    this.mesh.add(this.seriesLabel)
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
    return this.placementError(cassette) === null
  }

  placementError(cassette: Cassette): string | null {
    if (cassette.colorIndex !== this.colorIndex) return 'Эту кассету необходимо поместить на другой стеллаж — проверь жанр.'
    if (this.assignedSeries !== null && this.assignedSeries !== cassette.seriesIndex)
      return 'В данной ячейке уже находятся кассеты другой серии.'
    if (this.isFull) return 'Эта ячейка уже заполнена: все пять частей на месте.'
    if (this.hasPart(cassette.part)) return 'Эта часть серии уже стоит в ячейке.'
    if (this.isEmpty && this.shelf.isSeriesAssigned(cassette.seriesIndex))
      return 'Для этой серии уже есть ячейка на этом стеллаже — поставь кассету туда.'
    return null
  }

  addCassette(cassette: Cassette): void {
    this.cassettes.push(cassette)
    if (this.cassettes.length === 1) {
      this.seriesLabel.material.map = createSeriesLabelTexture(cassette.title)
      this.seriesLabel.material.needsUpdate = true
      this.seriesLabel.visible = true
    }
  }

  reset(): void {
    this.cassettes.length = 0
    this.seriesLabel.visible = false
    this.seriesLabel.material.map?.dispose()
    this.seriesLabel.material.map = null
  }

  protected applyHighlight(_on: boolean): void {
    // Ячейки невидимы — подсветка не нужна
  }
}
