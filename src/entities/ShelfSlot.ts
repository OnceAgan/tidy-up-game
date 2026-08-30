import * as THREE from 'three'
import { Interactable } from './Interactable'
import { CASSETTE_SIZE, type Cassette } from './Cassette'
import { PARTS_PER_SERIES } from '../data/cassetteCatalog'
import { shelfSectionWidth } from './cassettePlacement'

export class ShelfSlot extends Interactable {
  readonly kind = 'slot' as const
  readonly colorIndex: number
  /** 1…6 — какая серия живёт в этой ячейке */
  readonly seriesIndex: number
  readonly mesh: THREE.Mesh
  private readonly material: THREE.MeshStandardMaterial
  readonly cassettes: Cassette[] = []

  constructor(colorIndex: number, seriesIndex: number) {
    super()
    this.colorIndex = colorIndex
    this.seriesIndex = seriesIndex
    this.material = new THREE.MeshStandardMaterial({
      color: 0xd8d0c6,
      transparent: true,
      opacity: 0.22,
      roughness: 0.9,
    })
    const sectionW = shelfSectionWidth()
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sectionW, CASSETTE_SIZE.h + 0.02, CASSETTE_SIZE.w * 0.55),
      this.material,
    )
    this.mesh.userData.interactable = this
  }

  get isFull(): boolean {
    return this.cassettes.length >= PARTS_PER_SERIES
  }

  hasPart(part: number): boolean {
    return this.cassettes.some((c) => c.part === part)
  }

  accepts(cassette: Cassette): boolean {
    return (
      !this.isFull &&
      cassette.colorIndex === this.colorIndex &&
      cassette.seriesIndex === this.seriesIndex &&
      !this.hasPart(cassette.part)
    )
  }

  addCassette(cassette: Cassette): void {
    this.cassettes.push(cassette)
  }

  protected applyHighlight(on: boolean): void {
    this.material.opacity = on ? 0.48 : 0.22
    this.material.color.setHex(on ? 0xc8e8b0 : 0xd8d0c6)
  }
}
