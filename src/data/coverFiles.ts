import { GENRES } from './cassetteCatalog'

/** Имя PNG-файла в `public/covers/` */
export function getCoverFileName(genreId: number, indexInGenre: number): string {
  return `${genreId}-${indexInGenre}.png`
}

export function getCoverImageUrl(genreId: number, indexInGenre: number): string {
  const base = import.meta.env.BASE_URL
  return `${base}covers/${getCoverFileName(genreId, indexInGenre)}`
}

/** Список всех 24 обложек — для сверки имён файлов */
export const COVER_MANIFEST = GENRES.flatMap((genre) =>
  genre.titles.map((title, i) => ({
    file: getCoverFileName(genre.id, i + 1),
    genre: genre.name,
    title,
  })),
)
