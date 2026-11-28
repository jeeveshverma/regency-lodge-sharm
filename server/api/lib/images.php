<?php
/** Uploaded pictures: checked, re-encoded with GD (so nothing but pixels is kept) and resized. */
declare(strict_types=1);

const MAX_UPLOAD = 15 * 1024 * 1024;

function loadUpload(string $field): array
{
    $f = $_FILES[$field] ?? null;
    if (!$f || !is_uploaded_file($f['tmp_name'] ?? '')) fail(400, $f && ($f['error'] ?? 0) === UPLOAD_ERR_INI_SIZE ? 'file_too_big' : 'no_file');
    if ($f['size'] > MAX_UPLOAD) fail(400, 'file_too_big');
    $info = @getimagesize($f['tmp_name']);
    $make = [IMAGETYPE_JPEG => 'imagecreatefromjpeg', IMAGETYPE_PNG => 'imagecreatefrompng', IMAGETYPE_WEBP => 'imagecreatefromwebp'][$info[2] ?? 0] ?? null;
    if (!$make || !function_exists($make)) fail(400, 'not_an_image');
    if ($info[0] * $info[1] > 60_000_000) fail(400, 'file_too_big');
    $img = @$make($f['tmp_name']);
    if (!$img) fail(400, 'not_an_image');
    // phones store portrait photos sideways with a note in EXIF; turn them upright
    if ($info[2] === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $o = (int) (@exif_read_data($f['tmp_name'])['Orientation'] ?? 1);
        $deg = [3 => 180, 6 => -90, 8 => 90][$o] ?? 0;
        if ($deg) $img = imagerotate($img, $deg, 0);
    }
    return [$img, $info[2]];
}

function fitWidth(GdImage $img, int $max, bool $alpha = false): GdImage
{
    $w = imagesx($img); $h = imagesy($img);
    $nw = min($w, $max); $nh = (int) round($h * $nw / $w);
    $out = imagecreatetruecolor($nw, $nh);
    if ($alpha) { imagealphablending($out, false); imagesavealpha($out, true); imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127)); }
    else imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
    imagecopyresampled($out, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
    return $out;
}

function ensureUploads(): string
{
    $dir = uploadsDir();
    if (!is_dir($dir) && !@mkdir($dir, 0775, true)) fail(500, 'uploads_not_writable');
    if (!is_writable($dir)) fail(500, 'uploads_not_writable');
    return $dir;
}

/** Save a photo as name.jpg (up to 1600 px wide) and name-s.jpg (up to 640 px). Returns "name.jpg". */
function savePhoto(string $field): string
{
    [$img] = loadUpload($field);
    $dir = ensureUploads();
    $name = 'p' . bin2hex(random_bytes(8));
    if (!imagejpeg(fitWidth($img, 1600), "$dir/$name.jpg", 82) || !imagejpeg(fitWidth($img, 640), "$dir/$name-s.jpg", 78)) fail(500, 'uploads_not_writable');
    return "$name.jpg";
}

/** Save the logo as a PNG up to 600 px wide, keeping transparency. Returns the file name. */
function saveLogo(string $field): string
{
    [$img] = loadUpload($field);
    $dir = ensureUploads();
    $name = 'logo-' . bin2hex(random_bytes(5)) . '.png';
    if (!imagepng(fitWidth($img, 600, true), "$dir/$name", 8)) fail(500, 'uploads_not_writable');
    return $name;
}

function deletePhotoFiles(string $file): void
{
    if (!preg_match('/^[a-z0-9-]+\.(jpg|png)$/', $file)) return;
    $dir = uploadsDir();
    @unlink("$dir/$file");
    @unlink("$dir/" . preg_replace('/\.jpg$/', '-s.jpg', $file));
}

function photoJson(array $p): array
{
    $u = uploadsUrl() . '/';
    return ['id' => (int) $p['id'], 'room' => $p['room_id'] === null ? null : (int) $p['room_id'], 'src' => $u . $p['file'], 'small' => $u . preg_replace('/\.jpg$/', '-s.jpg', $p['file']),
        'cap' => ['ar' => $p['cap_ar'], 'en' => $p['cap_en']], 'wide' => (bool) $p['wide']];
}
