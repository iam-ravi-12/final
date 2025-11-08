// Compress image to reduce file size
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Compress video by reducing quality (basic approach)
// For more advanced video compression, consider using libraries like ffmpeg.wasm
export const compressVideo = (file) => {
  return new Promise((resolve, reject) => {
    // For now, just read the video as base64
    // In production, you might want to use ffmpeg.wasm for actual compression
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read video file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Main function to compress media files
export const compressMediaFile = async (file) => {
  if (file.type.startsWith('image/')) {
    return await compressImage(file);
  } else if (file.type.startsWith('video/')) {
    return await compressVideo(file);
  } else {
    throw new Error('Unsupported file type');
  }
};
