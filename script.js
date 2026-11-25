const form=document.getElementById('link-form');
const input=document.getElementById('video-url');
const statusEl=document.getElementById('status');
const pasteBtn=document.getElementById('paste-btn');
const downloadBtn=form.querySelector('.download-btn');
function isHttpUrl(value){try{const url=new URL(value);return url.protocol==='https:';}catch{return false;}}
function isTikTokUrl(value){try{const url=new URL(value);const host=url.hostname.toLowerCase();return ['tiktok.com','vm.tiktok.com','vt.tiktok.com'].some(domain=>host===domain||host.endsWith('.'+domain));}catch{return false;}}
function triggerDownload(url,filename){
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=filename||'video.mp4';
  anchor.rel='noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
pasteBtn.addEventListener('click',async()=>{try{const text=await navigator.clipboard.readText();if(text){input.value=text.trim();statusEl.textContent='Link pasted. Check it, then click Download video.';}}catch{statusEl.textContent='Clipboard access unavailable. Paste your link into the box manually.';input.focus();}});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const value=input.value.trim();
  if(!value){statusEl.textContent='Paste a video link to continue.';input.focus();return;}
  if(!isHttpUrl(value)){statusEl.textContent='Please enter a valid HTTPS link.';input.focus();return;}
  downloadBtn.disabled=true;downloadBtn.classList.add('loading');
  try{
    if(isTikTokUrl(value)){
      statusEl.textContent='Processing TikTok video…';
      const response=await fetch('/api/tiktok',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:value})});
      let data={};try{data=await response.json();}catch{}
      if(!response.ok){statusEl.textContent=data.error||'TikTok video processing failed. Try another link.';return;}
      if(!data.download_url){statusEl.textContent='No downloadable video was returned for this link.';return;}
      triggerDownload(data.download_url,data.filename||'tiktok-video.mp4');
      statusEl.textContent='Video ready. Your download should begin shortly.';
      return;
    }
    statusEl.textContent='Checking the video link…';
    const response=await fetch('/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:value})});
    if(!response.ok){let message='Download could not be started.';try{const data=await response.json();if(data.error)message=data.error;}catch{}statusEl.textContent=message;return;}
    const blob=await response.blob();
    const disposition=response.headers.get('content-disposition')||'';
    const match=disposition.match(/filename="?([^";]+)"?/i);
    const filename=match?match[1]:'video.mp4';
    const blobUrl=URL.createObjectURL(blob);triggerDownload(blobUrl,filename);setTimeout(()=>URL.revokeObjectURL(blobUrl),1000);
    statusEl.textContent='Download started. If prompted, choose where to save your video.';
  }catch(error){statusEl.textContent='Network error. Please try again.';}
  finally{downloadBtn.disabled=false;downloadBtn.classList.remove('loading');}
});
