/**
 * Zero-dependency browser-native client-side image compression.
 * Resizes large dimensions and compresses JPEG/WebP files before upload.
 * Reduces 5MB-15MB phone camera photos down to ~150KB-300KB (95%+ reduction),
 * enabling lightning-fast uploads and ultra-fast page loads.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

export const compressImage = async (
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<File> => {
  // If it's a GIF or SVG, do NOT compress so animation and vectors are preserved
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file instanceof File ? file : new File([file], 'image.gif', { type: file.type });
  }

  // If not an image, return original
  if (file.type && !file.type.startsWith('image/')) {
    return file instanceof File ? file : new File([file], 'file', { type: file.type });
  }

  // If already under 150KB, don't recompress
  if (file.size > 0 && file.size <= 150 * 1024) {
    return file instanceof File ? file : new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });
  }

  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      let { width, height } = img;

      // Calculate constrained dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original if 2D context is unavailable
        resolve(file instanceof File ? file : new File([file], 'image.jpg', { type: file.type }));
        return;
      }

      // Draw image onto canvas with high quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file instanceof File ? file : new File([file], 'image.jpg', { type: file.type }));
            return;
          }

          // Use original filename or generate a clean one
          const originalName = file instanceof File ? file.name : 'upload.jpg';
          const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';
          const cleanName = originalName.replace(/\.[^/.]+$/, '') + extension;

          const compressedFile = new File([blob], cleanName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          // If the compressed version is somehow larger, prefer the original
          if (file instanceof File && compressedFile.size >= file.size) {
            resolve(file);
          } else {
            resolve(compressedFile);
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(file instanceof File ? file : new File([file], 'image.jpg', { type: file.type }));
    };

    img.src = blobUrl;
  });
};
