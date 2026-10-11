# Формат данных каталога

Все данные лежат в папке `data/` и читаются **только серверным слоем** (`server/repositories/`).
В `public/` JSON не попадает. Схемы и типы — в [`shared/types/product.ts`](../shared/types/product.ts) (zod).

```
data/
├── categories.json     # категории (id, slug, title, description)
├── taxonomy.json       # справочники: фандомы, типы изделий, цвета, теплота/сезон
└── products/
    └── product-001.json   # один товар — один файл, имя файла = id товара
public/images/products/    # фотографии товаров
```

## Товар (`data/products/<id>.json`)

| Поле | Тип | Обязательно | Описание |
| --- | --- | --- | --- |
| `id` | string | да | Совпадает с именем файла: `product-001` |
| `slug` | string | да | Адрес `/product/<slug>`: `a-z`, `0-9`, дефис. Уникален |
| `title` | string | да | Название |
| `description` | string | нет | Описание |
| `price` | integer | да | Цена в целых рублях |
| `currency` | `"RUB"` | нет | По умолчанию RUB |
| `category` | string | да | `id` из `categories.json` |
| `type` | string | да | `id` из `taxonomy.json → types` |
| `fandom` | string \| null | нет | `id` из `taxonomy.json → fandoms`; `null` — без фандома |
| `colors` | string[] | нет | `id` из `taxonomy.json → colors`; можно пусто |
| `warmth` | string \| null | нет | `id` из `taxonomy.json → warmth`; `null` — не указано |
| `availability` | `"in_stock"` \| `"made_to_order"` | да | В наличии / под заказ |
| `stock` | integer | нет | Остаток для «в наличии». **Если не указан — лимита нет** (технический потолок — 99 шт.) |
| `leadTimeDays` | `{min, max}` | нет | Срок изготовления в днях для «под заказ» |
| `images` | `{src, alt, width, height}[]` | да, ≥1 | `src` — путь от корня сайта, `alt` — осмысленное описание |
| `attributes` | `{label, value}[]` | нет | Дополнительные характеристики (материал, размер…). Показываются только те, что заданы |
| `createdAt` | `YYYY-MM-DD` | да | Для сортировки «сначала новые» |
| `isDemo` | boolean | нет | `true` — демо-товар (для него не отдаётся Schema.org-разметка) |

Если файл товара некорректен (не проходит схему, неизвестная категория/цвет, дубль id/slug), он **пропускается**, а в логе сервера появляется строка вида
`[catalog] data/products/product-007.json пропущен: ...`. Остальной каталог продолжает работать.
Если не читаются `categories.json` или `taxonomy.json`, API отвечает 500 с понятным сообщением.

## Как добавить настоящий товар

1. Положите фото в `public/images/products/` (оригинал 1200×1500 или больше, соотношение 4:5). Адаптивные версии в `public/_img/` создаются автоматически (`npm run images`, запускается перед dev/build/generate).
2. Скопируйте любой `product-XXX.json`, поменяйте поля, поставьте `"isDemo": false`.
3. Новые фандомы, цвета и типы добавляются в `taxonomy.json`, новая категория — в `categories.json`.
4. `npm run test:unit` проверит целостность данных (ссылки на справочники, существование картинок, уникальность).
5. Когда все демо-товары заменены, удалите ненужные файлы товаров и картинки. Для каждой фотографии `npm run images` сам подготовит AVIF/WebP/JPEG нужных размеров.

## Константы магазина — `shared/utils/site.ts`

`SITE_NAME`, `OWNER_NAME` (имя мастера на сайте), `TELEGRAM_USERNAME`, размеры страниц. Имя «Мари» меняется только здесь.
