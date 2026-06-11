export type PostMediaType = 'image' | 'video' | 'audio' | 'unknown';

const extensionToMimeType: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4v: 'video/x-m4v',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  'x-m4a': 'audio/x-m4a',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  '3gp': 'audio/3gpp',
  flac: 'audio/flac',
};

/** Extensions that always mean audio (never video). */
const AUDIO_EXTENSIONS = new Set([
  'mp3', 'm4a', 'x-m4a', 'wav', 'aac', 'ogg', 'oga', '3gp', 'flac', 'opus', 'amr',
]);

/** Extensions that always mean video. */
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv', '3gpp']);

/** Extensions that always mean image. */
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']);

const cleanUri = (uri: string): string => uri.split('?')[0].split('#')[0];

const extensionFromUri = (uri: string): string | null => {
  const cleaned = cleanUri(uri).toLowerCase();
  const dotIndex = cleaned.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === cleaned.length - 1) return null;
  return cleaned.substring(dotIndex + 1);
};

/**
 * Infer the media type from a URI.
 *
 * Works for:
 *  - Local file URIs  (file:///cache/recording.m4a)
 *  - data: URIs       (data:audio/mpeg;base64,...)
 *  - Cloudinary URLs  (https://res.cloudinary.com/…/video/upload/v1/posts/uuid.m4a)
 *
 * Cloudinary stores audio with resource_type "video", so the URL contains
 * /video/upload/.  We look at the file extension in the public_id segment
 * (after the version number) to distinguish audio from real video.
 */
export const inferMediaType = (uri: string): PostMediaType => {
  if (!uri) return 'unknown';

  const lower = uri.toLowerCase();

  // ── data: URIs ──────────────────────────────────────────────────
  if (lower.startsWith('data:')) {
    if (lower.startsWith('data:image/')) return 'image';
    if (lower.startsWith('data:video/')) return 'video';
    if (lower.startsWith('data:audio/')) return 'audio';
    return 'unknown';
  }

  // ── Extension-first (covers local URIs and Cloudinary URLs with ext) ─
  const ext = extensionFromUri(lower);
  if (ext) {
    if (IMAGE_EXTENSIONS.has(ext)) return 'image';
    if (AUDIO_EXTENSIONS.has(ext)) return 'audio';  // check audio BEFORE video
    if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  }

  // ── Cloudinary URL without extension ────────────────────────────
  // Cloudinary audio is stored under /video/upload/.  When no extension
  // is present we cannot distinguish audio from video by the path alone,
  // so we return 'unknown' and let PostMediaAttachment probe via HEAD.
  // However, if the public_id itself contains a known audio keyword we
  // can make a best-effort guess.
  if (lower.includes('res.cloudinary.com')) {
    if (lower.includes('/image/upload/')) return 'image';
    // /video/upload/ is used for BOTH video and audio by Cloudinary
    // – fall through to 'unknown' so PostMediaAttachment HEAD-probes it
  }

  return 'unknown';
};

export const getMimeTypeFromUri = (uri: string): string | null => {
  const ext = extensionFromUri(uri);
  if (!ext) return null;
  return extensionToMimeType[ext] ?? null;
};

export const buildDataUri = (base64Content: string, mimeType: string): string =>
  `data:${mimeType};base64,${base64Content}`;
