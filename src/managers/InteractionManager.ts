import * as THREE from 'three'
import { Tween, Easing, Group as TweenGroup } from '@tweenjs/tween.js'
import type { Raycast } from '../core/Raycast'
import type { Crosshair } from '../ui/Crosshair'
import { CASSETTE_SIZE, HOLD_CASSETTE_ROT, type Cassette } from '../entities/Cassette'
import type { ShelfSlot } from '../entities/ShelfSlot'
import type { Shelf } from '../entities/Shelf'
import type { Interactable } from '../entities/Interactable'
import { computeFloorPlacement, flatFloorRotation, footprintFromMesh, shelfLocalPose } from '../entities/cassettePlacement'

const MAX_STACK = 5
/** Толщина кассеты вдоль оси «назад» (локальный −Z → hold +X при HOLD_CASSETTE_ROT) */
const HELD_STACK_STEP = CASSETTE_SIZE.d * 1.05
/** Ось укладки: задняя грань кассеты в пространстве holdRoot */
const HELD_STACK_AXIS = new THREE.Vector3(0, 0, -1).applyEuler(HOLD_CASSETTE_ROT).normalize()
const _heldSlotPos = new THREE.Vector3()

/** Правый нижний угол — смещено левее/выше, чтобы была видна вся стопка */
const HOLD_POS = new THREE.Vector3(0.30, -0.18, -0.54)
const HOLD_ROT = new THREE.Euler(0.06, 0.03, 0)

