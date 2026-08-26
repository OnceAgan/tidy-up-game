import * as THREE from 'three'
import type { InputManager } from '../core/InputManager'

export type RoomBounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

const EYE_HEIGHT = 1.6
const MOVE_SPEED = 3.2
const LOOK_SENSITIVITY = 0.0022
const PLAYER_RADIUS = 0.35

export class Player {
  readonly yawObject = new THREE.Object3D()
  readonly pitchObject = new THREE.Object3D()
  private pitch = 0
  private readonly input: InputManager
  private readonly bounds: RoomBounds

  constructor(camera: THREE.PerspectiveCamera, input: InputManager, bounds: RoomBounds) {
    this.input = input
    this.bounds = bounds
    this.yawObject.position.set(0, EYE_HEIGHT, 4)
    this.pitchObject.add(camera)
    this.yawObject.add(this.pitchObject)
  }

  update(dt: number): void {
    if (!this.input.isPointerLocked) return

    const mouse = this.input.consumeMouseDelta()
    this.yawObject.rotation.y -= mouse.x * LOOK_SENSITIVITY
    this.pitch -= mouse.y * LOOK_SENSITIVITY
    this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch))
    this.pitchObject.rotation.x = this.pitch

    const forward = Number(this.input.isDown('KeyW')) - Number(this.input.isDown('KeyS'))
    const strafe = Number(this.input.isDown('KeyD')) - Number(this.input.isDown('KeyA'))
    if (forward === 0 && strafe === 0) return

    const direction = new THREE.Vector3(strafe, 0, -forward)
    direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yawObject.rotation.y)

    const next = this.yawObject.position.clone()
    next.x += direction.x * MOVE_SPEED * dt
    next.z += direction.z * MOVE_SPEED * dt
    next.y = EYE_HEIGHT

    next.x = THREE.MathUtils.clamp(
      next.x,
      this.bounds.minX + PLAYER_RADIUS,
      this.bounds.maxX - PLAYER_RADIUS,
    )
    next.z = THREE.MathUtils.clamp(
      next.z,
      this.bounds.minZ + PLAYER_RADIUS,
      this.bounds.maxZ - PLAYER_RADIUS,
    )

    this.yawObject.position.copy(next)
  }
}
