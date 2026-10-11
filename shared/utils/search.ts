import type { Availability } from '../types/product'
import type { SortKey } from '../types/catalog'

/**
 * Лёгкий поиск без внешних библиотек и серверов: нормализация, упрощённая русская основа слова,
 * словарь синонимов и разбор «намерений» вроде «в наличии» или «до 2000».
 * Для каталога из сотен товаров работает за доли миллисекунды и не добавляет вес сайту.
 */

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'“”.,;:!?()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP_WORDS = new Set([
  'в', 'во', 'на', 'и', 'с', 'со', 'по', 'для', 'или', 'а', 'у', 'к', 'о', 'об', 'за', 'из', 'не', 'но',
  'мне', 'как', 'где', 'что', 'это', 'какой', 'какая', 'какие', 'есть', 'ли', 'мой', 'можно', 'хочу',
  'нужно', 'нужен', 'нужна', 'ваш', 'вас', 'у вас', 'мне', 'пожалуйста',
])

// Окончания, от самых длинных к коротким. Основа не короче 4 букв, чтобы не склеивать разные слова.
const ENDINGS = [
  'ыми', 'ими', 'ого', 'его', 'ому', 'ему', 'ами', 'ями',
  'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ый', 'ий', 'ой', 'ых', 'их', 'ым', 'им', 'ом', 'ем', 'ам', 'ям', 'ах', 'ях',
  'ов', 'ев', 'ей', 'ию', 'ью', 'ия', 'ья', 'ье', 'ки', 'ка', 'ку', 'ке', 'ок', 'ть', 'ти',
  'а', 'я', 'о', 'е', 'ы', 'и', 'у', 'ю', 'ь', 'й',
]

export function stem(word: string): string {
  if (word.length <= 4) return word
  for (const ending of ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= 4) return word.slice(0, -ending.length)
  }
  return word
}

export function wordsOf(text: string): string[] {
  return normalizeText(text).split(/[^a-zа-я0-9]+/).filter(Boolean)
}

/** Группы слов, означающих одно и то же. Только самые частые названия — словарь легко дополнять. */
const SYNONYM_GROUPS: string[][] = [
  ['серьги', 'серьга', 'сережки', 'сережка', 'серги'],
  ['шапка', 'шапки', 'шапочка', 'шапочки', 'бини', 'колпак'],
  ['варежки', 'варежка', 'рукавицы', 'рукавички'],
  ['шарф', 'шарфы', 'шарфик', 'шарфики', 'снуд'],
  ['игрушка', 'игрушки', 'игрушечный', 'мягкая', 'плюшевая', 'плюшевый', 'амигуруми'],
  ['брелок', 'брелки', 'брелочек', 'подвеска'],
  ['сумка', 'сумки', 'сумочка', 'сумочки', 'шоппер', 'торба'],
  ['косметичка', 'косметички', 'пенал', 'футляр', 'чехол'],
  ['плед', 'пледы', 'одеяло', 'покрывало'],
  ['костер', 'костеры', 'подставка', 'подставки', 'подстаканник'],
  ['браслет', 'браслеты', 'браслетик'],
  ['мишка', 'мишки', 'медведь', 'медвежонок', 'мишутка'],
  ['зайка', 'зайки', 'заяц', 'зайчик', 'кролик', 'крольчонок'],
  ['кот', 'коты', 'котик', 'котики', 'кошка', 'кошки', 'котенок'],
  ['сова', 'совы', 'совушка'],
  ['тепло', 'теплый', 'теплая', 'теплое', 'теплые', 'зима', 'зимний', 'зимняя', 'зимой', 'зимнее', 'холодно'],
  ['легкий', 'легкая', 'легкое', 'летний', 'летняя', 'лето', 'летом'],
  ['демисезон', 'демисезонный', 'демисезонное', 'осень', 'осенний', 'весна', 'весенний'],
  ['розовый', 'розовая', 'розовые', 'пудровый'],
  ['красный', 'красная', 'красные', 'алый', 'бордовый'],
  ['голубой', 'голубая', 'синий', 'синяя', 'небесный'],
  ['сиреневый', 'сиреневая', 'фиолетовый', 'фиолетовая', 'лавандовый', 'лиловый'],
  ['мятный', 'мятная', 'бирюзовый', 'бирюзовая'],
  ['зеленый', 'зеленая', 'салатовый', 'хвойный'],
  ['желтый', 'желтая', 'золотой', 'золотистый'],
  ['бежевый', 'бежевая', 'кремовый', 'молочный'],
  ['белый', 'белая', 'белые', 'снежный'],
  ['черный', 'черная', 'черные'],
  ['коричневый', 'коричневая', 'шоколадный'],
  ['серый', 'серая', 'серые'],
]

