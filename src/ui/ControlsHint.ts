const HINT_DURATION_MS = 30_000

type HintItem = {
  text: string
  keys: string[]
}

const HINT_ITEMS: HintItem[] = [
  { keys: ['W', 'A', 'S', 'D'], text: 'двигаться' },
  { keys: ['ЛКМ'], text: 'взять / положить' },
  { keys: ['E'], text: 'вернуть на пол' },
  { keys: ['ПКМ'], text: 'приблизить (удерживать)' },
  { keys: ['Shift'], text: 'бежать' },
  { keys: ['Колёсико'], text: 'сменить верхнюю в стопке' },
]

export class ControlsHint {
  private readonly root: HTMLDivElement
  private hideTimer: number | null = null
  private gameStarted = false

  constructor() {
    this.root = document.createElement('div')
    this.root.id = 'controls-hint'
    Object.assign(this.root.style, {
      position: 'fixed',
      top: '50%',
      right: 'clamp(16px, 3vw, 40px)',
      transform: 'translateY(-50%)',
      zIndex: '9',
      display: 'none',
      width: 'min(92vw, 340px)',
      padding: '16px 18px 14px',
      background: 'rgba(22, 20, 18, 0.78)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      borderRadius: '4px',
      color: '#f2ebe0',
      font: '400 15px/1.45 Arial, Helvetica, sans-serif',
      pointerEvents: 'none',
      userSelect: 'none',
      boxShadow: '0 8px 28px rgba(0, 0, 0, 0.35)',
    } as CSSStyleDeclaration)

    const header = document.createElement('div')
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
      paddingBottom: '8px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      fontWeight: '600',
      fontSize: '16px',
    } as CSSStyleDeclaration)
    header.innerHTML = '<span style="opacity:0.85;font-size:14px">▣</span><span>Клавиши навигации</span>'

    const list = document.createElement('ul')
    Object.assign(list.style, {
      margin: '0',
      padding: '0',
      listStyle: 'none',
    } as CSSStyleDeclaration)

    for (const item of HINT_ITEMS) {
      list.appendChild(this.createItem(item))
    }

    this.root.append(header, list)
    document.body.appendChild(this.root)
  }

  private createItem(item: HintItem): HTMLLIElement {
    const li = document.createElement('li')
    Object.assign(li.style, {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginBottom: '8px',
    } as CSSStyleDeclaration)

    const box = document.createElement('span')
    Object.assign(box.style, {
      width: '16px',
      height: '16px',
      marginTop: '2px',
      border: '1px solid rgba(255,255,255,0.45)',
      borderRadius: '2px',
      flexShrink: '0',
      opacity: '0.7',
    } as CSSStyleDeclaration)

    const text = document.createElement('span')
    const keysHtml = item.keys
      .map((k) => `<strong style="color:#e8c96a;font-weight:600">${k}</strong>`)
      .join(', ')
    text.innerHTML = `Нажмите ${keysHtml}, чтобы ${item.text}`

    li.append(box, text)
    return li
  }

  onGameStart(): void {
    if (this.gameStarted) return
    this.gameStarted = true
    this.show()
    this.hideTimer = window.setTimeout(() => this.hide(), HINT_DURATION_MS)
  }

  show(): void {
    this.root.style.display = 'block'
  }

  hide(): void {
    this.root.style.display = 'none'
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer)
      this.hideTimer = null
    }
  }

  reset(): void {
    this.gameStarted = false
    this.hide()
  }
}