export class InteractionManager {
  private readonly stack: Cassette[] = []
  private hovered: Interactable | null = null
  private readonly tweens = new TweenGroup()
  private busy = false
  private readonly holdRoot = new THREE.Object3D()
  private readonly camera: THREE.Camera
  private readonly scene: THREE.Scene
  private readonly raycast: Raycast
  private readonly crosshair: Crosshair
  private readonly cassettes: Cassette[]
  private readonly slots: ShelfSlot[]
  private readonly shelves: Shelf[]
  private onPlaced: (() => void) | null = null

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    raycast: Raycast,
    crosshair: Crosshair,
    cassettes: Cassette[],
    slots: ShelfSlot[],
    shelves: Shelf[],
  ) {
    this.camera = camera
    this.scene = scene
    this.raycast = raycast
    this.crosshair = crosshair
    this.cassettes = cassettes
    this.slots = slots
    this.shelves = shelves

    this.holdRoot.position.copy(HOLD_POS)
    this.holdRoot.rotation.copy(HOLD_ROT)
    this.camera.add(this.holdRoot)
  }

  get heldStack(): readonly Cassette[] {
    return this.stack
  }

  get hoveredTarget(): Interactable | null {
    return this.hovered
  }

  update(): void {
    this.tweens.update()
    if (this.busy) return

    const target = this.resolveTarget()
    if (this.hovered !== target) {
      this.hovered?.setHighlight(false)
      this.hovered = target
      this.hovered?.setHighlight(true)
    }
    this.crosshair.setActive(target !== null)
  }

  tryInteract(): void {
    if (this.busy) return
    const target = this.resolveTarget()
    if (!target) return

    if (target.kind === 'cassette') {
      const cassette = target as Cassette
      if (!cassette.placed && !cassette.held && this.stack.length < MAX_STACK) {
        this.pickUp(cassette)
      }
      return
    }

    if (target.kind === 'slot') {
      const top = this.stack[this.stack.length - 1]
      const slot = target as ShelfSlot
      if (top && slot.accepts(top)) {
        this.placeInSlot(slot, top)
      }
    }
  }

  /** ПКМ: верхняя кассета обратно на пол */
  tryDrop(): void {
    if (this.busy || this.stack.length === 0) return
    const cassette = this.stack.pop()!
    this.dropToFloor(cassette)
    this.relayoutStack(true)
  }

  /** Колёсико: верхняя кассета уходит вниз стопки */
  cycleStack(direction: number): void {
    if (this.busy || this.stack.length < 2 || direction === 0) return

    if (direction > 0) {
      const top = this.stack.pop()!
      this.stack.unshift(top)
    } else {
      const bottom = this.stack.shift()!
      this.stack.push(bottom)
    }
    this.relayoutStack(true)
  }

  private resolveTarget(): Interactable | null {
    const targets: Interactable[] = []

    if (this.stack.length < MAX_STACK) {
      targets.push(...this.cassettes.filter((c) => !c.held && !c.placed))
    }

    const top = this.stack[this.stack.length - 1]
    if (top) {
      targets.push(...this.slots.filter((s) => s.accepts(top)))
    }

    return this.raycast.pick(targets)
  }

  private pickUp(cassette: Cassette): void {
    this.busy = true
    cassette.held = true
    cassette.setHighlight(false)
    this.stack.push(cassette)

    cassette.mesh.updateWorldMatrix(true, false)
    const startPos = new THREE.Vector3()
    cassette.mesh.getWorldPosition(startPos)

    this.holdRoot.attach(cassette.mesh)
    cassette.mesh.position.copy(this.holdRoot.worldToLocal(startPos.clone()))

    this.relayoutStack(true, () => {
      this.busy = false
    })
  }

  private placeInSlot(slot: ShelfSlot, cassette: Cassette): void {
    this.busy = true
    this.stack.pop()
    cassette.held = false
    cassette.placed = true
    cassette.mesh.renderOrder = 0
    slot.addCassette(cassette)
    slot.setHighlight(false)

    const pose = shelfLocalPose(cassette.part)

    cassette.mesh.updateWorldMatrix(true, false)
    const startWorld = new THREE.Vector3()
    cassette.mesh.getWorldPosition(startWorld)

    this.scene.attach(cassette.mesh)
    slot.mesh.updateWorldMatrix(true, false)
    const endWorld = new THREE.Vector3()
    slot.mesh.localToWorld(endWorld.copy(pose.position))

    cassette.mesh.position.copy(startWorld)
    cassette.mesh.rotation.copy(HOLD_CASSETTE_ROT)

    new Tween(cassette.mesh.position, this.tweens)
      .to({ x: endWorld.x, y: endWorld.y, z: endWorld.z }, 220)
      .easing(Easing.Quadratic.Out)
      .onComplete(() => {
        slot.mesh.add(cassette.mesh)
        cassette.mesh.position.copy(pose.position)
        cassette.mesh.rotation.copy(pose.rotation)
        cassette.mesh.renderOrder = 10
        this.busy = false
        this.refreshShelfForSlot(slot)
        this.onPlaced?.()
      })
      .start()

    this.relayoutStack(true)
  }

  private dropToFloor(cassette: Cassette): void {
    this.busy = true
    cassette.held = false
    cassette.placed = false
    cassette.mesh.renderOrder = 0

    const dropPoint = this.getCameraFloorPoint()
    const dropX = dropPoint.x
    const dropZ = dropPoint.z
    const lookDir = new THREE.Vector3()
    this.camera.getWorldDirection(lookDir)
    const dropYaw = Math.atan2(lookDir.x, -lookDir.z)

    const placed = this.cassettes
      .filter((c) => c !== cassette && !c.held && !c.placed)
      .map((c) => footprintFromMesh(c.mesh))

    const { y: dropY, quaternion } = computeFloorPlacement(dropX, dropZ, dropYaw, placed)
    const flatRot = flatFloorRotation(dropYaw)

    cassette.mesh.updateWorldMatrix(true, false)
    const startWorld = new THREE.Vector3()
    cassette.mesh.getWorldPosition(startWorld)

    this.scene.attach(cassette.mesh)
    cassette.mesh.position.copy(startWorld)
    cassette.mesh.rotation.copy(HOLD_CASSETTE_ROT)

    const end = new THREE.Vector3(dropX, dropY, dropZ)
    const endRot = { x: flatRot.x, y: flatRot.y, z: flatRot.z }

    new Tween(cassette.mesh.position, this.tweens)
      .to({ x: end.x, y: end.y, z: end.z }, 200)
      .easing(Easing.Quadratic.Out)
      .start()

    new Tween(cassette.mesh.rotation, this.tweens)
      .to(endRot, 200)
      .easing(Easing.Quadratic.Out)
      .onComplete(() => {
        cassette.mesh.quaternion.copy(quaternion)
        this.rootAddCassette(cassette)
        this.busy = false
      })
      .start()
  }

  private rootAddCassette(cassette: Cassette): void {
    if (cassette.mesh.parent !== this.scene) {
      this.scene.attach(cassette.mesh)
    }
  }

  /** Точка на полу под прицелом камеры */
  private getCameraFloorPoint(): THREE.Vector3 {
    const origin = new THREE.Vector3()
    const dir = new THREE.Vector3()
    this.camera.getWorldPosition(origin)
    this.camera.getWorldDirection(dir)

    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    const ray = new THREE.Ray(origin, dir)

    if (ray.intersectPlane(floor, hit)) {
      const dist = hit.distanceTo(origin)
      if (dist >= 0.4 && dist <= 6) {
        return hit
      }
    }

    const flat = new THREE.Vector3(dir.x, 0, dir.z)
    if (flat.lengthSq() < 1e-6) {
      flat.set(0, 0, -1)
    } else {
      flat.normalize()
    }
    return origin.clone().addScaledVector(flat, 1.4).setY(0)
  }

  private refreshShelfForSlot(slot: ShelfSlot): void {
    const shelf = this.shelves.find((s) => s.slots.includes(slot))
    shelf?.refreshCategoryLabel()
  }

  private applyStackRotation(mesh: THREE.Mesh, _index: number): void {
    mesh.rotation.copy(HOLD_CASSETTE_ROT)
  }

  private slotLocalPos(index: number): THREE.Vector3 {
    const topIdx = this.stack.length - 1
    const depth = topIdx - index
    return _heldSlotPos.copy(HELD_STACK_AXIS).multiplyScalar(depth * HELD_STACK_STEP).clone()
  }

  private relayoutStack(animate: boolean, onComplete?: () => void): void {
    if (this.stack.length === 0) {
      onComplete?.()
      return
    }

    let pending = animate ? this.stack.length : 0
    const doneOne = () => {
      pending -= 1
      if (pending <= 0) onComplete?.()
    }

    this.stack.forEach((cassette, index) => {
      const end = this.slotLocalPos(index)
      this.applyStackRotation(cassette.mesh, index)
      cassette.mesh.renderOrder = 200 + index
      if (!animate) {
        cassette.mesh.position.copy(end)
        return
      }
      new Tween(cassette.mesh.position, this.tweens)
        .to({ x: end.x, y: end.y, z: end.z }, index === this.stack.length - 1 ? 180 : 140)
        .easing(Easing.Quadratic.Out)
        .onComplete(doneOne)
        .start()
    })

    if (!animate) onComplete?.()
  }

  setOnPlaced(fn: () => void): void {
    this.onPlaced = fn
  }
}
