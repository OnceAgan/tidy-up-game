import * as THREE from 'three'

export type InteractableKind = 'cassette' | 'slot'

export abstract class Interactable {
  abstract readonly kind: InteractableKind
  abstract readonly mesh: THREE.Object3D

  protected highlighted = false

  setHighlight(on: boolean): void {
    if (this.highlighted === on) return
    this.highlighted = on
    this.applyHighlight(on)
  }

  protected abstract applyHighlight(on: boolean): void
}
