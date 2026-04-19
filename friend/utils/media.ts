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
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
};

const cleanUri = (uri: string): string => uri.split('?')[0].split('#')[0];

const extensionFromUri = (uri: string): string | null => {
  const cleaned = cleanUri(uri).toLowerCase();
  const dotIndex = cleaned.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === cleaned.length - 1) return null;
  return cleaned.substring(dotIndex + 1);
};

export const inferMediaType = (uri: string): PostMediaType => {
  if (!uri) return 'unknown';

  const lowerUri = uri.toLowerCase();
  if (lowerUri.startsWith('data:')) {
    if (lowerUri.startsWith('data:image/')) return 'image';
    if (lowerUri.startsWith('data:video/')) return 'video';
    if (lowerUri.startsWith('data:audio/')) return 'audio';
    return 'unknown';
  }

  const ext = extensionFromUri(lowerUri);
  if (!ext) return 'unknown';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'webm', 'm4v'].includes(ext)) return 'video';
  if (['mp3', 'm4a', 'wav', 'aac', 'ogg', 'oga'].includes(ext)) return 'audio';
  return 'unknown';
};

export const getMimeTypeFromUri = (uri: string): string | null => {
  const ext = extensionFromUri(uri);
  if (!ext) return null;
  return extensionToMimeType[ext] ?? null;
};

export const buildDataUri = (base64Content: string, mimeType: string): string =>
  `data:${mimeType};base64,${base64Content}`;
