import type { AudioManager } from '../audio/AudioManager'

export class SoundToggle {
  private readonly button: HTMLButtonElement
  private readonly audio: AudioManager

  constructor(audio: AudioManager, parent: HTMLElement) {
    this.audio = audio

    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.title = 'Звук'
    this.button.setAttribute('aria-label', 'Включить или выключить звук')
    Object.assign(this.button.style, {
      position: 'absolute',
      top: '18px',
      right: '18px',
      width: '44px',
      height: '44px',
      border: '1px solid rgba(242, 235, 224, 0.28)',
      borderRadius: '6px',
      background: 'rgba(28, 22, 16, 0.72)',
      color: '#f2ebe0',
      font: '500 20px/1 Arial, sans-serif',
      cursor: 'pointer',
      zIndex: '2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
    } as CSSStyleDeclaration)

    this.button.addEventListener('mouseenter', () => {
      this.button.style.background = 'rgba(242, 235, 224, 0.18)'
    })
    this.button.addEventListener('mouseleave', () => {
      this.button.style.background = 'rgba(28, 22, 16, 0.72)'
    })
    this.button.addEventListener('click', (e) => {
      e.stopPropagation()
      this.audio.unlock()
      this.audio.toggle()
      this.refreshIcon()
    })

    this.refreshIcon()
    parent.appendChild(this.button)
  }

  refreshIcon(): void {
    this.button.textContent = this.audio.isEnabled() ? '♪' : '∅'
    this.button.style.opacity = this.audio.isEnabled() ? '1' : '0.55'
  }
}
