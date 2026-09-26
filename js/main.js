/* ==========================================================
   Kaviyarasan V — Video Editor Portfolio — main.js
   ========================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try { initLoader(reduceMotion); } catch (e) {}
  try { initSprocketStrip(); } catch (e) {}
  try { initNav(); } catch (e) {}
  try { initHeaderScroll(); } catch (e) {}
  try { initTypingEffect(reduceMotion); } catch (e) {}
  try { initSkillTracks(reduceMotion); } catch (e) {}
  try { initEditorFX(reduceMotion); } catch (e) {}
  try { initSectionReveal(reduceMotion); } catch (e) {}

  // Pulls the shared, server-side content (added via admin.html, visible to
  // every visitor on every device). Falls back to the baked-in defaults in
  // js/site-data.js if the API can't be reached (e.g. opened as a plain
  // file:// page instead of through a PHP-enabled server).
  let site = null;
  try { site = (typeof SiteAPI !== 'undefined') ? await SiteAPI.getData() : null; } catch (e) { site = null; }

  try { loadProfilePhoto(site); } catch (e) {}
  try { loadWork(site); } catch (e) {}
  try { loadReels(site); } catch (e) {}
  try { initLightbox(); } catch (e) {}
});

/* ---------- Tap-to-preview lightbox: posters open full image, local video clips open a playable preview ---------- */
const EXPAND_ICON = '<svg viewBox="0 0 24 24"><path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"/></svg>';

function initLightbox(){
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const backdrop = document.getElementById('lightboxBackdrop');
  const closeBtn = document.getElementById('lightboxClose');
  const media = document.getElementById('lightboxMedia');

  function close(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    media.innerHTML = ''; // stop any playing video
    document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  window.openLightbox = function({ type, src, poster, title, tag }){
    media.innerHTML = '';
    if (type === 'video'){
      const v = document.createElement('video');
      v.src = src;
      if (poster) v.poster = poster;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      media.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = title || '';
      media.appendChild(img);
    }
    document.getElementById('lightboxTag').textContent = tag || '';
    document.getElementById('lightboxTitle').textContent = title || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
}

function addExpandButton(thumb, onOpen){
  const btn = document.createElement('button');
  btn.className = 'preview-expand';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Open preview');
  btn.innerHTML = EXPAND_ICON;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // don't let clicks on the expand icon toggle inline video play
    onOpen();
  });
  thumb.appendChild(btn);
}

/* ---------- Profile photo: server-saved (every visitor) > baked-in default ---------- */
function loadProfilePhoto(site){
  const img = document.getElementById('heroPhoto');
  if (!img) return;
  const saved = site && site.profilePhoto;
  img.src = saved || (typeof SITE_DEFAULT_PHOTO !== 'undefined' ? SITE_DEFAULT_PHOTO : img.src);
}

/* ---------- Work / poster grid: server-saved (every visitor) > baked-in defaults ---------- */
function loadWork(site){
  const grid = document.getElementById('workGrid');
  if (!grid) return;

  let items = (site && Array.isArray(site.work)) ? site.work : null;
  if (!items || !items.length){
    items = (typeof SITE_DEFAULT_WORK !== 'undefined') ? SITE_DEFAULT_WORK : [];
  }

  grid.innerHTML = '';
  items.forEach((item, i) => grid.appendChild(buildWorkCard(item, i)));
  observeReveal(grid.querySelectorAll('.work-card'));
}

