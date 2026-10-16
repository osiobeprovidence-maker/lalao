export type UserType = 'person' | 'business' | 'organization' | 'club' | 'community';

export type VerificationTier = 'none' | 'verified' | 'priority' | 'creator' | 'creator_premium';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending_payment' | 'inactive';

export interface UserSubscription {
  status: SubscriptionStatus;
  tier: VerificationTier;
  startDate?: number;
  nextBillingDate?: number;
  price?: number;
  currency?: string;
  paymentMethod?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  userType?: UserType;
  badge?: 'BIZ' | 'ORG' | 'CLUB' | 'COMMUNITY';
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  viewsCount?: number;
  isFollowing?: boolean;
  relationship?: "none" | "following" | "follower" | "friends";
  isVerified?: boolean;
  verificationTier?: VerificationTier;
  verificationStatus?: SubscriptionStatus;
  verificationStartedAt?: number;
  verificationExpiresAt?: number;
  subscription?: UserSubscription;
  creatorCategory?: string;
  creatorLevel?: number;
  creatorEarnings?: number;
  creatorPendingEarnings?: number;
  creatorAchievements?: string[];
  creatorRank?: number;
  creatorRankMovement?: number;
  mutualInfo?: string;
  phoneSetupCompleted?: boolean;
  accessStatus?: "available" | "country_restricted" | "waitlisted";
  publicIdentityType?: "display_name" | "username" | "both";
  dateOfBirth?: string;
  birthDateVisibility?: "public" | "age_only" | "private";
  [key: string]: any;
}

export interface CreatorSubscriptionTier {
  id: 'verified' | 'priority' | 'creator';
  tierNumber: number;
  name: string;
  price: number;
  currency: string;
  badgeLabel: string;
  description: string;
  hasCreatorTools: boolean;
  hasMonetization: boolean;
  priorityWeight?: number;
}

export interface CreatorRankingItem {
  rank: number;
  movement: number;
  user: User;
  metricLabel: string;
  metricValue: string;
  score: number;
}

export interface CommentReply {
  id: string;
  author: User;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  replyToUsername?: string;
  isAuthor?: boolean;
  replies?: CommentReply[];
}

export interface PostComment {
  id: string;
  author: User;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  isPinned?: boolean;
  isAuthor?: boolean;
  replies?: CommentReply[];
}

export type PermissionState = 'prompt' | 'granted' | 'denied';

export interface DevicePermissions {
  location: PermissionState;
  preciseLocation: boolean;
  notifications: PermissionState;
  camera: PermissionState;
  microphone: PermissionState;
  photos: PermissionState;
}

export type PermissionPromptType = 'location' | 'notifications' | 'camera' | 'microphone' | 'photos' | null;

export type PostAudience = 'everyone' | 'closeFriends' | 'community' | 'page' | 'nearby' | 'anime' | 'interest';
export type PostReplyPermission =
  | 'everyone'
  | 'followers'
  | 'following'
  | 'friends'
  | 'closeFriends'
  | 'sameInterests'
  | 'mentioned';

export interface Post {
  id: string;
  author: User;
  text: string;
  mediaUrl?: string;
  mediaStorageId?: string;
  mediaType?: 'image' | 'video';
  muxUploadId?: string;
  muxAssetId?: string;
  muxPlaybackId?: string;
  mediaStatus?: 'uploading' | 'processing' | 'ready' | 'failed';
  mediaProcessingError?: string;
  mediaAspectRatio?: 'square' | 'wide' | 'tall';
  location: string;
  visibility?: 'public' | 'followers';
  latitude?: number;
  longitude?: number;
  distanceMeters?: number; // in meters, e.g. 21 -> 21m, 1200 -> 1.2 km
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  isLiked: boolean;
  isReposted: boolean;
  comments: PostComment[];
  audience?: PostAudience;
  replyPermission?: PostReplyPermission;
  gifUrl?: string;
  contentTopics?: string[];
  poll?: {
    question: string;
    options: string[];
    votes?: number[];
  };
  rallyRefId?: string; // If this post is linked to or broadcasting a Rally
  pageRefId?: string;
  // Sound attachment fields
  soundId?: string;
  soundTitle?: string;
  soundAuthorName?: string;
  soundAudioUrl?: string;
  soundStartOffset?: number;
  soundVolume?: number;
  originalAudioVolume?: number;
}

