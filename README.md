# 🎮 GameVault

A mobile-first, installable (PWA) app for tracking your personal video game collection.

- **Frontend:** Vue 3 (`<script setup>`) + Vite + vite-plugin-pwa + lucide-vue-next
- **Backend:** Express (ES modules) REST API
- **Database:** Neon serverless Postgres via `@neondatabase/serverless`

```
Game Vault/
├── backend/                Express API  (BACKEND)
│   ├── db/
│   │   ├── schema.sql      users, password_resets, games tables + indexes
│   │   ├── migrate.js      npm run db:schema  (applies schema.sql)
│   │   └── seed.js         npm run db:seed    (8 sample games for an account)
│   ├── src/
│   │   ├── index.js        app, CORS, JSON error handler
│   │   ├── db.js           Neon client
│   │   ├── validate.js     input validation
│   │   ├── auth.js         login tokens (JWT) + requireAuth middleware
│   │   ├── mailer.js       password reset emails (SMTP optional)
│   │   └── routes/         auth.js, games.js, stats.js
│   └── .env.example
└── frontend/               Vue 3 app    (FRONTEND)
    ├── public/             favicon + generated PWA icons
    ├── src/
    │   ├── App.vue
    │   ├── api.js          fetch wrapper (uses VITE_API_URL)
    │   ├── composables/    useTheme, useToast
    │   └── components/     StatsCards, ProgressBar, Toolbar, GameCard, GameList,
    │                       GameFormModal, ThemeToggle, EmptyState,
    │                       BaseSheet, ConfirmDialog, ToastContainer
    ├── vite.config.js      PWA manifest + service worker
    ├── capacitor.config.json
    └── .env.example
```

---

## 1. Create the Neon database

1. Sign in at <https://console.neon.tech> and click **New Project**. Pick a region close to where you will host the API (e.g. `US East (Ohio)` for Render's Ohio region).
2. On the project dashboard click **Connect**, keep **Pooled connection** turned on, and copy the connection string. It looks like:
   ```
   postgresql://neondb_owner:****@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. You can create the table in either of two ways:
   - **From this repo (recommended):** run `npm run db:schema` (see step 2 below).
   - **From the Neon Console:** open **SQL Editor**, paste `backend/db/schema.sql`, and run it.

## 2. Run locally

Requires **Node.js 20+**.

### API

```bash
cd backend
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
npm install
npm run db:schema           # create the tables (safe to re-run)
npm run dev                 # http://localhost:4000
```

Open the app, click **Create an account**, then optionally add sample games to it:

```bash
npm run db:seed                                   # seeds the first account
npm run db:seed -- --email you@example.com        # or a specific account
npm run db:seed -- --email you@example.com --force  # wipe that account's games and reseed
```

### Accounts

- Every game belongs to an account; each user only sees their own collection.
- Games created before accounts existed are given to the **first** account that registers.
- **Forgot password:** if `SMTP_HOST` is not set, the reset link is printed in the backend terminal instead of being emailed. Links expire after 1 hour and work once.

### Google sign-in (optional)

1. Open <https://console.cloud.google.com>, create (or pick) a project.
2. **APIs & Services → OAuth consent screen**: choose **External**, fill in the app name and your email, and save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**.
4. Under **Authorized JavaScript origins** add every address the frontend runs on:
   - `http://localhost:3000` and `http://localhost`
   - your live URL, e.g. `https://gamevault.vercel.app`

   No redirect URIs are needed.
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`) into both:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/.env` → `NUXT_PUBLIC_GOOGLE_CLIENT_ID=...`
6. Restart both servers. A **Sign in with Google** button appears on the login and register pages.

Signing in with Google links to an existing account with the same email, or creates a new one. Google-only accounts can add a password later with **Forgot password?**.

> Google blocks its sign-in inside embedded app webviews, so the button works in browsers and the installed PWA but not in the Capacitor Android/iOS build.

### Client

In a second terminal:

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173
```

To test on your phone, run `npm run dev -- --host` and open the printed network URL. Set `VITE_API_URL` to your computer's LAN IP (e.g. `http://192.168.1.20:4000`) so the phone can reach the API.

### Environment variables

| File | Variable | Description |
| --- | --- | --- |
| `backend/.env` | `DATABASE_URL` | Neon connection string |
| | `PORT` | API port (default `4000`; Render sets it for you) |
| | `CORS_ORIGIN` | Comma-separated allowed origins. Empty means allow all |
| | `JWT_SECRET` | Long random string used to sign login tokens (required) |
| | `FRONTEND_URL` | Frontend address, used in password reset links (default `http://localhost:3000`) |
| | `GOOGLE_CLIENT_ID` | Optional: Google OAuth Client ID. Empty turns Google sign-in off |
| | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional: send reset emails through SMTP (e.g. Gmail app password, Brevo, Resend) |
| `frontend/.env` | `VITE_API_URL` | API base URL without `/api`, e.g. `https://gamevault-api.onrender.com` |

`VITE_*` variables are baked in at **build time**, so rebuild or redeploy the client after changing them.

## 3. API reference

All responses are JSON. Errors look like `{ "error": "message" }` and use the matching 4xx/5xx status.

