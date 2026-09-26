<?php
/* ==========================================================
   Shared config for the PHP API (api/*.php)
   ----------------------------------------------------------
   IMPORTANT — change ADMIN_TOKEN below to your own secret string,
   and paste the EXACT same string into admin.html — search for
   ADMIN_TOKEN near the top of its <script> block. This is not a
   login screen (admin.html still opens directly, no password
   prompt) — it's a hidden shared key so a stranger who stumbles
   on these URLs can't edit or upload to your live site. Anyone
   who can view admin.html's source can see it, so for real
   protection also password-protect admin.html + the api/ folder
   at the hosting level (see README.md).
   ========================================================== */

/* Buffer all output from here on, and never print PHP warnings/
   notices to the page. Without this, a stray warning (classic
   example: "POST Content-Length exceeds the limit...") prints as
   plain text BEFORE our JSON, which breaks JSON.parse() on the
   front end and shows a generic "Upload failed — HTTP 400"
   instead of the real reason. Errors still go to the PHP error
   log — just not into the JSON response. */
ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL);

define('ADMIN_TOKEN', 'brandmaker-admin-2026');

define('ROOT_DIR', dirname(__DIR__));
define('DATA_FILE', ROOT_DIR . '/data/site-data.json');

define('IMG_UPLOAD_DIR', ROOT_DIR . '/assets/img/uploads');
define('VIDEO_UPLOAD_DIR', ROOT_DIR . '/assets/videos/uploads');
define('IMG_UPLOAD_URL', 'assets/img/uploads');
define('VIDEO_UPLOAD_URL', 'assets/videos/uploads');

define('MAX_IMAGE_BYTES', 15 * 1024 * 1024);    // 15MB per image
define('MAX_VIDEO_BYTES', 1000 * 1024 * 1024);  // 1000MB per video (server php.ini/.htaccess may cap lower — see README)

define('ALLOWED_IMAGE_EXT', ['jpg', 'jpeg', 'png', 'webp', 'svg']);
define('ALLOWED_VIDEO_EXT', ['mp4', 'mov', 'webm']);

header('X-Content-Type-Options: nosniff');

function send_json($data, $code = 200){
  // Discard any stray warning/notice text that may have already
  // been written to the buffer, so the response body is pure JSON.
  while (ob_get_level() > 0){ @ob_end_clean(); }
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_SLASHES);
  exit;
}

/* Reads the X-Admin-Token header across common PHP setups
   (mod_php, php-fpm, CLI server) and rejects the request if it
   doesn't match ADMIN_TOKEN. Every endpoint that changes data
   (POST) calls this; plain reads (GET) do not need it. */
function require_admin_token(){
  $token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
  if ($token === '' && function_exists('getallheaders')){
    foreach (getallheaders() as $k => $v){
      if (strtolower($k) === 'x-admin-token'){ $token = $v; break; }
    }
  }
  if ($token === '' || !hash_equals(ADMIN_TOKEN, $token)){
    send_json(['ok' => false, 'error' => 'Unauthorized — admin token missing or incorrect.'], 401);
  }
}

function ensure_dirs(){
  foreach ([IMG_UPLOAD_DIR, VIDEO_UPLOAD_DIR, dirname(DATA_FILE)] as $dir){
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
  }
}