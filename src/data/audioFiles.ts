/** MP3 в `public/audio/` */
export const AUDIO_FILES = {
  music: 'music.mp3',
  pickup: 'pickup.mp3',
  place: 'place.mp3',
  drop: 'drop.mp3',
} as const

export type SfxId = 'pickup' | 'place' | 'drop'

export function audioUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}audio/${fileName}`
}
