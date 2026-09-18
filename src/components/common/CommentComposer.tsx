import React, { useState, useRef, useEffect } from 'react';
import { X, Send, CornerDownRight, Smile, Image as ImageIcon, Mic, Square } from 'lucide-react';
import { Avatar } from './Avatar';
import { useLalao } from '../../context/LalaoContext';

export interface CommentComposerProps {
  postId: string;
  replyingTo: { commentId: string; username: string } | null;
  onCancelReply: () => void;
  onCommentAdded: () => void;
  currentUser: any;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  postId,
  replyingTo,
  onCancelReply,
  onCommentAdded,
  currentUser
}) => {
  const { addComment, generateUploadUrl } = useLalao();

  const [commentText, setCommentText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-reply.webm', { type: 'audio/webm' });
        setMediaFile(file);
        setMediaPreviewUrl(URL.createObjectURL(file));
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      };
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() && !mediaFile) return;

    setIsUploading(true);
    let storageId = undefined;
    let mediaType: 'image' | 'voice' | 'gif' | undefined = undefined;

    if (mediaFile) {
      if (mediaFile.type.startsWith('audio/')) mediaType = 'voice';
      else if (mediaFile.type === 'image/gif') mediaType = 'gif';
      else mediaType = 'image';

      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": mediaFile.type },
          body: mediaFile,
        });
        const { storageId: uploadedStorageId } = await result.json();
        storageId = uploadedStorageId;
      } catch (err) {
        console.error("Failed to upload media:", err);
        setIsUploading(false);
        return;
      }
    }

    try {
      await addComment(postId, commentText, replyingTo?.commentId, storageId, mediaType);
      setCommentText('');
      onCancelReply();
      setMediaFile(null);
      setMediaPreviewUrl(null);
      audioChunksRef.current = [];
      onCommentAdded();
    } catch (err) {
      console.error("Error posting comment", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 shrink-0 px-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <CornerDownRight className="h-3.5 w-3.5" />
            <span>Replying to <strong className="text-neutral-700">@{replyingTo.username}</strong></span>
          </div>
          <button type="button" onClick={onCancelReply} className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {mediaPreviewUrl && (
        <div className="mb-2 p-2 flex items-center gap-2 bg-neutral-50 rounded-lg border border-neutral-100">
          {mediaFile?.type.startsWith('audio/') ? (
            <audio src={mediaPreviewUrl} controls className="h-8 max-w-[200px]" />
          ) : (
            <div className="relative">
              <img src={mediaPreviewUrl} alt="preview" className="h-12 w-12 object-cover rounded-md" />
              <button type="button" onClick={() => { setMediaFile(null); setMediaPreviewUrl(null); }} className="absolute -top-1.5 -right-1.5 bg-neutral-800 text-white rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSend} className="flex shrink-0 flex-col w-full">
        <div className="flex items-center gap-2 w-full">
          <Avatar src={currentUser.avatar} alt={currentUser.name} size="xs" />
          <div className="flex flex-1 items-center rounded-full bg-neutral-100/70 px-3.5 py-1.5 border border-neutral-200 focus-within:border-[#5E43F3] focus-within:bg-white transition-all">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={isRecording ? "Recording..." : "Write a reply..."}
              disabled={isRecording || isUploading}
              className="w-full bg-transparent text-xs outline-none placeholder:text-neutral-400 disabled:opacity-50"
            />
            <div className="flex items-center gap-1.5 text-neutral-400">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 hover:text-[#5E43F3] transition"><ImageIcon className="h-4 w-4" /></button>
              {isRecording ? (
                <button type="button" onClick={stopRecording} className="p-1 text-rose-500 animate-pulse"><Square className="h-4 w-4 fill-current" /></button>
              ) : (
                <button type="button" onClick={startRecording} className="p-1 hover:text-[#5E43F3] transition"><Mic className="h-4 w-4" /></button>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={(!commentText.trim() && !mediaFile) || isRecording || isUploading}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${(!commentText.trim() && !mediaFile) || isRecording || isUploading ? 'bg-neutral-100 text-neutral-400' : 'bg-[#5E43F3] text-white shadow-sm hover:bg-[#4E34E0] active:scale-95'}`}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
