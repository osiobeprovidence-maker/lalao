import React, { useState } from 'react';
import { X, Calendar, MapPin, Check, MessageSquare, Clock } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '../../../context/AuthContext';
import { useLalao } from '../../../context/LalaoContext';

interface InspectionsDashboardProps {
  onClose: () => void;
}

export const InspectionsDashboard: React.FC<InspectionsDashboardProps> = ({ onClose }) => {
  const { user: currentUser } = useAuth();
  const { openChatWithUser } = useLalao();
  const inspectionsData = useQuery(api.roomy.getMyInspections);
  const updateStatus = useMutation(api.roomy.updateInspectionStatus);

  const [activeTab, setActiveTab] = useState<'requested' | 'received'>('received');

  const handleStatusUpdate = async (inspectionId: any, status: 'accepted' | 'declined') => {
    try {
      await updateStatus({ inspectionId, status });
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  const renderInspectionCard = (inspection: any, isReceived: boolean) => {
    const statusColors = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      declined: 'bg-rose-100 text-rose-700',
      rescheduled: 'bg-blue-100 text-blue-700',
    };

    return (
      <div key={inspection._id} className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3">
            <img 
              src={inspection.otherUser?.avatarUrl || '/placeholder.png'} 
              alt={inspection.otherUser?.name} 
              className="w-10 h-10 rounded-full object-cover border border-neutral-200"
            />
            <div>
              <p className="text-xs text-neutral-500 font-medium">
                {isReceived ? 'Request from' : 'Request to'}
              </p>
              <h5 className="font-bold text-neutral-900">{inspection.otherUser?.name}</h5>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
                <Calendar className="w-3.5 h-3.5 text-[#5E43F3]" />
                {new Date(inspection.proposedDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[inspection.status as keyof typeof statusColors]}`}>
            {inspection.status}
          </span>
        </div>

        {inspection.message && (
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-sm text-neutral-700">
            "{inspection.message}"
          </div>
        )}

        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-neutral-900 truncate max-w-[200px]">
              {inspection.listing?.title || inspection.listing?.description?.substring(0, 30)}
            </p>
            <p className="text-[11px] text-neutral-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {inspection.listing?.location}
            </p>
          </div>
          <button 
            onClick={() => {
              openChatWithUser(inspection.otherUser._id);
              onClose();
            }}
            className="p-2 rounded-full bg-neutral-200 text-neutral-700 hover:bg-[#5E43F3] hover:text-white transition-colors self-end sm:self-auto"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {isReceived && inspection.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t border-neutral-100 mt-2">
            <button 
              onClick={() => handleStatusUpdate(inspection._id, 'declined')}
              className="flex-1 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs hover:bg-neutral-200 transition-colors"
            >
              Decline
            </button>
            <button 
              onClick={() => handleStatusUpdate(inspection._id, 'accepted')}
              className="flex-1 py-2 bg-[#5E43F3] text-white font-bold rounded-xl text-xs hover:bg-[#4E34E0] transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h3 className="font-black text-lg text-neutral-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5E43F3]" />
            Inspections
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="flex border-b border-neutral-100">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
              activeTab === 'received' ? 'border-[#5E43F3] text-[#5E43F3]' : 'border-transparent text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            Received ({inspectionsData?.received.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('requested')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
              activeTab === 'requested' ? 'border-[#5E43F3] text-[#5E43F3]' : 'border-transparent text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            Requested ({inspectionsData?.requested.length || 0})
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-neutral-50/50">
          {!inspectionsData ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-[#5E43F3]/30 border-t-[#5E43F3] animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'received' && (
                inspectionsData.received.length > 0 ? (
                  inspectionsData.received.map(i => renderInspectionCard(i, true))
                ) : (
                  <div className="text-center py-12 text-neutral-500 text-sm">
                    No received inspection requests.
                  </div>
                )
              )}
              {activeTab === 'requested' && (
                inspectionsData.requested.length > 0 ? (
                  inspectionsData.requested.map(i => renderInspectionCard(i, false))
                ) : (
                  <div className="text-center py-12 text-neutral-500 text-sm">
                    You haven't requested any inspections.
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