export type SoundCategory = 'music' | 'original' | 'effects' | 'voice';

export interface SoundCreator {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface SoundItem {
  _id?: string;
  id: string;
  creatorId: string;
  creator?: SoundCreator;
  title: string;
  description?: string;
  category: SoundCategory;
  genre?: string;
  tags?: string[];
  duration: number; // in seconds
  audioUrl: string;
  audioStorageId?: string;
  coverUrl?: string;
  waveform?: number[];
  visibility: 'public' | 'private';
  isOfficial?: boolean;
  usageCount: number;
  favoritesCount: number;
  isFavorited?: boolean;
  license?: string;
  moderationStatus?: 'safe' | 'flagged' | 'removed';
  isDeleted?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface Rally {
  id: string;
  creator: User;
  postId?: string;
  type?: 'ASK' | 'HELP' | 'JOIN';
  title: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  eventDate?: string;
  eventTime?: string;
  timeDate?: string; // Legacy
  category?: 'Sports' | 'Help' | 'Meetup' | 'Initiative' | 'Civic' | 'General'; // Legacy
  status: 'active' | 'completed';
  interestedUsers: User[];
  joinedUsersCount: number;
  peopleNeeded?: number;
  maxNeeded?: number; // Legacy
  compensationType?: 'free' | 'paying' | 'charging' | 'other';
  compensationAmount?: string;
  isJoined: boolean;
  urgency?: 'normal' | 'urgent';
  tags?: string[];
}

export interface ProductVariantOption {
  name: string;
  options: string[];
}

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  currency?: string;
  image: string;
  images?: string[];
  description?: string;
  category?: string;
  inStock?: boolean;
  rating?: number;
  reviewsCount?: number;
  variants?: ProductVariantOption[];
  details?: string[];
  sku?: string;
}

export interface CartItem {
  id: string;
  product: ShopProduct;
  quantity: number;
  selectedOptions?: Record<string, string>;
  storeName?: string;
  storeId?: string;
  addedAt: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export type OrderStatus =
  | 'processing'
  | 'confirmed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  product: ShopProduct;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: Record<string, string>;
}

export interface Order {
  id: string; // e.g. "LZ-10284"
  userId: string;
  storeId?: string;
  storeName: string;
  storeAvatar?: string;
  storeBadge?: 'BIZ' | 'ORG' | 'CLUB' | 'COMMUNITY';
  storeLocation?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  dateFormatted: string; // e.g. "September 14, 2026"
  paymentStatus: PaymentStatus;
  paymentMethod: 'transfer' | 'card' | 'cod';
  orderStatus: OrderStatus;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  customerPhone?: string;
  customerName?: string;
  notes?: string;
}

export interface PageMonetization {
  enabled: boolean;
  sellProducts?: boolean;
  sellTickets?: boolean;
  paidEvents?: boolean;
  memberships?: boolean;
  membershipMonthlyFee?: number;
  communitySupport?: boolean;
  promotedPosts?: boolean;
  totalEarnings: number;
  availableBalance: number;
  pendingPayout: number;
  payoutBank?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    autoPayoutSchedule: 'weekly' | 'monthly' | 'manual';
  };
}

export interface PageAnalytics {
  views30d: number;
  reach30d: number;
  engagementRate: number;
  newFollowers30d: number;
  ticketSalesRevenue: number;
  ticketsSold: number;
  productSalesRevenue?: number;
}

export type GroupVisibility = 'public' | 'private_discoverable' | 'private_hidden';
export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface GroupCommunityFeatures {
  posts: boolean;
  replies: boolean;
  media: boolean;
  rallies: boolean;
}

