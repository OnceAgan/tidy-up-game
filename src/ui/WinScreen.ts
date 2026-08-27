export class WinScreen {
  private readonly overlay: HTMLDivElement

  constructor(onRestart: () => void) {
    this.overlay = document.createElement('div')
    this.overlay.id = 'win-screen'
    Object.assign(this.overlay.style, {
      position: 'fixed',
      inset: '0',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px',
      background: 'rgba(28, 22, 16, 0.82)',
      zIndex: '30',
      pointerEvents: 'auto',
      userSelect: 'none',
      padding: '24px',
    } as CSSStyleDeclaration)

    const title = document.createElement('h1')
    title.textContent = 'Комната в порядке!'
    Object.assign(title.style, {
      margin: '0',
      color: '#f2ebe0',
      font: '600 42px/1.2 Georgia, "Times New Roman", serif',
      letterSpacing: '0.02em',
      textAlign: 'center',
    } as CSSStyleDeclaration)

    const subtitle = document.createElement('p')
    subtitle.textContent = 'Все кассеты на своих местах'
    Object.assign(subtitle.style, {
      margin: '0',
      color: 'rgba(242, 235, 224, 0.8)',
      font: '400 18px/1.4 Georgia, "Times New Roman", serif',
      textAlign: 'center',
    } as CSSStyleDeclaration)

    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Начать заново'
    Object.assign(button.style, {
      marginTop: '8px',
      padding: '12px 28px',
      border: '1px solid rgba(242, 235, 224, 0.45)',
      borderRadius: '4px',
      background: 'rgba(242, 235, 224, 0.12)',
      color: '#f2ebe0',
      font: '500 16px/1 Georgia, "Times New Roman", serif',
      cursor: 'pointer',
      letterSpacing: '0.03em',
    } as CSSStyleDeclaration)
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(242, 235, 224, 0.22)'
    })
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(242, 235, 224, 0.12)'
    })
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      onRestart()
    })

    this.overlay.append(title, subtitle, button)
    document.body.appendChild(this.overlay)
  }

  show(): void {
    this.overlay.style.display = 'flex'
  }

  hide(): void {
    this.overlay.style.display = 'none'
  }
}
