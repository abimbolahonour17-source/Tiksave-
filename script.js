const form=document.getElementById('link-form');
const input=document.getElementById('video-url');
const statusEl=document.getElementById('status');
const pasteBtn=document.getElementById('paste-btn');
const downloadBtn=form.querySelector('.download-btn');
const preview=document.getElementById('video-preview');
const previewThumb=document.getElementById('preview-thumb');
const previewTitle=document.getElementById('preview-title');
const previewDownloadBtn=document.getElementById('preview-download-btn');
let resolvedTikTokLink='';
function isHttpUrl(value){try{const url=new URL(value);return url.protocol==='https:';}catch{return false;}}
function isTikTokUrl(value){try{const url=new URL(value);const host=url.hostname.toLowerCase();return ['tiktok.com','vm.tiktok.com','vt.tiktok.com'].some(domain=>host===domain||host.endsWith('.'+domain));}catch{return false;}}
function triggerDownload(url,filename){const anchor=document.createElement('a');anchor.href=url;anchor.download=filename||'video.mp4';anchor.rel='noopener';document.body.appendChild(anchor);anchor.click();anchor.remove();}
function hidePreview(){preview.hidden=true;previewThumb.removeAttribute('src');resolvedTikTokLink='';}
pasteBtn.addEventListener('click',async()=>{try{const text=await navigator.clipboard.readText();if(text){input.value=text.trim();hidePreview();statusEl.textContent='Link pasted. Click Download video to preview it.';}}catch{statusEl.textContent='Clipboard access unavailable. Paste your link into the box manually.';input.focus();}});
input.addEventListener('input',hidePreview);
form.addEventListener('submit',async event=>{
 event.preventDefault();const value=input.value.trim();
 if(!value){statusEl.textContent='Paste a video link to continue.';input.focus();return;}
 if(!isHttpUrl(value)){statusEl.textContent='Please enter a valid HTTPS link.';input.focus();return;}
 downloadBtn.disabled=true;downloadBtn.classList.add('loading');hidePreview();
 try{
  if(isTikTokUrl(value)){
   statusEl.textContent='Fetching video preview…';
   const response=await fetch('/api/tiktok',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:value})});
   let data={};try{data=await response.json();}catch{}
   if(!response.ok){statusEl.textContent=data.error||'TikTok video processing failed. Try another link.';return;}
   if(!data.download_url){statusEl.textContent='No downloadable video was returned for this link.';return;}
   resolvedTikTokLink=value;previewTitle.textContent=data.title||'TikTok video preview';
   if(data.thumbnail_url){previewThumb.src=data.thumbnail_url;previewThumb.alt=data.title?('Preview of '+data.title):'TikTok video thumbnail';previewThumb.onerror=()=>{previewThumb.removeAttribute('src');};}
   preview.hidden=false;statusEl.textContent='Preview ready. Check the thumbnail, then click Download this video.';
   previewDownloadBtn.disabled=false;previewDownloadBtn.textContent='Download this video ↓';
   preview.scrollIntoView({behavior:'smooth',block:'nearest'});
   return;
  }
  statusEl.textContent='Checking the video link…';
  const response=await fetch('/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:value})});
  if(!response.ok){let message='Download could not be started.';try{const data=await response.json();if(data.error)message=data.error;}catch{}statusEl.textContent=message;return;}
  const blob=await response.blob();const disposition=response.headers.get('content-disposition')||'';const match=disposition.match(/filename="?([^";]+)"?/i);const filename=match?match[1]:'video.mp4';
  const blobUrl=URL.createObjectURL(blob);triggerDownload(blobUrl,filename);setTimeout(()=>URL.revokeObjectURL(blobUrl),1000);statusEl.textContent='Download started. If prompted, choose where to save your video.';
 }catch{statusEl.textContent='Network error. Please try again.';}
 finally{downloadBtn.disabled=false;downloadBtn.classList.remove('loading');}
});
previewDownloadBtn.addEventListener('click',()=>{
 if(!resolvedTikTokLink)return;
 previewDownloadBtn.disabled=true;previewDownloadBtn.textContent='Preparing download…';
 statusEl.textContent='Preparing your video download…';
 const downloadUrl='/api/tiktok-download?url='+encodeURIComponent(resolvedTikTokLink);
 triggerDownload(downloadUrl,'TikSave-video.mp4');
 statusEl.textContent='Download requested. If your browser opens the file instead, use the browser download option.';
 setTimeout(()=>{previewDownloadBtn.disabled=false;previewDownloadBtn.textContent='Download this video ↓';},3500);
});

// Dark/light theme toggle (stores the visitor's choice)
(function(){const root=document.documentElement,button=document.getElementById('theme-toggle');if(!button)return;function apply(theme){root.dataset.theme=theme;try{localStorage.setItem('tiksave-theme',theme)}catch{}button.textContent=theme==='dark'?'☼':'☾';button.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');button.title=theme==='dark'?'Switch to light theme':'Switch to dark theme'}let current='dark';try{current=localStorage.getItem('tiksave-theme')||'dark'}catch{}apply(current);button.addEventListener('click',()=>apply(root.dataset.theme==='dark'?'light':'dark'));})();
