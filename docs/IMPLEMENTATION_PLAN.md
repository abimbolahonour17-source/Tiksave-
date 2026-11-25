# TikSave — Implementation Plan

## Product scope
A lightweight video-saving website. Current implementation supports direct video file URLs from an allowlisted host; TikTok share-link downloading requires a separate permitted integration and is not available in the official API as an arbitrary-link MP4 endpoint.

## Completed
- [x] Responsive homepage and UI
- [x] Clipboard paste
- [x] Form submits to `POST /api/download`
- [x] Vercel serverless route streams direct video files
- [x] HTTPS requirement, allowlisted host, redirect rejection, video MIME checks
- [x] 50 MB max, timeout, safe filename, no-cache headers
- [x] TikTok share URLs show an honest not-yet-supported notice

## Phase 1 — Vercel deploy/config
- Import GitHub repo into Vercel.
- Set `DOWNLOAD_ALLOWED_HOSTS` to specific approved direct-file hosts.
- Redeploy and smoke-test API.
- **Acceptance:** API returns a file for an allowed direct MP4/WebM/MOV and rejects unsupported hosts, redirects, HTML, and oversized files.

## Phase 2 — TikTok authorization/provider discovery
- Review official TikTok APIs, scopes, developer approval, data portability options, platform terms, and applicable law.
- If a provider is used, review its licensing, terms, reliability, security, and data handling.
- Avoid scraper-based or access-control-bypass workflows.
- **Acceptance:** Documented permission and API contract; secrets stored in Vercel environment settings.

## Phase 3 — TikTok download integration
- Add provider adapter in serverless API (or separate API route) only after an authorized API contract is selected.
- Validate TikTok URL server-side and pass only required data to provider.
- Normalize provider response and stream/download safely.
- Add rate limits, quotas, timeout, response size cap, provider error mapping.
- **Acceptance:** Authorized test videos return actual files and non-supported links fail clearly.

## Phase 4 — Testing/security
- Tests for URL parsing, allowlist, MIME, redirects, maximum size, timeout, TikTok links.
- Add abuse/rate-limit protections; Vercel functions may require a shared store for distributed limits.
- Ensure no user URLs or secrets are logged unnecessarily.
- **Acceptance:** Security and integration tests pass.

## Phase 5 — Launch
- Configure domain/HTTPS, analytics with privacy review, monitoring, error alerts, and legal pages.
- Test phone/tablet/desktop and deployed API.
- **Acceptance:** Production smoke tests pass; rollback plan documented.

## Important limitation
TikTok share-page URLs are not direct video-file URLs. TikTok's official Display APIs provide video metadata and embed links; Data Portability API is an account data export workflow. Neither is an arbitrary public TikTok share URL downloader. The app therefore does not pretend to download those links until a compliant integration is selected and implemented.
