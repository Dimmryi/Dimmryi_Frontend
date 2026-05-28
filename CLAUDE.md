# Project Development Rules

This file documents project-wide rules to follow consistently throughout the application.

## 1. Bilingual text support
- Every new component or page must display text in both Ukrainian and English.
- Use the existing localization infrastructure (`i18next` / `react-i18next`) and translation files under `src/locales/uk` and `src/locales/en`.
- Avoid hard-coded strings in components; always use translation keys.

## 2. Mobile-first development
- Build components and pages with mobile-first styles and layouts.
- Start with small-screen behavior, then scale up for larger breakpoints.
- Keep responsive behavior meaningful and test on narrow viewports first.

## 3. Additional rules for each iteration
- Keep UI text synchronized: update both locale files whenever a visible string changes.
- Preserve accessibility: use semantic elements, `aria-label`, and keyboard-friendly controls.
- Maintain consistent styling: prefer CSS variables, BEM-like class names, and shared global styles.
- Keep components reusable and composable: isolate logic, avoid duplication, and use small, focused files.
- Validate changes with type checking or linting before merging.
- Favor performance and simplicity: avoid unnecessary re-renders and keep animation/interaction code lightweight.
- Document any new shared behavior or conventions in this file so the team can follow it consistently.
