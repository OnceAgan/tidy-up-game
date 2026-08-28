import * as THREE from 'three'

export class Engine {
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  private readonly clock = new THREE.Clock()
  private running = false
  private onUpdate: ((dt: number) => void) | null = null

  constructor(container: HTMLElement) {
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100)
    this.camera.position.set(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)

    this.scene.background = new THREE.Color(0xb8a890)
    this.scene.fog = new THREE.Fog(0xb8a890, 16, 42)

    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  }

  setUpdate(fn: (dt: number) => void): void {
    this.onUpdate = fn
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.clock.start()
    this.renderer.setAnimationLoop(() => this.tick())
  }

  private tick(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.onUpdate?.(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private handleResize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }
}
