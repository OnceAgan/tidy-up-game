import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createBoostBoardTexture } from './coverArt'
import { createWallPictureTexture } from './textures'
import { addWindows } from './windowAssembly'
import { addChandelierFixture } from './chandelier'
import { addCeilingArchitecture } from './ceilingArchitecture'
import type { BoxCollider } from '../core/CollisionWorld'

export type DecorColliders = BoxCollider[]

/** Декор комнаты: картины, ковёр, свет, плинтусы */
export function buildRoomDecor(
  parent: THREE.Group,
  roomWidth: number,
  roomDepth: number,
  wallHeight: number,
  wallThickness = 0.2,
): DecorColliders {
  const halfW = roomWidth / 2
  const halfD = roomDepth / 2
  const colliders: DecorColliders = []

  addWallPictures(parent, halfD, wallHeight)
  addBoostBoard(parent, halfD)
  addWindows(parent, [
    { x: -2.4, z: -halfD + 0.11, rotY: 0 },
    { x: 2.4, z: halfD - 0.11, rotY: Math.PI },
  ])
  addRug(parent)
  addCeilingLights(parent, wallHeight)
  addCeilingArchitecture(parent, roomWidth, roomDepth, wallHeight)
  addBaseboards(parent, halfW - wallThickness / 2, halfD - wallThickness / 2)

  return colliders
}

function addWallPictures(parent: THREE.Group, halfD: number, wallHeight: number): void {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8a7358, roughness: 0.55, metalness: 0.1 })
  const placements: Array<{ x: number; z: number; ry: number; seed: number; w: number; h: number; py: number }> = [
    { x: 3.4, z: -halfD + 0.11, ry: 0, seed: 0, w: 0.9, h: 0.65, py: 1.85 },
    { x: -3.8, z: halfD - 0.11, ry: Math.PI, seed: 1, w: 0.7, h: 0.95, py: 2.05 },
    { x: -0.8, z: -halfD + 0.11, ry: 0, seed: 2, w: 1.0, h: 0.7, py: 1.75 },
    { x: 0.6, z: halfD - 0.11, ry: Math.PI, seed: 3, w: 0.75, h: 0.75, py: 1.95 },
    { x: 3.9, z: halfD - 0.11, ry: Math.PI, seed: 4, w: 0.85, h: 0.6, py: 2.1 },
  ]

  for (const p of placements) {
    const group = new THREE.Group()
    group.position.set(p.x, p.py, p.z)
    group.rotation.y = p.ry

    const frame = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.1, p.h + 0.1, 0.04), frameMat)
    frame.castShadow = false
    group.add(frame)

    const artMat = new THREE.MeshStandardMaterial({ roughness: 0.85 })
    artMat.map = createWallPictureTexture(p.seed, (tex) => {
      artMat.map = tex
      artMat.needsUpdate = true
    })
    const art = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), artMat)
    art.position.z = 0.025
    group.add(art)

    parent.add(group)
  }

  void wallHeight
}

function addBoostBoard(parent: THREE.Group, halfD: number): void {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.6 })
  const boardW = 0.95
  const boardH = 1.2
  const group = new THREE.Group()
  group.position.set(1.5, 1.65, -halfD + 0.11)
  group.rotation.y = 0

  const frame = new THREE.Mesh(new THREE.BoxGeometry(boardW + 0.08, boardH + 0.08, 0.05), frameMat)
  group.add(frame)

  const boardMat = new THREE.MeshStandardMaterial({ roughness: 0.9 })
  boardMat.map = createBoostBoardTexture()
  const board = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), boardMat)
  board.position.z = 0.028
  group.add(board)

  parent.add(group)
  void halfD
}

function addRug(parent: THREE.Group): void {
  const loader = new THREE.TextureLoader()
  const rugTex = loader.load(`${import.meta.env.BASE_URL}textures/rug.jpg`)
  rugTex.colorSpace = THREE.SRGBColorSpace
  rugTex.wrapS = THREE.ClampToEdgeWrapping
  rugTex.wrapT = THREE.ClampToEdgeWrapping
  rugTex.anisotropy = 4

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 5.4),
    new THREE.MeshStandardMaterial({
      map: rugTex,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  )
  rug.rotation.x = -Math.PI / 2
  rug.position.set(0, 0.018, 6.8)
  rug.receiveShadow = true
  parent.add(rug)
}

function addCeilingLights(parent: THREE.Group, wallHeight: number): void {
  const fixtures: Array<[number, number]> = [
    [0, 0],
    [-2.8, -5.5],
    [2.8, 5.5],
  ]
  for (const [x, z] of fixtures) {
    addChandelierFixture(parent, wallHeight, x, z)
  }
}

function addBaseboards(
  parent: THREE.Group,
  halfW: number,
  halfD: number,
): void {
  const pieces: THREE.BufferGeometry[] = []
  // Painted timber profile: toe, tall flat face, stepped cap and narrow top bead.
  for (const [y, h, depth] of [[0.018, 0.036, 0.07], [0.093, 0.114, 0.046],
    [0.154, 0.014, 0.058], [0.168, 0.014, 0.036]]) {
    const boards = [
      { w: halfW * 2, d: depth, x: 0, z: -halfD + depth / 2 },
      { w: halfW * 2, d: depth, x: 0, z: halfD - depth / 2 },
      { w: depth, d: halfD * 2 - depth * 2, x: -halfW + depth / 2, z: 0 },
      { w: depth, d: halfD * 2 - depth * 2, x: halfW - depth / 2, z: 0 },
    ]
    for (const b of boards) pieces.push(new THREE.BoxGeometry(b.w, h, b.d).translate(b.x, y, b.z))
  }
  const geometry = mergeGeometries(pieces)!
  for (const piece of pieces) piece.dispose()
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xddd1bb, roughness: 0.6 }))
  mesh.name = 'perimeter-baseboards'
  mesh.receiveShadow = true
  parent.add(mesh)
}