const synonymIndex = new Map<string, string[]>()
for (const group of SYNONYM_GROUPS) {
  const stems = [...new Set(group.map((w) => stem(normalizeText(w))))]
  for (const s of stems) synonymIndex.set(s, stems)
}

/** Все основы, которые считаем «тем же словом», включая синонимы. */
export function expandStem(word: string): string[] {
  const s = stem(word)
  return synonymIndex.get(s) ?? [s]
}

/** Слово запроса `s` подходит к слову из текста `h` (короткие — только точно, длинные — по началу). */
export function stemMatches(s: string, h: string): boolean {
  return s.length < 4 ? h === s : h.startsWith(s)
}

export interface QueryIntent {
  /** Для каждого значимого слова запроса — допустимые основы (слово и его синонимы). */
  groups: string[][]
  availability?: Availability
  minPrice?: number
  maxPrice?: number
  sort?: SortKey
}

const PRICE = '(\\d[\\d\\s]*\\d|\\d)(?:\\s*(тысяч\\w*|тыс\\w*|к\\b))?(?:\\s*(?:₽|руб\\w*|р\\b))?'
const cache = new Map<string, QueryIntent>()

function toNumber(digits: string, thousands?: string): number {
  return Number(digits.replace(/\s/g, '')) * (thousands ? 1000 : 1)
}

/** Разбирает запрос: вытаскивает «в наличии», «под заказ», «до 2000», «дешёвые» и оставляет слова для поиска. */
export function analyzeQuery(query: string): QueryIntent {
  const hit = cache.get(query)
  if (hit) return hit
  let text = ` ${normalizeText(query)} `
  const intent: QueryIntent = { groups: [] }

  const take = (re: RegExp, apply: (m: RegExpMatchArray) => void) => {
    const m = text.match(re)
    if (m) {
      apply(m)
      text = text.replace(re, ' ')
    }
  }
  take(/ (?:есть )?в наличии | налич\w+ | готов\w+ | сразу /, () => { intent.availability = 'in_stock' })
  take(/ (?:под|на) заказ /, () => { intent.availability = 'made_to_order' })
  take(new RegExp(` до ${PRICE} `), (m) => { intent.maxPrice = toNumber(m[1]!, m[2]) })
  take(new RegExp(` от ${PRICE} `), (m) => { intent.minPrice = toNumber(m[1]!, m[2]) })
  take(/ (?:недорог\w+|дешев\w+|бюджетн\w+) /, () => { intent.sort = 'price-asc' })
  take(/ (?:дорог\w+|эксклюзив\w*) /, () => { intent.sort = 'price-desc' })

  const seen = new Set<string>()
  for (const word of wordsOf(text)) {
    if (STOP_WORDS.has(word) || /^\d+$/.test(word)) continue
    const stems = expandStem(word)
    const key = stems.join('|')
    if (seen.has(key)) continue
    seen.add(key)
    intent.groups.push(stems)
  }
  if (cache.size > 200) cache.clear()
  cache.set(query, intent)
  return intent
}

/** Все слова текста → основы (для индекса товара). */
export function stemsOfText(text: string): string[] {
  return [...new Set(wordsOf(text).map(stem))]
}

export function matchesAllGroups(indexStems: string[], groups: string[][]): boolean {
  return groups.every((alternatives) => alternatives.some((s) => indexStems.some((h) => stemMatches(s, h))))
}
