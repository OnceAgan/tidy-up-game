/** PNG или JPG в `public/textures/` */
export const ROOM_TEXTURE_FILES = {
  floor: 'floor.jpg',
  wallpaper: 'wallpaper.jpg',
  picture: (index: 1 | 2 | 3 | 4 | 5) => `picture-${index}.jpg`,
} as const

export function roomTextureUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}textures/${fileName}`
}
