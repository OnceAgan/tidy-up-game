import * as THREE from 'three'
import { createFurnitureWoodTexture, createWallPictureTexture } from './textures'
import type { BoxCollider } from '../core/CollisionWorld'

export type DecorColliders = BoxCollider[]

/** Декор комнаты: картины, ковёр, свет, плинтусы */
export function buildRoomDecor(
  parent: THREE.Group,
  roomWidth: number,
  roomDepth: number,
  wallHeight: number,
): DecorColliders {
  const halfW = roomWidth / 2
  const halfD = roomDepth / 2
  const woodTex = createFurnitureWoodTexture()
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0xffffff,
    roughness: 0.72,
  })
  const colliders: DecorColliders = []

  addWallPictures(parent, halfW, halfD, wallHeight)
  addWindowPosters(parent, halfD)
  addRug(parent)
  addCeilingLights(parent, wallHeight)
  addBaseboards(parent, halfW, halfD, woodMat)

  return colliders
}

function addWallPictures(parent: THREE.Group, halfW: number, halfD: number, wallHeight: number): void {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8a7358, roughness: 0.55, metalness: 0.1 })
  const placements: Array<{ x: number; z: number; ry: number; seed: number; w: number; h: number; py: number }> = [
    { x: -halfW + 0.11, z: -3.5, ry: Math.PI / 2, seed: 0, w: 0.9, h: 0.65, py: 1.85 },
    { x: -halfW + 0.11, z: 4.2, ry: Math.PI / 2, seed: 1, w: 0.7, h: 0.95, py: 2.05 },
    { x: halfW - 0.11, z: -2.0, ry: -Math.PI / 2, seed: 2, w: 1.0, h: 0.7, py: 1.75 },
    { x: halfW - 0.11, z: 5.5, ry: -Math.PI / 2, seed: 3, w: 0.75, h: 0.75, py: 1.95 },
    { x: 1.2, z: -halfD + 0.11, ry: 0, seed: 4, w: 0.85, h: 0.6, py: 2.1 },
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

/** Превью: окно как картинка на стене (2D-текстура) */
function addWindowPosters(parent: THREE.Group, halfD: number): void {
  const url = `${import.meta.env.BASE_URL}textures/window-curtains.jpg`
  const tex = new THREE.TextureLoader().load(url)
  tex.colorSpace = THREE.SRGBColorSpace

  const width = 1.85
  const height = width * (875 / 1024)
  const centerY = 1.62

  const mat = new THREE.MeshBasicMaterial({ map: tex })
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8a7358, roughness: 0.55, metalness: 0.1 })

  const placements: Array<{ x: number; z: number; rotY: number }> = [
    { x: -2.4, z: -halfD + 0.11, rotY: 0 },
    { x: 2.4, z: halfD - 0.11, rotY: Math.PI },
  ]

  for (const p of placements) {
    const group = new THREE.Group()
    group.position.set(p.x, centerY, p.z)
    group.rotation.y = p.rotY

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.1, height + 0.1, 0.04),
      frameMat,
    )
    frame.position.z = -0.02
    frame.castShadow = false
    group.add(frame)

    const poster = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat)
    poster.position.z = 0.025
    group.add(poster)

    parent.add(group)
  }
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
  rug.position.set(0, 0.018, 1.2)
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

function addChandelierFixture(
  parent: THREE.Group,
  wallHeight: number,
  x: number,
  z: number,
): void {
  const group = new THREE.Group()
  group.position.set(x, wallHeight - 0.05, z)

  const metal = new THREE.MeshStandardMaterial({ color: 0xb8a078, metalness: 0.65, roughness: 0.35 })
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), metal)
  chain.position.y = -0.2
  group.add(chain)

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.15, 16), metal)
  body.position.y = -0.42
  group.add(body)

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf5ead0,
    emissive: 0xffe6b0,
    emissiveIntensity: 0.4,
    roughness: 0.6,
  })
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.1, 12), shadeMat)
    shade.position.set(Math.cos(a) * 0.28, -0.55, Math.sin(a) * 0.28)
    group.add(shade)
  }

  const light = new THREE.PointLight(0xffe0b0, 0.9, 20, 1.7)
  light.position.y = -0.55
  if (x === 0 && z === 0) {
    light.castShadow = true
    light.shadow.mapSize.set(1024, 1024)
  }
  group.add(light)

  parent.add(group)
}

function addBaseboards(
  parent: THREE.Group,
  halfW: number,
  halfD: number,
  woodMat: THREE.Material,
): void {
  const h = 0.12
  const t = 0.04
  const boards = [
    { w: halfW * 2, d: t, x: 0, z: -halfD + t / 2 },
    { w: halfW * 2, d: t, x: 0, z: halfD - t / 2 },
    { w: t, d: halfD * 2, x: -halfW + t / 2, z: 0 },
    { w: t, d: halfD * 2, x: halfW - t / 2, z: 0 },
  ]
  for (const b of boards) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, h, b.d), woodMat)
    mesh.position.set(b.x, h / 2, b.z)
    mesh.receiveShadow = true
    parent.add(mesh)
  }
}
