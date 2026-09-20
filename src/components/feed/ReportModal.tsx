import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { X, AlertTriangle } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "post" | "user" | "page" | "comment" | "reply" | "product" | "event" | "message" | "other";
  onSuccess: () => void;
}

const REPORT_REASONS = [
  "Spam",
  "Harassment or bullying",
  "Hate or abusive content",
  "Violence or threats",
  "Sexual or inappropriate content",
  "Scam or fraud",
  "False/misleading information",
  "Illegal activity",
  "Privacy violation",
  "Other"
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  onSuccess
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReport = useMutation(api.reports.createReport);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    
    setIsSubmitting(true);
    try {
      await createReport({
        targetType,
        targetId,
        reason: selectedReason,
        description: description.trim() || undefined,
        priority: "normal"
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-neutral-900">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-lg">Report Content</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Why are you reporting this?
            </label>
            <div className="max-h-[240px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {REPORT_REASONS.map((reason) => (
                <label 
                  key={reason}
                  className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-[#5200FF] focus:ring-[#5200FF] border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context to help us review..."
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-[#5200FF] focus:bg-white transition-colors resize-none"
              rows={3}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
