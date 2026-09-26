<?php
/* ==========================================================
   GET  -> returns the current shared site data as JSON.
           Called by index.html (every visitor) and admin.html.
   POST -> replaces it with the JSON body sent (requires the
           X-Admin-Token header). Called by admin.html only.
   ========================================================== */
require __DIR__ . '/config.php';
ensure_dirs();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET'){
  if (!file_exists(DATA_FILE)){
    send_json(['work' => [], 'videos' => [], 'profilePhoto' => null]);
  }
  $raw = @file_get_contents(DATA_FILE);
  $data = json_decode((string)$raw, true);
  if (!is_array($data)) $data = ['work' => [], 'videos' => [], 'profilePhoto' => null];
  send_json($data);
}

if ($method === 'POST'){
  require_admin_token();

  $incoming = json_decode(file_get_contents('php://input'), true);
  if (!is_array($incoming)){
    send_json(['ok' => false, 'error' => 'Invalid JSON body.'], 400);
  }

  $clean = function($v, $max = 300){
    if (!is_string($v)) return '';
    $v = trim(strip_tags($v));
    // mbstring isn't guaranteed on every shared host — fall back to a
    // plain byte substr rather than fatal-erroring the whole request.
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
  };
  $newId = function() {
    return 'id_' . bin2hex(random_bytes(6));
  };

  $work = is_array($incoming['work'] ?? null) ? $incoming['work'] : [];
  $videos = is_array($incoming['videos'] ?? null) ? $incoming['videos'] : [];
  $photo = $incoming['profilePhoto'] ?? null;

  $work = array_values(array_map(function($it) use ($clean, $newId){
    $it = is_array($it) ? $it : [];
    $id = $clean($it['id'] ?? '', 64);
    return [
      'id'          => $id !== '' ? $id : $newId(),
      'title'       => $clean($it['title'] ?? '', 150),
      'category'    => $clean($it['category'] ?? '', 60),
      'image'       => $clean($it['image'] ?? '', 500),
      'description' => $clean($it['description'] ?? '', 500),
    ];
  }, $work));

  $videos = array_values(array_map(function($it) use ($clean, $newId){
    $it = is_array($it) ? $it : [];
    $id = $clean($it['id'] ?? '', 64);
    return [
      'id'          => $id !== '' ? $id : $newId(),
      'title'       => $clean($it['title'] ?? '', 150),
      'category'    => $clean($it['category'] ?? '', 60),
      'video_url'   => $clean($it['video_url'] ?? '', 600),
      'poster_url'  => $clean($it['poster_url'] ?? '', 600),
      'duration'    => $clean($it['duration'] ?? '', 20),
      'description' => $clean($it['description'] ?? '', 500),
    ];
  }, $videos));

  $out = [
    'work'          => $work,
    'videos'        => $videos,
    'profilePhoto'  => is_string($photo) && $photo !== '' ? $clean($photo, 500) : null,
    'updatedAt'     => date('c'),
  ];

  $fp = @fopen(DATA_FILE, 'c+');
  if (!$fp){
    send_json(['ok' => false, 'error' => 'Could not open data file for writing — check folder permissions on data/.'], 500);
  }
  flock($fp, LOCK_EX);
  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);

  send_json(['ok' => true, 'data' => $out]);
}

send_json(['ok' => false, 'error' => 'Method not allowed'], 405);
