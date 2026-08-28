export type GenreDef = {
  id: number
  name: string
  /** Короткая метка на обложке */
  tag: string
  accent: number
  secondary: number
  titles: readonly string[]
}

export const GENRES: readonly GenreDef[] = [
  {
    id: 0,
    name: 'Боевики',
    tag: 'БОЕВИК',
    accent: 0xd94a3a,
    secondary: 0xff8c42,
    titles: [
      'Ночной Патруль ’89',
      'Последний Рейс',
      'Улицы Без Закона',
      'Операция «Север»',
      'Стальной Кулак',
      'Погоня по Магистрали',
    ],
  },
  {
    id: 1,
    name: 'Научная фантастика',
    tag: 'SCI-FI',
    accent: 0x2a5a9e,
    secondary: 0x5ec8e8,
    titles: [
      'Орбита Забвения',
      'Сигнал с Титана',
      'Хроники Купола',
      'Андроид 7',
      'Звёздный Карантин',
      'Машина Времени: Пилот',
    ],
  },
  {
    id: 2,
    name: 'Спортивные игры',
    tag: 'СПОРТ',
    accent: 0x2d7a45,
    secondary: 0x8fd460,
    titles: [
      'Кубок Наций ’92',
      'Ралли: Горный Этап',
      'Хоккей: Матч Звёзд',
      'Бокс: Титульный Бой',
      'Футбол: Дерби Сезона',
      'Олимпиада: Лучшие Моменты',
    ],
  },
  {
    id: 3,
    name: 'Мультфильмы',
    tag: 'МУЛЬТ',
    accent: 0xe8a820,
    secondary: 0xff6b9d,
    titles: [
      'Лесная Школа',
      'Приключения Карандаша',
      'Космический Кот',
      'Сказки на Ночь, вып. 3',
      'Город Игрушек',
      'Радужный Мост',
    ],
  },
] as const

export type CassetteDef = {
  genreId: number
  title: string
  /** 1…6 внутри жанра — для номера на обложке */
  indexInGenre: number
}

export function buildCassettePool(): CassetteDef[] {
  const pool: CassetteDef[] = []
  for (const genre of GENRES) {
    genre.titles.forEach((title, i) => {
      pool.push({ genreId: genre.id, title, indexInGenre: i + 1 })
    })
  }
  return pool
}

export function getGenre(genreId: number): GenreDef {
  return GENRES[genreId % GENRES.length]
}
