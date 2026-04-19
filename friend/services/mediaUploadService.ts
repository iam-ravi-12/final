import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://final-production-3b39.up.railway.app';

// How long to wait for the Render server to wake up from a cold start.
// Render free-tier instances can take 60–120 s to boot; 3 minutes is safe.
const WARMUP_TIMEOUT_MS = 180_000;
// How long to wait for the actual file upload once the server is awake.
const UPLOAD_TIMEOUT_MS = 120_000;

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
 * Send a lightweight GET request to wake up the Render server before the
 * actual upload. Any HTTP response (even 401/403) means the server is awake;
 * only a timeout or network error is treated as a failure.
 */
async function warmUpServer(token: string | null): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
  try {
    await fetch(`${API_URL}/api/auth/profile`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
    // Any response means the server is up – ignore the status code.
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        'Could not reach the server after 3 minutes. Please check your internet connection and try again.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Upload a local media file (image / video / audio) to Cloudinary
 * through the backend multipart endpoint.
 *
 * Uses React Native's built-in fetch + FormData so no extra packages are needed.
 * The file is NOT base64-encoded, so this works for large video/audio files.
 *
 * @param uri            Local file URI returned by ImagePicker / DocumentPicker
 * @param mimeType       MIME type of the file (e.g. "video/mp4", "audio/mpeg")
 * @param folder         Destination folder in Cloudinary (default: "posts")
 * @param onStatusChange Optional callback invoked with status text for UI display
 * @returns              Public Cloudinary URL for the uploaded file
 */
export async function uploadMedia(
  uri: string,
  mimeType: string,
  folder: string = 'posts',
  onStatusChange?: (status: string) => void
): Promise<string> {
  const token = await AsyncStorage.getItem('token');

  // Phase 1: wake up the Render server (absorbs the cold-start delay).
  onStatusChange?.('Connecting to server…');
  await warmUpServer(token);

  // Phase 2: now that the server is warm, send the actual file.
  onStatusChange?.('Uploading…');

  // Include the file extension in the name so React Native's native multipart
  // encoder can correctly identify the content type on all platforms.
  const ext = getExtension(mimeType);
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: mimeType,
    name: `upload.${ext}`,
  } as unknown as Blob);

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
      throw new Error('Upload timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
