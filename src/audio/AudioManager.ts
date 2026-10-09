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
  private musicSuspended = false
  private effectContext: AudioContext | null = null
  private effectGain: GainNode | null = null
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
    if (this.effectGain) this.effectGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0
  }

  /** Первый клик пользователя — разблокировка autoplay в браузере */
  unlock(): void {
    if (!this.unlocked) this.unlocked = true
    if (!this.effectContext && typeof AudioContext !== 'undefined') {
      this.effectContext = new AudioContext()
      this.effectGain = this.effectContext.createGain()
      this.effectGain.connect(this.effectContext.destination)
      this.applySfxVolume()
    }
    if (this.effectContext?.state === 'suspended') void this.effectContext.resume().catch(() => {})
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
    this.applySfxVolume()
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
    if (!this.musicEnabled || this.musicSuspended) return
    void this.music.play().catch(() => {})
  }

  pauseMusic(): void {
    this.music.pause()
  }

  suspendMusic(suspended: boolean): void {
    this.musicSuspended = suspended
    if (suspended) this.pauseMusic()
    else if (this.unlocked) this.playMusic()
  }

  playScrape(): void { this.playNoise(0.34, 1500, 0.22) }
  playSpiderScare(): void { this.playNoise(0.55, 430, 0.3) }

  private playNoise(duration: number, frequency: number, level: number): void {
    const ctx = this.effectContext
    if (!this.unlocked || !this.sfxEnabled || !ctx || !this.effectGain) return
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (0.65 + 0.35 * Math.sin(i / ctx.sampleRate * 210))
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(frequency, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(frequency * 0.45, ctx.currentTime + duration)
    filter.Q.value = 1.8
    const envelope = ctx.createGain()
    envelope.gain.setValueAtTime(0, ctx.currentTime)
    envelope.gain.linearRampToValueAtTime(level, ctx.currentTime + 0.018)
    envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    source.connect(filter).connect(envelope).connect(this.effectGain)
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect() }
    source.start()
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
