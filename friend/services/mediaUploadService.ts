import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://sos-check.onrender.com';

/**
 * Upload a local media file (image / video / audio) directly to Firebase Storage
 * through the backend multipart endpoint.
 *
 * The file is streamed as binary – no base64 conversion – so this works for
 * arbitrarily large video and audio files without running out of memory.
 *
 * @param uri      Local file URI returned by ImagePicker / DocumentPicker
 * @param mimeType MIME type of the file (e.g. "video/mp4", "audio/mpeg")
 * @param folder   Destination folder in Firebase Storage (default: "posts")
 * @returns        Public Firebase Storage URL for the uploaded file
 */
export async function uploadMedia(
  uri: string,
  mimeType: string,
  folder: string = 'posts'
): Promise<string> {
  const token = await AsyncStorage.getItem('token');

  const result = await FileSystem.uploadAsync(
    `${API_URL}/api/media/upload?folder=${encodeURIComponent(folder)}`,
    uri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    }
  );

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Media upload failed (HTTP ${result.status}): ${result.body}`);
  }

  const data = JSON.parse(result.body) as { url: string };
  if (!data.url) {
    throw new Error('Server did not return a media URL');
  }
  return data.url;
}
