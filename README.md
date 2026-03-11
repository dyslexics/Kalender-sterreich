<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Österreich Kalender 2026 – Entwicklung & Start

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1LyDRv-uVkqp12EjMeSUZRhaV_96tmvZ_

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Setzen Sie `GEMINI_API_KEY` in [.env.local](.env.local) auf Ihren Gemini API Key (`API_KEY` wird als Fallback weiterhin unterstützt).
3. Run the app:
   `npm run dev`


## Checks

- `npm run check:html-entry` prüft, dass `index.html` den Vite-Entry (`/index.tsx`) enthält.
