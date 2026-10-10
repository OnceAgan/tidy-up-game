import type { AudioManager } from '../audio/AudioManager'
import { WelcomeScreen } from './WelcomeScreen'
import { CONTROL_BINDINGS } from './ControlsHint'

const MENU_BG_URL = `${import.meta.env.BASE_URL}ui/menu/menu-bg.jpg`

type MenuItem = {
  label: string
  enabled: boolean
  onClick?: () => void
}

type MenuView = 'main' | 'settings' | 'controls'

export class StartMenu {
  private readonly root: HTMLDivElement
  private readonly canvas: HTMLElement
  private readonly audio: AudioManager
  private readonly panel: HTMLDivElement
  private readonly mainView: HTMLDivElement
  private readonly settingsView: HTMLDivElement
  private musicToggleBtn: HTMLButtonElement | null = null
  private sfxToggleBtn: HTMLButtonElement | null = null
  private suppressed = false
  private runStarted = false
  private continueBtn!: HTMLButtonElement
  private readonly welcome: WelcomeScreen
  private readonly controlsView: HTMLDivElement
  private onNewGame: (() => void) | null = null

  setOnNewGame(fn: () => void): void { this.onNewGame = fn }

  constructor(canvas: HTMLElement, audio: AudioManager) {
    this.canvas = canvas
    this.audio = audio

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

    this.panel = this.createPanelShell()
    this.mainView = this.createMainView()
    this.settingsView = this.createSettingsView()
    this.controlsView = this.createControlsView()
    this.welcome = new WelcomeScreen(() => this.resumeGame(), () => this.returnToMain())
    this.panel.append(this.mainView, this.settingsView, this.controlsView)

    this.root.append(this.panel)
    document.body.appendChild(this.root)

    this.canvas.style.visibility = 'hidden'
    this.canvas.style.pointerEvents = 'none'

    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  private createPanelShell(): HTMLDivElement {
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
    return panel
  }

  private createMainView(): HTMLDivElement {
    const view = document.createElement('div')
    Object.assign(view.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
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
      { label: 'Настройки', enabled: true, onClick: () => this.showView('settings') },
      { label: 'Управление', enabled: true, onClick: () => this.showView('controls') },
    ]

    view.append(title, subtitle)
    this.continueBtn = this.createButton({ label: 'Продолжить', enabled: true, onClick: () => this.resumeGame() })
    this.continueBtn.style.display = 'none'
    view.appendChild(this.continueBtn)
    for (const item of items) {
      view.appendChild(this.createButton(item))
    }

    return view
  }

  private createControlsView(): HTMLDivElement {
    const view = document.createElement('div')
    view.id = 'controls-menu'
    Object.assign(view.style, { display: 'none', flexDirection: 'column', gap: '10px', color: '#f2ebe0' })
    const title = document.createElement('h2')
    title.textContent = 'Управление'
    Object.assign(title.style, { margin: '0 0 10px', font: '28px Georgia, serif' })
    const list = document.createElement('dl')
    Object.assign(list.style, { display: 'grid', gridTemplateColumns: 'minmax(90px, 135px) 1fr',
      gap: '12px 16px', margin: '0 0 12px', font: '14px/1.45 Arial, sans-serif' })
    for (const [key, description] of CONTROL_BINDINGS) {
      const term = document.createElement('dt')
      term.textContent = key
      Object.assign(term.style, { color: '#e8c96a', fontWeight: '600' })
      const definition = document.createElement('dd')
      definition.textContent = description
      definition.style.margin = '0'
      list.append(term, definition)
    }
    view.append(title, list, this.createButton({ label: 'Назад', enabled: true,
      onClick: () => this.showView('main') }))
    return view
  }

  private createSettingsView(): HTMLDivElement {
    const view = document.createElement('div')
    Object.assign(view.style, {
      display: 'none',
      flexDirection: 'column',
      gap: '12px',
    } as CSSStyleDeclaration)

    const title = document.createElement('h2')
    title.textContent = 'Настройки'
    Object.assign(title.style, {
      margin: '0 0 6px',
      color: '#f2ebe0',
      font: '600 28px/1.15 Georgia, "Times New Roman", serif',
      textAlign: 'left',
      letterSpacing: '0.03em',
    } as CSSStyleDeclaration)

    const hint = document.createElement('p')
    hint.textContent = 'Звук включается после первого клика в меню.'
    Object.assign(hint.style, {
      margin: '0 0 8px',
      color: 'rgba(242, 235, 224, 0.62)',
      font: '400 13px/1.4 Georgia, "Times New Roman", serif',
      textAlign: 'left',
    } as CSSStyleDeclaration)

    const musicRow = this.createToggleRow(
      'Музыка',
      () => this.audio.isMusicEnabled(),
      () => {
        this.audio.unlock()
        this.audio.toggleMusic()
        this.refreshSettingsToggles()
      },
    )
    this.musicToggleBtn = musicRow.button

    const musicVolume = this.createVolumeRow(
      'Громкость музыки',
      () => this.audio.getMusicVolume(),
      (value) => {
        this.audio.unlock()
        this.audio.setMusicVolume(value)
      },
    )

    const sfxRow = this.createToggleRow(
      'Звуковые эффекты',
      () => this.audio.isSfxEnabled(),
      () => {
        this.audio.unlock()
        this.audio.toggleSfx()
        this.refreshSettingsToggles()
      },
    )
    this.sfxToggleBtn = sfxRow.button

    const sfxVolume = this.createVolumeRow(
      'Громкость эффектов',
      () => this.audio.getSfxVolume(),
      (value) => {
        this.audio.unlock()
        this.audio.setSfxVolume(value)
      },
    )

    const backBtn = this.createButton({
      label: 'Назад',
      enabled: true,
      onClick: () => this.showView('main'),
    })
    Object.assign(backBtn.style, { marginTop: '8px' } as CSSStyleDeclaration)

    view.append(title, hint, musicRow.row, musicVolume, sfxRow.row, sfxVolume, backBtn)
    return view
  }

  private createToggleRow(
    label: string,
    isOn: () => boolean,
    onToggle: () => void,
  ): { row: HTMLDivElement; button: HTMLButtonElement } {
    const row = document.createElement('div')
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '10px 12px',
      border: '1px solid rgba(242, 235, 224, 0.2)',
      borderRadius: '4px',
      background: 'rgba(242, 235, 224, 0.06)',
    } as CSSStyleDeclaration)

