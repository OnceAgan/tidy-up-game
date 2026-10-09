import * as THREE from 'three'
import { Interactable } from '../entities/Interactable'

export class HorrorTarget extends Interactable {
  readonly kind: 'switch' | 'sand'
  readonly mesh: THREE.Mesh
  private readonly highlightMaterial: THREE.MeshStandardMaterial

  constructor(kind: 'switch' | 'sand', mesh: THREE.Mesh, highlightMaterial: THREE.MeshStandardMaterial) {
    super()
    this.kind = kind
    this.mesh = mesh
    this.highlightMaterial = highlightMaterial
    mesh.userData.interactable = this
  }

  protected applyHighlight(on: boolean): void {
    this.highlightMaterial.emissive.setHex(on ? 0x68563c : 0x000000)
    this.highlightMaterial.emissiveIntensity = on ? 0.3 : 0
  }
}

function warningTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 230
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 1024, 230)
  ctx.font = 'bold 72px "Segoe Print", cursive'
  ctx.fillStyle = '#741014'
  ctx.textAlign = 'center'
  ctx.fillText('не поворачивай тумблер', 512, 110, 940)
  ctx.strokeStyle = '#741014'
  ctx.lineWidth = 3
  for (let i = 0; i < 17; i++) {
    const x = 75 + i * 53
    ctx.beginPath()
    ctx.moveTo(x, 90 + (i % 3) * 10)
    ctx.quadraticCurveTo(x - 2, 130, x + Math.sin(i) * 3, 132 + (i % 5) * 13)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function buildForbiddenSwitch(parent: THREE.Group): { target: HorrorTarget; lever: THREE.Group } {
  const group = new THREE.Group()
  group.name = 'forbidden-switch'
  group.position.set(-4.865, 0, 6.4)
  group.rotation.y = Math.PI / 2
  parent.add(group)
  const metal = new THREE.MeshStandardMaterial({ color: 0xaaa69b, metalness: 0.25, roughness: 0.48 })
  const black = new THREE.MeshStandardMaterial({ color: 0x181b17, roughness: 0.4 })
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    group.add(mesh)
    return mesh
  }
  add(new THREE.BoxGeometry(0.78, 0.7, 0.035), black, 0, 1.7, 0)
  const image = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}textures/forbidden-switch.png`)
  image.colorSpace = THREE.SRGBColorSpace
  add(new THREE.PlaneGeometry(0.72, 0.64), new THREE.MeshStandardMaterial({ map: image, roughness: 0.95 }), 0, 1.7, 0.02)
  add(new THREE.PlaneGeometry(1.45, 0.33), new THREE.MeshStandardMaterial({
    map: warningTexture(), transparent: true, depthWrite: false, roughness: 1 }), 0, 2.23, 0.01)
  add(new THREE.BoxGeometry(0.25, 0.34, 0.04), metal, 0, 1.05, 0.025)
  for (const x of [-0.095, 0.095]) for (const y of [0.915, 1.185]) {
    add(new THREE.SphereGeometry(0.009, 8, 6), black, x, y, 0.052)
  }
  const socket = add(new THREE.CylinderGeometry(0.046, 0.046, 0.04, 20), metal, 0, 1.05, 0.055)
  socket.rotation.x = Math.PI / 2
  const lever = new THREE.Group()
  lever.position.set(0, 1.05, 0.095)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.115, 12), metal)
  stem.position.y = 0.052
  const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.023, 0.075, 4, 12), black)
  grip.position.y = 0.135
  lever.add(stem, grip)
  group.add(lever)
  const hit = add(new THREE.BoxGeometry(0.28, 0.4, 0.2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 0, 1.05, 0.09)
  return { target: new HorrorTarget('switch', hit, metal), lever }
}

export function buildSandMound(parent: THREE.Group): HorrorTarget {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#a08a62'
  ctx.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = i % 2 ? '#c0aa7b' : '#766344'
    ctx.fillRect((i * 37) % 128, (i * 73 + Math.floor(i / 128) * 11) % 128, 1, 1)
  }
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.set(4, 4)
  const geometry = new THREE.SphereGeometry(0.53, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  geometry.scale(1, 0.48, 1)
  const p = geometry.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i)
    p.setY(i, p.getY(i) * (1 + 0.1 * Math.sin(x * 24) * Math.cos(z * 18)))
  }
  geometry.computeVertexNormals()
  const material = new THREE.MeshStandardMaterial({ color: 0xc6b287, map, roughness: 1 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(1.25, 0.028, -2)
  mesh.name = 'horror-sand'
  mesh.receiveShadow = true
  mesh.visible = false
  parent.add(mesh)
  return new HorrorTarget('sand', mesh, material)
}
