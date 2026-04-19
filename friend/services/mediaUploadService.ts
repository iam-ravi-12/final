import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://sos-check.onrender.com';

// Abort the upload after this many milliseconds to prevent an infinite spinner.
// Render free-tier servers can take up to 60 s to cold-start; 90 s gives ample
// margin while still surfacing a clear error to the user.
const UPLOAD_TIMEOUT_MS = 90_000;

/** Return a file extension for a given MIME type, e.g. "image/jpeg" → "jpg". */
function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
  };
  return map[mimeType] ?? mimeType.split('/')[1]?.split(';')[0] ?? 'bin';
}

/**
 * Upload a local media file (image / video / audio) to Cloudinary
 * through the backend multipart endpoint.
 *
 * Uses React Native's built-in fetch + FormData so no extra packages are needed.
 * The file is NOT base64-encoded, so this works for large video/audio files.
 *
 * @param uri      Local file URI returned by ImagePicker / DocumentPicker
 * @param mimeType MIME type of the file (e.g. "video/mp4", "audio/mpeg")
 * @param folder   Destination folder in Cloudinary (default: "posts")
 * @returns        Public Cloudinary URL for the uploaded file
 */
export async function uploadMedia(
  uri: string,
  mimeType: string,
  folder: string = 'posts'
): Promise<string> {
  const token = await AsyncStorage.getItem('token');

  // Include the file extension in the name so React Native's native multipart
  // encoder can correctly identify the content type on all platforms.
  const ext = getExtension(mimeType);
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: mimeType,
    name: `upload.${ext}`,
  } as unknown as Blob);

  // AbortController lets us cancel the fetch after UPLOAD_TIMEOUT_MS,
  // preventing the spinner from hanging forever when the server is slow.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_URL}/api/media/upload?folder=${encodeURIComponent(folder)}`,
      {
        method: 'POST',
        headers: {
          // Do NOT set Content-Type here – fetch sets it automatically with the
          // correct multipart boundary when the body is FormData.
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Media upload failed (HTTP ${response.status}): ${text}`);
    }

    const data = (await response.json()) as { url: string };
    if (!data.url) {
      throw new Error('Server did not return a media URL');
    }
    return data.url;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Upload timed out. The server may be starting up – please try again in a moment.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
