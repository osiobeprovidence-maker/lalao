import React, { useState } from 'react';
import { Page, RoomyListing } from '../../../types';
import { Search, MapPin, Plus, Filter, Heart, Home, Users, User } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '../../../context/AuthContext';
import { RoomyProfileModal } from './RoomyProfileModal';
import { CreateListingModal } from './CreateListingModal';
import { ListingDetailModal } from './ListingDetailModal';
import { InspectionsDashboard } from './InspectionsDashboard';

interface RoomyTabProps {
  page: Page;
}

type ListingFilter = 'all' | 'room_offered' | 'room_wanted' | 'roommate_wanted' | 'saved';

export const RoomyTab: React.FC<RoomyTabProps> = ({ page }) => {
  const { user: currentUser } = useAuth();
  
  const [filterType, setFilterType] = useState<ListingFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false);
  const [createListingDefaultType, setCreateListingDefaultType] = useState<'room_offered' | 'room_wanted' | 'roommate_wanted'>('room_offered');
  const [isInspectionsOpen, setIsInspectionsOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<RoomyListing | null>(null);

  const listingsQueryArg = filterType === 'all' || filterType === 'saved' ? undefined : filterType;
  const queriedListings = useQuery(api.roomy.getListings, { 
    type: listingsQueryArg,
    locationQuery: searchQuery || undefined 
  }) || [];

  const savedListingsQuery = useQuery(api.roomy.getSavedListings) || [];
  
  const dbListings = filterType === 'saved' ? savedListingsQuery : queriedListings;

  const myProfile = useQuery(api.roomy.getMyProfile);
  const toggleSave = useMutation(api.roomy.toggleSaveListing);

  const handleCreateListing = (type: 'room_offered' | 'room_wanted' | 'roommate_wanted') => {
    setCreateListingDefaultType(type);
    if (!myProfile) {
      setIsProfileModalOpen(true);
    } else {
      setIsCreateListingOpen(true);
    }
  };

  const getListingIcon = (type: string) => {
    switch(type) {
      case 'room_offered': return <Home className="w-4 h-4 text-emerald-500" />;
      case 'room_wanted': return <Search className="w-4 h-4 text-blue-500" />;
      case 'roommate_wanted': return <Users className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  const getListingLabel = (type: string) => {
    switch(type) {
      case 'room_offered': return 'Room Available';
      case 'room_wanted': return 'Looking for Room';
      case 'roommate_wanted': return 'Looking for Roommate';
      default: return 'Listing';
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search location, university, campus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5E43F3]/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsInspectionsOpen(true)}
            className="px-4 py-2.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-bold rounded-xl text-sm transition-all whitespace-nowrap cursor-pointer"
          >
            My Inspections
          </button>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center hover:bg-[#5E43F3]/20 transition-colors cursor-pointer"
            title="Roomy Profile"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prominent Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleCreateListing('room_offered')}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Home className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-bold text-emerald-900 text-sm">Find a Roommate</span>
          <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider mt-1">List a Room</span>
        </button>

        <button
          onClick={() => handleCreateListing('room_wanted')}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-bold text-blue-900 text-sm">Find a Room</span>
          <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wider mt-1">I'm Looking For</span>
        </button>

        <button
          onClick={() => handleCreateListing('roommate_wanted')}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <span className="font-bold text-purple-900 text-sm">Find a Roommate</span>
          <span className="text-[10px] text-purple-600 font-medium uppercase tracking-wider mt-1">I'm Looking For</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Listings' },
          { id: 'room_offered', label: 'Rooms Available' },
          { id: 'room_wanted', label: 'Looking for Room' },
          { id: 'roommate_wanted', label: 'Looking for Roommate' },
          { id: 'saved', label: 'Saved' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as ListingFilter)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterType === f.id 
                ? 'bg-neutral-900 text-white shadow-sm' 
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {dbListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dbListings.map((listing: any) => (
            <div 
              key={listing._id} 
              onClick={() => setSelectedListing(listing)}
              className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col h-full active:scale-[0.99]"
            >
              {listing.photos && listing.photos.length > 0 ? (
                <div className="aspect-video w-full bg-neutral-100 relative overflow-hidden">
                  <img 
                    src={listing.photos[0]} 
                    alt="Listing" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm text-[10px] font-black uppercase tracking-wider">
                    {getListingIcon(listing.type)}
                    <span>{getListingLabel(listing.type)}</span>
                  </div>
                </div>
              ) : (
                <div className="pt-4 px-4 pb-1">
                  <div className="inline-flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-700">
                    {getListingIcon(listing.type)}
                    <span>{getListingLabel(listing.type)}</span>
                  </div>
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-neutral-900 text-sm leading-snug line-clamp-2">
                    {listing.title || listing.description.split('\n')[0]}
                  </h3>
                  {listing.price && (
                    <span className="font-black text-[#5E43F3] whitespace-nowrap text-sm bg-[#5E43F3]/10 px-2 py-0.5 rounded-lg">
                      {listing.currency || '₦'}{listing.price.toLocaleString()}/mo
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-4 font-medium">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[#5E43F3]" />
                  <span className="truncate">{listing.location}</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    <img src={listing.owner?.avatarUrl || '/placeholder.png'} className="w-6 h-6 rounded-full object-cover border border-neutral-200 bg-neutral-100" alt="Owner" />
                    <span className="text-xs font-semibold text-neutral-700 hover:text-[#5E43F3] transition-colors">{listing.owner?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-neutral-200/60 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4 shadow-sm">
            <Search className="w-6 h-6 text-[#5E43F3]" />
          </div>
          <h3 className="font-black text-neutral-900 text-lg">No listings found</h3>
          <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search filters or be the first to post a listing in this area.
          </p>
          <button
            onClick={() => handleCreateListing('room_offered')}
            className="mt-6 px-6 py-2.5 bg-[#5E43F3] text-white font-bold rounded-xl text-sm flex items-center gap-1.5 hover:bg-[#4E34E0] transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create First Listing
          </button>
        </div>
      )}

      {/* Modals */}
      {isProfileModalOpen && (
        <RoomyProfileModal 
          profile={myProfile} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
      
      {isCreateListingOpen && (
        <CreateListingModal 
          defaultType={createListingDefaultType}
          onClose={() => setIsCreateListingOpen(false)} 
        />
      )}

      {isInspectionsOpen && (
        <InspectionsDashboard 
          onClose={() => setIsInspectionsOpen(false)} 
        />
      )}

      {selectedListing && (
        <ListingDetailModal 
          listingId={selectedListing._id} 
          onClose={() => setSelectedListing(null)} 
        />
      )}
    </div>
  );
};
