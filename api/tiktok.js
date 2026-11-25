// TikSave TikTok resolver (Vercel serverless).
// Uses TikWM's public endpoint; no TikSave API key or credit balance is required.
// TikWM is an independent third-party service and may impose limits or change availability.
const API_TIMEOUT_MS = 25000;
const TIKTOK_HOSTS = ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"];

function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
function isTikTokUrl(raw) {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    return u.protocol === "https:" && !u.username && !u.password &&
      TIKTOK_HOSTS.some((domain) => host === domain || host.endsWith("." + domain));
  } catch { return false; }
}
function isSafeDownloadUrl(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password &&
      !u.hostname.includes(":") && !/^\d+(\.\d+){3}$/.test(u.hostname);
  } catch { return false; }
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Use POST for TikTok video processing." });
  }
  const input = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  if (!input || input.length > 2048 || !isTikTokUrl(input)) {
    return sendJson(res, 400, { error: "Paste a valid HTTPS TikTok video link (including vm.tiktok.com or vt.tiktok.com short links)." });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const form = new URLSearchParams({ url: input, hd: "1" });
    const upstream = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      body: form,
      signal: controller.signal
    });
    if (!upstream.ok) {
      return sendJson(res, upstream.status === 429 ? 429 : 502, {
        error: upstream.status === 429 ? "TikWM is rate-limiting requests. Please try again later." : "TikTok could not be processed right now. Please try again."
      });
    }
    const result = await upstream.json();
    if (Number(result?.code) !== 0 || !result?.data) {
      return sendJson(res, 422, { error: typeof result?.msg === "string" ? result.msg.slice(0, 180) : "TikWM could not process this video. It may be unavailable or unsupported." });
    }
    const data = result.data;
    if (Array.isArray(data.images) && data.images.length) {
      return sendJson(res, 422, { error: "This TikTok post is a photo slideshow. Only video posts are supported." });
    }
    const downloadUrl = [data.hdplay, data.play].find((url) => typeof url === "string" && isSafeDownloadUrl(url));
    if (!downloadUrl) {
      return sendJson(res, 422, { error: "TikWM did not return a valid video link for this post." });
    }
    return sendJson(res, 200, {
      download_url: downloadUrl,
      filename: "tiktok-video.mp4",
      title: typeof data.title === "string" ? data.title.slice(0, 180) : ""
    });
  } catch (error) {
    return sendJson(res, error.name === "AbortError" ? 504 : 502, {
      error: error.name === "AbortError" ? "TikTok processing timed out. Please try again." : "TikSave could not reach TikWM. Please try again later."
    });
  } finally {
    clearTimeout(timer);
  }
}
