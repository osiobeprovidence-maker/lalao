import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { uploadImageWithFallback } from '../../lib/cloudinary';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface CampaignImageUploaderProps {
  mediaUrl: string;
  onMediaUrlChange: (url: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  disabled?: boolean;
}

export const CampaignImageUploader: React.FC<CampaignImageUploaderProps> = ({
  mediaUrl,
  onMediaUrlChange,
  onUploadStateChange,
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(mediaUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const localBlobUrlRef = useRef<string | null>(null);

  // Cloudinary / Convex storage mutation hooks
  const generateCloudinarySignature = useAction(api.cloudinary.generateSignature);
  const generateConvexUploadUrl = useMutation(api.social.generateUploadUrl);
  const resolveConvexStorageUrl = useMutation(api.social.resolveStorageUrl);

  // Synchronize local preview when mediaUrl changes externally (e.g., when selecting a promoted post)
  useEffect(() => {
    if (mediaUrl && !localBlobUrlRef.current) {
      setPreviewUrl(mediaUrl);
    }
  }, [mediaUrl]);

  // Notify parent of upload state changes
  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  // Clean up any temporary object URL on unmount or file replacement
  const cleanupBlobUrl = useCallback(() => {
    if (localBlobUrlRef.current) {
      URL.revokeObjectURL(localBlobUrlRef.current);
      localBlobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupBlobUrl();
    };
  }, [cleanupBlobUrl]);

  /**
   * Validate file format and size
   */
  const validateFile = (file: File): string | null => {
    const fileName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const hasAllowedMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type.startsWith('image/');

    if (!hasAllowedExtension && !hasAllowedMime) {
      return 'Unsupported file format. Please select a JPG, PNG, or WebP image.';
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File size (${sizeMb} MB) exceeds the maximum allowed limit of 10 MB.`;
    }

    return null;
  };

  /**
   * Perform upload of the file
   */
  const performUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgressText('Optimizing & uploading creative...');

    try {
      const cdnUrl = await uploadImageWithFallback(
        file,
        'ads',
        (folder) => generateCloudinarySignature({ folder }),
        () => generateConvexUploadUrl(),
        (args) => resolveConvexStorageUrl(args)
      );

      if (!cdnUrl) {
        throw new Error('Upload succeeded but no media URL was returned.');
      }

      // Upload finished successfully
      onMediaUrlChange(cdnUrl);
      setPreviewUrl(cdnUrl);
      setUploadProgressText('');
      // Clean up the local blob preview URL now that permanent CDN URL is active
      cleanupBlobUrl();
    } catch (err: any) {
      console.error('[CampaignImageUploader] Upload failed:', err);
      setUploadError(err.message || 'Image upload failed. Please verify your connection and try again.');
      setUploadProgressText('');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * File selection handler
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again if needed
    e.target.value = '';

    const validationMsg = validateFile(file);
    if (validationMsg) {
      setUploadError(validationMsg);
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Create immediate local object URL preview
    cleanupBlobUrl();
    const blobUrl = URL.createObjectURL(file);
    localBlobUrlRef.current = blobUrl;
    setPreviewUrl(blobUrl);

    // Immediately trigger upload
    performUpload(file);
  };

  /**
   * Remove selected image
   */
  const handleRemove = () => {
    cleanupBlobUrl();
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadError(null);
    setUploadProgressText('');
    onMediaUrlChange('');
  };

  /**
   * Retry failed upload
   */
  const handleRetry = () => {
    if (selectedFile) {
      performUpload(selectedFile);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
          <span>Ad Creative Image *</span>
          <span className="text-[10px] font-normal text-theme-tertiary">
            (JPG, PNG, WebP up to 10MB)
          </span>
        </label>
        {previewUrl && !isUploading && (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready</span>
          </span>
        )}
      </div>

      {/* Hidden Native File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-label="Upload ad creative image from device"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-label="Capture ad image with camera"
      />

      {/* Upload Dropzone / Preview Display */}
      {!previewUrl ? (
        <div
          onClick={() => {
            if (!disabled && !isUploading) fileInputRef.current?.click();
          }}
          className={`group relative rounded-2xl border-2 border-dashed border-theme-divider hover:border-[#5E43F3]/50 bg-theme-base/60 hover:bg-[#5E43F3]/5 transition-all p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 cursor-pointer select-none ${
            disabled ? 'opacity-50 pointer-events-none' : ''
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center transition-transform group-hover:scale-105">
            <ImageIcon className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-theme-primary">
              Choose an ad image or take a photo
            </p>
            <p className="text-xs text-theme-tertiary">
              Recommended: 1200×628px (Landscape) or 1080×1080px (Square)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select File</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary text-xs font-bold transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Use Camera</span>
            </button>
          </div>
        </div>
      ) : (
        /* Image Preview with Replace / Remove controls */
        <div className="relative rounded-2xl overflow-hidden border border-theme-divider bg-theme-base p-3 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black/5 max-h-[360px] flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Ad Creative Preview"
              className="w-full max-h-[360px] object-cover rounded-xl"
            />

            {/* Uploading Spinner Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white p-4">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-xs font-bold">{uploadProgressText || 'Uploading creative...'}</p>
                <p className="text-[10px] text-white/80">Please keep this window open</p>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-primary text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Image</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-secondary text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Error & Retry Banner */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
