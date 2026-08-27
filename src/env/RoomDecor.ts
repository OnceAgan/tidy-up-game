import * as THREE from 'three'
import { createFurnitureWoodTexture } from './textures'

/** Декор комнаты: окно, занавески, тумба, ваза, люстра — без влияния на геймплей */
export function buildRoomDecor(parent: THREE.Group, roomSize: number, wallHeight: number): void {
  const half = roomSize / 2
  const woodTex = createFurnitureWoodTexture()
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0xffffff,
    roughness: 0.75,
  })

  addWindowWithCurtains(parent, half)
  addNightstand(parent, woodMat)
  addChandelier(parent, wallHeight)
  addBaseboards(parent, half, woodMat)
}

function addWindowWithCurtains(parent: THREE.Group, half: number): void {
  const windowGroup = new THREE.Group()
  windowGroup.position.set(-2.6, 1.7, -half + 0.12)

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d8, roughness: 0.7 })
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xa8c8e0,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.2,
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
  sill.receiveShadow = true
  windowGroup.add(sill)

  const spot = new THREE.SpotLight(0xd8e8ff, 1.4, 10, Math.PI / 5, 0.5, 1)
  spot.position.set(0, 0, 0.4)
  spot.target.position.set(0, -0.5, 2)
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

    for (let i = 0; i < 3; i++) {
      const fold = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 1.95, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xc4a880, roughness: 0.95 }),
      )
      fold.position.set(side * 0.95 + side * (i - 1) * 0.1, -0.25, 0.14)
      windowGroup.add(fold)
    }
  }

  const rod = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.05, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xb0a090, metalness: 0.4, roughness: 0.4 }),
  )
  rod.position.set(0, 0.85, 0.14)
  windowGroup.add(rod)

  parent.add(windowGroup)
}

function addNightstand(parent: THREE.Group, woodMat: THREE.Material): void {
  const group = new THREE.Group()
  group.position.set(3.55, 0, -3.55)

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.4), woodMat)
  body.position.y = 0.35
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const top = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.45), woodMat)
  top.position.y = 0.62
  top.castShadow = true
  group.add(top)

  for (const [x, z] of [
    [-0.2, -0.14],
    [0.2, -0.14],
    [-0.2, 0.14],
    [0.2, 0.14],
  ] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), woodMat)
    leg.position.set(x, 0.06, z)
    group.add(leg)
  }

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.02, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xc0a060, metalness: 0.6, roughness: 0.35 }),
  )
  handle.position.set(0, 0.38, 0.21)
  group.add(handle)

  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a9e8a, roughness: 0.35, metalness: 0.05 }),
  )
  vase.position.set(0.05, 0.75, 0)
  vase.castShadow = true
  group.add(vase)

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.8 })
  const bloomColors = [0xd4707a, 0xe8c96a, 0xd490b0]
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.28, 6), stemMat)
    stem.position.set(Math.cos(angle) * 0.03, 0.98, Math.sin(angle) * 0.03)
    stem.rotation.z = (i - 1) * 0.12
    group.add(stem)

    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshStandardMaterial({ color: bloomColors[i], roughness: 0.7 }),
    )
    bloom.position.set(Math.cos(angle) * 0.04, 1.12, Math.sin(angle) * 0.04)
    group.add(bloom)
  }

  parent.add(group)
}

function addChandelier(parent: THREE.Group, wallHeight: number): void {
  const group = new THREE.Group()
  group.position.set(0, wallHeight - 0.05, 0)

  const metal = new THREE.MeshStandardMaterial({ color: 0xb8a078, metalness: 0.65, roughness: 0.35 })
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), metal)
  chain.position.y = -0.2
  group.add(chain)

  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), metal)
  canopy.position.y = -0.02
  group.add(canopy)

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.15, 16), metal)
  body.position.y = -0.42
  body.castShadow = true
  group.add(body)

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf5ead0,
    emissive: 0xffe6b0,
    emissiveIntensity: 0.35,
    roughness: 0.6,
  })
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.025), metal)
    arm.position.set(Math.cos(a) * 0.14, -0.48, Math.sin(a) * 0.14)
    arm.rotation.y = -a
    group.add(arm)

    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.1, 12), shadeMat)
    shade.position.set(Math.cos(a) * 0.28, -0.55, Math.sin(a) * 0.28)
    group.add(shade)
  }

  const light = new THREE.PointLight(0xffe0b0, 1.15, 16, 2)
  light.position.y = -0.55
  light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
  light.shadow.bias = -0.002
  group.add(light)

  parent.add(group)
}

function addBaseboards(parent: THREE.Group, half: number, woodMat: THREE.Material): void {
  const h = 0.12
  const t = 0.04
  const boards = [
    { w: half * 2, d: t, x: 0, z: -half + t / 2 },
    { w: half * 2, d: t, x: 0, z: half - t / 2 },
    { w: t, d: half * 2, x: -half + t / 2, z: 0 },
    { w: t, d: half * 2, x: half - t / 2, z: 0 },
  ]
  for (const b of boards) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, h, b.d), woodMat)
    mesh.position.set(b.x, h / 2, b.z)
    mesh.receiveShadow = true
    parent.add(mesh)
  }
}
