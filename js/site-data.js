/* ==========================================================
   Fallback site content.
   ----------------------------------------------------------
   The REAL content every visitor sees lives on the server —
   data/site-data.json, served through api/data.php and edited
   from admin.html. These arrays are only a fallback, used by
   js/main.js if that API can't be reached (e.g. the site is
   opened as a plain file:// page with no PHP server running).
   ========================================================== */

const SITE_DEFAULT_PHOTO = 'assets/img/kaviyarasan.jpg';

// NOTE ON DEMO ITEMS: these default arrays are only ever shown when the
// server data (data/site-data.json) has no work/videos, or can't be
// reached at all. Once real items exist on the server, every visitor
// sees those instead — these are just a safety net.

const SITE_DEFAULT_WORK = [
  {
    id: 'id_mugvji5ofqbnqf',
    title: 'Hiring Poster',
    category: 'Posters',
    image: 'assets/img/hiring-poster.jpg',
    description: ''
  },
  {
    id: 'id_mugvk9l7igtop5',
    title: 'Cafe Shop Opening',
    category: 'Posters',
    image: 'assets/img/cafe-shop-opening.jpg',
    description: ''
  },
  {
    id: 'id_mugvkwinfm4gbb',
    title: 'Package Poster',
    category: 'Posters',
    image: 'assets/img/package-poster.jpg',
    description: ''
  }
];

const SITE_DEFAULT_VIDEOS = [
  {
    id: 'default-video-1',
    title: 'Demo edit — sample cuts',
    description: 'A short synthetic sample so you can see how a locally-uploaded clip plays and controls on mobile. Replace with a real reel in admin.html.',
    category: 'Reel · demo clip',
    video_url: 'assets/videos/demo-reel.mp4',
    poster_url: 'assets/img/demo-poster.jpg'
  },
  {
    id: 'default-video-2',
    title: 'Brand promo cut',
    description: 'Fast-paced product reel — pacing, transitions, and beat-synced cuts.',
    category: 'Reel · brand promo',
    video_url: 'https://www.instagram.com/reel/Darv9ApxcEl/?igsi=NmcxaGV6czVxZXlk',
    poster_url: ''
  },
  {
    id: 'default-video-3',
    title: 'Add your next reel',
    description: 'Open admin.html and add a title, description and Instagram/YouTube link, or upload a file.',
    category: 'Reel · add link',
    video_url: '#',
    poster_url: ''
  }
];