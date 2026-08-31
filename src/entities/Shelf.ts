import * as THREE from 'three'
import { ShelfSlot } from './ShelfSlot'
import { createFurnitureWoodTexture } from '../env/textures'
import { createCategoryLabelTexture } from '../env/coverArt'
import { getGenre } from '../data/cassetteCatalog'
import {
  SHELF_BASE_H,
  SHELF_COL_GAP,
  SHELF_COMPARTMENT_H,
  SHELF_CROWN_H,
  SHELF_DEPTH,
  SHELF_DIVIDER_W,
  SHELF_LABEL_Y,
  SHELF_PLANK_THICK,
  SHELF_PLANK_TOP_Y,
  SHELF_SIDE_W,
  SHELF_SLOT_ROW_Y,
  SHELF_SLOT_Z,
  SHELF_TOTAL_H,
  shelfColumnXs,
  shelfHalfWidth,
  shelfSectionWidth,
} from './cassettePlacement'
import type { BoxCollider } from '../core/CollisionWorld'

export class Shelf {
  readonly root = new THREE.Group()
  readonly slots: ShelfSlot[] = []
  readonly colorIndex: number
  private labelMaterial: THREE.MeshBasicMaterial | null = null
  private categoryComplete = false

  constructor(colorIndex: number, x: number, z: number, rotationY: number) {
    this.colorIndex = colorIndex
    this.root.position.set(x, 0, z)
    this.root.rotation.y = rotationY
    this.buildFrame()
    this.buildSlots()
    this.buildInteriorLighting()
    this.buildCategoryLabel()
  }

