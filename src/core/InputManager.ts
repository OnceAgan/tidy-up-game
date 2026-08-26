export class InputManager {
  private readonly keys = new Set<string>()
  private pointerLocked = false
  private mouseDeltaX = 0
  private mouseDeltaY = 0
  private readonly domElement: HTMLElement
  private readonly hintEl: HTMLElement | null

  constructor(domElement: HTMLElement, hintEl: HTMLElement | null) {
    this.domElement = domElement
    this.hintEl = hintEl
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onPointerLockChange = this.onPointerLockChange.bind(this)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    this.domElement.addEventListener('click', this.onClick)
    this.hintEl?.addEventListener('click', this.onClick)
  }

  get isPointerLocked(): boolean {
    return this.pointerLocked
  }

  isDown(code: string): boolean {
    return this.keys.has(code)
  }

  consumeMouseDelta(): { x: number; y: number } {
    const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY }
    this.mouseDeltaX = 0
    this.mouseDeltaY = 0
    return delta
  }

  private onClick(): void {
    if (!this.pointerLocked) {
      this.domElement.requestPointerLock()
    }
  }

  private onPointerLockChange(): void {
    this.pointerLocked = document.pointerLockElement === this.domElement
    if (this.hintEl) {
      this.hintEl.classList.toggle('hidden', this.pointerLocked)
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code)
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code)
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.pointerLocked) return
    this.mouseDeltaX += e.movementX
    this.mouseDeltaY += e.movementY
  }
}
