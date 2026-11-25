# TikSave

Responsive video-saving website with a Vercel serverless API for public TikTok share links and direct video-file URLs.

## Current functionality

- Responsive landing page, paste button, and download form
- TikTok links: full links and short links (tiktok.com, vm.tiktok.com, vt.tiktok.com) are sent to `POST /api/tiktok`
- TikTok processing uses TikWM's public endpoint (no TikSave API key or provider credits are required)
- Prefers HD video URL when available, falls back to standard video URL
- Direct MP4/WebM/MOV links can be downloaded through `POST /api/download` when their host is on the configured allowlist
- HTTPS validation, request timeout, error messages, and no-cache API responses

## Deploy on Vercel

The repository is connected to Vercel according to project setup. New commits to the connected deployment branch should trigger deployments automatically.

No TikTok provider API key is required for TikWM integration. TikWM is an independent third-party service; its public endpoint can impose rate limits, change behavior, or become unavailable. This is not a guarantee of unlimited or permanent free usage.

### Direct video-file downloads

For `POST /api/download`, add `DOWNLOAD_ALLOWED_HOSTS` as a comma-separated list of specific approved hostnames serving direct video files. Do not use broad or untrusted hostnames. Endpoint accepts HTTPS, refuses redirects, validates video MIME types, limits files to 50 MB, and times out.

## How it works

- TikTok URL → `/api/tiktok` → TikWM public resolver → direct video URL → browser download
- Direct file URL → `/api/download` → validated streaming response → browser download

TikTok links can still fail if the video is private, deleted, restricted, a slideshow, or unsupported by TikWM. This does not guarantee every TikTok link will succeed.

Only download videos you own or have permission to save. Respect creator rights, platform terms, third-party service terms, and applicable laws.

## Repository files

- `index.html` — homepage
- `styles.css` — UI styling
- `script.js` — frontend workflow
- `api/tiktok.js` — TikTok processing adapter (TikWM)
- `api/download.js` — direct video-file download endpoint
- `docs/IMPLEMENTATION_PLAN.md` — roadmap and status
