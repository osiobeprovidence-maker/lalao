export interface PostMediaSource {
  mediaUrl?: string;
  mediaStorageId?: string;
  getUrl?: (storageId: string) => string | undefined;
}

export function resolvePostMediaUrl({
  mediaUrl,
  mediaStorageId,
  getUrl,
}: PostMediaSource): string | undefined {
  if (mediaUrl?.trim()) return mediaUrl;
  if (!mediaStorageId || !getUrl) return undefined;
  return getUrl(mediaStorageId);
}
