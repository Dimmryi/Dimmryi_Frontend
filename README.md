# Дім мрії — React + Vite + TypeScript

Цей репозиторій містить адаптовану версію дизайну з початкової HTML/CSS/JS збірки у React + Vite + TypeScript.

## Структура

- `src/` — основний код React
- `src/components/` — UI-компоненти
- `src/store/` — Redux Toolkit стан
- `src/styles/globals.css` — оригінальні стилі
- `.env` — змінні середовища Vite
- `vitest.config.ts` — конфігурація тестів

## Команди

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm test
pnpm test:coverage
pnpm typecheck
```

## Налаштування

- Змінні середовища для Vite повинні починатися з `VITE_`
- `src/setupTests.ts` імпортує `@testing-library/jest-dom`
- `.gitignore` уже виключає `node_modules`, `dist`, `.env` та інші побічні файли

## Тестування

У репозиторії є приклад тесту `src/App.test.tsx`, який перевіряє рендер головного заголовка.

## Примітки

- Панель налаштувань (`TweaksPanel`) тепер відкрита за замовчуванням
- Внутрішні стилі з `styles.css` збережені у `src/styles/globals.css`
- `vite.config.ts` та `vitest.config.ts` налаштовані для браузерного середовища (`jsdom`)
