<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8c9d0dd8-32df-4507-9ebd-7eb3c37be9d6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase database

The app stores recognition history and preferences in Supabase. Each browser gets
its own anonymous account, and row-level security restricts its records to that
account. Enable **Allow anonymous sign-ins** in the Supabase project's
Authentication settings, then run [`supabase/schema.sql`](./supabase/schema.sql)
in the Supabase SQL Editor.

Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from the Supabase project's API settings. These are
public client credentials; do not use or expose the service-role key. Restart
the development server after changing environment variables. Settings and saved
recognition results are then synced to the database.

## Gesture customization

Open **Settings → Custom Gesture Controls** to choose pinch, index-only, or
peace-sign drawing. The selected pose is shared by Live Detection and the
Calligraphy workspace. An optional eye-blink shortcut can save the current
result or clear the Live Detection canvas. Blink detection uses MediaPipe Face
Mesh locally in the browser while the webcam is active; camera frames are not
sent to the app's AI endpoint for blink detection.

## Deploy to Vercel

Import this project directory in Vercel and use the default build settings from
`vercel.json`. Add `GEMINI_API_KEY` as an environment variable in the Vercel
project settings to enable cloud AI features. Also configure
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel and redeploy to
enable database persistence. The app can be deployed without those credentials,
but database-backed features will show a configuration error. The app can be
deployed without the Gemini key, but endpoints that call Gemini will not work.
