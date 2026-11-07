export const uploadImageToCloudinary = async (
  file: File,
  signatureData: { signature: string; timestamp: number; apiKey: string; folder?: string; cloudName?: string; resourceType?: string }
): Promise<string> => {
  return (await uploadCloudinaryAsset(file, signatureData)).secureUrl;
};

export type CloudinaryAvatarUpload = {
  secureUrl: string;
  publicId: string;
};

export async function uploadAvatarToCloudinary(
  file: File,
  signatureData: { signature: string; timestamp: number; apiKey: string; publicId: string; cloudName: string },
): Promise<CloudinaryAvatarUpload> {
  return uploadCloudinaryAsset(file, signatureData);
}

async function uploadCloudinaryAsset(
  file: File,
  signatureData: {
    signature: string;
    timestamp: number;
    apiKey: string;
    folder?: string;
    publicId?: string;
    cloudName?: string;
    resourceType?: string;
  },
): Promise<CloudinaryAvatarUpload> {
  const cloudName = signatureData.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("VITE_CLOUDINARY_CLOUD_NAME is not set in environment variables");
  }

  const resourceType = signatureData.resourceType ?? 'image';
  if (resourceType !== 'image') {
    throw new Error('Only image uploads are permitted through this upload flow.');
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", signatureData.timestamp.toString());
  formData.append("signature", signatureData.signature);
  if (signatureData.folder) {
    formData.append("folder", signatureData.folder);
  }
  if (signatureData.publicId) {
    formData.append("public_id", signatureData.publicId);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const data = await response.json();
  if (typeof data.secure_url !== 'string' || typeof data.public_id !== 'string') {
    throw new Error('Cloudinary returned an incomplete upload response.');
  }
  return { secureUrl: data.secure_url, publicId: data.public_id };
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