export interface GroupPublishingPermissions {
  canPost: string;
  canReply: string;
  canUploadMedia: string;
  canCreateRallies: string;
}

export interface Group {
  id: string;
  name: string;
  username: string;
  description: string;
  avatarUrl: string;
  coverImage: string;
  rules: string[];
  category: string;
  interests?: string[];
  visibility: GroupVisibility;
  communityEnabled: boolean;
  communityFeatures: GroupCommunityFeatures;
  publishingPermissions: GroupPublishingPermissions;
  memberCount: number;
  followersCount: number;
  isMember: boolean;
  isFollower: boolean;
  isPendingRequest?: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  role: GroupRole | null;
  conversationId: string | null;
  isRestrictedPreview?: boolean;
  createdAt: number;
}

export interface GroupMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: GroupRole;
  isCreator: boolean;
  joinedAt: number;
  isVerified?: boolean;
  verificationTier?: string;
}

export interface GroupAnalytics {
  totalMembers: number;
  pendingRequestsCount: number;
  totalPosts: number;
  totalReplies: number;
  mediaCount: number;
  totalRallies: number;
  totalMessages: number;
  followersCount: number;
}

export interface Page {
  id: string;
  name: string;
  username: string;
  type: 'business' | 'organization' | 'club' | 'community';
  badge: 'BIZ' | 'ORG' | 'CLUB' | 'COMMUNITY';
  isBusiness?: boolean;
  avatar: string;
  coverImage: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  followersCount: number;
  isFollowing: boolean;
  isOwner?: boolean;
  ownerId?: string;
  category: string;
  aboutInfo: {
    address?: string;
    phone?: string;
    website?: string;
    hours?: string;
    founded?: string;
    email?: string;
  };
  products?: ShopProduct[];
  events?: OrgEvent[];
  ticketingEnabled?: boolean;
  monetization?: PageMonetization;
  analytics?: PageAnalytics;
  businessType?: 'commerce' | 'subscription' | 'hybrid';
  activeTools?: string[];
  globalDiscoveryStatus?: 'global' | 'national' | 'regional' | 'local';
  serviceAreas?: string[];
  isOnlineBusiness?: boolean;
}

export type EventType = 'tournament' | 'community' | 'live';
export type EventRegistrationStatus = 'open' | 'opening_soon' | 'closed' | 'completed';
export type TicketStatus = 'active' | 'used' | 'expired' | 'cancelled';

export interface OrgEvent {
  id: string;
  pageId: string;
  organizationName: string;
  organizationAvatar: string;
  organizationBadge: 'ORG' | 'BIZ' | 'CLUB' | 'COMMUNITY';
  title: string;
  type: EventType;
  coverImage: string;
  date: string;
  time: string;
  location: string;
  isOnline: boolean;
  registrationStatus: EventRegistrationStatus;
  isFree?: boolean;
  entryFee?: number;
  price?: number;
  bannerUrl?: string;
  venue?: string;
  organizerName?: string;
  organizerAvatar?: string;
  teamsCount?: number;
  maxTeams?: number;
  registeredTeamsCount?: number;
  prizePool?: number;
  prizeCurrency?: string;
  ticketPrice?: number;
  isTicketed: boolean;
  isTournament: boolean;
  availableTickets?: number;
  totalTickets?: number;
  description: string;
  rules?: string[];
  schedule?: { time: string; activity: string }[];
  prizes?: { place: string; amount: string }[];
  registeredTeams?: {
    id: string;
    name: string;
    tag: string;
    logo: string;
    captain: string;
    membersCount: number;
  }[];
  mediaGallery?: string[];
  highlights?: string[];
}

export interface EventTicket {
  id: string; // e.g. "LL-HOK-2026-00128"
  eventId: string;
  eventTitle: string;
  organizationName: string;
  organizationAvatar?: string;
  userId?: string;
  holderId?: string;
  holderName: string;
  ticketType: string; // "General Admission" | "VIP Pass"
  price: number;
  currency?: string;
  date: string;
  time: string;
  venue: string;
  status: TicketStatus;
  qrCodeData?: string;
  qrCodeUrl?: string;
  purchasedAt?: string;
  purchaseDate?: string;
  seat?: string;
  eventBanner?: string;
  eventDate?: string;
  eventTime?: string;
  tier?: string;
  qrCode?: string;
  organizerName?: string;
  organizerAvatar?: string;
}

