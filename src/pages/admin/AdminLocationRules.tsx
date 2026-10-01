import React from 'react';
import { MapPin, Sliders, ShieldCheck } from 'lucide-react';

export const AdminLocationRules: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-theme-primary">Location Discovery Rules</h1>
        <p className="text-sm text-theme-tertiary mt-1">Configure how external events are distributed into user feeds and discovery.</p>
      </div>

      <div className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm space-y-8">
        <div>
          <h3 className="font-bold text-lg text-theme-primary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#5E43F3]" />
            Default Event Radius
          </h3>
          <p className="text-sm text-theme-tertiary mb-4">Set the baseline geographic radius for event distribution when an event doesn't specify one.</p>
          
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="100" 
              defaultValue="25" 
              className="flex-1 accent-[#5E43F3]"
            />
            <span className="w-16 font-bold text-theme-primary text-right">25 km</span>
          </div>
        </div>

        <div className="pt-8 border-t border-theme-divider-light">
          <h3 className="font-bold text-lg text-theme-primary mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-orange-500" />
            Feed Frequency Limits
          </h3>
          <p className="text-sm text-theme-tertiary mb-4">Control how often distributed events appear naturally inside the Lalao user feed to prevent spam.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-2">Max Event Feed Appearances</label>
              <select className="w-full bg-theme-base border border-theme-divider rounded-xl px-4 py-3 font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20">
                <option>1 per event / 24 hours</option>
                <option>1 per event / 48 hours</option>
                <option>2 per event / 24 hours</option>
                <option>Unlimited</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-2">Feed Density Limit</label>
              <select className="w-full bg-theme-base border border-theme-divider rounded-xl px-4 py-3 font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20">
                <option>1 event per 10 posts</option>
                <option>1 event per 20 posts</option>
                <option>1 event per 50 posts</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-theme-divider-light">
          <h3 className="font-bold text-lg text-theme-primary mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Relevance Scoring
          </h3>
          <p className="text-sm text-theme-tertiary mb-4">Adjust the weights for the event relevance calculation.</p>
          
          <div className="space-y-4">
            {[
              { label: 'Distance from user location', val: 50 },
              { label: 'User interests match category', val: 30 },
              { label: 'Event popularity (clicks & views)', val: 20 },
            ].map((weight) => (
              <div key={weight.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-theme-base p-4 rounded-xl">
                <span className="font-semibold text-theme-secondary">{weight.label}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 bg-theme-surface-active rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full bg-emerald-500" style={{ width: `${weight.val}%` }} />
                  </div>
                  <span className="font-bold text-theme-primary w-12 text-right">{weight.val}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <button className="px-6 py-3 bg-[#5E43F3] text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors">
            Save Rules
          </button>
        </div>
      </div>
    </div>
  );
};
