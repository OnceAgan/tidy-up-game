import * as THREE from 'three'
import { Interactable } from './Interactable'
import { createCoverTexture, createSpineTexture } from '../env/coverArt'

export const CASSETTE_SIZE = { w: 0.32, h: 0.51, d: 0.068 }

export const CASSETTE_COLORS = [
  0xc45c4a,
  0x3d5a80,
  0x4a7c59,
  0xc9a227,
  0x8b5a9e,
  0xd4783a,
] as const

export class Cassette extends Interactable {
  readonly kind = 'cassette' as const
  readonly genreId: number
  readonly colorIndex: number
  readonly title: string
  readonly indexInGenre: number
  readonly mesh: THREE.Mesh
  private readonly coverMaterial: THREE.MeshStandardMaterial
  private readonly spineMaterial: THREE.MeshStandardMaterial
  private readonly materials: THREE.MeshStandardMaterial[]
  held = false
  placed = false

  constructor(genreId: number, title: string, indexInGenre: number) {
    super()
    this.genreId = genreId
    this.colorIndex = genreId
    this.title = title
    this.indexInGenre = indexInGenre

    const coverTex = createCoverTexture(title, genreId, indexInGenre)
    const spineTex = createSpineTexture(title, genreId, indexInGenre)

    this.coverMaterial = new THREE.MeshStandardMaterial({
      map: coverTex,
      roughness: 0.55,
      metalness: 0.02,
    })

    this.spineMaterial = new THREE.MeshStandardMaterial({
      map: spineTex,
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.02,
    })

    const backMaterial = new THREE.MeshStandardMaterial({
      map: coverTex,
      roughness: 0.55,
      metalness: 0.02,
    })

    const top = new THREE.MeshStandardMaterial({
      color: 0xe8e2d6,
      roughness: 0.55,
    })
    const bottom = new THREE.MeshStandardMaterial({
      color: 0xe0dace,
      roughness: 0.6,
    })

    // +X, -X, +Y, -Y, +Z (лицевая), -Z (задняя)
    this.materials = [this.spineMaterial, this.spineMaterial, top, bottom, this.coverMaterial, backMaterial]

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(CASSETTE_SIZE.w, CASSETTE_SIZE.h, CASSETTE_SIZE.d),
      this.materials,
    )
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.userData.interactable = this

    const lipMat = new THREE.MeshStandardMaterial({ color: 0xf2ede4, roughness: 0.45 })
    const lipT = 0.006
    const hw = CASSETTE_SIZE.w / 2
    const hh = CASSETTE_SIZE.h / 2
    const hd = CASSETTE_SIZE.d / 2
    const lips: Array<[number, number, number, number, number, number]> = [
      [CASSETTE_SIZE.w + lipT * 2, lipT, lipT, 0, hh - lipT / 2, hd + lipT / 2],
      [CASSETTE_SIZE.w + lipT * 2, lipT, lipT, 0, -hh + lipT / 2, hd + lipT / 2],
      [lipT, CASSETTE_SIZE.h, lipT, hw - lipT / 2, 0, hd + lipT / 2],
      [-lipT, CASSETTE_SIZE.h, lipT, -hw + lipT / 2, 0, hd + lipT / 2],
    ]
    for (const [lw, lh, ld, lx, ly, lz] of lips) {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, ld), lipMat)
      lip.position.set(lx, ly, lz)
      this.mesh.add(lip)
    }
  }

  protected applyHighlight(on: boolean): void {
    const emissive = on ? 0x443322 : 0x000000
    const intensity = on ? 0.35 : 0
    this.coverMaterial.emissive.setHex(emissive)
    this.coverMaterial.emissiveIntensity = intensity
    this.spineMaterial.emissive.setHex(on ? 0x222211 : 0x000000)
    this.spineMaterial.emissiveIntensity = on ? 0.25 : 0
  }
}

/** Поворот в руках: торец смотрит на камеру */
export const HOLD_CASSETTE_ROT = new THREE.Euler(0, -Math.PI / 2, 0)
