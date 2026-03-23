# $LIL Stats Hub

Dark-mode Next.js dashboard for the $LIL token ecosystem, hosted on Vercel with Supabase for daily snapshots.

---

## Stack

- **Next.js 14** (App Router, server components)
- **Tailwind CSS** — dark-mode UI
- **Supabase** — stores daily snapshots, provides 24h deltas
- **Vercel** — hosting + cron job (free tier)

---

## Local development

```bash
npm install
npm run dev
# → http://localhost:3000
```

Seed your first snapshot (needed for 24h deltas to appear):

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/snapshot
```

---

## Environment variables

Add all of these to your **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hggnizhesclzqbqqnkoh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
| `LIL_TOKEN_ADDRESS` | `0x22683BbaDD01473969F23709879187705a253763` |
| `DEAD_ADDRESS` | `0x000000000000000000000000000000000000dEaD` |
| `LP_ADDRESS` | `0x8acc49857A1259D25eb3CA0aa15B398D0E149EF2` |
| `AVAX_RPC_URL` | `https://api.avax.network/ext/bc/C/rpc` |
| `EVENTS_API_BASE` | `https://api.moats.app/api` |
| `MOAT_ADDRESS` | `0x7a4d20261a765bd9ba67d49fbf8189843eec3393` |
| `CRON_SECRET` | any random string — run `openssl rand -hex 32` to generate one |

---

## Supabase table

Run this once in **Supabase → SQL Editor**:

```sql
create table lil_stats (
  id          bigserial primary key,
  created_at  timestamptz default now(),
  staked      numeric not null,
  locked      numeric not null,
  burned      numeric not null,
  dead        numeric not null,
  lp          numeric not null,
  circulating numeric not null
);
```

---

## Deploy to Vercel from GitHub

```bash
# Inside the web/ folder:
git init
git remote add origin https://github.com/0xpiweb/lil-stats-hub.git
git add .
git commit -m "Initial commit: $LIL Stats Hub"
git push -u origin main
```

Then in Vercel:
1. **New Project** → Import `0xpiweb/lil-stats-hub`
2. Set **Root Directory** → `web`
3. Add all environment variables from the table above
4. Click **Deploy**

The `vercel.json` cron fires at **00:00 UTC every day**, POSTing to `/api/snapshot` to insert a new Supabase row. After two rows exist the dashboard shows 24h deltas automatically.

---

## API reference

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/stats` | GET | none | Live stats, revalidates every 60s |
| `/api/snapshot` | POST | `Authorization: Bearer <CRON_SECRET>` | Insert current stats into Supabase |
