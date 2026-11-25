const form=document.getElementById('link-form');
const input=document.getElementById('video-url');
const statusEl=document.getElementById('status');
const pasteBtn=document.getElementById('paste-btn');
const downloadBtn=form.querySelector('.download-btn');
function isHttpUrl(value){try{const url=new URL(value);return url.protocol==='https:';}catch{return false;}}
function isTikTokUrl(value){try{const url=new URL(value);return url.hostname==='tiktok.com'||url.hostname.endsWith('.tiktok.com');}catch{return false;}}
pasteBtn.addEventListener('click',async()=>{try{const text=await navigator.clipboard.readText();if(text){input.value=text.trim();statusEl.textContent='Link pasted. Check it, then click Download video.';}}catch{statusEl.textContent='Clipboard access unavailable. Paste your link into the box manually.';input.focus();}});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const value=input.value.trim();
  if(!value){statusEl.textContent='Paste a video link to continue.';input.focus();return;}
  if(!isHttpUrl(value)){statusEl.textContent='Please enter a valid HTTPS link.';input.focus();return;}
  if(isTikTokUrl(value)){statusEl.textContent='TikTok share links need an authorized TikTok download integration. For now, use a direct video file URL from an approved host.';return;}
  downloadBtn.disabled=true;downloadBtn.classList.add('loading');statusEl.textContent='Checking the video link…';
  try{
    const response=await fetch('/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:value})});
    if(!response.ok){let message='Download could not be started.';try{const data=await response.json();if(data.error)message=data.error;}catch{}statusEl.textContent=message;return;}
    const blob=await response.blob();
    const disposition=response.headers.get('content-disposition')||'';
    const match=disposition.match(/filename="?([^";]+)"?/i);
    const filename=match?match[1]:'video.mp4';
    const blobUrl=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=blobUrl;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(blobUrl),1000);
    statusEl.textContent='Download started. If prompted, choose where to save your video.';
  }catch(error){statusEl.textContent='Network error. Please try again.';}
  finally{downloadBtn.disabled=false;downloadBtn.classList.remove('loading');}
});