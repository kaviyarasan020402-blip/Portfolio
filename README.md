# Kaviyarasan V — Video Editor Portfolio

HTML + CSS + JS front end, with a small PHP backend for content and
uploads. The look and every page (`index.html`, `admin.html`) is exactly
as before — only how data is stored changed.

## Folder structure
```
index.html                    → main page
admin.html                    → admin panel (Poster/Work, Videos, Profile Photo) — no login
css/style.css                 → all styling + animations + responsive rules
js/site-data.js               → FALLBACK content, used only if the API can't be reached
js/storage.js                 → SiteAPI: fetch()/XHR helpers that talk to api/*.php, + file-prep utils
js/main.js                    → loader, typing effect, cursor/scroll fx, renders work/reels/photo
api/config.php                → shared settings: ADMIN_TOKEN, folders, size/extension limits
api/data.php                  → GET returns site data; POST (admin only) saves it
api/upload.php                → POST (admin only) saves an uploaded image/video to disk
api/delete.php                → POST (admin only) removes one previously-uploaded file
data/site-data.json           → the real, shared content — every visitor's source of truth
assets/img, assets/videos     → your curated files (referenced by path)
assets/img/uploads/           → images uploaded through admin.html land here
assets/videos/uploads/        → videos uploaded through admin.html land here
```

## How content works now
Before, `admin.html` saved into that one browser's `localStorage`/`IndexedDB` —
so uploads only showed up on the device you used, and mobile browsers (especially
iOS Safari) often couldn't hold a large video at all.

Now `admin.html` sends everything to small PHP scripts under `api/`:
- Titles, categories, descriptions and paths are saved into `data/site-data.json`
  on the server via `api/data.php`.
- Poster images and video files are uploaded as real files via `api/upload.php`,
  saved into `assets/img/uploads/` or `assets/videos/uploads/`.
- `index.html` (every visitor, any device) fetches `data/site-data.json` and
  shows exactly what's there — no browser storage involved for them at all.

This means: add or edit something in `admin.html` from your phone, your laptop,
whatever — it's live for every visitor immediately, the same way.

`js/site-data.js` still exists as a **fallback only** — it's what shows if
`data/site-data.json` can't be loaded (e.g. the site is opened as a plain
`file://` page with no server running).

## IMPORTANT — the admin token
There's still no login screen (same as before), but the API endpoints that
change your site are now reachable over the internet, so a hidden shared key
called `ADMIN_TOKEN` protects them from strangers who might stumble on the URLs:

- Set it once in `api/config.php`.
- Copy the exact same string into `admin.html` — near the top of its
  `<script>` block, look for `const ADMIN_TOKEN = '...'`.

If the two don't match, every save/upload in `admin.html` will fail with
"Unauthorized". This is **not** real security — anyone who views admin.html's
page source can read the token. For real protection, also password-protect
`admin.html` and the `api/` folder at the hosting level (on Apache: an
`.htpasswd` + `.htaccess` `AuthType Basic` block; most hosting control panels,
including Hostinger's, have a "Password Protect Directories" tool that does
this without editing files by hand).

## Run locally (Laragon)
1. Put the whole folder inside Laragon's `www/` directory.
2. Start Laragon (Apache + PHP).
3. Open `http://localhost/<folder-name>/index.html` and
   `http://localhost/<folder-name>/admin.html` in the browser.

Opening `index.html` directly as a `file://` path (double-clicking it) will
show the fallback content from `js/site-data.js` — the API needs a real PHP
server (Laragon locally, or your live host) to work.

## Deploy — Hostinger / InfinityFree (or any PHP host)
1. Upload the **whole folder** (all files, keeping the structure) via File
   Manager or FTP — `api/`, `data/`, `assets/`, everything.
2. Make sure `data/`, `assets/img/uploads/` and `assets/videos/uploads/` are
   writable by PHP (usually fine by default; if `admin.html` shows a "not
   writable" error, set those folders to permission `755` or `775` in File
   Manager).
3. Change `ADMIN_TOKEN` in `api/config.php` and `admin.html` to your own
   secret string (see above) before you rely on this for anything real.
4. Open `admin.html` on the live domain and add your real content.

## Uploading big videos (mobile included)
Because uploads now go straight to the server over normal HTTP, they work the
same from a phone, tablet or laptop — mobile browsers can pick a video from
the gallery or record one and upload it here just like a desktop browser does.

The actual size you can upload is capped by the **server's** PHP settings —
`upload_max_filesize` and `post_max_size` in `php.ini` — not by this code
(`api/config.php` allows up to 1000MB by default, but the server can be lower).
If the real limit is smaller than the file, PHP does not send a clean error —
it can print a raw warning before the JSON and `admin.html` shows a generic
"Upload failed — HTTP 400". Two ready-made files raise the real limit;
**which one works depends on how PHP runs on your server:**

- **XAMPP / Laragon / any Apache + mod_php host** (this is XAMPP's default —
  `.user.ini` is silently ignored here): use the included root **`.htaccess`**
  — it sets `upload_max_filesize`, `post_max_size`, `max_execution_time`,
  `max_input_time` and `memory_limit` via `php_value`. Just restart Apache
  after adding it. If it still doesn't apply, XAMPP's `httpd-xampp.conf` may
  have `AllowOverride None` for `htdocs` — change it to `AllowOverride All`
  and restart Apache.
- **Hostinger / any PHP-FPM host**: use the included root **`.user.ini`**
  instead (php_value in `.htaccess` does nothing under php-fpm). Takes a few
  minutes to apply; hPanel → Advanced → PHP Configuration also lets you raise
  these per-site if `.user.ini` isn't picked up by your plan.
- **InfinityFree** (free tier): these limits are usually fixed and low
  (often ~10MB) and can't be raised — for that host, keep videos small or
  paste a hosted link (YouTube/Instagram) into the "path/URL" field instead
  of uploading the file.

If an upload fails with a size-related error, `admin.html` will say so —
compress the video, raise the server's limits (if you can), or use the link
field instead.

## Notes
- Uploaded images are resized in the browser before upload (poster images to
  ~1000px, thumbnails to ~900px, profile photo to ~1000px) so a phone photo
  doesn't need to travel to the server at full size.
- Deleting a work/video item, or replacing its file, also deletes the old
  uploaded file from the server (best-effort) — files you reference by a
  pasted path/link are never touched.
- `api/upload.php` only accepts `.jpg .jpeg .png .webp .svg` for images and
  `.mp4 .mov .webm` for video, and only from a request carrying the correct
  `X-Admin-Token`.
- Animations respect `prefers-reduced-motion`.
- `admin.html` is responsive down to small phones (tables scroll
  horizontally instead of breaking the layout; buttons/tabs stack).