export interface TeamRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  teamName: string;
  teamTag: string;
  teamLogo: string;
  captain: { id: string; name: string; username: string; avatar: string };
  players: { id: string; name: string; username: string; avatar: string; role?: string }[];
  substitutes?: { id: string; name: string; username: string; avatar: string }[];
  status: 'confirmed' | 'pending';
  registeredAt: string;
  entryFee?: number;
  paymentMethod?: 'wallet' | 'paystack' | 'free';
}

export interface PlayerTeam {
  id: string;
  name: string;
  tag: string;
  logo: string;
  isCustomLogo?: boolean;
  captain: { id: string; name: string; username: string; avatar: string };
  players: { id: string; name: string; username: string; avatar: string; role?: string }[];
  createdAt: string;
  stats?: {
    matchesPlayed: number;
    wins: number;
    winRate: string;
  };
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'tournament_fee' | 'ticket_purchase' | 'prize_payout' | 'transfer_out' | 'refund';
  amount: number;
  description: string;
  reference?: string;
  status: 'successful' | 'pending' | 'failed';
  date: string;
  paymentMethod?: 'wallet' | 'paystack' | 'bank_transfer' | 'card';
  eventTitle?: string;
}

export interface UserWallet {
  balance: number;
  currency: string;
  accountNumber?: string;
  bankName?: string;
  transactions: WalletTransaction[];
}

export interface CycleViewer {
  id: string;
  name: string;
  avatar: string;
  viewedAt: string;
}

export interface CycleStoryReply {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  text: string;
  createdAt: string;
}

export interface CycleStoryItem {
  id: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'audio' | 'text';
  text?: string;
  duration?: number;
  backgroundColor?: string;
  textColor?: string;
  caption?: string;
  audience?: 'community' | 'nearby' | 'friends';
  createdAt: string;
  timeRemaining?: string; // e.g. "18h left"
  location: string;
  distanceMeters?: number;
  viewsCount: number;
  viewers?: CycleViewer[];
  likesCount?: number;
  isLiked?: boolean;
  repliesCount?: number;
  replies?: CycleStoryReply[];
}

export interface CycleMember extends User {
  role?: 'admin' | 'member';
}

export interface CycleMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMine: boolean;
}

export interface Cycle {
  id: string;
  user: User;
  items: CycleStoryItem[];
  hasUnseen: boolean;
  updatedAt: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  category?: string;
  // Compatibility fields
  name?: string;
  avatar?: string;
  description?: string;
  memberCount?: number;
  isMember?: boolean;
  members?: CycleMember[];
  lastActive?: string;
  recentMessagesCount?: number;
  messages?: CycleMessage[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  createdAt?: number;
  isMine: boolean;
  isSticker?: boolean;
  stickerId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isReply?: boolean;
  replyToMessageId?: string;
  replyToMessageText?: string;
  isEdited?: boolean;
  type?: 'text' | 'image' | 'video' | 'call';
  callId?: string;
  callType?: 'voice' | 'video';
  callDuration?: number;
  callStatus?: 'completed' | 'missed' | 'declined' | 'canceled' | 'failed';
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  audioUrl?: string;
  audioDuration?: number;
  viewOnce?: boolean;
  viewOnceOpened?: boolean;
  viewedAt?: number;
}

export type CallType = 'voice' | 'video';
export type CallStatus =
  | 'calling'
  | 'ringing'
  | 'connected'
  | 'completed'
  | 'missed'
  | 'declined'
  | 'canceled'
  | 'failed';

export interface CallSession {
  _id: string;
  callerId: string;
  recipientId: string;
  conversationId?: string;
  type: CallType;
  status: CallStatus;
  channelName: string;
  callerUid: number;
  recipientUid: number;
  startedAt: number;
  connectedAt?: number;
  endedAt?: number;
  duration?: number;
  endReason?: string;
  isCaller?: boolean;
  myUid?: number;
  targetUid?: number;
  caller?: User | null;
  recipient?: User | null;
  otherUser?: User | null;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: DirectMessage[];
}

export type NotificationType =
  | 'follow'
  | 'like'
  | 'reply'
  | 'rally_join'
  | 'page_interaction'
  | 'message'
  | 'missed_call'
  | 'incoming_call';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: User | null;
  text: string;
  timestamp: string;
  createdAt?: number;
  isRead: boolean;
  targetExcerpt?: string | null;
  targetId?: string | null;
  conversationId?: string | null;
}

