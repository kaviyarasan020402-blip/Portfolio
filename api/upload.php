<?php
/* ==========================================================
   POST (multipart/form-data): field "file" + field "type"
   ("image" or "video"). Saves the file into
   assets/img/uploads/ or assets/videos/uploads/ with a safe,
   unique name and returns { ok:true, path:"assets/..." }.

   This is a plain HTTP file upload, so it works the same from
   a phone, tablet or laptop — mobile browsers can pick a photo
   or video from the gallery/camera and POST it here exactly
   like a desktop browser does.
   ========================================================== */
require __DIR__ . '/config.php';
ensure_dirs();
require_admin_token();

if ($_SERVER['REQUEST_METHOD'] !== 'POST'){
  send_json(['ok' => false, 'error' => 'Method not allowed'], 405);
}

if (!isset($_FILES['file'])){
  send_json(['ok' => false, 'error' => 'No file received.'], 400);
}

$file = $_FILES['file'];
$type = ($_POST['type'] ?? 'image') === 'video' ? 'video' : 'image';

if ($file['error'] !== UPLOAD_ERR_OK){
  $msg = 'Upload failed (code ' . $file['error'] . ').';
  if (in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)){
    $msg = 'That file is larger than this server currently allows (php.ini upload_max_filesize / post_max_size). '
         . 'Ask your host to raise these, or compress the file — see README.md.';
  }
  send_json(['ok' => false, 'error' => $msg], 400);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if ($type === 'video'){
  if (!in_array($ext, ALLOWED_VIDEO_EXT, true)){
    send_json(['ok' => false, 'error' => 'Only .mp4, .mov or .webm video files are allowed.'], 400);
  }
  if ($file['size'] > MAX_VIDEO_BYTES){
    send_json(['ok' => false, 'error' => 'Video is larger than the allowed limit.'], 400);
  }
  $dir = VIDEO_UPLOAD_DIR;
  $urlBase = VIDEO_UPLOAD_URL;
} else {
  if (!in_array($ext, ALLOWED_IMAGE_EXT, true)){
    send_json(['ok' => false, 'error' => 'Only .jpg, .png, .webp or .svg image files are allowed.'], 400);
  }
  if ($file['size'] > MAX_IMAGE_BYTES){
    send_json(['ok' => false, 'error' => 'Image is larger than the allowed limit.'], 400);
  }
  $dir = IMG_UPLOAD_DIR;
  $urlBase = IMG_UPLOAD_URL;
}

$safeBase = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($file['name'], PATHINFO_FILENAME));
$safeBase = trim(substr($safeBase, 0, 60), '-') ?: 'file';
$filename = $safeBase . '-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.' . $ext;
$dest = $dir . '/' . $filename;

if (!is_dir($dir) || !is_writable($dir)){
  send_json(['ok' => false, 'error' => 'Upload folder is not writable on the server: ' . $urlBase], 500);
}

if (!move_uploaded_file($file['tmp_name'], $dest)){
  send_json(['ok' => false, 'error' => 'Could not save the file on the server.'], 500);
}
@chmod($dest, 0644);

send_json(['ok' => true, 'path' => $urlBase . '/' . $filename]);
