// TikSave TikTok resolver (Vercel serverless).
// Provider: InterAPI. Optional API key increases the documented quota.
// Do not place the provider key in frontend code.
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
    return u.protocol === "https:" && !u.username && !u.password &&
      TIKTOK_HOSTS.some((host) => u.hostname.toLowerCase() === host || u.hostname.toLowerCase().endsWith("." + host));
  } catch { return false; }
}
function isSafeDownloadUrl(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password &&
      !u.hostname.includes(":") && !/^\d+(\.\d+){3}$/.test(u.hostname);
  } catch { return false; }
}
function chooseDownload(data) {
  if (Array.isArray(data?.media)) {
    const videos = data.media.filter((item) => item && item.type === "video");
    const hd = videos.find((item) => /hd/i.test(String(item.quality || ""))) || videos[0];
    if (hd?.download_url && isSafeDownloadUrl(hd.download_url)) return hd.download_url;
    if (hd?.url && isSafeDownloadUrl(hd.url)) return hd.url;
  }
  for (const key of ["video_hd_url", "video_url"]) {
    if (data?.[key] && isSafeDownloadUrl(data[key])) return data[key];
  }
  return null;
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
    const endpoint = new URL("https://api.interapi.dev/api/v1/tiktok");
    endpoint.searchParams.set("url", input);
    const headers = {};
    if (process.env.INTERAPI_API_KEY) headers["X-API-Key"] = process.env.INTERAPI_API_KEY;
    const upstream = await fetch(endpoint, { headers, signal: controller.signal });
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : 422;
      return sendJson(res, status, { error: upstream.status === 429 ? "TikSave is temporarily rate-limited. Try again later." : "TikTok could not be processed. The video may be private, unavailable, or unsupported." });
    }
    const data = await upstream.json();
    const downloadUrl = chooseDownload(data);
    if (!downloadUrl) {
      return sendJson(res, 422, { error: "The provider did not return a video file for this link. It may be private, deleted, age-restricted, or a slideshow." });
    }
    return sendJson(res, 200, { download_url: downloadUrl, filename: "tiktok-video.mp4", title: typeof data.title === "string" ? data.title.slice(0, 180) : "" });
  } catch (error) {
    return sendJson(res, error.name === "AbortError" ? 504 : 502, { error: error.name === "AbortError" ? "TikTok processing timed out. Please try again." : "TikSave could not reach the TikTok processing provider." });
  } finally {
    clearTimeout(timer);
  }
}
