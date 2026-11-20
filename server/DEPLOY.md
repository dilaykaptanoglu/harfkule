# HarfKule API — public deploy (Render)

TestFlight cannot reach `127.0.0.1`. Host this Express + SQLite API, then bake the HTTPS URL into Expo via `EXPO_PUBLIC_API_URL`.

**Yerel pass-and-play does not need the API** (offline on-device).

Free Render notes: spins down after ~15 min idle (~1 min wake); filesystem is **ephemeral** (SQLite resets on redeploy/spin-down). Fine for TestFlight MVP.

---

## Option A — Dashboard: New Web Service (recommended for Dilay)

1. Open https://dashboard.render.com and sign in.
2. **New +** → **Web Service**.
3. **Connect GitHub** (first time: authorize Render) → select **`dilaykaptanoglu/harfkule`**.
4. Settings:

| Field | Value |
| --- | --- |
| Name | `harfkule-api` |
| Region | Frankfurt (or closest) |
| Branch | `cursor/testflight-keyboard-api-839c` until PR #1 merges, then `main` |
| Root Directory | `server` |
| Runtime | **Docker** |
| Dockerfile Path | `./Dockerfile` (relative to Root Directory `server`) |
| Instance type | **Free** |

5. **Environment** (Add Environment Variable):

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/data` |

Do **not** set `PORT` — Render provides it.

6. Leave **Disk** empty (free plan cannot attach a persistent disk).
7. Click **Create Web Service** → wait until status is **Live**.
8. Copy the public URL (e.g. `https://harfkule-api.onrender.com`).
9. Smoke: open `https://YOUR-HOST/health` → `{"ok":true,"service":"harfkule-api",...}`  
   First request after idle may take ~30–60s (cold start).

### Alternate: Native Node (no Docker)

Same steps, but:

| Field | Value |
| --- | --- |
| Runtime | **Node** |
| Root Directory | `server` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Env | `NODE_ENV=production`, `DATA_DIR=./data` |

---

## Option B — Blueprint

1. **New +** → **Blueprint**
2. Repo `dilaykaptanoglu/harfkule`, branch with `render.yaml`
3. Apply → wait for `harfkule-api` Live

---

## Option C — Agent deploy via API token (no paste in chat)

1. Render Dashboard → **Account Settings** → **API Keys** → **Create API Key**
2. Cursor Dashboard → Cloud Agents → this environment → **Secrets** → add:
   - Name: `RENDER_API_KEY`
   - Value: the key (never paste into chat)
3. Tell the agent “Render secret added” — agent can create/deploy the service and write `eas.json`.

---

## After you have the HTTPS URL

1. Set both `eas.json` `EXPO_PUBLIC_API_URL` values to `https://YOUR-HOST` (no trailing slash).
2. Rebuild + TestFlight:

```bash
git pull origin main   # or the PR branch
npm ci
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit -p ios --latest --profile production
```

---

## Local API (dev only)

```bash
cd server && npm ci && npm start   # :8787
# Expo: EXPO_PUBLIC_API_URL=http://<LAN-IP>:8787 npx expo start
```

## Fly.io (optional paid/alternative)

See `fly.toml` in this folder if you prefer Fly over Render.
