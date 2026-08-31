export class InputManager {
  private readonly keys = new Set<string>()
  private pointerLocked = false
  private mouseDeltaX = 0
  private mouseDeltaY = 0
  private interactQueued = false
  private dropQueued = false
  private wheelStep = 0
  private hintSuppressed = false
  private readonly domElement: HTMLElement
  private readonly hintEl: HTMLElement | null

  constructor(domElement: HTMLElement, hintEl: HTMLElement | null) {
    this.domElement = domElement
    this.hintEl = hintEl
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onWheel = this.onWheel.bind(this)
    this.onPointerLockChange = this.onPointerLockChange.bind(this)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    this.domElement.addEventListener('click', this.onClick)
    this.domElement.addEventListener('mousedown', this.onMouseDown)
    this.domElement.addEventListener('contextmenu', this.onContextMenu)
    this.domElement.addEventListener('wheel', this.onWheel, { passive: true })
    this.hintEl?.addEventListener('click', this.onClick)
  }

  get isPointerLocked(): boolean {
    return this.pointerLocked
  }

  /** Скрыть стартовую подсказку (например, на экране победы) */
  suppressHint(): void {
    this.hintSuppressed = true
    this.hintEl?.classList.add('hidden')
  }

  isDown(code: string): boolean {
    return this.keys.has(code)
  }

  /** Удержание Alt (Win/Linux) или ⌘ (Mac) — зум 2× */
  isZoomHeld(): boolean {
    return this.keys.has('AltLeft') || this.keys.has('MetaLeft')
  }

  consumeMouseDelta(): { x: number; y: number } {
    const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY }
    this.mouseDeltaX = 0
    this.mouseDeltaY = 0
    return delta
  }

  consumeInteract(): boolean {
    if (!this.interactQueued) return false
    this.interactQueued = false
    return true
  }

  consumeDrop(): boolean {
    if (!this.dropQueued) return false
    this.dropQueued = false
    return true
  }

  /** -1 вверх, +1 вниз, 0 нет */
  consumeWheelStep(): number {
    const step = this.wheelStep
    this.wheelStep = 0
    return step
  }

  private onWheel(e: WheelEvent): void {
    if (!this.pointerLocked || this.hintSuppressed) return
    if (e.deltaY > 0) this.wheelStep = 1
    else if (e.deltaY < 0) this.wheelStep = -1
  }

  private onClick(): void {
    if (this.hintSuppressed) return
    if (!this.pointerLocked) {
      this.domElement.requestPointerLock()
      return
    }
    this.interactQueued = true
  }

  private onMouseDown(e: MouseEvent): void {
    if (this.hintSuppressed || !this.pointerLocked) return
    if (e.button === 2) {
      e.preventDefault()
      this.dropQueued = true
    }
  }

  private onContextMenu(e: Event): void {
    e.preventDefault()
  }

  private onPointerLockChange(): void {
    this.pointerLocked = document.pointerLockElement === this.domElement
    if (!this.hintEl || this.hintSuppressed) return
    this.hintEl.classList.toggle('hidden', this.pointerLocked)
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'AltLeft' || e.code === 'MetaLeft') {
      e.preventDefault()
    }
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
