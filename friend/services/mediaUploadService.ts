import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://sos-check.onrender.com';

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

  const formData = new FormData();
  // React Native FormData accepts a file-like object with uri/type/name
  formData.append('file', {
    uri,
    type: mimeType,
    name: 'upload',
  } as unknown as Blob);

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
}