export interface Draft {
  _id: string;
  _creationTime: number;
  authorId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  audience?: PostAudience;
  replyPermission?: PostReplyPermission;
  gifUrl?: string;
  pollQuestion?: string;
  pollOptions?: string[];
  pageRefId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LocationPrivacySettings {
  approximateDistance: boolean; // Blur distances (e.g. "~800m" or "Within 500m") to protect privacy
  ghostMode: boolean; // Hide presence from "People Near You" in discover
  showNeighborhoodOnly: boolean; // Show "Udu" rather than specific street
  shareLocationOnPosts: boolean; // Default to tagging current location on new posts
}

export interface LocationConfig {
  name: string; // e.g., "Udu"
  subArea: string; // e.g., "Delta State"
  radiusKm: number; // e.g., 5
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  capturedAt?: number;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  isGpsDetected?: boolean;
}

export interface SubscriptionListing {
  _id: string;
  pageId: string;
  platformId?: string;
  platformName?: string;
  platformLogo?: string;
  name: string;
  description?: string;
  category: string;
  totalAccountCost: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  totalCapacity: number;
  defaultSlotPrice: number;
  allowDifferentSlotPrices: boolean;
  memberInstructions?: string;
  benefits: string[];
  active: boolean;
  availableSlots?: number;
  slotsCount?: number;
}

export interface SubscriptionSlot {
  _id: string;
  subscriptionId: string;
  pageId: string;
  slotNumber: number;
  status: 'available' | 'occupied' | 'paused';
  currentMemberId?: string;
  priceOverride?: number;
  role?: 'Head of Family' | 'Member';
}

export interface SubscriptionMembership {
  _id: string;
  userId: string;
  pageId: string;
  subscriptionId: string;
  slotId: string;
  role: 'Head of Family' | 'Member';
  status: 'pending' | 'active' | 'cancelled' | 'past_due';
  startedAt?: number;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd: boolean;
}

export interface RoomyProfile {
  _id: string;
  userId: string;
  university?: string;
  campus?: string;
  preferredLocation?: string;
  preferredAreas?: string[];
  budget?: number;
  currency?: string;
  roomType?: string;
  moveInPeriod?: string;
  roommatePreferences?: string;
  roommatesWanted?: number;
  lifestyle?: string[];
  bio?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RoomyListing {
  _id: string;
  userId: string;
  type: 'room_offered' | 'room_wanted' | 'roommate_wanted';
  status: 'active' | 'filled' | 'inactive' | 'removed';
  title?: string;
  description: string;
  price?: number;
  currency?: string;
  location: string;
  university?: string;
  campus?: string;
  area?: string;
  roomType?: string;
  availabilityDate?: string;
  amenities?: string[];
  photos?: string[];
  roommatesNeeded?: number;
  preferences?: string;
  createdAt: number;
  updatedAt: number;
  owner?: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    avatarStorageId?: string;
  };
}

export interface RoomyInspection {
  _id: string;
  requesterId: string;
  ownerId: string;
  listingId: string;
  status: 'pending' | 'accepted' | 'declined' | 'rescheduled';
  proposedDate: string;
  message?: string;
  createdAt: number;
  updatedAt: number;
  listing?: RoomyListing;
  otherUser?: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
}
