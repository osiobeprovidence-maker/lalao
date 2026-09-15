import React, { useState, useRef, useEffect } from 'react';
import { Hand, MapPin, Clock, Tag } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Rally } from '../../types';

export const RallyComposerModal: React.FC = () => {
  const {
    location,
    createRally,
    createFlowType,
    setCreateFlowType,
    setIsCreateSheetOpen,
  } = useLalao();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rallyLocation, setRallyLocation] = useState(`${location.name} Area`);
  const [timeDate, setTimeDate] = useState('Today · 6:00 PM');
  const [category, setCategory] = useState<Rally['category']>('Sports');
  const [isUrgent, setIsUrgent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (createFlowType === 'rally') {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [createFlowType]);

  if (createFlowType !== 'rally') return null;

  const handleClose = () => {
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    createRally({
      title: title.trim(),
      description: description.trim(),
      location: rallyLocation.trim(),
      timeDate: timeDate.trim(),
      category,
    });
  };

  const categories: Rally['category'][] = ['Sports', 'Help', 'Meetup', 'Initiative', 'Civic', 'General'];

  return (
    <div
      ref={containerRef}
      id="rally-composer-screen"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-250"
    >
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="text-sm font-semibold text-neutral-600 hover:text-neutral-950 px-2 py-1 -ml-2 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-1.5">
          <Hand className="w-4 h-4 text-[#5E43F3]" />
          <h3 className="font-bold text-base text-neutral-950">Create Rally</h3>
        </div>

        <button
          id="btn-submit-rally"
          onClick={handleSubmit}
          disabled={!title.trim() || !description.trim()}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            title.trim() && description.trim()
              ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 active:scale-95'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          Broadcast
        </button>
      </div>

      {/* Main Screen Body */}
      <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-5 pb-24">
        {/* Explain Banner */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 text-xs text-indigo-950 flex items-start gap-2.5 shadow-2xs">
          <Hand className="w-4 h-4 text-[#5E43F3] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            A <strong>Rally</strong> reaches out to people within your discovery radius. Use it to
            ask for urgent assistance, gather players, or invite neighbors to take action.
          </p>
        </div>

        {/* Category Pills */}
        <div>
          <label className="text-xs font-bold text-neutral-700 mb-2 block">
            Select Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-[#5E43F3] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
            Rally Request / Action Title
          </label>
          <input
            id="input-rally-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Need 2 people for football tonight"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 outline-none text-sm font-semibold text-neutral-900"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
            Details & Instructions
          </label>
          <textarea
            id="input-rally-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Looking for two people to join our game at 6pm. Pitch is booked, bibs provided..."
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 outline-none text-sm text-neutral-900 resize-none leading-relaxed"
          />
        </div>

        {/* Location & Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#5E43F3]" />
              Location
            </label>
            <input
              type="text"
              value={rallyLocation}
              onChange={(e) => setRallyLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-800 focus:border-[#5E43F3] outline-none"
              placeholder="Udu Field / Junction"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#5E43F3]" />
              When / Time
            </label>
            <input
              type="text"
              value={timeDate}
              onChange={(e) => setTimeDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-800 focus:border-[#5E43F3] outline-none"
              placeholder="Today · 6:00 PM"
            />
          </div>
        </div>

        {/* Urgent switch */}
        <div className="pt-2 flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="rounded text-[#5E43F3] focus:ring-[#5E43F3] w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-bold text-neutral-800">Mark as Urgent Request</span>
          </label>
        </div>
      </div>
    </div>
  );
};
