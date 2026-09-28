import React from 'react';
import { ExternalEvent } from '../../services/events/types';
import { useEventDistribution } from '../../services/events/EventDistributionContext';
import { useLalao } from '../../context/LalaoContext';
import { calculateDistanceMeters } from '../../utils/locationUtils';
import { PostItem } from '../feed/PostItem';
import { Post } from '../../types';

export const EventFeedCard: React.FC<{ event: ExternalEvent }> = ({ event }) => {
  const { trackImpression } = useEventDistribution();
  const { location } = useLalao();

  React.useEffect(() => {
    trackImpression(event.id);
  }, [event.id]);

  const distanceMeters = location.latitude && location.longitude 
    ? calculateDistanceMeters(location.latitude, location.longitude, event.latitude, event.longitude)
    : 0;

  // Mock a post so it looks exactly like My Events posted this
  const mockPost: Post = {
    id: `event-post-${event.id}`,
    author: {
      id: 'my-events-partner',
      name: 'My Events',
      username: 'my_events',
      avatar: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
      userType: 'organization',
      badge: 'ORG',
    },
    text: `${event.title}\n\n${event.description}`,
    mediaUrl: event.imageUrl,
    mediaType: 'image',
    location: `${event.city}`,
    distanceMeters: distanceMeters,
    createdAt: '2h',
    likesCount: Math.floor(Math.random() * 50) + 10,
    commentsCount: Math.floor(Math.random() * 20),
    repostsCount: Math.floor(Math.random() * 5),
    isLiked: false,
    isReposted: false,
    comments: [],
    audience: 'everyone',
  };

  return <PostItem post={mockPost} externalEvent={event} />;
};