function buildWorkCard(item, index){
  const card = document.createElement('div');
  card.className = 'work-card';

  const thumb = document.createElement('div');
  thumb.className = 'work-thumb';
  if (item.image){
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || '';
    img.loading = 'lazy';
    thumb.appendChild(img);
  }
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = item.category || 'Work';
  thumb.appendChild(tag);

  const body = document.createElement('div');
  body.className = 'reel-body';
  const h3 = document.createElement('h3');
  h3.textContent = item.title || '';
  const p = document.createElement('p');
  p.textContent = item.description || '';
  if (item.description) p.title = item.description;
  body.appendChild(h3);
  body.appendChild(p);

  card.appendChild(thumb);
  card.appendChild(body);

  if (item.image){
    const openPreview = () => {
      if (typeof window.openLightbox === 'function'){
        window.openLightbox({ type: 'image', src: item.image, title: item.title, tag: item.category || 'Work' });
      }
    };
    addExpandButton(thumb, openPreview);
    card.addEventListener('click', openPreview); // tap anywhere on the poster card to preview
  }

  return card;
}

/* ---------- Header: add a shadow/tighten once the page scrolls ---------- */
function initHeaderScroll(){
  const header = document.querySelector('header');
  if (!header) return;
  const apply = () => header.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', apply, { passive: true });
  apply();
}

/* ---------- Section heads + timeline items: same wipe-reveal as reel cards ---------- */
function initSectionReveal(reduceMotion){
  const targets = document.querySelectorAll('.section-head, .t-item');
  if (!targets.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)){
    targets.forEach(t => t.classList.add('reveal-in'));
    return;
  }
  requestAnimationFrame(() => {
    targets.forEach(t => t.classList.add('reveal-ready'));
    requestAnimationFrame(() => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting){
            setTimeout(() => entry.target.classList.add('reveal-in'), i * 70);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      targets.forEach(t => io.observe(t));
    });
  });
}

/* ---------- Ambient editor-tool layer: drifts on mousemove + scroll ---------- */
function initEditorFX(reduceMotion){
  const layer = document.getElementById('editorFx');
  if (!layer) return;
  const icons = Array.from(layer.querySelectorAll('.efx-icon'));
  if (!icons.length || reduceMotion) return; // keep them static for reduced-motion users

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let scrollY = window.scrollY;
  let ticking = false;

  function apply(){
    icons.forEach(icon => {
      const depth = parseFloat(icon.dataset.depth) || 0.03;
      const baseRot = parseFloat(icon.dataset.rot) || 0;
      const dx = (mouseX - window.innerWidth / 2) * depth;
      const dy = (mouseY - window.innerHeight / 2) * depth + scrollY * depth * 0.35;
      const rot = baseRot + scrollY * depth * 0.05;
      icon.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
    });
    ticking = false;
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!ticking){ requestAnimationFrame(apply); ticking = true; }
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    if (!ticking){ requestAnimationFrame(apply); ticking = true; }
  }, { passive: true });

  apply();
}

/* ---------- Skill tracks: fill like a render bar when scrolled into view ---------- */
function initSkillTracks(reduceMotion){
  const tracks = document.querySelectorAll('.skill-track');
  if (!tracks.length) return;
  tracks.forEach(t => t.style.setProperty('--level', (t.dataset.level || 0) + '%'));

  if (reduceMotion || !('IntersectionObserver' in window)){
    tracks.forEach(t => t.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting){
        setTimeout(() => entry.target.classList.add('in-view'), i * 90);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });
  tracks.forEach(t => io.observe(t));
}

/* ---------- Loader: one-time "render" progress bar ---------- */
function initLoader(reduceMotion){
  const loader = document.getElementById('loader');
  if (reduceMotion || !loader){
    if (loader) loader.classList.add('done');
    return;
  }
  const fill = document.getElementById('loaderFill');
  const pct = document.getElementById('loaderPct');
  let progress = 0;
  const timer = setInterval(() => {
    progress += Math.random() * 18 + 6;
    if (progress >= 100){
      progress = 100;
      clearInterval(timer);
      setTimeout(() => loader.classList.add('done'), 250);
    }
    fill.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';
  }, 110);
}

/* ---------- Sprocket strip: fill with hole marks responsively ---------- */
function initSprocketStrip(){
  const strip = document.getElementById('sprocketStrip');
  if (!strip) return;
  const count = Math.ceil(window.innerWidth / 16) + 4;
  strip.innerHTML = '<span></span>'.repeat(count);
}

