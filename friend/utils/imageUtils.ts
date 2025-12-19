import * as FileSystem from 'expo-file-system';

/**
 * Convert image URI to base64 string for uploading to backend
 * The backend will then upload it to Firebase Storage
 * 
 * @param uri - Local file URI from ImagePicker
 * @returns Base64 encoded string with data URI prefix
 */
export const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Determine the image type from the URI
    const imageType = uri.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    
    // Return with data URI prefix so backend knows the format
    return `data:image/${imageType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Convert multiple image URIs to base64 strings
 * 
 * @param uris - Array of local file URIs
 * @returns Array of base64 encoded strings
 */
export const convertImagesToBase64 = async (uris: string[]): Promise<string[]> => {
  try {
    const promises = uris.map(uri => convertImageToBase64(uri));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error converting images to base64:', error);
    throw new Error('Failed to process images');
  }
};
