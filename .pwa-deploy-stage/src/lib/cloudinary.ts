export const uploadImageToCloudinary = async (
  file: File,
  signatureData: { signature: string; timestamp: number; apiKey: string; folder?: string }
): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error("VITE_CLOUDINARY_CLOUD_NAME is not set in environment variables");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", signatureData.timestamp.toString());
  formData.append("signature", signatureData.signature);
  if (signatureData.folder) {
    formData.append("folder", signatureData.folder);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const data = await response.json();
  return data.secure_url;
};

import { compressImage } from './imageCompression';

/**
 * Uploads an image using Cloudinary if available and configured,
 * otherwise seamlessly falls back to Convex internal file storage.
 * Compresses images automatically client-side for fast uploads and speedy page loads.
 * Always resolves and returns a public URL string.
 */
export const uploadImageWithFallback = async (
  file: File | Blob,
  folder: string | undefined,
  generateCloudinarySignature: ((folder?: string) => Promise<any>) | undefined,
  generateConvexUploadUrl: () => Promise<string>,
  resolveConvexStorageUrl: (args: { storageId: any }) => Promise<string | null>
): Promise<string> => {
  // Compress images client-side before uploading (avatars 512px, other photos 1600px)
  const isImage = file.type?.startsWith('image/') || file.type === '';
  const processedFile = isImage
    ? await compressImage(file, {
        maxWidth: folder === 'avatars' ? 512 : 1600,
        maxHeight: folder === 'avatars' ? 512 : 1600,
        quality: 0.82,
      })
    : file;

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  // 1. Attempt Cloudinary if frontend cloud name is present & signature action is provided
  if (cloudName && typeof generateCloudinarySignature === 'function') {
    try {
      const sigData = await generateCloudinarySignature(folder);
      if (sigData && sigData.signature) {
        return await uploadImageToCloudinary(processedFile as File, sigData);
      }
    } catch (cloudErr) {
      console.warn('[Upload] Cloudinary upload unavailable or unconfigured, falling back to Convex storage:', cloudErr);
    }
  }

  // 2. Seamless Convex File Storage Fallback
  const uploadUrl = await generateConvexUploadUrl();
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': processedFile.type || 'application/octet-stream' },
    body: processedFile,
  });


  if (!uploadRes.ok) {
    throw new Error(`Convex storage upload failed with status ${uploadRes.status}`);
  }

  const { storageId } = await uploadRes.json();
  const directUrl = await resolveConvexStorageUrl({ storageId });
  if (!directUrl) {
    throw new Error('Could not resolve Convex storage URL');
  }

  return directUrl;
};

