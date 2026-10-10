export const PARTS_PER_SERIES = 5
export const SERIES_PER_GENRE = 6

export type GenreDef = {
  id: number
  name: string
  /** Короткая метка на обложке */
  tag: string
  accent: number
  secondary: number
  titles: readonly string[]
  coverStyle?: 'illustrated'
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
  {
    id: 4, name: 'Детективы', tag: 'ДЕТЕКТИВ', accent: 0x705383, secondary: 0xd6bc89,
    coverStyle: 'illustrated',
    titles: ['Дело о синем конверте', 'Последний поезд в туман', 'Тень на пятом этаже',
      'Ключ от комнаты 17', 'Город без свидетелей', 'Полночь на набережной'],
  },
  {
    id: 5, name: 'Приключения', tag: 'ПРИКЛЮЧЕНИЯ', accent: 0x197c83, secondary: 0xf2b071,
    coverStyle: 'illustrated',
    titles: ['Остров ветров', 'Карта забытого моря', 'За перевалом облаков',
      'Сокровища красных дюн', 'Дорога к маяку', 'Экспедиция «Аврора»'],
  },
  {
    id: 6, name: 'Музыка', tag: 'МУЗЫКА', accent: 0xad396c, secondary: 0x75cde0,
    coverStyle: 'illustrated',
    titles: ['Неон после дождя', 'Джаз на крыше', 'Сторона Б: лето',
      'Полночный винил', 'Синтезатор мечты', 'Последний бис'],
  },
  {
    id: 7, name: 'Мистика', tag: 'МИСТИКА', accent: 0x42665a, secondary: 0xb296cc,
    coverStyle: 'illustrated',
    titles: ['Дом, который помнит', 'Шёпот за дверью', 'Лунный сад',
      'Письма из ниоткуда', 'Часовня у озера', 'Тринадцатая свеча'],
  },
] as const

export const TOTAL_CASSETTES = GENRES.reduce((total, genre) => total + genre.titles.length * PARTS_PER_SERIES, 0)

export type CassetteDef = {
  genreId: number
  title: string
  /** 1…6 — серия (ячейка на полке) */
  seriesIndex: number
  /** 1…5 — часть внутри серии */
  part: number
}

export function buildCassettePool(): CassetteDef[] {
  const pool: CassetteDef[] = []
  for (const genre of GENRES) {
    genre.titles.forEach((title, i) => {
      const seriesIndex = i + 1
      for (let part = 1; part <= PARTS_PER_SERIES; part++) {
        pool.push({ genreId: genre.id, title, seriesIndex, part })
      }
    })
  }
  return pool
}

export function getGenre(genreId: number): GenreDef {
  return GENRES[genreId % GENRES.length]
}

export function formatCassetteLabel(title: string, part: number): string {
  return `${title} — ч. ${part}`
}
