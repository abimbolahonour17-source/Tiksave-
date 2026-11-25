# TikSave — Implementation Plan

## Product
A video-saving landing page with TikTok link processing and direct-file downloads, hosted on Vercel and maintained in GitHub.

## Completed in repository
- [x] Responsive homepage and clipboard paste
- [x] Frontend routes TikTok links to `POST /api/tiktok`
- [x] Server-side TikTok resolver adapter (no provider secret in browser)
- [x] Supports full TikTok URLs and vm./vt. short-link hostnames
- [x] Uses TikWM public endpoint; no TikSave API key or credits configured
- [x] Prefers HD media link and falls back to standard media link
- [x] Returns download URL to browser
- [x] Direct file download endpoint remains available with allowlist, HTTPS, no redirects, MIME validation, 50 MB cap, and timeout
- [x] Error and timeout messaging

## Deploy configuration
- GitHub repository is connected to Vercel; commits to the deployment branch should auto-deploy.
- No TikTok provider API key is needed for TikWM integration.
- Optional for direct-file downloads: `DOWNLOAD_ALLOWED_HOSTS` (comma-separated specific approved hosts).

## TikTok processing flow
1. Browser posts the pasted TikTok URL to `/api/tiktok`.
2. API validates HTTPS URL and TikTok host (including short-link domains).
3. API sends a form POST to TikWM's public endpoint.
4. API checks for a successful video result, rejects photo slideshows, and chooses HD or standard video URL.
5. Browser starts download from the returned media URL.

## Limitations
- TikWM is a third-party service; rate limits, availability, endpoint changes, and terms apply. No guarantee of unlimited free usage.
- Private, deleted, age-restricted, slideshow, or otherwise unsupported posts may fail.
- This is not an official TikTok API integration.
- Download only content you are authorized to save.

## Test checklist after deployment
- [ ] Paste a full public TikTok link and try download
- [ ] Paste a vm.tiktok.com or vt.tiktok.com short link
- [ ] Try a private/deleted post (expect a clear error)
- [ ] Try malformed and non-TikTok URLs on the TikTok route (expect 400)
- [ ] Test direct-file endpoint with an approved direct MP4 link
- [ ] Verify production Vercel deployment logs contain no secrets
