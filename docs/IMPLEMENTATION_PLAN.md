# TikSave — Implementation Plan

## Project overview
TikSave is a simple, responsive web interface for users to submit a TikTok video URL and, once a compliant download service is integrated, save content they own or have permission to download.

## Product goals
- Make the URL-to-download workflow easy to understand and use on mobile and desktop.
- Keep the interface lightweight, accessible, and fast.
- Validate input and communicate errors clearly.
- Build a backend that protects the service from abuse and only supports lawful/authorized media workflows.

## Current repository implementation
- [x] Responsive homepage, branding, hero form, feature and how-it-works sections.
- [x] Paste-from-clipboard control.
- [x] Client-side TikTok URL validation.
- [x] Accessible status region for validation and backend-not-connected message.
- [ ] Actual video retrieval/download service.
- [ ] Automated tests and deployment pipeline.

## Phases

### Phase 1 — UI foundation (completed in this commit)
**Deliverables:** HTML, CSS, JavaScript, mobile responsive layout, link validation, clipboard paste, README.
**Acceptance criteria:** Page loads without build tooling; form validates blank, invalid, and TikTok-looking URLs; user is told the download service is not connected.

### Phase 2 — Technical/legal discovery
- Review TikTok terms, rights, privacy, and applicable local laws.
- Select a permitted API/provider or authorized media workflow.
- Document acceptable use, content ownership, retention, and user reporting.
**Acceptance criteria:** The chosen integration is documented and has an appropriate permission/licensing basis before coding.

### Phase 3 — Backend/API
- Select deployment/runtime (recommended Node.js with a maintained framework).
- Create POST endpoint accepting a URL; validate hostname and URL shape server-side.
- Avoid open-proxy behavior; allow only explicitly supported hosts and workflows.
- Enforce request rate limits, quotas, request timeouts, size limits, and safe temporary storage.
- Never expose API keys/secrets in client code; configure them in deployment environment.
- Return structured errors; ensure cleanup of temporary assets.
**Acceptance criteria:** API rejects malformed or unsupported links, limits abuse, does not retain files beyond documented need, and uses approved source access.

### Phase 4 — Frontend integration
- Connect form to backend endpoint.
- Add loading state, progress where supported, and download-ready result.
- Add retry, failure, and network error states.
- Preserve responsive and accessible behavior.
**Acceptance criteria:** User can submit a supported/authorized link and get a clear outcome; keyboard and mobile interactions work.

### Phase 5 — Quality, privacy, and security
- Add unit/integration tests for URL validation, API behavior, rate limiting, and cleanup.
- Add privacy policy, terms, contact/report flow, and clear authorization messaging.
- Check server-side SSRF protections, redirects, MIME/content type, file size, and dependency updates.
- Add logging with data minimization; avoid logging full URLs if they contain user tokens.
**Acceptance criteria:** Security review and tests pass; privacy and abuse controls are documented.

### Phase 6 — Deployment and launch
- Choose host and domain; configure HTTPS.
- Set environment variables and secrets.
- Configure monitoring, health checks, error reporting, and backups as appropriate.
- Deploy staging, test real-device UX, then launch production.
**Acceptance criteria:** Staging passes smoke tests; production health monitored and rollback procedure documented.

## Suggested stack
- Frontend: vanilla HTML/CSS/JavaScript (already in place).
- Backend: Node.js + Express or another maintained framework.
- Hosting: static frontend plus server/API host that supports the approved workflow.
- Tests: Node test runner or Vitest for frontend validation and API tests.

## Milestones
- M1: UI deployed to preview.
- M2: Integration policy and provider selected.
- M3: Backend API and security controls complete.
- M4: Frontend connected; end-to-end tests pass.
- M5: Production launch.

## Risks and mitigations
- **Platform/provider changes:** use a permitted, documented provider and keep integration isolated behind an adapter.
- **Copyright/terms:** support authorized downloads only; review policy and legal requirements before launch.
- **Abuse/cost:** rate limit, quotas, timeouts, request caps.
- **Privacy:** minimize logging, short retention, clear disclosures.
- **Security:** strict host allowlist, SSRF defenses, no arbitrary URLs, safe file handling.

## Next recommended task
Phase 2 discovery: decide which authorized TikTok workflow or media provider can support this project. The current UI intentionally does not claim to download video until that integration exists.
