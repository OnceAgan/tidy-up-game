import * as THREE from 'three'
import type { AudioManager } from '../audio/AudioManager'
import type { Player } from '../entities/Player'
import type { Interactable } from '../entities/Interactable'
import { Spider } from '../entities/Spider'
import { buildForbiddenSwitch, buildSandMound, type HorrorTarget } from '../env/horrorProps'
import { resolveMovement, type BoxCollider } from '../core/CollisionWorld'

export type HorrorPhase = 'idle' | 'flicker' | 'sand' | 'swarm' | 'merge' | 'giant' | 'scare' | 'fall' | 'ended'
type HorrorCallbacks = { onCinematic: () => void; onFade: (opacity: number) => void; onFinished: () => void }
const DARK_BRIGHTNESS = 1.15

export class HorrorManager {
  readonly targets: Interactable[] = []
  private phase: HorrorPhase = 'idle'
  private time = 0
  private animationTime = 0
  private readonly switchTarget: HorrorTarget
  private readonly sand: HorrorTarget
  private readonly lever: THREE.Group
  private readonly spiders: Spider[] = []
  private readonly wanderers: Array<{ heading: number; speed: number; turnAt: number }> = []
  private readonly giant = new Spider()
  private readonly swarmRoot = new THREE.Group()
  private readonly mergePoint = new THREE.Vector3()
  private readonly mergeStarts: THREE.Vector3[] = []
  private readonly lights: Array<{ light: THREE.Light; intensity: number; central: boolean }> = []
  private readonly emissives = new Map<THREE.MeshStandardMaterial, number>()
  private readonly strips = new Map<THREE.MeshBasicMaterial, THREE.Color>()
  private readonly originalBackground: THREE.Color | THREE.Texture | null
  private readonly originalFog: THREE.Fog | THREE.FogExp2 | null
  private readonly scareLight = new THREE.PointLight(0xd4cbb8, 0, 6, 2)
  private readonly sandLight = new THREE.SpotLight(0xffd7a0, 0, 2.2, Math.PI / 5, 0.85, 2)
  private fallStartHeight = 1.6