Everything except `/api/auth/*` and `/api/health` needs an `Authorization: Bearer <token>` header. The token comes from register, login or reset-password and lasts 7 days.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password }` (password 8+ chars). Returns `201 { token, user }` |
| POST | `/api/auth/login` | `{ email, password }`. Returns `{ token, user }` |
| POST | `/api/auth/google` | `{ credential }` (ID token from the Google button). Returns `{ token, user }`, `201` if the account is new |
| GET | `/api/auth/me` | The logged-in user |
| POST | `/api/auth/forgot-password` | `{ email }`. Sends a reset link; always returns the same message |
| POST | `/api/auth/reset-password` | `{ token, password }`. Returns `{ token, user }` |
| GET | `/api/games?q=&status=&favorite=1&sort=` | List games. `q` is a case-insensitive title search. `status` is one of `backlog`, `playing`, `completed`, `dropped`. `favorite=1` shows favorites only. `sort` is `newest` (default), `oldest`, `title`, `rating` or `hours` |
| GET | `/api/games/:id` | Get one game |
| POST | `/api/games` | Create a game. `title` is required. Returns `201` |
| PATCH | `/api/games/:id` | Update any of: `title, platform, genre, status, favorite, rating, hours_played, cover_url, notes` |
| DELETE | `/api/games/:id` | Delete a game. Returns `204` |
| GET | `/api/stats` | `{ total, favorites, completed, playing, backlog, hours, avg_rating, rated, by_status, by_platform, by_genre, most_played }` |
| GET | `/api/discover` | Suggested games (`backend/src/data/catalog.js`) with descriptions and official store links, marked `in_vault`, plus `recommended` slugs based on the user's genres |
| GET | `/api/health` | Health check |

Example:

```bash
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Celeste","platform":"PC","genre":"Platformer","rating":5}'
```

## 4. Deploy

### API on Render

1. Push this repo to GitHub.
2. In Render choose **New → Web Service** and connect the repo.
3. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Under **Environment**, add:
   - `DATABASE_URL`: your Neon pooled connection string
   - `CORS_ORIGIN`: your Vercel URL, e.g. `https://gamevault.vercel.app` (you can set this after step 5)
   - `JWT_SECRET`: a long random string (Render's **Generate** button works)
   - `FRONTEND_URL`: your Vercel URL, so reset links point to the live app
   - `SMTP_*` / `MAIL_FROM`: needed in production so reset emails are actually sent
5. Deploy, then note the URL, e.g. `https://gamevault-api.onrender.com`.

> Render free instances sleep when idle, so the first request after a pause can take about 30 seconds.

### Frontend on Vercel

1. In Vercel choose **Add New → Project** and import the same GitHub repo.
2. Configure the project:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Nuxt.js (auto-detected; build `npm run build`)
3. Under **Environment Variables**, add:
   - `NUXT_PUBLIC_API_URL`: your Render URL without `/api` and without a trailing slash, e.g. `https://gamevault-api.onrender.com`
   - `NUXT_PUBLIC_GOOGLE_CLIENT_ID`: same value as the backend's `GOOGLE_CLIENT_ID` (optional)
4. Deploy and note the URL, e.g. `https://gamevault.vercel.app`.
5. Back in **Render → Environment**, set `CORS_ORIGIN` and `FRONTEND_URL` to that Vercel URL. Render redeploys automatically.
6. In **Google Cloud → Clients → your client → Authorized JavaScript origins**, add the Vercel URL so Google sign-in works there.

### Install as an app (PWA)

After deploying over HTTPS:

- **Android / Chrome:** open the site, then use the menu → **Install app**.
- **iOS / Safari:** tap Share → **Add to Home Screen**.

The service worker precaches the app shell and keeps the last API responses, so the list still shows while offline (read-only).

To change the icon, edit `frontend/public/favicon.svg` and run `npm run generate-pwa-assets`.

## 5. Optional: native Android/iOS with Capacitor

`frontend/capacitor.config.json` is already set up (`webDir: dist`).

```bash
cd frontend
npm install @capacitor/core
npm install -D @capacitor/cli
npm install @capacitor/android @capacitor/ios   # choose the platforms you need

# Set VITE_API_URL to your deployed HTTPS API first; localhost won't work on a device.
npm run build
npx cap add android        # and/or: npx cap add ios   (requires macOS + Xcode)
npx cap sync
npx cap open android       # opens Android Studio
```

After later changes, run `npm run cap:sync`. Also add `https://localhost` (Android) and `capacitor://localhost` (iOS) to the API's `CORS_ORIGIN`.

## Features

- Stat cards (2×2 on phones, 4 across on desktop) and a collection progress bar
- Debounced title search, status filter, and add, edit, and delete (delete asks for confirmation)
- One-tap favorite toggle with optimistic update
- Bottom-sheet form on mobile, centered modal on desktop
- Loading skeletons, toast notifications, and an empty state
- Dark theme by default, with a light/dark toggle that is remembered
- 44px touch targets, safe-area insets, no horizontal scroll, and reduced-motion support
- Parameterized SQL everywhere; PATCH column names come from a whitelist
