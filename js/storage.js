/* ==========================================================
   Kaviyarasan V — Portfolio data layer
   ----------------------------------------------------------
   Content now lives on the SERVER, not in this browser:

     - js/site-data.js  -> baked-in fallback content only (used
                           if the server/API can't be reached).
     - data/site-data.json (via api/data.php) -> the real, shared
                           data every visitor sees, on every device.
     - api/upload.php   -> receives poster images and video files
                           from admin.html and saves them into
                           assets/img/uploads/ or assets/videos/uploads/
                           as real files on the server.

   Because this is a normal HTTP upload, it works identically from
   a phone, tablet or laptop — there's no browser storage quota to
   run into like the old localStorage/IndexedDB version had.

   admin.html requires the same ADMIN_TOKEN string defined in
   api/config.php — see the top of admin.html's <script> block.
   ========================================================== */

const SiteAPI = {
  _base: (typeof window !== 'undefined' && window.SITE_API_BASE) || 'api/',

  async getData(){
    const res = await fetch(this._base + 'data.php', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load site data (HTTP ' + res.status + ').');
    return res.json();
  },

  async saveData(payload){
    const res = await fetch(this._base + 'data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': ADMIN_TOKEN },
      body: JSON.stringify(payload)
    });
    const out = await safeJson(res);
    if (!res.ok || !out || out.ok === false) throw new Error((out && out.error) || 'Could not save — HTTP ' + res.status);
    return out.data;
  },

  /* Uploads one file. onProgress(percent) is called as the upload
     streams (useful for large videos on slower mobile connections). */
  uploadFile(file, type, onProgress){
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this._base + 'upload.php');
      xhr.setRequestHeader('X-Admin-Token', ADMIN_TOKEN);
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.onload = () => {
        let out;
        try{ out = JSON.parse(xhr.responseText); }catch(e){ out = null; }
        if (xhr.status >= 200 && xhr.status < 300 && out && out.ok){
          resolve(out.path);
        } else {
          reject(new Error((out && out.error) || ('Upload failed — HTTP ' + xhr.status)));
        }
      };
      xhr.onerror = () => reject(new Error('Upload failed — network error.'));
      const form = new FormData();
      form.append('type', type);
      form.append('file', file);
      xhr.send(form);
    });
  },

  async deleteFile(path){
    if (!path) return;
    try{
      await fetch(this._base + 'delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': ADMIN_TOKEN },
        body: JSON.stringify({ path })
      });
    }catch(e){ /* best-effort — an orphaned file is harmless */ }
  }
};

async function safeJson(res){
  try{ return await res.json(); }catch(e){ return null; }
}

/* True for a path this site itself manages (i.e. safe to delete server-side
   when an item is removed/replaced) — never true for a pasted external link. */
function isUploadedPath(path){
  return typeof path === 'string' && /^assets\/(img|videos)\/uploads\//.test(path);
}

function kvUid(){
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatBytes(n){
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

/* Resize + compress an image file in-browser before upload, so a phone
   photo (often 4-12MB) doesn't need to travel to the server at full size. */
function fileToResizedDataURL(file, maxDim = 1280, quality = 0.82){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim){
          if (width >= height){ height = Math.round(height * (maxDim / width)); width = maxDim; }
          else { width = Math.round(width * (maxDim / height)); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Turns a resized data URL (from fileToResizedDataURL) back into a File,
   so it can be sent to api/upload.php the same way as any other file. */
function dataURLtoFile(dataUrl, filename){
  const [header, base64] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(header)[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}
