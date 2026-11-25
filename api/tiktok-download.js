// TikSave download proxy. Resolves the TikTok URL server-side and returns the media as an attachment.
const TIMEOUT_MS=25000;
const MAX_BYTES=50*1024*1024;
const HOSTS=["tiktok.com","vm.tiktok.com","vt.tiktok.com"];
function isTikTokUrl(raw){try{const u=new URL(raw),h=u.hostname.toLowerCase();return u.protocol==="https:"&&!u.username&&!u.password&&HOSTS.some(d=>h===d||h.endsWith("."+d));}catch{return false;}}
function isSafeUrl(raw){try{const u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password&&!u.hostname.includes(":")&&!/^\d+(\.\d+){3}$/.test(u.hostname);}catch{return false;}}
function sendJson(res,status,body){res.status(status).setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify(body));}
async function resolve(input,signal){
 const form=new URLSearchParams({url:input,hd:"1"});
 const r=await fetch("https://www.tikwm.com/api/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"},body:form,signal});
 if(!r.ok)throw new Error("TikWM could not process this video.");
 const j=await r.json();if(Number(j?.code)!==0||!j?.data)throw new Error(j?.msg||"TikWM could not process this video.");
 const d=j.data;if(Array.isArray(d.images)&&d.images.length)throw new Error("Photo slideshows are not supported.");
 const u=[d.hdplay,d.play].find(x=>typeof x==="string"&&isSafeUrl(x));if(!u)throw new Error("No downloadable video link was returned.");return u;
}
export default async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return sendJson(res,405,{error:"Use GET to download the video."});}
 const input=typeof req.query?.url==="string"?req.query.url.trim():"";
 if(!input||input.length>2048||!isTikTokUrl(input))return sendJson(res,400,{error:"Paste a valid HTTPS TikTok link."});
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
 try{
  const mediaUrl=await resolve(input,controller.signal);
  const media=await fetch(mediaUrl,{headers:{"User-Agent":"Mozilla/5.0"},signal:controller.signal});
  if(!media.ok||!media.body)return sendJson(res,502,{error:"Could not retrieve the video file. Please try again."});
  const length=Number(media.headers.get("content-length")||0);
  if(length>MAX_BYTES){controller.abort();return sendJson(res,413,{error:"This video is larger than the 50 MB download limit."});}
  res.status(200);res.setHeader("Content-Type","video/mp4");res.setHeader("Content-Disposition",'attachment; filename="TikSave-video.mp4"');res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
  const reader=media.body.getReader();let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BYTES){controller.abort();if(!res.headersSent)sendJson(res,413,{error:"Video exceeds the 50 MB limit."});else res.destroy();return;}res.write(Buffer.from(value));}
  res.end();
 }catch(error){if(!res.headersSent)sendJson(res,error.name==="AbortError"?504:422,{error:error.name==="AbortError"?"Download timed out. Please try again.":error.message||"Download failed."});else res.destroy();}
 finally{clearTimeout(timer);}
}
