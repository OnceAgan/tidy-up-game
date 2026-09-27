import * as THREE from 'three'
import { roomTextureUrl } from '../data/roomTextureFiles'
import { WINDOW_CENTER_Y, WINDOW_HEIGHT, WINDOW_WIDTH } from './roomWalls'
import { type WindowPlacement } from './loadWindowModel'

const FRAME_BAR = 0.085
const FRAME_DEPTH = 0.11
const CURTAIN_W = 0.36
const CURTAIN_H = WINDOW_HEIGHT + 0.55

let windowViewTexture: THREE.Texture | null = null

function getWindowViewTexture(): THREE.Texture {
  if (!windowViewTexture) {
    windowViewTexture = new THREE.TextureLoader().load(
      roomTextureUrl('window-curtains.jpg'),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
      },
    )
  }
  return windowViewTexture
}

function addBox(
  group: THREE.Group,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = false
  mesh.receiveShadow = true
  group.add(mesh)
}

function createProceduralWindowAssembly(): THREE.Group {
  const group = new THREE.Group()

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xf2e8d8,
    roughness: 0.58,
    metalness: 0.02,
  })
  const sillMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6d8,
    roughness: 0.68,
  })
  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x2a2420,
    roughness: 0.95,
  })
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0xd8c8b0,
    roughness: 0.96,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  })
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0xb0a090,
    metalness: 0.5,
    roughness: 0.38,
  })

  const halfW = WINDOW_WIDTH / 2
  const halfH = WINDOW_HEIGHT / 2
  const frameZ = FRAME_DEPTH / 2

  const recess = new THREE.Mesh(
    new THREE.PlaneGeometry(WINDOW_WIDTH + 0.08, WINDOW_HEIGHT + 0.08),
    recessMat,
  )
  recess.position.z = -0.05
  group.add(recess)

  const view = new THREE.Mesh(
    new THREE.PlaneGeometry(WINDOW_WIDTH, WINDOW_HEIGHT),
    new THREE.MeshBasicMaterial({ map: getWindowViewTexture() }),
  )
  view.position.z = -0.02
  group.add(view)

  addBox(group, WINDOW_WIDTH + FRAME_BAR * 2, FRAME_BAR, FRAME_DEPTH, 0, halfH + FRAME_BAR / 2, frameZ, frameMat)
  addBox(group, FRAME_BAR, WINDOW_HEIGHT, FRAME_DEPTH, -halfW - FRAME_BAR / 2, 0, frameZ, frameMat)
  addBox(group, FRAME_BAR, WINDOW_HEIGHT, FRAME_DEPTH, halfW + FRAME_BAR / 2, 0, frameZ, frameMat)

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(WINDOW_WIDTH - 0.04, WINDOW_HEIGHT - 0.04),
    new THREE.MeshPhysicalMaterial({
      color: 0xe8f4ff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.06,
      metalness: 0.05,
      transmission: 0.88,
      thickness: 0.02,
      ior: 1.45,
    }),
  )
  glass.position.z = 0.055
  group.add(glass)

  for (const side of [-1, 1] as const) {
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(CURTAIN_W, CURTAIN_H), curtainMat)
    curtain.position.set(side * (halfW + CURTAIN_W * 0.42), -0.08, 0.075)
    curtain.rotation.y = side * -0.14
    group.add(curtain)
  }

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, WINDOW_WIDTH + 0.7, 10), rodMat)
  rod.rotation.z = Math.PI / 2
  rod.position.set(0, halfH + 0.22, 0.09)
  group.add(rod)

  addBox(group, WINDOW_WIDTH + 0.38, 0.07, 0.2, 0, -halfH - 0.06, 0.1, sillMat)

  const daylight = new THREE.PointLight(0xfff4e0, 0.42, 7, 1.6)
  daylight.position.set(0, 0.1, 0.35)
  group.add(daylight)

  return group
}

function addProceduralWindows(parent: THREE.Group, placements: WindowPlacement[]): void {
  for (const p of placements) {
    const windowGroup = createProceduralWindowAssembly()
    windowGroup.position.set(p.x, WINDOW_CENTER_Y, p.z)
    windowGroup.rotation.y = p.rotY
    parent.add(windowGroup)
  }
}

export function addWindows(parent: THREE.Group, placements: WindowPlacement[]): void {
  addProceduralWindows(parent, placements)
}
