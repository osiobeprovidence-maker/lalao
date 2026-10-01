import React, { useState } from 'react';
import { X, MapPin, Calendar, Check, MessageSquare, AlertCircle, Flag } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useLalao } from '../../../context/LalaoContext';

interface ListingDetailModalProps {
  listingId: any;
  onClose: () => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listingId, onClose }) => {
  const { openChatWithUser, currentUser } = useLalao();
  const listingData = useQuery(api.roomy.getListing, { listingId });
  const isSaved = useQuery(api.roomy.isListingSaved, { listingId });
  
  const toggleSave = useMutation(api.roomy.toggleSaveListing);
  const requestInspection = useMutation(api.roomy.requestInspection);
  
  const [isRequesting, setIsRequesting] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [message, setMessage] = useState('');
  const [showInspectionForm, setShowInspectionForm] = useState(false);

  if (!listingData) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  const { owner, ownerProfile } = listingData;
  const isOwner = currentUser?.id === owner?._id;

  const handleContactOwner = () => {
    if (owner?._id) {
      const initialMessage = `Hi! I saw your Roomy listing: "${listingData.title || listingData.description.substring(0, 30)}...". Is it still available?`;
      openChatWithUser(owner as any, initialMessage);
      onClose();
    }
  };

  const handleRequestInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequesting || !proposedDate) return;

    setIsRequesting(true);
    try {
      await requestInspection({
        listingId,
        proposedDate,
        message,
      });
      setShowInspectionForm(false);
      alert('Inspection requested successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to request inspection.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-theme-divider-light sticky top-0 bg-theme-surface z-10">
          <h3 className="font-black text-lg text-theme-primary">Listing Details</h3>
          <div className="flex items-center gap-2">
            {!isOwner && (
              <>
                <button 
                  onClick={() => toggleSave({ listingId })}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSaved ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface-active'
                  }`}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <button 
                  onClick={() => alert("Report submitted to moderation team.")}
                  className="p-2 rounded-full bg-theme-surface-hover text-theme-tertiary hover:bg-rose-100 hover:text-rose-600 cursor-pointer transition-colors"
                  title="Report Listing"
                >
                  <Flag className="w-5 h-5 stroke-[2.5]" />
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-theme-surface-hover text-theme-tertiary hover:bg-theme-surface-active cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          {listingData.photos && listingData.photos.length > 0 && (
            <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-theme-inverse relative">
              <img 
                src={listingData.photos[0]} 
                alt="Listing Cover" 
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          )}

          <div className="p-5 sm:p-8 space-y-8">
            {/* Header section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-[#5E43F3]/10 text-[#5E43F3] rounded-full text-[10px] font-black uppercase tracking-wider">
                  {listingData.type.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  listingData.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-theme-surface-hover text-theme-tertiary'
                }`}>
                  {listingData.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-theme-primary mb-2 leading-tight">
                {listingData.title || 'Room Listing'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-theme-tertiary">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-theme-tertiary" />
                  <span>{listingData.location}</span>
                </div>
                {listingData.price && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[#5E43F3] text-lg">
                      {listingData.currency || '₦'}{listingData.price.toLocaleString()}
                    </span>
                    <span className="text-xs">/month</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-3">Description</h4>
              <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">
                {listingData.description}
              </p>
            </div>

            {/* Owner Profile Snippet */}
            <div className="bg-theme-base border border-theme-divider-light rounded-2xl p-5">
              <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-4">Listed By</h4>
              <div className="flex items-start gap-4">
                <img 
                  src={owner?.avatarUrl || '/placeholder.png'} 
                  alt={owner?.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="flex-1">
                  <h5 className="font-bold text-theme-primary">{owner?.name}</h5>
                  <p className="text-xs text-theme-tertiary">@{owner?.username}</p>
                  
                  {ownerProfile?.bio && (
                    <p className="text-xs text-theme-secondary mt-2 line-clamp-2">
                      "{ownerProfile.bio}"
                    </p>
                  )}
                  
                  {ownerProfile?.university && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-theme-surface border border-theme-divider rounded-lg text-[10px] font-bold text-theme-secondary">
                      <span>🎓</span> {ownerProfile.university}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Area */}
            {!isOwner && listingData.status === 'active' && (
              <div className="pt-4 border-t border-theme-divider-light">
                {showInspectionForm ? (
                  <form onSubmit={handleRequestInspection} className="bg-theme-base p-5 rounded-2xl border border-theme-divider space-y-4">
                    <h4 className="font-bold text-theme-primary flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5E43F3]" />
                      Schedule an Inspection
                    </h4>
                    
                    <div>
                      <label className="block text-xs font-bold text-theme-secondary mb-1.5">Proposed Date & Time</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={proposedDate}
                        onChange={e => setProposedDate(e.target.value)}
                        className="w-full bg-theme-surface border border-theme-divider rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5E43F3]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-theme-secondary mb-1.5">Message (Optional)</label>
                      <textarea 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Hi, I'd like to check out the place..."
                        rows={2}
                        className="w-full bg-theme-surface border border-theme-divider rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5E43F3] resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setShowInspectionForm(false)}
                        className="flex-1 py-2.5 bg-theme-surface border border-theme-divider text-theme-secondary font-bold rounded-xl text-sm hover:bg-theme-base transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isRequesting || !proposedDate}
                        className="flex-1 py-2.5 bg-[#5E43F3] text-white font-bold rounded-xl text-sm hover:bg-[#4E34E0] disabled:opacity-50 transition-colors"
                      >
                        {isRequesting ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={handleContactOwner}
                      className="flex-1 py-3.5 bg-theme-inverse text-theme-text-inverse font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-theme-inverse transition-all cursor-pointer shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Contact Owner
                    </button>
                    <button 
                      onClick={() => setShowInspectionForm(true)}
                      className="flex-1 py-3.5 bg-[#5E43F3] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#4E34E0] transition-all cursor-pointer shadow-md"
                    >
                      <Calendar className="w-4 h-4" />
                      Request Inspection
                    </button>
                  </div>
                )}
              </div>
            )}

            {isOwner && (
              <div className="pt-4 border-t border-theme-divider-light bg-theme-base -mx-5 sm:-mx-8 px-5 sm:px-8 pb-5 sm:pb-8">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">You manage this listing</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Check your inspections dashboard for requests or messages.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
