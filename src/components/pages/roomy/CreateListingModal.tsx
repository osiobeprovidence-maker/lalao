import React, { useState } from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

interface CreateListingModalProps {
  defaultType?: 'room_offered' | 'room_wanted' | 'roommate_wanted';
  onClose: () => void;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ defaultType = 'room_offered', onClose }) => {
  const [type, setType] = useState<'room_offered' | 'room_wanted' | 'roommate_wanted'>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createListing = useMutation(api.roomy.createListing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !location) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createListing({
        type,
        title: title || undefined,
        description,
        price: price ? parseInt(price) : undefined,
        location,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h3 className="font-black text-lg text-neutral-900">Post a Listing</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <form id="create-listing-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Type Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wider">
                What are you posting?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'room_offered', label: 'Room Available' },
                  { id: 'room_wanted', label: 'Need a Room' },
                  { id: 'roommate_wanted', label: 'Need a Roommate' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id as any)}
                    className={`py-3 px-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer ${
                      type === opt.id 
                        ? 'border-[#5E43F3] bg-[#5E43F3]/5 text-[#5E43F3]' 
                        : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {type === 'room_offered' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Listing Title
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Spacious En-suite Room in Ugbowo"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5E43F3]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Location *
              </label>
              <input 
                type="text" 
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. BDPA, Ugbowo"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5E43F3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Price (Monthly)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₦</span>
                <input 
                  type="number" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#5E43F3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Description *
              </label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the room, amenities, rules, or what you are looking for..."
                rows={5}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5E43F3] resize-none"
              />
            </div>

            {/* Placeholder for photos - complex upload logic goes here normally */}
            {type === 'room_offered' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Photos
                </label>
                <button type="button" className="w-full py-8 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center gap-2 text-neutral-400 hover:bg-neutral-50 hover:border-[#5E43F3]/50 transition-all cursor-not-allowed">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs font-semibold">Photo uploads coming soon</span>
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50">
          <button
            type="submit"
            form="create-listing-form"
            disabled={isSubmitting || !description || !location}
            className="w-full py-3.5 bg-[#5E43F3] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#4E34E0] disabled:opacity-50 cursor-pointer shadow-md transition-all"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                Post Listing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
