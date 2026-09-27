import { AUDIO_FILES, audioUrl, type SfxId } from '../data/audioFiles'

const LEGACY_SOUND_KEY = 'tidy-up-game-sound-enabled'
const MUSIC_KEY = 'tidy-up-game-music-enabled'
const SFX_KEY = 'tidy-up-game-sfx-enabled'
const MUSIC_VOLUME_KEY = 'tidy-up-game-music-volume'
const SFX_VOLUME_KEY = 'tidy-up-game-sfx-volume'

const DEFAULT_MUSIC_VOLUME = 0.32
const DEFAULT_SFX_VOLUME = 1

function readFlag(key: string, fallback: boolean): boolean {
  const stored = localStorage.getItem(key)
  if (stored === null) return fallback
  return stored === '1'
}

function readVolume(key: string, fallback: number): number {
  const stored = localStorage.getItem(key)
  if (stored === null) return fallback
  const value = Number.parseFloat(stored)
  if (!Number.isFinite(value)) return fallback
  return Math.min(1, Math.max(0, value))
}

export class AudioManager {
  private musicEnabled = true
  private sfxEnabled = true
  private musicVolume = DEFAULT_MUSIC_VOLUME
  private sfxVolume = DEFAULT_SFX_VOLUME
  private unlocked = false
  private music: HTMLAudioElement
  private readonly sfx = new Map<SfxId, HTMLAudioElement>()

  constructor() {
    this.migrateLegacySoundSetting()
    this.musicEnabled = readFlag(MUSIC_KEY, true)
    this.sfxEnabled = readFlag(SFX_KEY, true)
    this.musicVolume = readVolume(MUSIC_VOLUME_KEY, DEFAULT_MUSIC_VOLUME)
    this.sfxVolume = readVolume(SFX_VOLUME_KEY, DEFAULT_SFX_VOLUME)

    this.music = this.createAudio(AUDIO_FILES.music, { loop: true })
    this.applyMusicVolume()
    this.sfx.set('pickup', this.createAudio(AUDIO_FILES.pickup))
    this.sfx.set('place', this.createAudio(AUDIO_FILES.place))
    this.sfx.set('drop', this.createAudio(AUDIO_FILES.drop))
    this.applySfxVolume()

    this.music.addEventListener('canplaythrough', () => {
      if (this.unlocked && this.musicEnabled) this.playMusic()
    })
  }

  private migrateLegacySoundSetting(): void {
    const legacy = localStorage.getItem(LEGACY_SOUND_KEY)
    if (legacy === null || localStorage.getItem(MUSIC_KEY) !== null) return
    const on = legacy === '1'
    localStorage.setItem(MUSIC_KEY, on ? '1' : '0')
    localStorage.setItem(SFX_KEY, on ? '1' : '0')
  }

  private createAudio(
    fileName: string,
    options: { loop?: boolean } = {},
  ): HTMLAudioElement {
    const audio = new Audio(audioUrl(fileName))
    audio.loop = options.loop ?? false
    audio.preload = 'auto'
    return audio
  }

  private applyMusicVolume(): void {
    this.music.volume = this.musicVolume
  }

  private applySfxVolume(): void {
    for (const clip of this.sfx.values()) {
      clip.volume = this.sfxVolume
    }
  }

  /** Первый клик пользователя — разблокировка autoplay в браузере */
  unlock(): void {
    if (!this.unlocked) this.unlocked = true
    if (this.musicEnabled) this.playMusic()
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled
  }

  isSfxEnabled(): boolean {
    return this.sfxEnabled
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled
    localStorage.setItem(MUSIC_KEY, enabled ? '1' : '0')
    if (enabled) {
      this.playMusic()
    } else {
      this.pauseMusic()
    }
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled
    localStorage.setItem(SFX_KEY, enabled ? '1' : '0')
  }

  toggleMusic(): boolean {
    this.setMusicEnabled(!this.musicEnabled)
    return this.musicEnabled
  }

  toggleSfx(): boolean {
    this.setSfxEnabled(!this.sfxEnabled)
    return this.sfxEnabled
  }

  getMusicVolume(): number {
    return this.musicVolume
  }

  getSfxVolume(): number {
    return this.sfxVolume
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.min(1, Math.max(0, volume))
    localStorage.setItem(MUSIC_VOLUME_KEY, String(this.musicVolume))
    this.applyMusicVolume()
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.min(1, Math.max(0, volume))
    localStorage.setItem(SFX_VOLUME_KEY, String(this.sfxVolume))
    this.applySfxVolume()
  }

  playMusic(): void {
    if (!this.musicEnabled) return
    void this.music.play().catch(() => {})
  }

  pauseMusic(): void {
    this.music.pause()
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
    if (!this.sfxEnabled) return
    const clip = this.sfx.get(id)
    if (!clip) return
    clip.volume = this.sfxVolume
    clip.currentTime = 0
    void clip.play().catch(() => {})
  }
}
