import React from 'react';
import { ExternalEvent } from '../../services/events/types';
import { useEventDistribution } from '../../services/events/EventDistributionContext';
import { useLalao } from '../../context/LalaoContext';
import { calculateDistanceMeters } from '../../utils/locationUtils';
import { PostItem } from '../feed/PostItem';
import { Post } from '../../types';

export const EventFeedCard: React.FC<{ event: ExternalEvent; showLocation?: boolean }> = ({ event, showLocation }) => {
  const { trackImpression } = useEventDistribution();
  const { location } = useLalao();

  React.useEffect(() => {
    trackImpression(event.id);
  }, [event.id]);

  const distanceMeters = location.latitude && location.longitude 
    ? calculateDistanceMeters(location.latitude, location.longitude, event.latitude, event.longitude)
    : 0;

  // Render the distributed event as a post by the real organizer —
  // never a fictional partner identity, never fabricated engagement numbers.
  const orgName = event.organizerName?.trim() || 'Event Partner';
  const post: Post = {
    id: `event-post-${event.id}`,
    author: {
      id: `event-partner-${event.sourceId}`,
      name: orgName,
      username: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event-partner',
      avatar: '',
      userType: 'organization',
      badge: 'ORG',
    },
    text: `${event.title}\n\n${event.description}`,
    mediaUrl: event.imageUrl,
    mediaType: 'image',
    location: `${event.city}`,
    distanceMeters: distanceMeters,
    createdAt: event.importedAt,
    likesCount: 0,
    commentsCount: 0,
    repostsCount: 0,
    isLiked: false,
    isReposted: false,
    comments: [],
    audience: 'everyone',
  };

  return <PostItem post={post} externalEvent={event} showLocation={showLocation} />;
};
