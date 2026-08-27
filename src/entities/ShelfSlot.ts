import * as THREE from 'three'
import { Interactable } from './Interactable'
import { CASSETTE_SIZE, type Cassette } from './Cassette'

export class ShelfSlot extends Interactable {
  readonly kind = 'slot' as const
  readonly colorIndex: number
  readonly mesh: THREE.Mesh
  private readonly material: THREE.MeshStandardMaterial
  cassette: Cassette | null = null

  constructor(colorIndex: number) {
    super()
    this.colorIndex = colorIndex
    this.material = new THREE.MeshStandardMaterial({
      color: 0x8a7a68,
      transparent: true,
      opacity: 0.35,
      roughness: 0.9,
    })
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(CASSETTE_SIZE.w + 0.02, CASSETTE_SIZE.h + 0.02, CASSETTE_SIZE.d + 0.02),
      this.material,
    )
    this.mesh.userData.interactable = this
  }

  get isEmpty(): boolean {
    return this.cassette === null
  }

  accepts(cassette: Cassette): boolean {
    return this.isEmpty && cassette.colorIndex === this.colorIndex
  }

  protected applyHighlight(on: boolean): void {
    this.material.opacity = on ? 0.65 : 0.35
    this.material.color.setHex(on ? 0xb8e0a8 : 0x8a7a68)
  }
}
