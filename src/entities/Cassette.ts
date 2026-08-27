import * as THREE from 'three'
import { Interactable } from './Interactable'

export const CASSETTE_SIZE = { w: 0.12, h: 0.19, d: 0.025 }

/** 6 цветовых вариантов кассет */
export const CASSETTE_COLORS = [
  0xc45c4a, // red
  0x4a7c59, // green
  0x3d5a80, // blue
  0xc9a227, // yellow
  0x8b5a9e, // purple
  0xd4783a, // orange
] as const

export class Cassette extends Interactable {
  readonly kind = 'cassette' as const
  readonly colorIndex: number
  readonly mesh: THREE.Mesh
  private readonly material: THREE.MeshStandardMaterial
  held = false
  placed = false

  constructor(colorIndex: number) {
    super()
    this.colorIndex = colorIndex % CASSETTE_COLORS.length
    this.material = new THREE.MeshStandardMaterial({
      color: CASSETTE_COLORS[this.colorIndex],
      roughness: 0.55,
      metalness: 0.05,
    })
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(CASSETTE_SIZE.w, CASSETTE_SIZE.h, CASSETTE_SIZE.d),
      this.material,
    )
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.userData.interactable = this
  }

  protected applyHighlight(on: boolean): void {
    this.material.emissive.setHex(on ? 0x332211 : 0x000000)
    this.material.emissiveIntensity = on ? 0.45 : 0
  }
}
