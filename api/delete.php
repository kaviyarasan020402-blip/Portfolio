<?php
/* ==========================================================
   POST { "path": "assets/img/uploads/xxx.jpg" }
   Deletes that one file — only if it's inside
   assets/img/uploads/ or assets/videos/uploads/, so this can
   never be used to remove anything else on the server.
   Best-effort: admin.html calls this when a work/video item
   with an uploaded (not linked) file is deleted or replaced.
   ========================================================== */
require __DIR__ . '/config.php';
require_admin_token();

if ($_SERVER['REQUEST_METHOD'] !== 'POST'){
  send_json(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$incoming = json_decode(file_get_contents('php://input'), true);
$path = is_array($incoming) ? (string)($incoming['path'] ?? '') : '';
$path = ltrim(str_replace('\\', '/', $path), '/');

$allowedPrefixes = [IMG_UPLOAD_URL . '/', VIDEO_UPLOAD_URL . '/'];
$allowed = false;
foreach ($allowedPrefixes as $prefix){
  if (strpos($path, $prefix) === 0){ $allowed = true; break; }
}

if (!$allowed || strpos($path, '..') !== false || $path === ''){
  // Not an error the admin needs to see — just refuse quietly.
  send_json(['ok' => false, 'error' => 'Refusing to delete that path.'], 400);
}

$full = ROOT_DIR . '/' . $path;
if (is_file($full)) @unlink($full);

send_json(['ok' => true]);
