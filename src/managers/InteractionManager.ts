import * as THREE from 'three'
import { Tween, Easing, Group as TweenGroup } from '@tweenjs/tween.js'
import type { Raycast } from '../core/Raycast'
import type { Crosshair } from '../ui/Crosshair'
import { CASSETTE_SIZE, type Cassette } from '../entities/Cassette'
import type { ShelfSlot } from '../entities/ShelfSlot'
import type { Interactable } from '../entities/Interactable'

const MAX_STACK = 5
const STACK_STEP = CASSETTE_SIZE.d + 0.008

/** Стопка справа внизу, ракурс ¾ — виден торец и верх */
const HOLD_POS = new THREE.Vector3(0.32, -0.26, -0.52)
const HOLD_ROT = new THREE.Euler(-0.5, 0.95, 0.18)

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
  private onPlaced: (() => void) | null = null

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    raycast: Raycast,
    crosshair: Crosshair,
    cassettes: Cassette[],
    slots: ShelfSlot[],
  ) {
    this.camera = camera
    this.scene = scene
    this.raycast = raycast
    this.crosshair = crosshair
    this.cassettes = cassettes
    this.slots = slots

    this.holdRoot.position.copy(HOLD_POS)
    this.holdRoot.rotation.copy(HOLD_ROT)
    this.camera.add(this.holdRoot)
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
    // лежат плашмя в стопке: торец (тонкая грань) смотрит «на камеру» стопки
    cassette.mesh.rotation.set(Math.PI / 2, 0, 0)

    const index = this.stack.length - 1
    const end = this.slotLocalPos(index)

    // чуть пододвинуть уже лежащие в стопке
    for (let i = 0; i < index; i++) {
      const pos = this.slotLocalPos(i)
      const mesh = this.stack[i].mesh
      new Tween(mesh.position, this.tweens)
        .to({ x: pos.x, y: pos.y, z: pos.z }, 140)
        .easing(Easing.Quadratic.Out)
        .start()
    }

    new Tween(cassette.mesh.position, this.tweens)
      .to({ x: end.x, y: end.y, z: end.z }, 180)
      .easing(Easing.Quadratic.Out)
      .onComplete(() => {
        this.busy = false
      })
      .start()
  }

  private placeInSlot(slot: ShelfSlot, cassette: Cassette): void {
    this.busy = true
    this.stack.pop()
    cassette.held = false
    cassette.placed = true
    slot.cassette = cassette
    slot.setHighlight(false)

    cassette.mesh.updateWorldMatrix(true, false)
    const startWorld = new THREE.Vector3()
    cassette.mesh.getWorldPosition(startWorld)

    this.scene.attach(cassette.mesh)
    slot.mesh.updateWorldMatrix(true, false)
    const endWorld = new THREE.Vector3()
    slot.mesh.getWorldPosition(endWorld)

    cassette.mesh.position.copy(startWorld)
    cassette.mesh.rotation.set(0, 0, 0)

    new Tween(cassette.mesh.position, this.tweens)
      .to({ x: endWorld.x, y: endWorld.y, z: endWorld.z }, 220)
      .easing(Easing.Quadratic.Out)
      .onComplete(() => {
        slot.mesh.add(cassette.mesh)
        cassette.mesh.position.set(0, 0, 0)
        cassette.mesh.rotation.set(0, 0, 0)
        this.busy = false
        this.onPlaced?.()
      })
      .start()

    this.relayoutStack(true)
  }

  private slotLocalPos(index: number): THREE.Vector3 {
    // лёгкий сдвиг, чтобы стопка читалась
    const wobble = (index % 2 === 0 ? 1 : -1) * 0.004 * index
    return new THREE.Vector3(wobble, index * STACK_STEP, wobble * 0.5)
  }

  private relayoutStack(animate: boolean): void {
    this.stack.forEach((cassette, index) => {
      const end = this.slotLocalPos(index)
      cassette.mesh.rotation.set(Math.PI / 2, 0, 0)
      if (!animate) {
        cassette.mesh.position.copy(end)
        return
      }
      new Tween(cassette.mesh.position, this.tweens)
        .to({ x: end.x, y: end.y, z: end.z }, 140)
        .easing(Easing.Quadratic.Out)
        .start()
    })
  }

  setOnPlaced(fn: () => void): void {
    this.onPlaced = fn
  }
}