/* ---------- Mobile nav toggle ---------- */
function initNav(){
  const toggle = document.getElementById('navToggle');
  const list = document.getElementById('navList');
  if (!toggle || !list) return;
  toggle.addEventListener('click', () => {
    const open = list.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });
  list.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    list.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

/* ---------- Hero typing effect: cycles through edit-related words ---------- */
function initTypingEffect(reduceMotion){
  const el = document.getElementById('typedWord');
  if (!el) return;
  const words = ['story', 'reel', 'brand', 'moment'];
  if (reduceMotion){
    el.textContent = words[0];
    return;
  }
  let wordIndex = 0;
  let charIndex = words[0].length;
  let deleting = false;

  function tick(){
    const word = words[wordIndex];
    if (!deleting){
      charIndex++;
      if (charIndex > word.length){
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      if (charIndex < 0){
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        charIndex = 0;
      }
    }
    el.textContent = word.slice(0, charIndex);
    setTimeout(tick, deleting ? 45 : 90);
  }
  setTimeout(tick, 1200);
}

/* ---------- Reel grid: admin items (this browser) > baked-in defaults ---------- */

// Default square poster shown behind a manually-uploaded video until the
// browser can grab its first frame, or for any reel that doesn't have its
// own poster image set in the admin panel.
const DEFAULT_POSTER = 'assets/img/poster-placeholder.svg';

// A video was uploaded manually (local file path like assets/videos/x.mp4)
// rather than pasted as an Instagram/YouTube link — these get a real,
// playable <video> on the frontend instead of a "watch on..." link-out.
function isLocalVideoFile(url){
  if (!url) return false;
  if (/^data:video\//i.test(url)) return true;
  return !/^https?:\/\//i.test(url) && /\.(mp4|mov|webm)$/i.test(url);
}

function loadReels(site){
  const grid = document.getElementById('reelGrid');
  if (!grid) return;

  let reels = (site && Array.isArray(site.videos)) ? site.videos : null;
  if (!reels || !reels.length){
    reels = (typeof SITE_DEFAULT_VIDEOS !== 'undefined') ? SITE_DEFAULT_VIDEOS : [];
  }

  grid.innerHTML = '';
  reels.forEach((reel, i) => grid.appendChild(buildReelCard(reel, i)));
  observeReveal(grid.querySelectorAll('.reel-card'));
}

// A small set of original outline icons (not brand logos) so each card gets
// a distinct watermark even when no real thumbnail image exists yet.
const CLIP_ICONS = [
  '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8V4z"/></svg>', // play
  '<svg viewBox="0 0 24 24"><circle cx="7" cy="6" r="2"/><circle cx="7" cy="18" r="2"/><path d="M9 7.3L19 17M9 16.7L19 7"/></svg>', // scissors
  '<svg viewBox="0 0 24 24"><path d="M3 8l3-3 2 2 12-3v3L8 9.5 5 10.5 3 8z"/><rect x="3" y="10" width="18" height="9" rx="1"/></svg>', // clapperboard
  '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 8h18M3 16h18M7 4v4M7 16v4M17 4v4M17 16v4"/></svg>', // filmstrip
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>', // aperture
  '<svg viewBox="0 0 24 24"><path d="M4 13a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-1v-6h3M4 18v-5h3v6H6a2 2 0 0 1-2-2z"/></svg>' // headphones
];

function buildReelCard(reel, index){
  const isPlaceholder = !reel.video_url || reel.video_url === '#';
  const isLocalVideo = !isPlaceholder && isLocalVideoFile(reel.video_url);
  const card = document.createElement('div');
  card.className = 'reel-card' + (isPlaceholder ? ' placeholder-card' : '');

  const thumb = document.createElement('div');
  thumb.className = 'reel-thumb';
  if (isLocalVideo){
    thumb.classList.add('has-video');
  } else if (reel.poster_url){
    // A link-type reel (e.g. Instagram) with a poster image set in admin —
    // use it as the thumb background instead of the flat gradient.
    thumb.style.setProperty('--frame', `url("${reel.poster_url}") center/cover no-repeat`);
  } else if (reel.frame){
    thumb.style.setProperty('--frame', reel.frame);
  }

  const clipNo = document.createElement('span');
  clipNo.className = 'clip-no';
  clipNo.textContent = 'CLIP ' + String(index + 1).padStart(2, '0');
  thumb.appendChild(clipNo);

  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = reel.category || 'Reel';
  thumb.appendChild(tag);

  if (isLocalVideo){
    // Manually uploaded file (or a path pasted into admin.html) — play it
    // right here on the frontend, no link-out needed.
    const video = document.createElement('video');
    video.className = 'reel-video';
    video.src = reel.video_url;
    video.poster = reel.poster_url || DEFAULT_POSTER;
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;
    thumb.appendChild(video);
    thumb.classList.add('has-preview');
    addExpandButton(thumb, () => {
      if (typeof window.openLightbox === 'function'){
        const bigSrc = video.src || video.currentSrc;
        window.openLightbox({ type: 'video', src: bigSrc, poster: reel.poster_url || DEFAULT_POSTER, title: reel.title, tag: reel.category || 'Reel' });
      }
    });
  } else {
    const clipIcon = document.createElement('span');
    clipIcon.className = 'clip-icon';
    clipIcon.setAttribute('aria-hidden', 'true');
    clipIcon.innerHTML = CLIP_ICONS[index % CLIP_ICONS.length];
    thumb.appendChild(clipIcon);

    const play = document.createElement('div');
    play.className = 'play';
    play.setAttribute('aria-hidden', 'true');
    play.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8V4z"/></svg>';
    thumb.appendChild(play);
  }

  const body = document.createElement('div');
  body.className = 'reel-body';
  const h3 = document.createElement('h3');
  h3.textContent = reel.title;
  const p = document.createElement('p');
  p.textContent = reel.description || '';
  if (reel.description) p.title = reel.description; // full text on hover since the card clamps to 2 lines

  body.appendChild(h3);
  body.appendChild(p);

  if (isLocalVideo){
    // Video already plays inline above (with native fullscreen controls) —
    // still offer a direct link to the file for opening it standalone.
    const a = document.createElement('a');
    a.className = 'watch';
    a.href = reel.video_url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Open full video ↗';
    body.appendChild(a);
  } else {
    const a = document.createElement('a');
    a.className = 'watch';
    a.href = reel.video_url || '#';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = isPlaceholder ? 'Add link →' : 'Watch on Instagram →';
    body.appendChild(a);
  }

  card.appendChild(thumb);
  card.appendChild(body);
  return card;
}

/* ---------- Scroll reveal: clip-path "wipe" cut, not a generic fade-slide ---------- */
function observeReveal(cards){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window) || !cards.length){
    cards.forEach(c => c.classList.add('reveal-in'));
    return;
  }

  // Safety net: whatever happens with the observer, nothing stays
  // invisible for more than a moment.
  const forceReveal = () => cards.forEach(c => c.classList.add('reveal-in'));
  const safety = setTimeout(forceReveal, 1200);

  // Apply the hidden starting state only right before the browser paints,
  // so a card is never left stuck hidden if this script errors elsewhere.
  requestAnimationFrame(() => {
    cards.forEach(c => c.classList.add('reveal-ready'));
    requestAnimationFrame(() => {
      try {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting){
              setTimeout(() => entry.target.classList.add('reveal-in'), i * 60);
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
        cards.forEach(c => io.observe(c));
      } catch (e) {
        clearTimeout(safety);
        forceReveal();
      }
    });
  });
}