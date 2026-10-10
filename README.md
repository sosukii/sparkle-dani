# Sparkle Dani

Интернет-магазин изделий ручной работы Мари. Nuxt 4 + Vue 3 + TypeScript (strict) + Tailwind CSS 4.

> Статус: идёт разработка по этапам. README дополняется по ходу работы.

## Быстрый старт

```bash
nvm use            # Node 22
npm ci
npx playwright install chromium
npm run dev        # http://localhost:3000
```

## Проверки

| Команда | Что делает |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | `nuxt typecheck` (vue-tsc) |
| `npm run test:unit` | Vitest |
| `npm run build` | production-сборка |
| `npm run test:e2e` | Playwright E2E против production-сборки (нужен `npm run build`) |
| `npm run test:visual` | Playwright screenshot-тесты |
| `npm test` | всё вышеперечисленное по порядку |

Хуки Husky: `pre-commit` гоняет весь `npm test`, `pre-push` повторяет его только если дерево коммита не проходило `pre-commit`.
Обходить хуки (`--no-verify`) без явной договорённости нельзя.

### Визуальные тесты

- Эталоны лежат в `tests/visual/__screenshots__/<платформа>/...`: macOS и Linux рисуют шрифты по-разному, поэтому у каждой платформы свои эталоны.
- Допуск — 40 пикселей и `threshold: 0.01` (почти точное сравнение цвета); относительный порог не используется, потому что на длинной странице он прячет целые строки текста.
- Упавший тест оставляет `expected`, `actual` и `diff` в `test-results/` и в HTML-отчёте (`npx playwright show-report`).
- **Эталоны не обновляются автоматически.** Сначала посмотри diff; если изменение ожидаемое, обнови осознанно: `npm run test:visual:update` и проверь `git diff` по PNG.
