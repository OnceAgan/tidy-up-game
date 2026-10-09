export class HorrorScreen {
  private readonly overlay = document.createElement('div')
  private readonly content = document.createElement('div')
  private readonly restart = document.createElement('button')

  constructor(onRestart: () => void) {
    this.overlay.id = 'horror-ending'
    Object.assign(this.overlay.style, { position: 'fixed', inset: '0', background: '#000', opacity: '0',
      display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: '120', pointerEvents: 'none', padding: '24px' })
    this.overlay.setAttribute('role', 'dialog')
    this.overlay.setAttribute('aria-modal', 'true')
    this.overlay.setAttribute('aria-labelledby', 'horror-ending-title')
    Object.assign(this.content.style, { textAlign: 'center', display: 'none', maxWidth: '650px' })
    const title = document.createElement('h1')
    title.id = 'horror-ending-title'
    title.textContent = 'не стоило поворачивать тумблер'
    Object.assign(title.style, { color: '#a62a29', font: '400 clamp(27px,4vw,42px)/1.5 Georgia,serif', marginBottom: '38px' })
    this.restart.type = 'button'
    this.restart.textContent = 'Начать заново'
    Object.assign(this.restart.style, { padding: '13px 28px', border: '1px solid #66504c',
      background: '#181211', borderRadius: '5px', color: '#e0ceca', font: '16px Georgia,serif', cursor: 'pointer' })
    this.restart.addEventListener('click', e => { e.stopPropagation(); onRestart() })
    this.content.append(title, this.restart)
    this.overlay.appendChild(this.content)
    document.body.appendChild(this.overlay)
  }

  fade(opacity: number): void {
    this.overlay.style.display = opacity > 0 ? 'flex' : 'none'
    this.overlay.style.opacity = String(opacity)
  }

  show(): void {
    this.fade(1)
    this.overlay.style.pointerEvents = 'auto'
    this.content.style.display = 'block'
    this.restart.focus({ preventScroll: true })
  }

  hide(): void {
    this.fade(0)
    this.content.style.display = 'none'
    this.overlay.style.pointerEvents = 'none'
  }
}