  constructor(privateScene: THREE.Scene, privateRoot: THREE.Group, privateCamera: THREE.Camera,
    privatePlayer: Player, privateAudio: AudioManager, privateColliders: readonly BoxCollider[], privateCallbacks: HorrorCallbacks) {
    this.scene = privateScene; this.root = privateRoot; this.camera = privateCamera
    this.player = privatePlayer; this.audio = privateAudio; this.colliders = privateColliders; this.callbacks = privateCallbacks
    this.originalBackground = this.scene.background
    this.originalFog = this.scene.fog
    this.root.traverse(object => {
      if (object instanceof THREE.Light) {
        const fixture = object.parent
        this.lights.push({ light: object, intensity: object.intensity,
          central: object.userData.chandelier === true && fixture?.position.x === 0 && fixture?.position.z === 0 })
      }
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial && material.emissiveIntensity > 0 &&
            (material.emissive.r + material.emissive.g + material.emissive.b) > 0) this.emissives.set(material, material.emissiveIntensity)
          if (material instanceof THREE.MeshBasicMaterial && !material.map) this.strips.set(material, material.color.clone())
        }
      }
    })
    const props = buildForbiddenSwitch(this.root)
    this.switchTarget = props.target
    this.lever = props.lever
    this.sand = buildSandMound(this.root)
    this.sandLight.position.copy(this.sand.mesh.position).add(new THREE.Vector3(0, 1, 0))
    this.sandLight.target = this.sand.mesh
    this.root.add(this.sandLight)
    this.swarmRoot.name = 'horror-spiders'
    for (let i = 0; i < 10; i++) {
      const spider = new Spider()
      this.spiders.push(spider)
      this.wanderers.push({ heading: 0, speed: 0, turnAt: 0 })
      this.swarmRoot.add(spider.root)
    }
    this.swarmRoot.add(this.giant.root)
    this.root.add(this.swarmRoot)
    this.scareLight.position.set(0, 0, -0.3)
    this.camera.add(this.scareLight)
    this.reset()
  }

  private readonly scene: THREE.Scene
  private readonly root: THREE.Group
  private readonly camera: THREE.Camera
  private readonly player: Player
  private readonly audio: AudioManager
  private readonly colliders: readonly BoxCollider[]
  private readonly callbacks: HorrorCallbacks

  get currentPhase(): HorrorPhase { return this.phase }
  get isActive(): boolean { return this.phase !== 'idle' }
  get isCinematic(): boolean { return this.phase === 'scare' || this.phase === 'fall' || this.phase === 'ended' }

  tryInteract(target: Interactable): void {
    if (target === this.switchTarget && this.phase === 'idle') {
      this.audio.playScrape()
      this.audio.suspendMusic(true)
      this.targets.length = 0
      this.switchTarget.setHighlight(false)
      this.enter('flicker')
    } else if (target === this.sand && this.phase === 'sand') {
      this.targets.length = 0
      this.sand.setHighlight(false)
      this.spiders.forEach((spider, i) => {
        this.wanderers[i] = {
          heading: i / this.spiders.length * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
          speed: 1.4 + ((i * 7) % 10) * 0.26,
          turnAt: 1.2 + (i % 4) * 0.55,
        }
        spider.root.visible = true
        spider.root.scale.setScalar(0.03)
        spider.root.position.copy(this.sand.mesh.position)
        spider.root.position.y = -0.18
        spider.root.position.x += Math.cos(i * 2.4) * 0.08
        spider.root.position.z += Math.sin(i * 2.4) * 0.08
      })
      this.enter('swarm')
    }
  }

  reset(): void {
    this.phase = 'idle'; this.time = this.animationTime = 0
    this.targets.splice(0, this.targets.length, this.switchTarget)
    this.switchTarget.setHighlight(false)
    this.sand.setHighlight(false)
    this.lever.rotation.x = 0
    this.sand.mesh.visible = false
    this.sandLight.intensity = 0
    for (const spider of this.spiders) { spider.root.visible = false; spider.root.scale.setScalar(1) }
    this.swarmRoot.add(this.giant.root)
    this.giant.root.visible = false
    this.giant.root.scale.setScalar(1)
    this.scareLight.intensity = 0
    for (const entry of this.lights) entry.light.intensity = entry.intensity
    for (const [material, intensity] of this.emissives) material.emissiveIntensity = intensity
    for (const [material, color] of this.strips) material.color.copy(color)
    this.scene.background = this.originalBackground
    this.scene.fog = this.originalFog
    this.camera.rotation.set(0, 0, 0)
    this.audio.suspendMusic(false)
    this.callbacks.onFade(0)
  }

  update(dt: number, playing: boolean): void {
    if (!playing || this.phase === 'idle' || this.phase === 'ended') return
    this.time += dt
    this.animationTime += dt
    if (this.phase === 'flicker') {
      const t = Math.min(1, this.time / 0.42)
      this.lever.rotation.x = Math.PI * (1 - Math.pow(1 - t, 3))
      const blink = Math.sin(this.time * 11) + Math.sin(this.time * 3.7)
      this.applyFlicker(blink > 0.1 ? Math.max(0.18, 1 - this.time / 3.6) : 0.045)
      if (this.time >= 3.2) {
        this.setDarkRoom()
        this.sand.mesh.visible = true
        this.sandLight.intensity = 0.9
        this.targets.push(this.sand)
        this.enter('sand')
      }
    } else if (this.phase === 'swarm') {
      this.sandLight.intensity = 0.9 * Math.max(0, 1 - this.time)
      this.spiders.forEach((spider, i) => {
        const age = this.time - i * 0.075
        spider.root.visible = age >= 0
        if (age < 0) return
        const emergence = Math.min(1, age / 0.18)
        spider.root.scale.setScalar((0.75 + (i % 3) * 0.17) * Math.max(0.03, emergence))
        spider.root.position.y = age < 0.18 ? THREE.MathUtils.lerp(-0.18, 0.06, emergence) :
          0.025 + Math.max(0, 0.28 - age) * 0.35
        this.wander(spider, i, dt)
        spider.animate(this.animationTime * this.wanderers[i].speed / 2.8 + i)
      })
      if (this.time >= 13) {
        this.mergePoint.set(0, 0.025, 0)
        for (const spider of this.spiders) this.mergePoint.add(spider.root.position)
        this.mergePoint.multiplyScalar(1 / this.spiders.length).setY(0.025)
        // Assemble in front of the player, leaving room for the giant to approach visibly.
        const direction = new THREE.Vector3()
        this.camera.getWorldDirection(direction)
        const angle = Math.atan2(direction.x, direction.z)
        for (const turn of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
          const x = THREE.MathUtils.clamp(this.player.position.x + Math.sin(angle + turn) * 2.8, -3.6, 3.6)
          const z = THREE.MathUtils.clamp(this.player.position.z + Math.cos(angle + turn) * 2.8, -8.5, 8.5)
          const clear = resolveMovement(this.player.position.x, this.player.position.z, x, z, 0.35, this.colliders)
          if (Math.hypot(clear.x - x, clear.z - z) < 0.01 && Math.hypot(x - this.player.position.x, z - this.player.position.z) > 2) {
            this.mergePoint.set(x, 0.025, z)
            break
          }
        }
        this.mergeStarts.splice(0, this.mergeStarts.length, ...this.spiders.map(spider => spider.root.position.clone()))
        this.giant.root.position.copy(this.mergePoint)
        this.giant.root.rotation.y = Math.atan2(this.mergePoint.x - this.player.position.x, this.mergePoint.z - this.player.position.z)
        this.giant.root.scale.setScalar(0.01)
        this.giant.root.visible = true
        this.enter('merge')
      }
    } else if (this.phase === 'merge') {
      const t = Math.min(1, this.time / 1.35)
      this.spiders.forEach((spider, i) => {
        spider.root.position.lerpVectors(this.mergeStarts[i], this.mergePoint, t)
        spider.root.scale.setScalar((0.75 + (i % 3) * 0.17) * (1 - t))
        spider.animate(this.animationTime + i)
      })
      this.giant.root.scale.setScalar(Math.max(0.01, t * 4.8))
      this.giant.animate(this.animationTime)
      if (t === 1) { for (const spider of this.spiders) spider.root.visible = false; this.enter('giant') }
    } else if (this.phase === 'giant') {
      this.chase(this.giant, this.player.position.x, this.player.position.z, 5.7, 0.3, dt)
      this.giant.animate(this.animationTime)
      const distance = Math.hypot(this.giant.root.position.x - this.player.position.x, this.giant.root.position.z - this.player.position.z)
      if ((distance < 1.55 && this.time > 0.35) || this.time > 12) this.startScare()
    } else if (this.phase === 'scare') {
      const t = Math.min(1, this.time / 0.65)
      this.giant.root.position.set(Math.sin(this.time * 39) * 0.045, -0.8, -3.2 + t * 1.1)
      this.giant.root.scale.setScalar(4.8)
      this.giant.animate(this.animationTime)
      this.camera.rotation.z = Math.sin(this.time * 32) * 0.035 * (1 - t)
      if (t === 1) {
        this.scene.attach(this.giant.root)
        this.fallStartHeight = this.player.position.y
        this.enter('fall')
      }
    } else if (this.phase === 'fall') {
      const t = Math.min(1, this.time / 1.4), eased = t * t
      this.player.position.y = THREE.MathUtils.lerp(this.fallStartHeight, 0.26, eased)
      this.camera.rotation.z = -1.25 * eased
      this.camera.rotation.x = -0.35 * eased
      this.scareLight.intensity = 1.8 * (1 - t)
      this.callbacks.onFade(Math.max(0, (t - 0.2) / 0.8))
      if (t === 1) { this.enter('ended'); this.callbacks.onFinished() }
    }
  }

  private enter(phase: HorrorPhase): void { this.phase = phase; this.time = 0 }

  private applyFlicker(factor: number): void {
    for (const entry of this.lights) entry.light.intensity = entry.intensity * factor
    for (const [material, intensity] of this.emissives) material.emissiveIntensity = intensity * factor
    for (const [material, color] of this.strips) material.color.copy(color).multiplyScalar(factor)
  }

  private setDarkRoom(): void {
    for (const entry of this.lights) entry.light.intensity = entry.central ? entry.intensity * 0.14 * DARK_BRIGHTNESS :
      entry.light instanceof THREE.AmbientLight ? 0.055 * DARK_BRIGHTNESS : 0
    // Shade/bulb materials are shared within each chandelier, so only the central fixture remains emissive.
    for (const [material] of this.emissives) material.emissiveIntensity = 0
    this.root.traverse(object => {
      if (object.name !== 'chandelier' || object.position.x !== 0 || object.position.z !== 0) return
      object.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          const original = this.emissives.get(child.material)
          if (original !== undefined) child.material.emissiveIntensity = original * 0.12 * DARK_BRIGHTNESS
        }
      })
    })
    for (const [material, color] of this.strips) material.color.copy(color).multiplyScalar(0.025 * DARK_BRIGHTNESS)
    const darkness = new THREE.Color(0x10120f).multiplyScalar(DARK_BRIGHTNESS)
    this.scene.background = darkness
    this.scene.fog = new THREE.Fog(darkness, 5, 19)
  }

  private wander(spider: Spider, index: number, dt: number): void {
    const motion = this.wanderers[index], pos = spider.root.position
    if (this.time >= motion.turnAt) {
      motion.heading += (index % 2 ? 1 : -1) * (0.6 + Math.random() * 1.2)
      motion.turnAt = this.time + 1.1 + Math.random() * 2
    }
    motion.heading += Math.sin(this.time * 0.8 + index) * 0.2 * dt
    const fromX = pos.x, fromZ = pos.z
    this.chase(spider, fromX + Math.sin(motion.heading) * 2.5,
      fromZ + Math.cos(motion.heading) * 2.5, motion.speed, 0.14, dt)
    const movedX = pos.x - fromX, movedZ = pos.z - fromZ
    if (Math.hypot(movedX, movedZ) < motion.speed * dt * 0.25 ||
      Math.abs(pos.x) >= 4.44 || Math.abs(pos.z) >= 9.39) {
      motion.heading += Math.PI * (0.7 + Math.random() * 0.6)
      motion.turnAt = this.time + 0.8
    } else motion.heading = Math.atan2(movedX, movedZ)
  }

  private chase(spider: Spider, x: number, z: number, speed: number, radius: number, dt: number): void {
    const pos = spider.root.position, dx = x - pos.x, dz = z - pos.z
    const distance = Math.hypot(dx, dz)
    if (distance < 0.08) return
    const step = Math.min(distance, speed * dt), angle = Math.atan2(dx, dz)
    let next = resolveMovement(pos.x, pos.z, pos.x + dx / distance * step, pos.z + dz / distance * step, radius, this.colliders)
    if (Math.hypot(next.x - pos.x, next.z - pos.z) < step * 0.15) {
      for (const turn of [Math.PI / 3, -Math.PI / 3, Math.PI / 2, -Math.PI / 2]) {
        next = resolveMovement(pos.x, pos.z, pos.x + Math.sin(angle + turn) * step, pos.z + Math.cos(angle + turn) * step, radius, this.colliders)
        if (Math.hypot(next.x - pos.x, next.z - pos.z) > step * 0.4) break
      }
    }
    const movedX = next.x - pos.x, movedZ = next.z - pos.z
    if (Math.hypot(movedX, movedZ) > 0.001) spider.root.rotation.y = Math.atan2(-movedX, -movedZ)
    pos.x = THREE.MathUtils.clamp(next.x, -4.45, 4.45)
    pos.z = THREE.MathUtils.clamp(next.z, -9.4, 9.4)
  }

  private startScare(): void {
    this.callbacks.onCinematic()
    this.audio.playSpiderScare()
    this.camera.add(this.giant.root)
    this.giant.root.rotation.set(0, Math.PI, 0)
    this.giant.root.position.set(0, -0.8, -3.2)
    this.scareLight.intensity = 1.8
    this.enter('scare')
  }
}
