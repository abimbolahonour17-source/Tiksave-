# TikSave

Responsive video-download landing page with clipboard paste and a Vercel serverless API for downloading **direct video-file URLs from approved hosts**.

## Current functionality

- Responsive UI, link form, clipboard paste
- Frontend submits to `POST /api/download`
- Vercel serverless endpoint streams direct video files to the browser
- Host allowlist (`DOWNLOAD_ALLOWED_HOSTS`) required
- HTTPS-only, redirect-denied, video MIME validation, 50 MB cap, request timeout
- TikTok share links are currently **not downloaded**. They are explicitly rejected; the official TikTok developer APIs provide video metadata/display and data-export flows, not an arbitrary share-link-to-MP4 endpoint. Add a permitted provider/authorized account-export integration before enabling that feature.

## Deploy on Vercel

1. Import this GitHub repo into Vercel.
2. Set Framework Preset to **Other** (no build command; static files plus serverless API).
3. In Project → Settings → Environment Variables, add:
   - `DOWNLOAD_ALLOWED_HOSTS`: comma-separated approved hostnames that serve direct video files, e.g. hosts you control or have permission to use.
4. Redeploy after adding environment variables.
5. Open the deployed site and test with a direct HTTPS MP4/WebM/MOV file on an allowlisted host.

**Do not** set this allowlist to broad, untrusted hosts. The endpoint refuses TikTok page/share URLs, IP literals, local hosts, redirects, non-video content, and files larger than 50 MB.

## Local testing

Run using a local Vercel environment (recommended) with `vercel dev` after installing the Vercel CLI. The API endpoint is `/api/download`.

## Repository files

- `index.html` — homepage
- `styles.css` — UI styling
- `script.js` — frontend download workflow
- `api/download.js` — Vercel serverless download endpoint
- `docs/IMPLEMENTATION_PLAN.md` — roadmap

## Responsible use

Only download videos you own or are authorized to save. Respect creators' rights, applicable laws, and platform terms.
