# HarfKule API — public deploy

TestFlight builds cannot reach `127.0.0.1`. Host this Express + SQLite API, then bake the HTTPS URL into the Expo build via `EXPO_PUBLIC_API_URL`.

**Yerel pass-and-play does not need the API** — it stays offline on-device.

## Option A — Fly.io (recommended)

```bash
# Install: https://fly.io/docs/hands-on/install-flyctl/
cd server
fly auth login
fly apps create harfkule-api          # rename in fly.toml if taken
fly volumes create harfkule_data --region fra --size 1
fly deploy
curl -s https://harfkule-api.fly.dev/health
```

## Option B — Render (free web + disk)

1. https://dashboard.render.com → **New** → **Blueprint**
2. Select `dilaykaptanoglu/harfkule` (uses root `render.yaml`)
3. Wait for deploy → copy `https://….onrender.com`
4. Free tier may cold-start (~30s); first online login can be slow

## After you have the HTTPS URL

1. Edit root `eas.json` — replace both `EXPO_PUBLIC_API_URL` values:

```json
"EXPO_PUBLIC_API_URL": "https://YOUR-HOST"
```

2. Bump is automatic with production `autoIncrement`, or set `ios.buildNumber` in `app.json`.
3. Rebuild + TestFlight:

```bash
git pull origin main
npm ci
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit -p ios --latest --profile production
```

4. Smoke from a laptop: `curl -s https://YOUR-HOST/health` → `{"ok":true,...}`

## Local API (dev only)

```bash
cd server && npm ci && npm start   # :8787
# Expo: EXPO_PUBLIC_API_URL=http://<LAN-IP>:8787 npx expo start
```
