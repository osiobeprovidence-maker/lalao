import React, { useEffect } from 'react';
import { useEventDistribution } from '../../services/events/EventDistributionContext';
import { X, Calendar, Clock, MapPin, Building2, ExternalLink } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { calculateDistanceMeters } from '../../utils/locationUtils';

interface ExternalEventDetailModalProps {
  eventId: string;
  onClose: () => void;
}

export const ExternalEventDetailModal: React.FC<ExternalEventDetailModalProps> = ({ eventId, onClose }) => {
  const { externalEvents, trackView, trackTicketClick } = useEventDistribution();
  const { location } = useLalao();

  const evt = externalEvents.find(e => e.id === eventId);

  useEffect(() => {
    if (evt) {
      trackView(evt.id);
    }
  }, [evt?.id]);

  if (!evt) return null;

  const distance = location.latitude && location.longitude 
    ? (calculateDistanceMeters(location.latitude, location.longitude, evt.latitude, evt.longitude) / 1000).toFixed(1)
    : '0';

  const handleGetTickets = () => {
    trackTicketClick(evt.id);
    window.open(evt.ticketUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-theme-base sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="relative aspect-video w-full shrink-0">
          <img src={evt.imageUrl} alt={evt.title} className="w-full h-full object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-4 bg-theme-surface/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-theme-primary shadow-sm">
            {evt.category}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-theme-surface">
          <h2 className="text-2xl font-black text-theme-primary mb-2">{evt.title}</h2>
          
          <div className="flex flex-wrap gap-4 mb-6 text-sm font-semibold text-theme-secondary">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#5E43F3]" />
              {new Date(evt.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#5E43F3]" />
              {evt.time}
            </div>
          </div>

          <p className="text-theme-secondary leading-relaxed font-medium mb-8">
            {evt.description}
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#5E43F3]" />
              </div>
              <div>
                <h4 className="font-bold text-theme-primary">{evt.venue}</h4>
                <p className="text-sm font-medium text-theme-tertiary">{evt.area}, {evt.city}, {evt.state}</p>
                <p className="text-xs font-semibold text-[#5E43F3] mt-1">{distance} km away</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h4 className="font-bold text-theme-primary">Organized by</h4>
                <p className="text-sm font-medium text-theme-tertiary">{evt.organizerName}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-theme-base rounded-2xl flex items-center justify-between border border-theme-divider-light mb-4">
            <div>
              <span className="text-xs font-bold text-theme-tertiary uppercase block mb-1">Tickets provided by</span>
              <span className="font-black text-theme-primary text-lg flex items-center gap-2">
                {evt.sourceName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-theme-tertiary uppercase block mb-1">Price</span>
              <span className="font-black text-theme-primary text-lg">
                {evt.price === 0 ? 'Free' : `${evt.currency} ${evt.price.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-theme-surface border-t border-theme-divider-light shrink-0">
          <button
            onClick={handleGetTickets}
            className="w-full py-4 rounded-full bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            Get Tickets <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
