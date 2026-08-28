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
      color: 0xd8d0c6,
      transparent: true,
      opacity: 0.28,
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
    this.material.opacity = on ? 0.55 : 0.28
    this.material.color.setHex(on ? 0xc8e8b0 : 0xd8d0c6)
  }
}
