import * as THREE from 'three'
import type { Interactable } from '../entities/Interactable'

const MAX_DISTANCE = 2.8

export class Raycast {
  private readonly raycaster = new THREE.Raycaster()
  private readonly center = new THREE.Vector2(0, 0)
  private readonly camera: THREE.Camera

  constructor(camera: THREE.Camera) {
    this.camera = camera
  }

  pick(targets: Interactable[]): Interactable | null {
    const meshes = targets.map((t) => t.mesh)
    this.raycaster.setFromCamera(this.center, this.camera)
    this.raycaster.far = MAX_DISTANCE

    const hits = this.raycaster.intersectObjects(meshes, false)
    if (hits.length === 0) return null

    const hit = hits[0]
    const interactable = hit.object.userData.interactable as Interactable | undefined
    return interactable ?? null
  }
}
