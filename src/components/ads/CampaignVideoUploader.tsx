import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Video as VideoIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Play,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Configured size limits based on Lalao storage infrastructure
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

interface CampaignVideoUploaderProps {
  mediaUrl: string;
  onMediaUrlChange: (url: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  disabled?: boolean;
}

export const CampaignVideoUploader: React.FC<CampaignVideoUploaderProps> = ({
  mediaUrl,
  onMediaUrlChange,
  onUploadStateChange,
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(mediaUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const localBlobUrlRef = useRef<string | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Storage mutation hooks
  const generateConvexUploadUrl = useMutation(api.social.generateUploadUrl);
  const resolveConvexStorageUrl = useMutation(api.social.resolveStorageUrl);

  // Synchronize local preview when mediaUrl changes externally
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
   * Validate video format and size
   */
  const validateFile = (file: File): string | null => {
    const fileName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_VIDEO_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const hasAllowedMime = ALLOWED_VIDEO_MIME_TYPES.includes(file.type) || file.type.startsWith('video/');

    if (!hasAllowedExtension && !hasAllowedMime) {
      return 'Unsupported video format. Please select an MP4, WebM, or MOV video.';
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `Video size (${sizeMb} MB) exceeds the maximum allowed limit of 100 MB.`;
    }

    return null;
  };

  /**
   * Perform upload of the video to Convex storage with XMLHttpRequest progress
   */
  const performUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUploadProgressText('Requesting upload authorization...');

    try {
      const uploadUrl = await generateConvexUploadUrl();
      if (!uploadUrl) {
        throw new Error('Failed to generate secure upload URL.');
      }

      setUploadProgressText('Uploading video creative...');

      // Upload using XMLHttpRequest to get accurate progress updates
      const storageId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
            setUploadProgressText(`Uploading video creative... ${percent}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.storageId) {
                resolve(res.storageId);
              } else {
                reject(new Error('Storage ID not returned from upload endpoint.'));
              }
            } catch (e) {
              reject(new Error('Failed to parse storage response.'));
            }
          } else {
            reject(new Error(`Storage upload failed with HTTP status ${xhr.status}.`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during video upload. Please check your internet connection.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Upload request timed out. Please try again.'));
        };

        xhr.send(file);
      });

      setUploadProgressText('Finalizing media delivery...');
      const directUrl = await resolveConvexStorageUrl({ storageId: storageId as any });
      if (!directUrl) {
        throw new Error('Could not resolve public video delivery URL.');
      }

      // Success
      onMediaUrlChange(directUrl);
      setPreviewUrl(directUrl);
      setUploadProgressText('');
      setUploadProgress(100);
      cleanupBlobUrl();
    } catch (err: any) {
      console.error('[CampaignVideoUploader] Upload error:', err);
      setUploadError(err.message || 'Video upload failed. Please verify your connection and try again.');
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

    // Reset input value so same file can be re-selected if desired
    e.target.value = '';

    const validationMsg = validateFile(file);
    if (validationMsg) {
      setUploadError(validationMsg);
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Create immediate local object URL for preview
    cleanupBlobUrl();
    const blobUrl = URL.createObjectURL(file);
    localBlobUrlRef.current = blobUrl;
    setPreviewUrl(blobUrl);

    // Trigger upload
    performUpload(file);
  };

  /**
   * Remove selected video
   */
  const handleRemove = () => {
    cleanupBlobUrl();
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadError(null);
    setUploadProgressText('');
    setUploadProgress(0);
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
          <span>Ad Video Creative *</span>
          <span className="text-[10px] font-normal text-theme-tertiary">
            (MP4, WebM, MOV up to 100MB)
          </span>
        </label>
        {previewUrl && !isUploading && (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready</span>
          </span>
        )}
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-label="Upload ad creative video from device"
      />

      {/* Upload Dropzone / Video Preview */}
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
            <VideoIcon className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-theme-primary">
              Choose an ad video file
            </p>
            <p className="text-xs text-theme-tertiary">
              Recommended: MP4 / WebM with 16:9, 1:1, or 9:16 vertical ratio
            </p>
          </div>

          <div className="pt-2">
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
              <span>Select Video File</span>
            </button>
          </div>
        </div>
      ) : (
        /* Video Preview with native controls & replace/remove bar */
        <div className="relative rounded-2xl overflow-hidden border border-theme-divider bg-theme-base p-3 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black max-h-[360px] flex items-center justify-center">
            <video
              ref={videoPreviewRef}
              src={previewUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[360px] object-contain rounded-xl"
            />

            {/* Uploading Spinner & Progress Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white p-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#5E43F3]" />
                <div className="w-full max-w-xs space-y-1.5 text-center">
                  <p className="text-xs font-bold">{uploadProgressText || 'Uploading video...'}</p>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5E43F3] h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/80">
                    {uploadProgress}% · Please keep this window open
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-theme-primary text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace Video</span>
            </button>

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
