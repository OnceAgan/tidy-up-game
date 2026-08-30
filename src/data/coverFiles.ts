import { GENRES, PARTS_PER_SERIES } from './cassetteCatalog'

/** Имя PNG-файла в `public/covers/` (одна обложка на всю серию) */
export function getCoverFileName(genreId: number, seriesIndex: number): string {
  return `${genreId}-${seriesIndex}.png`
}

export function getCoverImageUrl(genreId: number, seriesIndex: number): string {
  const base = import.meta.env.BASE_URL
  return `${base}covers/${getCoverFileName(genreId, seriesIndex)}`
}

/** Список обложек серий — для сверки имён файлов */
export const COVER_MANIFEST = GENRES.flatMap((genre) =>
  genre.titles.map((title, i) => ({
    file: getCoverFileName(genre.id, i + 1),
    genre: genre.name,
    title,
    parts: PARTS_PER_SERIES,
  })),
)
