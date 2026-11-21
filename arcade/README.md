# Aleen & Mansour Arcade 🎮

Family game arcade made for Aleen & Mansour — 8 fun, brain and memory games (solo, vs Robot, or two players), stars, Hall of Fame and "Beat them!" challenges.

- `index.html` — the whole app (static).
- `api/scores.js` — serverless API (GET/POST/DELETE) storing scores on **Vercel Blob**.

## Deploy on Vercel
1. Import this repo in Vercel (Framework: **Other**, no build command).
2. Storage → **Create Blob store** → connect to the project (injects `BLOB_READ_WRITE_TOKEN`).
3. Redeploy. Without Blob the arcade still works, but scores stay on each device.

Optional env: `ADMIN_PIN` (default 2026) for clearing scores via `DELETE /api/scores`.
