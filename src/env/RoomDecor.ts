import * as THREE from 'three'
import { createFurnitureWoodTexture, createWallPictureTexture } from './textures'
import type { BoxCollider } from '../core/CollisionWorld'

export type DecorColliders = BoxCollider[]

/** Декор комнаты: окна, мебель, картины, ковёр */
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

  addWindowWithCurtains(parent, -2.4, -halfD + 0.12)
  addWindowWithCurtains(parent, 2.4, halfD - 0.12, Math.PI)
  colliders.push({ cx: -2.4, cz: -halfD + 0.38, halfW: 1.1, halfD: 0.4, rotY: 0 })
  colliders.push({ cx: 2.4, cz: halfD - 0.38, halfW: 1.1, halfD: 0.4, rotY: 0 })

  addWallPictures(parent, halfW, halfD, wallHeight)
  addRug(parent)
  addArmchair(parent, halfW - 1.3, halfD - 2.2, -0.6, colliders)
  addFloorLamp(parent, -halfW + 1.6, halfD - 2.4)
  addNightstand(parent, woodMat, halfW - 1.4, -halfD + 1.8, colliders)
  addChandelier(parent, wallHeight)
  addBaseboards(parent, halfW, halfD, woodMat)

  return colliders
}

function addWindowWithCurtains(
  parent: THREE.Group,
  x: number,
  z: number,
  rotY = 0,
): void {
  const windowGroup = new THREE.Group()
  windowGroup.position.set(x, 1.7, z)
  windowGroup.rotation.y = rotY

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d8, roughness: 0.68 })
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xa8c8e0,
    transparent: true,
    opacity: 0.42,
    roughness: 0.08,
    metalness: 0.15,
  })

  const outer = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.35, 0.08), frameMat)
  outer.castShadow = true
  windowGroup.add(outer)

  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.12, 0.03), glassMat)
  glass.position.z = 0.02
  windowGroup.add(glass)

  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.12, 0.04), frameMat)
  mullionV.position.z = 0.03
  windowGroup.add(mullionV)
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.05, 0.04), frameMat)
  mullionH.position.z = 0.03
  windowGroup.add(mullionH)

  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.22), frameMat)
  sill.position.set(0, -0.72, 0.1)
  sill.castShadow = true
  windowGroup.add(sill)

  const spot = new THREE.SpotLight(0xd8e8ff, 1.1, 12, Math.PI / 5, 0.5, 1)
  spot.position.set(0, 0, 0.35)
  spot.target.position.set(0, -0.5, 1.5)
  windowGroup.add(spot)
  windowGroup.add(spot.target)

  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0xd4b896,
    roughness: 0.95,
    side: THREE.DoubleSide,
  })
  for (const side of [-1, 1] as const) {
    const curtain = new THREE.Mesh(new THREE.BoxGeometry(0.38, 2.0, 0.04), curtainMat)
    curtain.position.set(side * 0.95, -0.25, 0.12)
    curtain.castShadow = true
    windowGroup.add(curtain)
  }

  const rod = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.05, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xb0a090, metalness: 0.45, roughness: 0.38 }),
  )
  rod.position.set(0, 0.85, 0.14)
  windowGroup.add(rod)

  parent.add(windowGroup)
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
    frame.castShadow = true
    group.add(frame)

    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(p.w, p.h),
      new THREE.MeshStandardMaterial({ map: createWallPictureTexture(p.seed), roughness: 0.85 }),
    )
    art.position.z = 0.025
    group.add(art)

    parent.add(group)
  }

  void wallHeight
}

function addRug(parent: THREE.Group): void {
  const loader = new THREE.TextureLoader()
  const rugTex = loader.load(`${import.meta.env.BASE_URL}textures/rug.jpg`)
  rugTex.colorSpace = THREE.SRGBColorSpace
  rugTex.wrapS = THREE.ClampToEdgeWrapping
  rugTex.wrapT = THREE.ClampToEdgeWrapping
  rugTex.anisotropy = 8

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

function addArmchair(
  parent: THREE.Group,
  x: number,
  z: number,
  rotY: number,
  colliders: DecorColliders,
): void {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = rotY
  const fabric = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.92 })
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.7), fabric)
  seat.position.y = 0.38
  seat.castShadow = true
  group.add(seat)
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.12), fabric)
  back.position.set(0, 0.68, -0.29)
  back.castShadow = true
  group.add(back)
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.65), fabric)
  armL.position.set(-0.33, 0.52, 0)
  group.add(armL)
  const armR = armL.clone()
  armR.position.x = 0.33
  group.add(armR)
  parent.add(group)
  colliders.push({ cx: x, cz: z, halfW: 0.42, halfD: 0.38, rotY })
}

function addFloorLamp(parent: THREE.Group, x: number, z: number): void {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8a078, metalness: 0.55, roughness: 0.4 })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.55, 8), metal)
  pole.position.y = 0.78
  pole.castShadow = true
  group.add(pole)
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 0.22, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xf5ead0,
      emissive: 0xffe0a8,
      emissiveIntensity: 0.25,
      roughness: 0.7,
      side: THREE.DoubleSide,
    }),
  )
  shade.position.y = 1.52
  group.add(shade)
  const light = new THREE.PointLight(0xffe8c0, 0.55, 5, 2)
  light.position.y = 1.45
  group.add(light)
  parent.add(group)
}

function addNightstand(
  parent: THREE.Group,
  woodMat: THREE.Material,
  x: number,
  z: number,
  colliders: DecorColliders,
): void {
  const group = new THREE.Group()
  group.position.set(x, 0, z)

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.4), woodMat)
  body.position.y = 0.35
  body.castShadow = true
  group.add(body)

  const top = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.45), woodMat)
  top.position.y = 0.62
  group.add(top)

  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.24, 12),
    new THREE.MeshStandardMaterial({ color: 0x7a9480, roughness: 0.32 }),
  )
  vase.position.set(0.05, 0.76, 0)
  vase.castShadow = true
  group.add(vase)

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.8 })
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.3, 6), stemMat)
    stem.position.set(Math.cos(angle) * 0.03, 1.0, Math.sin(angle) * 0.03)
    group.add(stem)
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: [0xd4707a, 0xe8c96a, 0xd490b0][i], roughness: 0.7 }),
    )
    bloom.position.set(Math.cos(angle) * 0.04, 1.14, Math.sin(angle) * 0.04)
    group.add(bloom)
  }

  parent.add(group)
  colliders.push({ cx: x, cz: z, halfW: 0.36, halfD: 0.32, rotY: 0 })
}

function addChandelier(parent: THREE.Group, wallHeight: number): void {
  const group = new THREE.Group()
  group.position.set(0, wallHeight - 0.05, 0)

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
    emissiveIntensity: 0.35,
    roughness: 0.6,
  })
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.1, 12), shadeMat)
    shade.position.set(Math.cos(a) * 0.28, -0.55, Math.sin(a) * 0.28)
    group.add(shade)
  }

  const light = new THREE.PointLight(0xffe0b0, 1.1, 22, 1.8)
  light.position.y = -0.55
  light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
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
