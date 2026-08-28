import * as THREE from 'three'
import { Tween, Easing, Group as TweenGroup } from '@tweenjs/tween.js'
import type { Raycast } from '../core/Raycast'
import type { Crosshair } from '../ui/Crosshair'
import { CASSETTE_SIZE, HOLD_CASSETTE_ROT, type Cassette } from '../entities/Cassette'
import type { ShelfSlot } from '../entities/ShelfSlot'
import type { Interactable } from '../entities/Interactable'

const MAX_STACK = 5
/** Вертикальная стопка торцами к камере */
const STACK_STEP = CASSETTE_SIZE.h * 0.9

const HOLD_POS = new THREE.Vector3(0.46, -0.08, -0.58)
const HOLD_ROT = new THREE.Euler(-0.1, -0.72, 0.05)

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
    this.applyStackRotation(cassette.mesh)

    const index = this.stack.length - 1
    const end = this.slotLocalPos(index)

    for (let i = 0; i < index; i++) {
      const pos = this.slotLocalPos(i)
      const mesh = this.stack[i].mesh
      this.applyStackRotation(mesh)
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

  private applyStackRotation(mesh: THREE.Mesh): void {
    mesh.rotation.copy(HOLD_CASSETTE_ROT)
  }

  private slotLocalPos(index: number): THREE.Vector3 {
    const side = index % 2 === 0 ? 1 : -1
    return new THREE.Vector3(side * 0.016 * index, index * STACK_STEP, index * 0.028)
  }

  private relayoutStack(animate: boolean): void {
    this.stack.forEach((cassette, index) => {
      const end = this.slotLocalPos(index)
      this.applyStackRotation(cassette.mesh)
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
