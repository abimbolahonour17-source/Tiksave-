// TikSave download proxy. Uses the media URL already resolved by /api/tiktok to avoid a second TikWM lookup.
const TIMEOUT_MS=25000,MAX_BYTES=50*1024*1024;
const MEDIA_HOSTS=["tiktokcdn.com","tiktokv.com","tikwm.com"];
function sendJson(res,status,body){res.status(status).setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify(body));}
function safeMediaUrl(raw){try{const u=new URL(raw),h=u.hostname.toLowerCase();return u.protocol==="https:"&&!u.username&&!u.password&&!h.includes(":")&&!/^\d+(\.\d+){3}$/.test(h)&&MEDIA_HOSTS.some(d=>h===d||h.endsWith("."+d));}catch{return false;}}
export default async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return sendJson(res,405,{error:"Use GET for downloads."});}
 const mediaUrl=typeof req.query?.media==="string"?req.query.media:"";
 if(!mediaUrl||mediaUrl.length>4096||!safeMediaUrl(mediaUrl))return sendJson(res,400,{error:"Invalid or unsupported media link."});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
 try{
  const media=await fetch(mediaUrl,{headers:{"User-Agent":"Mozilla/5.0"},signal:controller.signal});
  if(!media.ok||!media.body)return sendJson(res,502,{error:"Could not retrieve the video file. Please try again."});
  const length=Number(media.headers.get("content-length")||0);if(length>MAX_BYTES)return sendJson(res,413,{error:"This video is larger than the 50 MB download limit."});
  res.status(200);res.setHeader("Content-Type","video/mp4");res.setHeader("Content-Disposition",'attachment; filename="TikSave-video.mp4"');res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
  const reader=media.body.getReader();let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BYTES){controller.abort();if(!res.headersSent)sendJson(res,413,{error:"Video exceeds the 50 MB limit."});else res.destroy();return;}if(!res.write(Buffer.from(value)))await new Promise(resolve=>res.once("drain",resolve));}
  res.end();
 }catch(error){if(!res.headersSent)sendJson(res,error.name==="AbortError"?504:502,{error:error.name==="AbortError"?"Download timed out. Please try again.":"Download failed."});else res.destroy();}
 finally{clearTimeout(timer);}
}