  private buildFrame(): void {
    const woodTex = createFurnitureWoodTexture()
    const body = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xf0dcc0,
      roughness: 0.52,
      metalness: 0.02,
    })
    const light = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xf8efe0,
      roughness: 0.45,
      metalness: 0.02,
    })
    const trim = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xc4a484,
      roughness: 0.38,
      metalness: 0.03,
    })
    const dark = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x9a7858,
      roughness: 0.62,
      metalness: 0.01,
    })
    const back = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xd4c4a8,
      roughness: 0.78,
      metalness: 0,
      emissive: 0x3a3028,
      emissiveIntensity: 0.12,
    })

    const add = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material = body,
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      mesh.position.set(x, y, z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.root.add(mesh)
      return mesh
    }

    const halfW = shelfHalfWidth()
    const innerW = halfW * 2 - SHELF_SIDE_W * 2
    const halfD = SHELF_DEPTH / 2
    const midY = SHELF_TOTAL_H / 2

    // Боковины
    for (const sx of [-1, 1] as const) {
      const x = sx * (halfW - SHELF_SIDE_W / 2)
      add(SHELF_SIDE_W, SHELF_TOTAL_H, SHELF_DEPTH, x, SHELF_TOTAL_H / 2, 0, body)
      add(0.018, SHELF_TOTAL_H - 0.12, SHELF_DEPTH - 0.04, x + sx * 0.028, midY, 0.02, light)
      add(0.035, SHELF_TOTAL_H - 0.08, 0.025, x + sx * 0.04, SHELF_TOTAL_H - 0.1, halfD - 0.01, trim)
    }

    // Цоколь
    add(innerW + SHELF_SIDE_W * 2, SHELF_BASE_H, SHELF_DEPTH + 0.02, 0, SHELF_BASE_H / 2, 0.01, dark)
    add(innerW, 0.045, SHELF_DEPTH, 0, SHELF_BASE_H + 0.02, 0.02, trim)

    // Задняя стенка
    const backH = SHELF_PLANK_TOP_Y[1] + SHELF_COMPARTMENT_H - SHELF_PLANK_TOP_Y[0]
    const backY = (SHELF_PLANK_TOP_Y[0] + SHELF_PLANK_TOP_Y[1] + SHELF_COMPARTMENT_H) / 2
    add(innerW - 0.04, backH, 0.06, 0, backY, -halfD + 0.03, back)

    // Горизонтальные полки — только плоскость опоры, без передних кромок
    for (const topY of SHELF_PLANK_TOP_Y) {
      const cy = topY - SHELF_PLANK_THICK / 2
      add(innerW - 0.02, SHELF_PLANK_THICK, SHELF_DEPTH - 0.04, 0, cy, 0, body)
      add(innerW - 0.06, 0.012, SHELF_DEPTH - 0.08, 0, topY - 0.006, 0.01, light)
    }

    // Вертикальные перегородки между колонками
    const divH = SHELF_PLANK_TOP_Y[1] + SHELF_COMPARTMENT_H - SHELF_PLANK_TOP_Y[0]
    const divY = (SHELF_PLANK_TOP_Y[0] + SHELF_PLANK_TOP_Y[1] + SHELF_COMPARTMENT_H) / 2
    const divX = shelfColumnXs()[0] + shelfSectionWidth() / 2 + SHELF_COL_GAP / 2
    for (const x of [-divX, divX]) {
      add(SHELF_DIVIDER_W, divH, SHELF_DEPTH - 0.08, x, divY, 0, trim)
    }

    // Верхняя крышка + фронтон (декор только снаружи, выше кассет)
    const crownY = SHELF_PLANK_TOP_Y[1] + SHELF_COMPARTMENT_H + SHELF_CROWN_H / 2
    add(innerW + 0.04, SHELF_CROWN_H, SHELF_DEPTH + 0.02, 0, crownY, 0, body)
    add(innerW + 0.1, 0.05, SHELF_DEPTH + 0.04, 0, crownY + SHELF_CROWN_H / 2 + 0.02, 0.01, trim)
    add(innerW + 0.14, 0.028, 0.05, 0, crownY + SHELF_CROWN_H / 2 + 0.06, halfD + 0.02, light)
    add(innerW + 0.12, 0.06, 0.08, 0, crownY + SHELF_CROWN_H / 2 + 0.1, halfD + 0.04, trim)
  }

  /** Тёплая подсветка внутри ячеек — LED-полоски + мягкий point light */
  private buildInteriorLighting(): void {
    const halfD = SHELF_DEPTH / 2
    const innerW = shelfHalfWidth() * 2 - SHELF_SIDE_W * 2 - 0.1

    const stripMat = new THREE.MeshStandardMaterial({
      color: 0xfff8ee,
      emissive: 0xffd8a0,
      emissiveIntensity: 1.15,
      roughness: 0.92,
      metalness: 0,
    })

    const addLedStrip = (y: number) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.012, 0.04), stripMat)
      strip.position.set(0, y - 0.007, halfD * 0.34)
      this.root.add(strip)
    }

    for (const topY of SHELF_PLANK_TOP_Y) {
      addLedStrip(topY)
    }
    addLedStrip(SHELF_PLANK_TOP_Y[1] + SHELF_COMPARTMENT_H + SHELF_CROWN_H - 0.03)

    for (const slot of this.slots) {
      const light = new THREE.PointLight(0xfff2dc, 0.52, 1.45, 2)
      light.position.set(
        slot.mesh.position.x,
        slot.mesh.position.y + SHELF_COMPARTMENT_H * 0.4,
        slot.mesh.position.z + halfD * 0.3,
      )
      this.root.add(light)
    }
  }

  isSeriesAssigned(seriesIndex: number): boolean {
    return this.slots.some((slot) => slot.assignedSeries === seriesIndex)
  }

  private buildSlots(): void {
    const colXs = shelfColumnXs()
    for (const y of SHELF_SLOT_ROW_Y) {
      for (const x of colXs) {
        const slot = new ShelfSlot(this, this.colorIndex)
        slot.mesh.position.set(x, y, SHELF_SLOT_Z)
        this.root.add(slot.mesh)
        this.slots.push(slot)
      }
    }
  }

  private buildCategoryLabel(): void {
    const genre = getGenre(this.colorIndex)
    const tex = createCategoryLabelTexture(genre.name, false)

    const labelW = 1.35
    const labelH = 0.22
    const material = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    })
    this.labelMaterial = material
    const label = new THREE.Mesh(new THREE.PlaneGeometry(labelW, labelH), material)
    label.position.set(0, SHELF_LABEL_Y, SHELF_DEPTH / 2 + 0.02)
    this.root.add(label)
  }

  isCategoryComplete(): boolean {
    return this.slots.every((slot) => slot.isFull)
  }

  refreshCategoryLabel(): void {
    const complete = this.isCategoryComplete()
    if (complete === this.categoryComplete) return
    this.categoryComplete = complete
    if (!this.labelMaterial) return
    const genre = getGenre(this.colorIndex)
    this.labelMaterial.map = createCategoryLabelTexture(genre.name, complete)
    this.labelMaterial.needsUpdate = true
  }

  getFootprintCollider(): BoxCollider {
    const inset = new THREE.Vector3(0, 0, 0.2)
    inset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.root.rotation.y)
    return {
      cx: this.root.position.x + inset.x,
      cz: this.root.position.z + inset.z,
      halfW: shelfHalfWidth() + 0.04,
      halfD: 0.2,
      rotY: this.root.rotation.y,
    }
  }
}
