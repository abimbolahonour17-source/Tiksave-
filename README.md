# TikSave

Responsive video-saving website with a Vercel serverless API for TikTok share links and direct video-file URLs.

## Current functionality

- Responsive landing page, paste button, and download form
- TikTok links: full links and short links (tiktok.com, vm.tiktok.com, vt.tiktok.com) are sent to a server-side provider adapter at `POST /api/tiktok`
- TikTok adapter uses InterAPI's TikTok endpoint and selects an available video download link (HD preferred when marked)
- Direct MP4/WebM/MOV links can be downloaded through `POST /api/download` when their host is on the configured allowlist
- Provider secrets are never placed in frontend JavaScript
- HTTPS validation, request timeouts, error messages, no-cache API responses

## Deploy on Vercel

This repository is already connected to Vercel according to project setup. New commits to the connected deployment branch should trigger Vercel deployments automatically.

### TikTok provider setup (recommended)

1. Create an InterAPI account and obtain an API key from its dashboard.
2. In Vercel, open the TikSave project → **Settings → Environment Variables**.
3. Add `INTERAPI_API_KEY` with your provider key for Production (and Preview if you want previews to use the provider).
4. Redeploy or wait for the next commit deployment.

The provider documents a limited no-key allowance for testing, but a key is recommended for reliability and usage limits. API processing is subject to provider availability, quotas/credits, and its terms. The code can be deployed without a key; TikTok processing may work within the provider's unauthenticated limit.

### Direct video-file downloads

For `POST /api/download`, add `DOWNLOAD_ALLOWED_HOSTS` as a comma-separated list of specific approved hostnames serving direct video files. Do not use broad/untrusted hostnames. Endpoint accepts HTTPS, refuses redirects, validates video MIME types, limits files to 50 MB, and times out.

## How it works

- TikTok URL → `/api/tiktok` → provider API → signed download URL → browser download
- Direct file URL → `/api/download` → validated streaming response → browser download

TikTok links can still fail if the video is private, deleted, restricted, a slideshow, or unsupported by the provider. This does not guarantee every TikTok link will succeed.

Only download videos you own or have permission to save. Respect creator rights, platform terms, provider terms, and applicable laws.

## Repository files

- `index.html` — homepage
- `styles.css` — UI styling
- `script.js` — frontend workflow
- `api/tiktok.js` — TikTok processing provider adapter
- `api/download.js` — direct video-file download endpoint
- `docs/IMPLEMENTATION_PLAN.md` — roadmap and status
