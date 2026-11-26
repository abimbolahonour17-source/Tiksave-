// TikSave TikTok resolver (Vercel serverless), powered by TikWM public endpoint.
const API_TIMEOUT_MS = 25000;
const TIKTOK_HOSTS = ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"];
function sendJson(res,status,body){res.status(status).setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify(body));}
function isTikTokUrl(raw){try{const u=new URL(raw);const h=u.hostname.toLowerCase();return u.protocol==="https:"&&!u.username&&!u.password&&TIKTOK_HOSTS.some(d=>h===d||h.endsWith("."+d));}catch{return false;}}
const MEDIA_HOSTS=["tiktokcdn.com","tiktokcdn-us.com","tiktokcdn-eu.com","tokcdn.com","tiktokv.com","tikwm.com","byteoversea.com","ibytedtos.com","muscdn.com","snssdk.com","tiktok.com","tiktokstatic.com"];
function normalizeMediaUrl(raw){try{const u=new URL(raw,"https://www.tikwm.com/");if(u.protocol==="http:")u.protocol="https:";const h=u.hostname.toLowerCase();if(u.protocol!=="https:"||u.username||u.password||/^\d+(\.\d+){3}$/.test(h)||!MEDIA_HOSTS.some(d=>h===d||h.endsWith("."+d)))return null;return u.href;}catch{return null;}}
async function resolveTikTok(input,signal){
 const form=new URLSearchParams({url:input,hd:"1"});
 const upstream=await fetch("https://www.tikwm.com/api/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"},body:form,signal});
 if(!upstream.ok)throw new Error(upstream.status===429?"TikWM is rate-limiting requests. Try again later.":"TikWM could not process this video right now.");
 const result=await upstream.json();
 if(Number(result?.code)!==0||!result?.data)throw new Error(typeof result?.msg==="string"?result.msg.slice(0,180):"TikWM could not process this video.");
 const data=result.data;
 if(Array.isArray(data.images)&&data.images.length)throw new Error("This TikTok post is a photo slideshow. Only video posts are supported.");
 const rawVideoUrl=[data.hdplay,data.play].find(url=>typeof url==="string"&&url.trim());
 const videoUrl=rawVideoUrl&&normalizeMediaUrl(rawVideoUrl);
 if(!videoUrl)throw new Error("TikWM did not return a supported video link.");
 const thumbnail=[data.cover,data.origin_cover].find(url=>typeof url==="string"&&isSafeDownloadUrl(url))||null;
 return {videoUrl,thumbnail,title:typeof data.title==="string"?data.title.slice(0,180):""};
}
export default async function handler(req,res){
 if(req.method!=="POST"){res.setHeader("Allow","POST");return sendJson(res,405,{error:"Use POST for TikTok video processing."});}
 const input=typeof req.body?.url==="string"?req.body.url.trim():"";
 if(!input||input.length>2048||!isTikTokUrl(input))return sendJson(res,400,{error:"Paste a valid HTTPS TikTok link."});
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),API_TIMEOUT_MS);
 try{const video=await resolveTikTok(input,controller.signal);return sendJson(res,200,{download_url:video.videoUrl,thumbnail_url:video.thumbnail,filename:"tiktok-video.mp4",title:video.title});}
 catch(error){return sendJson(res,error.name==="AbortError"?504:422,{error:error.name==="AbortError"?"TikTok processing timed out. Please try again.":error.message||"TikTok video processing failed."});}
 finally{clearTimeout(timer);}
}
