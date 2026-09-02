const MENU_BG_URL = `${import.meta.env.BASE_URL}ui/menu/menu-bg.jpg`

type MenuItem = {
  label: string
  enabled: boolean
  onClick?: () => void
}

export class StartMenu {
  private readonly root: HTMLDivElement
  private readonly canvas: HTMLElement
  private suppressed = false

  constructor(canvas: HTMLElement) {
    this.canvas = canvas

    this.root = document.createElement('div')
    this.root.id = 'start-menu'
    Object.assign(this.root.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '100',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '0 clamp(24px, 5vw, 72px)',
      backgroundImage: `linear-gradient(90deg, rgba(18, 14, 10, 0.55) 0%, rgba(18, 14, 10, 0.2) 45%, rgba(18, 14, 10, 0.35) 100%), url("${MENU_BG_URL}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      userSelect: 'none',
    } as CSSStyleDeclaration)

    const panel = document.createElement('div')
    Object.assign(panel.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '10px',
      minWidth: 'min(88vw, 300px)',
      maxWidth: '300px',
      padding: '28px 28px',
      background: 'rgba(28, 22, 16, 0.72)',
      border: '1px solid rgba(242, 235, 224, 0.22)',
      borderRadius: '6px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
    } as CSSStyleDeclaration)

    const title = document.createElement('h1')
    title.textContent = 'Tidy Up'
    Object.assign(title.style, {
      margin: '0 0 4px',
      color: '#f2ebe0',
      font: '600 36px/1.15 Georgia, "Times New Roman", serif',
      textAlign: 'left',
      letterSpacing: '0.04em',
    } as CSSStyleDeclaration)

    const subtitle = document.createElement('p')
    subtitle.textContent = 'Разложи кассеты по полкам'
    Object.assign(subtitle.style, {
      margin: '0 0 18px',
      color: 'rgba(242, 235, 224, 0.72)',
      font: '400 15px/1.4 Georgia, "Times New Roman", serif',
      textAlign: 'left',
    } as CSSStyleDeclaration)

    const items: MenuItem[] = [
      { label: 'Новая игра', enabled: true, onClick: () => this.startGame() },
      { label: 'Настройки', enabled: false },
      { label: 'История версий', enabled: false },
      { label: 'Управление', enabled: false },
    ]

    for (const item of items) {
      panel.appendChild(this.createButton(item))
    }

    this.root.append(panel)
    document.body.appendChild(this.root)

    this.canvas.style.visibility = 'hidden'
    this.canvas.style.pointerEvents = 'none'

    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  private createButton(item: MenuItem): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = item.label
    btn.disabled = !item.enabled
    Object.assign(btn.style, {
      padding: '11px 16px',
      border: '1px solid rgba(242, 235, 224, 0.28)',
      borderRadius: '4px',
      background: item.enabled ? 'rgba(242, 235, 224, 0.14)' : 'rgba(242, 235, 224, 0.05)',
      color: item.enabled ? '#f2ebe0' : 'rgba(242, 235, 224, 0.38)',
      font: '500 16px/1.2 Georgia, "Times New Roman", serif',
      cursor: item.enabled ? 'pointer' : 'not-allowed',
      letterSpacing: '0.02em',
    } as CSSStyleDeclaration)

    if (item.enabled && item.onClick) {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(242, 235, 224, 0.24)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(242, 235, 224, 0.14)'
      })
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        item.onClick?.()
      })
    }

    return btn
  }

  private startGame(): void {
    this.canvas.style.visibility = 'visible'
    this.canvas.style.pointerEvents = 'auto'
    this.canvas.requestPointerLock()
  }

  private onPointerLockChange = (): void => {
    if (this.suppressed) return
    const locked = document.pointerLockElement === this.canvas
    this.root.style.display = locked ? 'none' : 'flex'
    if (!locked) {
      this.canvas.style.visibility = 'hidden'
      this.canvas.style.pointerEvents = 'none'
    }
  }

  /** Скрыть меню навсегда (экран победы) */
  suppress(): void {
    this.suppressed = true
    this.root.style.display = 'none'
  }

  dispose(): void {
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    this.root.remove()
  }
}
