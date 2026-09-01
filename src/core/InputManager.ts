export class InputManager {
  private readonly keys = new Set<string>()
  private pointerLocked = false
  private mouseDeltaX = 0
  private mouseDeltaY = 0
  private interactQueued = false
  private dropQueued = false
  private wheelStep = 0
  private rmbHeld = false
  private inputBlocked = false
  private readonly domElement: HTMLElement

  constructor(domElement: HTMLElement) {
    this.domElement = domElement
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onWheel = this.onWheel.bind(this)
    this.onPointerLockChange = this.onPointerLockChange.bind(this)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    window.addEventListener('mouseup', this.onMouseUp)
    this.domElement.addEventListener('click', this.onClick)
    this.domElement.addEventListener('mousedown', this.onMouseDown)
    this.domElement.addEventListener('contextmenu', this.onContextMenu)
    this.domElement.addEventListener('wheel', this.onWheel, { passive: true })
  }

  get isPointerLocked(): boolean {
    return this.pointerLocked
  }

  /** Заблокировать ввод (экран победы) */
  blockInput(): void {
    this.inputBlocked = true
  }

  isDown(code: string): boolean {
    return this.keys.has(code)
  }

  /** Удержание ПКМ — зум 2× */
  isZoomHeld(): boolean {
    return this.pointerLocked && this.rmbHeld
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
    if (!this.pointerLocked || this.inputBlocked) return
    if (e.deltaY > 0) this.wheelStep = 1
    else if (e.deltaY < 0) this.wheelStep = -1
  }

  private onClick(): void {
    if (this.inputBlocked || !this.pointerLocked) return
    this.interactQueued = true
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 2) {
      e.preventDefault()
      if (!this.inputBlocked && this.pointerLocked) {
        this.rmbHeld = true
      }
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 2) {
      this.rmbHeld = false
    }
  }

  private onContextMenu(e: Event): void {
    e.preventDefault()
  }

  private onPointerLockChange(): void {
    this.pointerLocked = document.pointerLockElement === this.domElement
    if (!this.pointerLocked) {
      this.rmbHeld = false
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code)
    if (e.code === 'KeyE' && !e.repeat && this.pointerLocked && !this.inputBlocked) {
      this.dropQueued = true
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code)
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.pointerLocked) return
    this.rmbHeld = (e.buttons & 2) !== 0
    this.mouseDeltaX += e.movementX
    this.mouseDeltaY += e.movementY
  }
}
