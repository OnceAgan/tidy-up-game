import { AUDIO_FILES, audioUrl, type SfxId } from '../data/audioFiles'

const STORAGE_KEY = 'tidy-up-game-sound-enabled'

export class AudioManager {
  private enabled = true
  private unlocked = false
  private music: HTMLAudioElement | null = null
  private readonly sfx = new Map<SfxId, HTMLAudioElement>()

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) this.enabled = stored === '1'

    this.music = this.createAudio(AUDIO_FILES.music, { loop: true, volume: 0.32 })
    this.sfx.set('pickup', this.createAudio(AUDIO_FILES.pickup, { volume: 0.55 }))
    this.sfx.set('place', this.createAudio(AUDIO_FILES.place, { volume: 0.55 }))
    this.sfx.set('drop', this.createAudio(AUDIO_FILES.drop, { volume: 0.5 }))
  }

  private createAudio(
    fileName: string,
    options: { loop?: boolean; volume: number },
  ): HTMLAudioElement {
    const audio = new Audio(audioUrl(fileName))
    audio.loop = options.loop ?? false
    audio.volume = options.volume
    audio.preload = 'auto'
    return audio
  }

  /** Первый клик пользователя — разблокировка autoplay в браузере */
  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    if (this.enabled) this.playMusic()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    localStorage.setItem(STORAGE_KEY, this.enabled ? '1' : '0')
    if (this.enabled) {
      this.playMusic()
    } else {
      this.pauseMusic()
    }
    return this.enabled
  }

  playMusic(): void {
    if (!this.enabled || !this.music) return
    void this.music.play().catch(() => {})
  }

  pauseMusic(): void {
    this.music?.pause()
  }

  playPickup(): void {
    this.playSfx('pickup')
  }

  playPlace(): void {
    this.playSfx('place')
  }

  playDrop(): void {
    this.playSfx('drop')
  }

  private playSfx(id: SfxId): void {
    if (!this.enabled) return
    const clip = this.sfx.get(id)
    if (!clip) return
    clip.currentTime = 0
    void clip.play().catch(() => {})
  }
}