    const text = document.createElement('span')
    text.textContent = label
    Object.assign(text.style, {
      color: '#f2ebe0',
      font: '500 15px/1.2 Georgia, "Times New Roman", serif',
    } as CSSStyleDeclaration)

    const button = document.createElement('button')
    button.type = 'button'
    Object.assign(button.style, {
      minWidth: '72px',
      padding: '7px 10px',
      border: '1px solid rgba(242, 235, 224, 0.28)',
      borderRadius: '4px',
      background: 'rgba(242, 235, 224, 0.14)',
      color: '#f2ebe0',
      font: '500 14px/1.2 Georgia, "Times New Roman", serif',
      cursor: 'pointer',
    } as CSSStyleDeclaration)

    const refresh = () => {
      const on = isOn()
      button.textContent = on ? 'Вкл' : 'Выкл'
      button.style.opacity = on ? '1' : '0.6'
    }

    button.addEventListener('click', (e) => {
      e.stopPropagation()
      onToggle()
      refresh()
    })

    refresh()
    row.append(text, button)
    return { row, button }
  }

  private createVolumeRow(
    label: string,
    getValue: () => number,
    onChange: (value: number) => void,
  ): HTMLDivElement {
    const row = document.createElement('div')
    Object.assign(row.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '10px 12px',
      border: '1px solid rgba(242, 235, 224, 0.16)',
      borderRadius: '4px',
      background: 'rgba(242, 235, 224, 0.04)',
    } as CSSStyleDeclaration)

    const header = document.createElement('div')
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
    } as CSSStyleDeclaration)

    const text = document.createElement('span')
    text.textContent = label
    Object.assign(text.style, {
      color: 'rgba(242, 235, 224, 0.82)',
      font: '400 13px/1.2 Georgia, "Times New Roman", serif',
    } as CSSStyleDeclaration)

    const valueLabel = document.createElement('span')
    Object.assign(valueLabel.style, {
      color: 'rgba(242, 235, 224, 0.62)',
      font: '400 12px/1.2 Georgia, "Times New Roman", serif',
      minWidth: '36px',
      textAlign: 'right',
    } as CSSStyleDeclaration)

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = '0'
    slider.max = '100'
    slider.step = '1'
    Object.assign(slider.style, {
      width: '100%',
      margin: '0',
      accentColor: '#d8cbb8',
      cursor: 'pointer',
    } as CSSStyleDeclaration)

    const refresh = () => {
      const percent = Math.round(getValue() * 100)
      slider.value = String(percent)
      valueLabel.textContent = `${percent}%`
    }

    slider.addEventListener('input', () => {
      const value = Number.parseInt(slider.value, 10) / 100
      onChange(value)
      valueLabel.textContent = `${slider.value}%`
    })

    refresh()
    header.append(text, valueLabel)
    row.append(header, slider)
    return row
  }

  private refreshSettingsToggles(): void {
    if (this.musicToggleBtn) {
      const on = this.audio.isMusicEnabled()
      this.musicToggleBtn.textContent = on ? 'Вкл' : 'Выкл'
      this.musicToggleBtn.style.opacity = on ? '1' : '0.6'
    }
    if (this.sfxToggleBtn) {
      const on = this.audio.isSfxEnabled()
      this.sfxToggleBtn.textContent = on ? 'Вкл' : 'Выкл'
      this.sfxToggleBtn.style.opacity = on ? '1' : '0.6'
    }
  }

  private showView(view: MenuView): void {
    this.audio.unlock()
    this.mainView.style.display = view === 'main' ? 'flex' : 'none'
    this.settingsView.style.display = view === 'settings' ? 'flex' : 'none'
    this.controlsView.style.display = view === 'controls' ? 'flex' : 'none'
    this.panel.style.maxWidth = view === 'controls' ? '520px' : '300px'
    this.panel.style.maxHeight = 'calc(100vh - 40px)'
    this.panel.style.overflowY = 'auto'
    this.continueBtn.style.display = this.runStarted ? 'block' : 'none'
    if (view === 'settings') this.refreshSettingsToggles()
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

  startGame(): void {
    this.onNewGame?.()
    this.suppressed = false
    this.runStarted = false
    this.root.style.display = 'none'
    this.canvas.style.visibility = 'visible'
    this.canvas.style.pointerEvents = 'none'
    this.welcome.show()
  }

  private resumeGame(): void {
    this.welcome.hide()
    this.suppressed = false
    this.audio.unlock()
    this.canvas.style.visibility = 'visible'
    this.canvas.style.pointerEvents = 'auto'
    this.canvas.requestPointerLock()
  }

  private onPointerLockChange = (): void => {
    if (this.suppressed) return
    const locked = document.pointerLockElement === this.canvas
    if (locked) this.runStarted = true
    this.root.style.display = locked ? 'none' : 'flex'
    if (!locked) {
      this.canvas.style.visibility = 'hidden'
      this.canvas.style.pointerEvents = 'none'
      this.showView('main')
      this.audio.playMusic()
    }
  }

  /** Скрыть меню навсегда (экран победы) */
  suppress(): void {
    this.welcome.hide()
    this.suppressed = true
    this.root.style.display = 'none'
  }

  returnToMain(): void {
    this.welcome.hide()
    this.suppressed = false
    this.runStarted = false
    this.root.style.display = 'flex'
    this.canvas.style.visibility = 'hidden'
    this.canvas.style.pointerEvents = 'none'
    this.showView('main')
    this.audio.playMusic()
  }

  dispose(): void {
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    this.root.remove()
    this.welcome.dispose()
  }
}
