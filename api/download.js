// Vercel Node.js serverless endpoint: POST { "url": "https://approved-host/path/video.mp4" }
const MAX_BYTES = 50 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]);

function sendJson(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
function safeFilename(url, contentType) {
  const raw = url.pathname.split("/").filter(Boolean).pop() || "video";
  let name = raw.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  if (!/\.(mp4|webm|mov|m4v)$/i.test(name)) {
    const ext = contentType === "video/webm" ? ".webm" : contentType === "video/quicktime" ? ".mov" : ".mp4";
    name = (name.replace(/\.[^.]*$/, "") || "video") + ext;
  }
  return name;
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Use POST for downloads." });
  }
  const hosts = (process.env.DOWNLOAD_ALLOWED_HOSTS || "")
    .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!hosts.length) {
    return sendJson(res, 503, { error: "Direct downloads are not configured yet. Add DOWNLOAD_ALLOWED_HOSTS in Vercel settings." });
  }
  const body = req.body || {};
  const input = typeof body.url === "string" ? body.url.trim() : "";
  if (!input || input.length > 2048) return sendJson(res, 400, { error: "Please provide a valid video URL." });

  let url;
  try { url = new URL(input); } catch { return sendJson(res, 400, { error: "The URL is invalid." }); }
  if (url.protocol !== "https:" || url.username || url.password) {
    return sendJson(res, 400, { error: "Only public HTTPS links without credentials are accepted." });
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") ||
      /^\d+(\.\d+){3}$/.test(hostname) || hostname.includes(":")) {
    return sendJson(res, 400, { error: "Local and IP-address URLs are not accepted." });
  }
  if (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")) {
    return sendJson(res, 422, { error: "TikTok share links are not direct video files. TikSave needs an authorized TikTok download provider or official account export to support these links." });
  }
  if (!hosts.some((allowed) => hostname === allowed || hostname.endsWith("." + allowed))) {
    return sendJson(res, 403, { error: "This host is not on TikSave’s download allowlist. Configure DOWNLOAD_ALLOWED_HOSTS in Vercel for approved file hosts." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(url, { method: "GET", redirect: "manual", signal: controller.signal });
    if (upstream.status >= 300 && upstream.status < 400) {
      return sendJson(res, 502, { error: "The file host redirected the request. Redirects are disabled for safety." });
    }
    if (!upstream.ok) return sendJson(res, 502, { error: "The video host returned an error." });
    const type = (upstream.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!VIDEO_TYPES.has(type)) return sendJson(res, 415, { error: "The URL did not return a supported video file." });
    const length = Number(upstream.headers.get("content-length") || 0);
    if (length > MAX_BYTES) return sendJson(res, 413, { error: "Videos must be 50 MB or smaller." });
    if (!upstream.body) return sendJson(res, 502, { error: "The video response was empty." });

    res.status(200);
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Disposition", 'attachment; filename="' + safeFilename(url, type).replace(/"/g, "") + '"');
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    let sent = 0;
    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sent += value.byteLength;
        if (sent > MAX_BYTES) {
          res.destroy(new Error("Video exceeded the 50 MB limit."));
          return;
        }
        if (!res.write(Buffer.from(value))) await new Promise((resolve) => res.once("drain", resolve));
      }
      res.end();
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.name === "AbortError" ? 504 : 502, { error: error.name === "AbortError" ? "The video host timed out." : "Could not fetch the video file." });
    else if (!res.destroyed) res.destroy(error);
  } finally {
    clearTimeout(timeout);
  }
}
