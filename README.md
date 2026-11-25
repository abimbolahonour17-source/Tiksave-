# TikSave

A lightweight, mobile-friendly landing page for TikSave, a planned tool for saving TikTok videos users own or have permission to download.

## Current status

- Responsive landing page and visual design
- Link input and clipboard paste interaction
- Basic TikTok URL validation
- Clear UI status messages
- **Downloader backend is not implemented yet.** The current button validates a URL; it does not retrieve or download video files.

## Run locally

No build step is required.

1. Clone this repository.
2. Open `index.html` in a browser, or serve the folder with a static server.
3. Paste a TikTok URL and test the validation states.

## Files

- `index.html` — page structure and content
- `styles.css` — responsive dark/purple design
- `script.js` — paste button, validation, and status messages
- `docs/IMPLEMENTATION_PLAN.md` — phased implementation plan

## Roadmap

1. Confirm authorized content use and platform-policy/legal requirements.
2. Choose an approved media source/API and design the server-side download flow.
3. Build backend endpoint with strict URL validation, rate limits, timeouts, and safe temporary-file handling.
4. Connect frontend to backend and show progress/errors.
5. Add tests, privacy/terms, monitoring, and deploy.

## Responsible use

TikSave should only support downloads of videos the user owns or is authorized to save. Respect creators' rights, TikTok's terms, and applicable law. Do not bypass access controls or download restricted content.
