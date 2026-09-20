import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './AuthContext';
import { getOrRequestWebPushSubscription } from '../lib/push';
import {
  User,
  Post,
  PostComment,
  CommentReply,
  Rally,
  Page,
  Cycle,
  CycleStoryItem,
  Conversation,
  DirectMessage,
  NotificationItem,
  PostAudience,
  PostReplyPermission,
  LocationConfig,
  LocationPrivacySettings,
  DevicePermissions,
  PermissionState,
  PermissionPromptType,
  ShopProduct,
  CartItem,
  Order,
  OrgEvent,
  EventTicket,
  TeamRegistration,
  PlayerTeam,
  WalletTransaction,
  UserWallet,
  PageMonetization,
  PageAnalytics,
} from '../types';

import { HOK_EVENTS, HOK_SEED_TICKETS, HOK_ORGANIZATION_PAGE } from '../data/honorOfKingsData';
import {
  calculateDistanceMeters,
  getCoordinatesForLocation,
  KNOWN_LOCATION_HUBS,
} from '../utils/locationUtils';

export type NavTab =
  | 'home'
  | 'discover'
  | 'create'
  | 'create-post'
  | 'messages'
  | 'notifications'
  | 'profile'
  | 'following'
  | 'saved'
  | 'liked'
  | 'create-page';
export type FeedTab = 'for_you' | 'following' | 'nearby' | string;
export type CreateOption = 'post' | 'rally' | 'page' | 'cycle' | null;

interface LalaoContextType {
  platformSettings: any;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  feedTab: FeedTab;
  setFeedTab: (tab: FeedTab) => void;
  location: LocationConfig;
  setLocation: (loc: LocationConfig) => void;
  radiusKm: number;
  setRadiusKm: (radiusKm: number) => void;
  locationPrivacy: LocationPrivacySettings;
  setLocationPrivacy: React.Dispatch<React.SetStateAction<LocationPrivacySettings>>;
  updateRadius: (radiusKm: number) => void;
  nearbySort: 'closest' | 'recent';
  setNearbySort: (sort: 'closest' | 'recent') => void;
  detectGpsLocation: () => Promise<{ success: boolean; error?: string }>;
  isDetectingGps: boolean;
  
  // Content state
  users: User[];
  posts: Post[];
  isFeedLoading: boolean;
  rallies: Rally[];
  pages: Page[];
  myPages: Page[];
  cycles: Cycle[];
  conversations: Conversation[];
  messageContacts: User[];
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  suggestedUsers: User[];
  drafts: any[]; // using any for simplicity, can type as Draft
  markAllNotificationsRead: () => void;
  saveDraft: (draft: any) => Promise<string | undefined>;
  deleteDraft: (draftId: string) => Promise<void>;

  // Actions
  toggleLikePost: (postId: string) => void | Promise<void>;
  toggleRepostPost: (postId: string) => void;
  toggleFollowUser: (userId: string) => void | Promise<void>;
  addComment: (postId: string, text: string, parentCommentId?: string, mediaStorageId?: string, mediaType?: 'image' | 'voice' | 'gif' | 'sticker') => void | Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleLikeComment: (postId: string, commentId: string, replyId?: string) => void | Promise<void>;
  createPost: (post: {
    text: string;
    mediaUrl?: string;
    mediaStorageId?: string;
    mediaType?: 'image' | 'video';
    location: string;
    audience?: PostAudience;
    replyPermission?: PostReplyPermission;
    gifUrl?: string;
    poll?: { question: string; options: string[] };
    rallyRefId?: string;
    pageRefId?: string;
  }) => void | Promise<void>;
  
  generateUploadUrl: () => Promise<string>;
  generateCloudinarySignature: (folder?: string) => Promise<{ signature: string; timestamp: number; apiKey: string }>;
  deletePost: (postId: string) => Promise<void>;
  
  toggleJoinRally: (rallyId: string) => void;
  joinRally: (rallyId: string) => void;
  createRally: (rally: { title: string; description: string; location: string; timeDate: string; category: Rally['category'] }) => void;

  toggleFollowPage: (pageId: string) => void;
  createPage: (pageData: {
    name: string;
    username: string;
    category: string;
    description: string;
    type: Page['type'];
    location: string;
    avatar?: string;
    coverImage?: string;
  }) => Promise<string | undefined>;
  updatePage: (pageId: string, updatedData: Partial<Page>) => void;
  createPagePost: (pageId: string, postData: { text: string; mediaUrl?: string; mediaType?: 'image' | 'video'; location?: string }) => void;
  createPageEvent: (pageId: string, eventData: Partial<OrgEvent>) => void;
  updatePageEvent: (eventId: string, eventData: Partial<OrgEvent>) => void;
  deletePageEvent: (eventId: string) => void;
  updatePageMonetization: (pageId: string, monetization: Partial<PageMonetization>) => void;
  
  currentPage: Page | null | undefined;
  
  // Real Convex product integration
  pageProducts: ShopProduct[];
  addPageProduct: (pageId: string, product: Partial<ShopProduct>) => Promise<void>;
  deletePageProduct: (pageId: string, productId: string) => Promise<void>;

  toggleJoinCycle: (cycleId: string) => void;
  createCycle: (cycleData: { name: string; description: string; category: string; location: string }) => void;
  sendCycleMessage: (cycleId: string, text: string) => void;

  // Device & App Permissions
  permissions: DevicePermissions;
  activePermissionPrompt: PermissionPromptType;
  setActivePermissionPrompt: (prompt: PermissionPromptType) => void;
  isPermissionsModalOpen: boolean;
  setIsPermissionsModalOpen: (open: boolean) => void;
  requestPermission: (type: PermissionPromptType, options?: { precise?: boolean }) => Promise<boolean>;
  updatePermission: (type: keyof DevicePermissions, value: PermissionState | boolean) => void;

  // Cycle (Status / Story) Actions
  activeStoryIndex: number;
  setActiveStoryIndex: (index: number) => void;
  openCycleStory: (cycleId: string, itemIndex?: number) => void;
  closeCycleStory: () => void;
  postCycleStory: (data: {
    mediaType: 'image' | 'video' | 'audio' | 'text';
    mediaUrl?: string;
    text?: string;
    backgroundColor?: string;
    caption?: string;
    audience?: 'community' | 'nearby' | 'friends';
    location?: string;
  }) => void;
  reactToCycleStory: (cycleId: string, itemId: string, emoji: string) => void;
  replyToCycleStory: (cycleId: string, itemId: string, messageText: string) => void;
  deleteCycleStoryItem: (itemId: string) => void;
  isCreateCycleOpen: boolean;
  setIsCreateCycleOpen: (open: boolean) => void;

  sendDirectMessage: (conversationId: string, text: string, stickerId?: string) => void;
  markConversationRead: (conversationId: string) => void;
  startPageConversation: (pageId: string) => Promise<void>;
  markNotificationsAsRead: () => void;

  // Modal / Navigation Overlay States
  isCreateSheetOpen: boolean;
  setIsCreateSheetOpen: (open: boolean) => void;
  createFlowType: CreateOption;
  setCreateFlowType: (type: CreateOption) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isMySubscriptionsOpen: boolean;
  setIsMySubscriptionsOpen: (open: boolean) => void;
  isManageSubscriptionsOpen: boolean;
  setIsManageSubscriptionsOpen: (open: boolean) => void;
  isSubscriptionCheckoutOpen: boolean;
  setIsSubscriptionCheckoutOpen: (open: boolean) => void;
  selectedSubscriptionPlan: any;
  setSelectedSubscriptionPlan: (plan: any) => void;
  
  // Drilldown modals
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  openChatWithUser: (user: User) => void;
  activeCycleId: string | null;
  setActiveCycleId: (id: string | null) => void;
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
  activeUserProfile: User | null;
  setActiveUserProfile: (user: User | null) => void;
  composerInitialText: string;
  setComposerInitialText: (text: string) => void;
  activeCommentsPostId: string | null;
  setActiveCommentsPostId: (id: string | null) => void;

  // Shopping & Cart
  cart: CartItem[];
  cartCount: number;
  addToCart: (
    product: ShopProduct,
    quantity: number,
    options?: Record<string, string>,
    store?: { id: string; name: string }
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  savedProductIds: string[];
  toggleSaveProduct: (productId: string) => void;
  isProductSaved: (productId: string) => boolean;
  selectedShopProduct: ShopProduct | null;
  setSelectedShopProduct: (product: ShopProduct | null) => void;
  selectedProductStore: Page | null;
  setSelectedProductStore: (store: Page | null) => void;

  // Shopping History & Orders
  orders: Order[];
  userOrders: Order[];
  addOrder: (order: Order) => void;
  isShoppingHistoryOpen: boolean;
  setIsShoppingHistoryOpen: (open: boolean) => void;
  selectedOrderForDetail: Order | null;
  setSelectedOrderForDetail: (order: Order | null) => void;

  // Events & Ticketing Ecosystem
  events: OrgEvent[];
  tickets: EventTicket[];
  activeTickets: EventTicket[];
  ticketHistory: EventTicket[];
  activeTicketsCount: number;
  addTicket: (ticket: EventTicket) => void;
  isMyTicketsOpen: boolean;
  setIsMyTicketsOpen: (open: boolean) => void;
  selectedTicketForPass: EventTicket | null;
  setSelectedTicketForPass: (ticket: EventTicket | null) => void;
  selectedEventForDetail: OrgEvent | null;
  setSelectedEventForDetail: (event: OrgEvent | null) => void;
  isEventDetailOpen: boolean;
  setIsEventDetailOpen: (open: boolean) => void;
  isTournamentRegisterOpen: boolean;
  setIsTournamentRegisterOpen: (open: boolean) => void;
  registeringEvent: OrgEvent | null;
  setRegisteringEvent: (event: OrgEvent | null) => void;
  isTicketPurchaseOpen: boolean;
  setIsTicketPurchaseOpen: (open: boolean) => void;
  purchasingEvent: OrgEvent | null;
  setPurchasingEvent: (event: OrgEvent | null) => void;
  teamRegistrations: TeamRegistration[];
  addTeamRegistration: (reg: TeamRegistration) => void;
  openHonorOfKingsPage: () => void;

  // Subscriptions
  mySubscriptions: any[];
  pageSubscriptionPlans: any[];
  createSubscriptionPlan: (plan: any) => Promise<string>;
  updateSubscriptionPlan: (planId: string, updates: any) => Promise<void>;
  subscribeToPlan: (planId: string) => Promise<string>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;

  // Teams & Roster Storage
  savedTeams: PlayerTeam[];
  saveTeam: (team: PlayerTeam) => void;
  deleteTeam: (teamId: string) => void;

  // User Wallet Ecosystem
  wallet: UserWallet;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  topUpWallet: (amount: number, method?: string) => void;
  payWithWallet: (amount: number, description: string, reference?: string) => boolean;

  // Utilities
  shareToast: string | null;
  triggerShareToast: (message?: string) => void;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (open: boolean) => void;

  // Push Notifications
  enablePushNotifications: () => Promise<boolean>;
  pushEnabled: boolean;

  // Topics & Preferences
  activeTopics: any[];
  updateHomePreference: (slug: string, enabled: boolean) => Promise<void>;
  updateUserProfile: (updates: {
    name?: string;
    username?: string;
    bio?: string;
    locationName?: string;
    avatarUrl?: string;
  }) => Promise<void>;
}

const LalaoContext = createContext<LalaoContextType | undefined>(undefined);

const DEFAULT_LOCATION: LocationConfig = {
  name: 'Udu',
  subArea: 'Delta State',
  radiusKm: 5,
  latitude: 5.8912,
  longitude: 5.7532,
  isGpsDetected: false,
};

const DEFAULT_LOCATION_PRIVACY: LocationPrivacySettings = {
  approximateDistance: true,
  ghostMode: false,
  showNeighborhoodOnly: true,
  shareLocationOnPosts: true,
};

const EMPTY_CURRENT_USER: User = {
  id: 'local-user',
  name: 'New user',
  username: 'newuser',
  avatar: '',
  userType: 'person',
  followersCount: 0,
  followingCount: 0,
  location: '',
  bio: '',
};

const EMPTY_POSTS: Post[] = [];
const EMPTY_RALLIES: Rally[] = [];
const EMPTY_PAGES: Page[] = [];
const EMPTY_CYCLES: Cycle[] = [];
const EMPTY_CONVERSATIONS: Conversation[] = [];
const EMPTY_NOTIFICATIONS: NotificationItem[] = [];
const EMPTY_ORDERS: Order[] = [];

const normalizeConvexUser = (user: Record<string, any> | null | undefined, fallbackAvatar?: string): User => {
  if (!user) return EMPTY_CURRENT_USER;

  const avatar = user.avatarUrl || user.avatar || fallbackAvatar || EMPTY_CURRENT_USER.avatar;

  return {
    id: user._id ?? user.id ?? EMPTY_CURRENT_USER.id,
    name: user.name ?? 'New user',
    username: user.username ?? 'newuser',
    avatar,
    userType: (user.userType ?? 'person') as User['userType'],
    bio: user.bio ?? undefined,
    location: user.locationName ?? user.location ?? EMPTY_CURRENT_USER.location,
    latitude: user.latitude ?? undefined,
    longitude: user.longitude ?? undefined,
    followersCount: typeof user.followersCount === 'number' ? user.followersCount : 0,
    followingCount: typeof user.followingCount === 'number' ? user.followingCount : 0,
    isFollowing: typeof user.isFollowing === 'boolean' ? user.isFollowing : false,
    isVerified: typeof user.isVerified === 'boolean' ? user.isVerified : false,
  };
};

export const LalaoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const startPageConversationMutation = useMutation(api.social.startPageConversation);
  const [feedTab, setFeedTab] = useState<FeedTab>('for_you');

  const currentUserQuery = useQuery(api.users.getCurrentUser);
  const feedPostsQuery = useQuery(api.social.listFeedPosts, { feedType: feedTab });
  const activeTopicsQuery = useQuery((api as any).topics?.listActiveTopics) || [];
  const updateUserHomePreferenceMutation = useMutation((api as any).topics?.updateUserHomePreference || api.social.toggleLikePost); // fallback while compiling
  const exploreUsersQuery = useQuery(api.social.listUsersForExplore);
  const pagesQuery = useQuery(api.social.listPages);
  const myPagesQuery = useQuery(api.pages.getMyPages);
  const conversationsQuery = useQuery(api.social.listConversations);

  const [users, setUsers] = useState<User[]>([]);
  const [myPages, setMyPages] = useState<Page[]>([]);

  const toggleLikePostMutation = useMutation(api.social.toggleLikePost);
  const addCommentMutation = useMutation(api.social.addCommentToPost);
  const toggleFollowUserMutation = useMutation(api.social.toggleFollowUser);
  const toggleFollowPageMutation = useMutation(api.pages.toggleFollowPage);
  const markAllNotificationsReadMutation = useMutation(api.social.markAllNotificationsRead);
  const toggleLikeCommentMutation = useMutation(api.social.toggleLikeComment);
  const saveDraftMutation = useMutation(api.social.saveDraft);
  const deleteDraftMutation = useMutation(api.social.deleteDraft);
  const addProductMutation = useMutation(api.shop.addProduct);
  const deleteProductMutation = useMutation(api.shop.deleteProduct);
  const upsertWebPushSubscriptionMutation = useMutation(api.push.upsertWebPushSubscription);
  const hasActivePushTokenQuery = useQuery(
    api.push.hasActivePushToken,
    currentUserQuery ? {} : "skip"
  );

  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  const currentPageQuery = useQuery(
    api.social.getPage,
    activePageId ? { pageId: activePageId } : "skip"
  );
  
  // Use a query specifically for the active page's products
  const pageProductsQuery = useQuery(
    api.shop.getProductsByPage, 
    activePageId ? { pageId: activePageId } : "skip"
  );

  const notificationsQuery = useQuery(api.social.listNotifications);
  const unreadNotifsCountQuery = useQuery(api.social.getUnreadNotificationCount);
  const suggestedUsersQuery = useQuery(api.social.listSuggestedUsers);
  const messageContactsQuery = useQuery(api.social.getMessageContacts);
  const draftsQuery = useQuery(api.social.listMyDrafts);
  const platformSettingsQuery = useQuery((api as any).platformSettings?.getBrandingSettings);

  // Subscriptions — these are now queried directly by PageDetailModal & MySubscriptionsModal
  // Only keep the calls that have real matching Convex functions
  const pageSubscriptionPlansQuery = useQuery(
    api.subscriptions.getListingsByPage,
    activePageId ? { pageId: activePageId as any } : "skip"
  );
  const mySubscriptionsQuery = useQuery(api.subscriptions.getMySubscriptions);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('lalao_current_user');
      if (saved) {
        const parsed = JSON.parse(saved) as User;
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // ignore storage issues
    }
    return EMPTY_CURRENT_USER;
  });

  const { user: authUser } = useAuth();
  const syncAuthProfileMutation = useMutation(api.users.syncAuthProfile);
  const updateUserProfileMutation = useMutation(api.users.updateUserProfile);

  useEffect(() => {
    if (authUser && (authUser.photoURL || authUser.displayName)) {
      if (!currentUserQuery?.avatarUrl && authUser.photoURL) {
        syncAuthProfileMutation({
          avatarUrl: authUser.photoURL,
          name: authUser.displayName || undefined,
        }).catch(() => {});
      }
    }
  }, [authUser, currentUserQuery, syncAuthProfileMutation]);

  const hydratedCurrentUser = useMemo(
    () => normalizeConvexUser(currentUserQuery, authUser?.photoURL || undefined),
    [currentUserQuery, authUser?.photoURL]
  );

  const updateUserProfile = useCallback(async (updates: {
    name?: string;
    username?: string;
    bio?: string;
    locationName?: string;
    avatarUrl?: string;
  }) => {
    await updateUserProfileMutation(updates);
    setCurrentUser((prev) => ({
      ...prev,
      name: updates.name ?? prev.name,
      username: updates.username ?? prev.username,
      bio: updates.bio ?? prev.bio,
      location: updates.locationName ?? prev.location,
      avatar: updates.avatarUrl ?? prev.avatar,
    }));
  }, [updateUserProfileMutation]);

  useEffect(() => {
    if (currentUserQuery) {
      setCurrentUser((prev) => ({
        ...prev,
        ...hydratedCurrentUser,
        id: hydratedCurrentUser.id || prev.id,
      }));
    }
  }, [currentUserQuery, hydratedCurrentUser]);

  useEffect(() => {
    if (suggestedUsersQuery !== undefined) {
      setSuggestedUsers(suggestedUsersQuery as User[]);
    }
    if (messageContactsQuery !== undefined) {
      setMessageContacts(messageContactsQuery as User[]);
    }
  }, [
    exploreUsersQuery,
    feedPostsQuery,
    pagesQuery,
    conversationsQuery,
    notificationsQuery,
    unreadNotifsCountQuery,
    suggestedUsersQuery,
    messageContactsQuery,
  ]);

  useEffect(() => {
    if (exploreUsersQuery) {
      setUsers(exploreUsersQuery as User[]);
    }
  }, [exploreUsersQuery]);

  useEffect(() => {
    if (feedPostsQuery) {
      setPosts(feedPostsQuery as Post[]);
    }
  }, [feedPostsQuery]);

  useEffect(() => {
    if (pagesQuery) {
      setPages(pagesQuery as Page[]);
    }
  }, [pagesQuery]);

  useEffect(() => {
    if (myPagesQuery) {
      setMyPages(myPagesQuery as Page[]);
    }
  }, [myPagesQuery]);

  useEffect(() => {
    if (conversationsQuery) {
      setConversations(conversationsQuery as Conversation[]);
    }
  }, [conversationsQuery]);

  useEffect(() => {
    try {
      localStorage.removeItem('lalao_posts');
      localStorage.removeItem('lalao_rallies');
      localStorage.removeItem('lalao_pages');
      localStorage.removeItem('lalao_cycles');
      localStorage.removeItem('lalao_conversations');
      localStorage.removeItem('lalao_notifications');
      localStorage.setItem('lalao_current_user', JSON.stringify(currentUser));
    } catch {
      // ignore storage issues
    }
  }, [currentUser]);

  const [nearbySort, setNearbySort] = useState<'closest' | 'recent'>('closest');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const [location, setLocation] = useState<LocationConfig>(() => {
    try {
      const saved = localStorage.getItem('lalao_location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  const [locationPrivacy, setLocationPrivacy] = useState<LocationPrivacySettings>(() => {
    try {
      const saved = localStorage.getItem('lalao_location_privacy');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION_PRIVACY;
    } catch {
      return DEFAULT_LOCATION_PRIVACY;
    }
  });

  const [posts, setPosts] = useState<Post[]>(EMPTY_POSTS);

  const [rallies, setRallies] = useState<Rally[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_rallies');
      return saved ? JSON.parse(saved) : EMPTY_RALLIES;
    } catch {
      return EMPTY_RALLIES;
    }
  });

  const [pages, setPages] = useState<Page[]>(EMPTY_PAGES);

  const [cycles, setCycles] = useState<Cycle[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_cycles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.items) {
          return parsed;
        }
      }
      return EMPTY_CYCLES;
    } catch {
      return EMPTY_CYCLES;
    }
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_conversations');
      return saved ? JSON.parse(saved) : EMPTY_CONVERSATIONS;
    } catch {
      return EMPTY_CONVERSATIONS;
    }
  });

  const notifications = (notificationsQuery as NotificationItem[]) || [];
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(() => (unreadNotifsCountQuery as number) || 0);
  const [messageContacts, setMessageContacts] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>(() => (suggestedUsersQuery as User[]) || []);
  const drafts = (draftsQuery as any[]) || [];

  useEffect(() => {
    if (unreadNotifsCountQuery !== undefined) {
      setUnreadNotifsCount((unreadNotifsCountQuery as number) || 0);
    }
  }, [unreadNotifsCountQuery]);

  useEffect(() => {
    if (suggestedUsersQuery !== undefined) {
      setSuggestedUsers((suggestedUsersQuery as User[]) || []);
    }
  }, [suggestedUsersQuery]);

  useEffect(() => {
    if (platformSettingsQuery) {
      if (platformSettingsQuery.browserTitle) {
        document.title = platformSettingsQuery.browserTitle;
      }
      if (platformSettingsQuery.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = platformSettingsQuery.faviconUrl;
      }
      if (platformSettingsQuery.primaryColor) {
        document.documentElement.style.setProperty('--color-primary', platformSettingsQuery.primaryColor);
      }
      if (platformSettingsQuery.accentColor) {
        document.documentElement.style.setProperty('--color-accent', platformSettingsQuery.accentColor);
      }
      if (platformSettingsQuery.backgroundColor) {
        document.documentElement.style.setProperty('--color-background', platformSettingsQuery.backgroundColor);
      }
    }
  }, [platformSettingsQuery]);

  const markAllNotificationsRead = async () => {
    try {
      await markAllNotificationsReadMutation();
    } catch {}
  };

  const saveDraft = async (draft: any) => {
    try {
      return await saveDraftMutation(draft);
    } catch {
      return undefined;
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      await deleteDraftMutation({ draftId: draftId as any });
    } catch {}
  };

  // Modal States
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [createFlowType, setCreateFlowType] = useState<CreateOption>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Subscription UI states
  const [isMySubscriptionsOpen, setIsMySubscriptionsOpen] = useState(false);
  const [isManageSubscriptionsOpen, setIsManageSubscriptionsOpen] = useState(false);
  const [isSubscriptionCheckoutOpen, setIsSubscriptionCheckoutOpen] = useState(false);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<any>(null);

  // Device Permissions State
  const [permissions, setPermissions] = useState<DevicePermissions>(() => {
    try {
      const saved = localStorage.getItem('lalao_device_permissions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      location: 'prompt',
      preciseLocation: true,
      notifications: 'prompt',
      camera: 'prompt',
      microphone: 'prompt',
      photos: 'prompt',
    };
  });
  const [activePermissionPrompt, setActivePermissionPrompt] = useState<PermissionPromptType>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const updatePermission = (type: keyof DevicePermissions, value: PermissionState | boolean) => {
    setPermissions((prev) => {
      const updated = { ...prev, [type]: value };
      try {
        localStorage.setItem('lalao_device_permissions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const requestPermission = async (
    type: PermissionPromptType,
    options?: { precise?: boolean }
  ): Promise<boolean> => {
    if (!type) return false;

    if (type === 'location') {
      try {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                updatePermission('location', 'granted');
                if (options?.precise !== undefined) {
                  updatePermission('preciseLocation', options.precise);
                }
                resolve(true);
              },
              () => {
                updatePermission('location', 'denied');
                resolve(false);
              },
              { timeout: 8000, enableHighAccuracy: options?.precise ?? true }
            );
          });
        }
      } catch {
        updatePermission('location', 'granted');
        return true;
      }
    } else if (type === 'notifications') {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const res = await Notification.requestPermission();
          const state: PermissionState = res === 'granted' ? 'granted' : res === 'denied' ? 'denied' : 'prompt';
          updatePermission('notifications', state);
          if (state === 'granted') {
            // Auto-register FCM token after permission is granted
            enablePushNotifications().catch(() => {});
          }
          return state === 'granted';
        }
      } catch {
        updatePermission('notifications', 'granted');
        return true;
      }
    } else if (type === 'camera') {
      try {
        if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
          updatePermission('camera', 'granted');
          return true;
        }
      } catch {
        updatePermission('camera', 'granted');
        return true;
      }
    } else if (type === 'microphone') {
      try {
        if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          updatePermission('microphone', 'granted');
          return true;
        }
      } catch {
        updatePermission('microphone', 'granted');
        return true;
      }
    } else if (type === 'photos') {
      updatePermission('photos', 'granted');
      return true;
    }

    return false;
  };

  /**
   * Request native Web Push permission + register push subscription in Convex.
   * Returns true if push was successfully enabled.
   */
  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await getOrRequestWebPushSubscription();
      if (!subscription) return false;
      
      const subJson = subscription.toJSON();
      
      await upsertWebPushSubscriptionMutation({
        endpoint: subscription.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
        userAgent: navigator.userAgent.slice(0, 200),
      });
      
      updatePermission('notifications', 'granted');
      return true;
    } catch (err) {
      console.error('[push] enablePushNotifications error:', err);
      return false;
    }
  }, [upsertWebPushSubscriptionMutation]);

  const pushEnabled = hasActivePushTokenQuery === true;

  // Drilldowns
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false);
  const [activeUserProfile, setActiveUserProfile] = useState<User | null>(null);
  const [composerInitialText, setComposerInitialText] = useState<string>('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Handle URL deep links from Web Push notifications or external links
  useEffect(() => {
    const handleUrlDeepLink = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        const postParam = params.get('post');

        if (
          tabParam &&
          ['home', 'discover', 'create', 'create-post', 'messages', 'notifications', 'profile', 'following', 'saved', 'liked', 'create-page'].includes(tabParam)
        ) {
          setActiveTab(tabParam as NavTab);
        }
        if (postParam) {
          setActiveCommentsPostId(postParam);
        }
      } catch (err) {
        console.error('Failed to parse URL deep link:', err);
      }
    };

    handleUrlDeepLink();
    window.addEventListener('popstate', handleUrlDeepLink);
    return () => window.removeEventListener('popstate', handleUrlDeepLink);
  }, []);

  // Shopping, Cart & Saved Products
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_saved_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedShopProduct, setSelectedShopProduct] = useState<ShopProduct | null>(null);
  const [selectedProductStore, setSelectedProductStore] = useState<Page | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('lalao_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('lalao_saved_products', JSON.stringify(savedProductIds));
    } catch {}
  }, [savedProductIds]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const addToCart = (
    product: ShopProduct,
    quantity: number,
    options?: Record<string, string>,
    store?: { id: string; name: string }
  ) => {
    setCart((prev) => {
      const optionsKey = options ? JSON.stringify(options) : '';
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.selectedOptions ? JSON.stringify(item.selectedOptions) : '') === optionsKey
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product,
        quantity,
        selectedOptions: options,
        storeId: store?.id,
        storeName: store?.name,
        addedAt: new Date().toISOString(),
      };
      return [newItem, ...prev];
    });

    triggerShareToast(`Added ${quantity}x ${product.name} to cart`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    triggerShareToast('Item removed from cart');
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleSaveProduct = (productId: string) => {
    setSavedProductIds((prev) => {
      const isSaved = prev.includes(productId);
      if (isSaved) {
        triggerShareToast('Removed from saved items');
        return prev.filter((id) => id !== productId);
      } else {
        triggerShareToast('Saved to your wishlist');
        return [...prev, productId];
      }
    });
  };

  const isProductSaved = (productId: string) => {
    return savedProductIds.includes(productId);
  };

  // Orders & Shopping History (User-specific persistence)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(`lalao_orders_${currentUser.id}`);
      return saved ? JSON.parse(saved) : EMPTY_ORDERS;
    } catch {
      return EMPTY_ORDERS;
    }
  });

  const [isShoppingHistoryOpen, setIsShoppingHistoryOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`lalao_orders_${currentUser.id}`, JSON.stringify(orders));
    } catch {}
  }, [orders, currentUser.id]);

  const userOrders = orders.filter((o) => o.userId === currentUser.id);

  const addOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  // Events & Ticketing Ecosystem State
  const initialOrgEvents: OrgEvent[] = [];

  const [events, setEvents] = useState<OrgEvent[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tickets, setTickets] = useState<EventTicket[]>(() => {
    try {
      const saved = localStorage.getItem(`lalao_tickets_${currentUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>(() => {
    try {
      const saved = localStorage.getItem(`lalao_team_regs_${currentUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`lalao_tickets_${currentUser.id}`, JSON.stringify(tickets));
    } catch {}
  }, [tickets, currentUser.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`lalao_team_regs_${currentUser.id}`, JSON.stringify(teamRegistrations));
    } catch {}
  }, [teamRegistrations, currentUser.id]);

  const activeTickets = tickets.filter((t) => t.status === 'active');
  const ticketHistory = tickets.filter((t) => t.status !== 'active');
  const activeTicketsCount = activeTickets.length;

  const addTicket = (newTicket: EventTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  const addTeamRegistration = (reg: TeamRegistration) => {
    setTeamRegistrations((prev) => [reg, ...prev]);
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === reg.eventId
          ? {
              ...ev,
              registeredTeamsCount: Math.min(
                ev.maxTeams || 32,
                (ev.registeredTeamsCount || 0) + 1
              ),
              registeredTeams: [
                {
                  id: reg.id,
                  name: reg.teamName,
                  tag: reg.teamTag,
                  logo: reg.teamLogo,
                  captain: reg.captain.name,
                  membersCount: reg.players?.length || 0,
                },
                ...(ev.registeredTeams || []),
              ],
            }
          : ev
      )
    );
  };

  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);
  const [selectedTicketForPass, setSelectedTicketForPass] = useState<EventTicket | null>(null);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<OrgEvent | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isTournamentRegisterOpen, setIsTournamentRegisterOpen] = useState(false);
  const [registeringEvent, setRegisteringEvent] = useState<OrgEvent | null>(null);

  // Saved Player Teams
  const [savedTeams, setSavedTeams] = useState<PlayerTeam[]>(() => {
    try {
      const saved = localStorage.getItem(`lalao_saved_teams_${currentUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`lalao_saved_teams_${currentUser.id}`, JSON.stringify(savedTeams));
    } catch {}
  }, [savedTeams, currentUser.id]);

  const saveTeam = (team: PlayerTeam) => {
    setSavedTeams((prev) => {
      const exists = prev.some((t) => t.id === team.id);
      if (exists) {
        return prev.map((t) => (t.id === team.id ? team : t));
      }
      return [team, ...prev];
    });
  };

  const deleteTeam = (teamId: string) => {
    setSavedTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  // User Wallet Ecosystem
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [wallet, setWallet] = useState<UserWallet>(() => {
    try {
      const saved = localStorage.getItem(`lalao_wallet_${currentUser.id}`);
      return saved
        ? JSON.parse(saved)
        : {
            balance: 0,
            currency: 'NGN',
            accountNumber: '',
            bankName: '',
            transactions: [],
          };
    } catch {
      return {
        balance: 0,
        currency: 'NGN',
        accountNumber: '',
        bankName: '',
        transactions: [],
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`lalao_wallet_${currentUser.id}`, JSON.stringify(wallet));
    } catch {}
  }, [wallet, currentUser.id]);

  const topUpWallet = (amount: number, method = 'paystack') => {
    if (amount <= 0) return;
    const newTx: WalletTransaction = {
      id: `tx_topup_${Date.now()}`,
      type: 'deposit',
      amount,
      description: `Wallet Top-Up via ${method === 'paystack' ? 'Paystack (Card)' : 'Direct Bank Transfer'}`,
      reference: `LLW-TOP-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'successful',
      date: new Date().toISOString(),
      paymentMethod: method as any,
    };

    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      transactions: [newTx, ...prev.transactions],
    }));
    triggerShareToast(`₦${amount.toLocaleString()} funded into your wallet!`);
  };

  const payWithWallet = (amount: number, description: string, reference?: string): boolean => {
    if (wallet.balance < amount) {
      return false;
    }

    const newTx: WalletTransaction = {
      id: `tx_pay_${Date.now()}`,
      type: 'tournament_fee',
      amount,
      description,
      reference: reference || `LLW-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'successful',
      date: new Date().toISOString(),
      paymentMethod: 'wallet',
    };

    setWallet((prev) => ({
      ...prev,
      balance: prev.balance - amount,
      transactions: [newTx, ...prev.transactions],
    }));
    return true;
  };
  const [isTicketPurchaseOpen, setIsTicketPurchaseOpen] = useState(false);
  const [purchasingEvent, setPurchasingEvent] = useState<OrgEvent | null>(null);

  const openHonorOfKingsPage = () => {
    setPages((prev) => {
      if (!prev.some((p) => p.id === 'page_honorofkings')) {
        return [HOK_ORGANIZATION_PAGE, ...prev];
      }
      return prev;
    });
    setActivePageId('page_honorofkings');
  };

  // Helper to quickly adjust radius
  const updateRadius = (radiusKm: number) => {
    const clamped = Math.max(1, Math.min(50, Math.round(radiusKm)));
    setLocation((prev) => ({ ...prev, radiusKm: clamped }));
  };

  // GPS Detection with graceful fallback
  const detectGpsLocation = async (): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return { success: false, error: 'Geolocation is not supported by your browser' };
    }
    setIsDetectingGps(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsDetectingGps(false);
          const { latitude, longitude } = position.coords;

          // Find closest known hub
          let closestHub = null;
          let minDistance = Infinity;
          for (const hub of Object.values(KNOWN_LOCATION_HUBS)) {
            const d = calculateDistanceMeters(latitude, longitude, hub.coords.lat, hub.coords.lng);
            if (d < minDistance) {
              minDistance = d;
              closestHub = hub;
            }
          }

          let locName = 'Current Location';
          let subArea = 'GPS Detected';
          if (closestHub && minDistance < 12000) {
            locName = closestHub.name;
            subArea = closestHub.subArea;
          } else {
            locName = `GPS Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
          }

          const newLoc: LocationConfig = {
            name: locName,
            subArea,
            radiusKm: location.radiusKm || 5,
            latitude,
            longitude,
            isGpsDetected: true,
          };
          setLocation(newLoc);
          triggerShareToast(`Location detected: ${locName}`);
          resolve({ success: true });
        },
        (err) => {
          setIsDetectingGps(false);
          let errorMsg = 'Could not access your location.';
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Location permission was denied. You can select a neighborhood manually.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'Location position unavailable. Please choose from popular areas.';
          }
          resolve({ success: false, error: errorMsg });
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  };

  // Recompute distance to all items dynamically whenever user location changes
  useEffect(() => {
    const userCoords = {
      lat: location.latitude ?? getCoordinatesForLocation(location.name).lat,
      lng: location.longitude ?? getCoordinatesForLocation(location.name).lng,
    };

    setPosts((prev) =>
      prev.map((post) => {
        const coords =
          post.latitude && post.longitude
            ? { lat: post.latitude, lng: post.longitude }
            : getCoordinatesForLocation(post.location);
        const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
        return { ...post, distanceMeters: dist };
      })
    );

    setRallies((prev) =>
      prev.map((rally) => {
        const coords =
          rally.latitude && rally.longitude
            ? { lat: rally.latitude, lng: rally.longitude }
            : getCoordinatesForLocation(rally.location);
        const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
        return { ...rally, distanceMeters: dist };
      })
    );

    setPages((prev) =>
      prev.map((page) => {
        const coords =
          page.latitude && page.longitude
            ? { lat: page.latitude, lng: page.longitude }
            : getCoordinatesForLocation(page.location);
        const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
        return { ...page, distanceMeters: dist };
      })
    );

    setCycles((prev) =>
      prev.map((cycle) => {
        const coords =
          cycle.latitude && cycle.longitude
            ? { lat: cycle.latitude, lng: cycle.longitude }
            : getCoordinatesForLocation(cycle.location);
        const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
        return { ...cycle, distanceMeters: dist };
      })
    );
  }, [location.name, location.latitude, location.longitude]);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('lalao_location', JSON.stringify(location));
      localStorage.setItem('lalao_location_privacy', JSON.stringify(locationPrivacy));
      localStorage.setItem('lalao_posts', JSON.stringify(posts));
      localStorage.setItem('lalao_rallies', JSON.stringify(rallies));
      localStorage.setItem('lalao_pages', JSON.stringify(pages));
      localStorage.setItem('lalao_cycles', JSON.stringify(cycles));
      localStorage.setItem('lalao_conversations', JSON.stringify(conversations));
      localStorage.setItem('lalao_notifications', JSON.stringify(notifications));
    } catch {
      // ignore storage quota errors
    }
  }, [location, locationPrivacy, posts, rallies, pages, cycles, conversations, notifications]);

  const triggerShareToast = (msg = 'Link copied to clipboard!') => {
    setShareToast(msg);
    setTimeout(() => setShareToast(null), 2500);
  };

  const toggleLikePost = async (postId: string) => {
    const prevPost = posts.find((post) => post.id === postId);
    const optimisticLiked = !(prevPost?.isLiked ?? false);

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likesCount: isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
        };
      })
    );

    try {
      const result = await toggleLikePostMutation({ postId: postId as any });
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            isLiked: Boolean(result?.liked),
            likesCount: typeof result?.likesCount === 'number' ? result.likesCount : post.likesCount,
          };
        })
      );
    } catch {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            isLiked: optimisticLiked ? false : true,
            likesCount: prevPost ? (prevPost.likesCount ?? 0) : post.likesCount,
          };
        })
      );
    }
  };

  const toggleRepostPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isReposted = !post.isReposted;
          return {
            ...post,
            isReposted,
            repostsCount: isReposted ? post.repostsCount + 1 : Math.max(0, post.repostsCount - 1),
          };
        }
        return post;
      })
    );
    triggerShareToast('Reposted to your local feed');
  };

  const addComment = async (
    postId: string,
    text: string,
    parentCommentId?: string,
    mediaStorageId?: string,
    mediaType?: 'image' | 'voice' | 'gif' | 'sticker',
    duration?: number
  ) => {
    try {
      await addCommentMutation({
        postId: postId as any,
        text: text.trim(),
        parentCommentId: parentCommentId as any,
        mediaStorageId: mediaStorageId as any,
        mediaType,
        duration,
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error;
    }
  };

  const toggleLikeComment = async (postId: string, commentId: string, replyId?: string) => {
    const targetId = replyId || commentId;
    try {
      await toggleLikeCommentMutation({ commentId: targetId as any });
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
    }
  };

  const deleteCommentMutation = useMutation(api.social.deleteComment);
  const deleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation({ commentId: commentId as any });
    } catch (e) {
      console.error("Failed to delete comment:", e);
      throw e;
    }
  };

  const generateUploadUrlMutation = useMutation(api.social.generateUploadUrl);
  const generateCloudinarySignatureMutation = useAction(api.cloudinary.generateSignature);

  const generateUploadUrl = async () => {
    return await generateUploadUrlMutation();
  };

  const generateCloudinarySignature = async (folder?: string) => {
    return await generateCloudinarySignatureMutation({ folder });
  };

  const createPostMutation = useMutation(api.social.createPost);
  const deletePostMutation = useMutation(api.social.deletePost);

  const deletePost = async (postId: string) => {
    try {
      await deletePostMutation({ postId: postId as any });
      // Optimistic UI update can be optional since feedPostsQuery is reactive, 
      // but doing it makes the UI feel instantly responsive.
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
      triggerShareToast("Failed to delete post");
    }
  };

  const createPost = async ({
    text,
    mediaUrl,
    mediaStorageId,
    mediaType = 'image',
    location: postLocation,
    audience = 'everyone',
    replyPermission = 'everyone',
    gifUrl,
    poll,
    rallyRefId,
    pageRefId,
  }: {
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    location: string;
    audience?: PostAudience;
    replyPermission?: PostReplyPermission;
    gifUrl?: string;
    poll?: { question: string; options: string[] };
    rallyRefId?: string;
    pageRefId?: string;
    mediaStorageId?: string;
  }) => {
    if (!text.trim() && !mediaUrl && !mediaStorageId) return;

    const created = await createPostMutation({
      text: text.trim(),
      mediaUrl,
      mediaStorageId: mediaStorageId as any,
      mediaType,
      location: postLocation || location.name,
      audience,
      replyPermission,
      gifUrl,
      pollQuestion: poll?.question,
      pollOptions: poll?.options,
      rallyRefId,
      pageRefId,
    });

    const backendPost = created as Post | null;
    const newPost: Post = backendPost || {
      id: `post_${Date.now()}`,
      author: currentUser,
      text: text.trim(),
      mediaUrl,
      mediaType,
      location: postLocation || location.name,
      distanceMeters: 10,
      createdAt: 'Just now',
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      isLiked: false,
      isReposted: false,
      comments: [],
      audience,
      replyPermission,
      gifUrl,
      poll,
      rallyRefId,
    };

    setPosts((prev) => [newPost, ...prev]);
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    setActiveTab('home');
    triggerShareToast('Post published to nearby feed');
  };

  const toggleJoinRally = (rallyId: string) => {
    setRallies((prev) =>
      prev.map((rally) => {
        if (rally.id === rallyId) {
          const isJoined = !rally.isJoined;
          const interestedUsers = isJoined
            ? [currentUser, ...rally.interestedUsers.filter((u) => u.id !== currentUser.id)]
            : rally.interestedUsers.filter((u) => u.id !== currentUser.id);

          return {
            ...rally,
            isJoined,
            joinedUsersCount: isJoined
              ? rally.joinedUsersCount + 1
              : Math.max(0, rally.joinedUsersCount - 1),
            interestedUsers,
          };
        }
        return rally;
      })
    );
  };

  const createRally = ({
    title,
    description,
    location: rallyLoc,
    timeDate,
    category,
  }: {
    title: string;
    description: string;
    location: string;
    timeDate: string;
    category: Rally['category'];
  }) => {
    const newRally: Rally = {
      id: `rally_${Date.now()}`,
      creator: currentUser,
      title,
      description,
      location: rallyLoc || `${location.name} Center`,
      distanceMeters: 50,
      timeDate: timeDate || 'Today · Soon',
      category,
      status: 'active',
      interestedUsers: [currentUser],
      joinedUsersCount: 1,
      isJoined: true,
      tags: [category, 'LocalRally'],
    };

    // Also create a linked broadcast post in the feed
    const broadcastPost: Post = {
      id: `post_rally_${newRally.id}`,
      author: currentUser,
      text: `⚡ RALLY: ${title} — ${description}`,
      location: newRally.location,
      distanceMeters: 50,
      createdAt: 'Just now',
      likesCount: 1,
      commentsCount: 0,
      repostsCount: 0,
      isLiked: true,
      isReposted: false,
      comments: [],
      rallyRefId: newRally.id,
    };

    setRallies([newRally, ...rallies]);
    setPosts([broadcastPost, ...posts]);
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    setActiveTab('home');
    triggerShareToast('Rally created! Broadcasting to people nearby');
  };

  const toggleFollowPage = async (pageId: string) => {
    try {
      const { isFollowing } = await toggleFollowPageMutation({ pageId: pageId as any });
      
      setPages((prev) =>
        prev.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              isFollowing,
              followersCount: isFollowing
                ? (page.followersCount ?? 0) + 1
                : Math.max(0, (page.followersCount ?? 0) - 1),
            };
          }
          return page;
        })
      );
    } catch (error: any) {
      triggerShareToast(error.message || 'Failed to toggle follow');
      console.error(error);
    }
  };

  const toggleFollowUser = async (userId: string) => {
    let nowFollowing = false;
    let targetUsername = '';

    setActiveUserProfile((prev) => {
      if (prev && prev.id === userId) {
        nowFollowing = !prev.isFollowing;
        targetUsername = prev.username;
        return {
          ...prev,
          isFollowing: nowFollowing,
          followersCount: nowFollowing
            ? (prev.followersCount || 0) + 1
            : Math.max(0, (prev.followersCount || 0) - 1),
        };
      }
      return prev;
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.author.id === userId) {
          if (!targetUsername) targetUsername = p.author.username;
          const updatedFollowing = !p.author.isFollowing;
          nowFollowing = updatedFollowing;
          return {
            ...p,
            author: {
              ...p.author,
              isFollowing: updatedFollowing,
              followersCount: updatedFollowing
                ? (p.author.followersCount || 0) + 1
                : Math.max(0, (p.author.followersCount || 0) - 1),
            },
          };
        }
        return p;
      })
    );

    setConversations((prev) =>
      prev.map((c) => {
        if (c.participant.id === userId) {
          return {
            ...c,
            participant: {
              ...c.participant,
              isFollowing: !c.participant.isFollowing,
            },
          };
        }
        return c;
      })
    );

    setCurrentUser((prev) => ({
      ...prev,
      followingCount: nowFollowing
        ? prev.followingCount + 1
        : Math.max(0, prev.followingCount - 1),
    }));

    try {
      const res = await toggleFollowUserMutation({ targetUserId: userId as any });
      triggerShareToast(res.following ? `Following @${targetUsername || 'user'}` : `Unfollowed @${targetUsername || 'user'}`);
    } catch {
      triggerShareToast("Failed to update follow status.");
    }
  };

  const createPageMutation = useMutation(api.pages.createPage);
  const updatePageMutation = useMutation(api.pages.updatePage);

  const createPage = async ({
    name,
    username,
    category,
    description,
    type,
    location: pageLoc,
    avatar,
    coverImage,
  }: {
    name: string;
    username: string;
    category?: string;
    description?: string;
    type: 'business' | 'organization' | 'club' | 'community';
    location: string;
    avatar?: string;
    coverImage?: string;
  }) => {
    try {
      const newPageId = await createPageMutation({
        name,
        username,
        category,
        description,
        type,
        location: pageLoc || `${location.name}, ${location.subArea}`,
        avatar,
        coverImage,
      });

      setCreateFlowType(null);
      setIsCreateSheetOpen(false);
      
      triggerShareToast(`Page "${name}" successfully created!`);
      return newPageId;
    } catch (err) {
      console.error(err);
      triggerShareToast('Failed to create page');
      return undefined;
    }
  };

  const updatePage = async (pageId: string, updatedData: Partial<Page>) => {
    // Update local state optimistically
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p;
        const updated = {
          ...p,
          ...updatedData,
          aboutInfo: {
            ...p.aboutInfo,
            ...(updatedData.aboutInfo || {}),
          },
        };
        return updated;
      })
    );

    // Update backend via Convex mutation
    try {
      await updatePageMutation({
        pageId: pageId as any,
        name: updatedData.name,
        username: updatedData.username,
        category: updatedData.category,
        description: updatedData.description,
        location: updatedData.location,
        avatar: updatedData.avatar,
        coverImage: updatedData.coverImage,
        aboutInfo: updatedData.aboutInfo,
      });
      triggerShareToast('Page details updated successfully!');
    } catch (err) {
      console.error('Failed to update page', err);
      triggerShareToast('Failed to update page backend');
    }
  };

  const createPagePost = (
    pageId: string,
    postData: {
      text: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video';
      location?: string;
    }
  ) => {
    const targetPage = pages.find((p) => p.id === pageId);
    if (!targetPage) return;

    const newPost: Post = {
      id: `post_page_${Date.now()}`,
      author: {
        id: targetPage.id,
        name: targetPage.name,
        username: targetPage.username,
        avatar: targetPage.avatar,
        userType: targetPage.type || 'business',
        badge: targetPage.badge,
        followersCount: targetPage.followersCount || 0,
        followingCount: 0,
        isVerified: true,
        location: targetPage.location,
      },
      text: postData.text,
      mediaUrl: postData.mediaUrl,
      mediaType: postData.mediaType || 'image',
      location: postData.location || targetPage.location,
      distanceMeters: 0,
      pageRefId: targetPage.id,
      createdAt: 'Just now',
      likesCount: 0,
      repostsCount: 0,
      commentsCount: 0,
      isLiked: false,
      isReposted: false,
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    triggerShareToast(`Post published to ${targetPage.name}!`);
  };

  const createPageEvent = (pageId: string, eventData: Partial<OrgEvent>) => {
    const targetPage = pages.find((p) => p.id === pageId);
    if (!targetPage) return;

    const newEvent: OrgEvent = {
      id: `event_${Date.now()}`,
      pageId,
      organizationName: targetPage.name,
      organizationAvatar: targetPage.avatar,
      organizationBadge: targetPage.badge,
      title: eventData.title || 'New Community Event',
      type: eventData.type || 'community',
      coverImage:
        eventData.coverImage ||
        targetPage.coverImage ||
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
      date: eventData.date || 'Upcoming',
      time: eventData.time || 'TBD',
      location: eventData.location || targetPage.location,
      isOnline: eventData.isOnline ?? false,
      registrationStatus: eventData.registrationStatus || 'open',
      isTournament: eventData.isTournament ?? false,
      isTicketed: eventData.isTicketed ?? false,
      ticketPrice: eventData.ticketPrice,
      prizePool: eventData.prizePool,
      prizeCurrency: eventData.prizeCurrency || 'NGN',
      description: eventData.description || '',
      availableTickets: eventData.availableTickets || 100,
      totalTickets: eventData.totalTickets || 100,
      rules: eventData.rules,
      schedule: eventData.schedule,
    };

    setEvents((prev) => [newEvent, ...prev]);
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? { ...p, events: [newEvent, ...(p.events || [])] }
          : p
      )
    );
    triggerShareToast('Event created successfully!');
  };

  const updatePageEvent = (eventId: string, eventData: Partial<OrgEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...eventData } : e))
    );
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        events: (p.events || []).map((e) =>
          e.id === eventId ? { ...e, ...eventData } : e
        ),
      }))
    );
    triggerShareToast('Event updated successfully!');
  };

  const deletePageEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        events: (p.events || []).filter((e) => e.id !== eventId),
      }))
    );
    triggerShareToast('Event cancelled/removed');
  };

  const updatePageMonetization = (
    pageId: string,
    monetizationUpdate: Partial<PageMonetization>
  ) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p;
        const currentMon = p.monetization || {
          enabled: true,
          totalEarnings: 0,
          availableBalance: 0,
          pendingPayout: 0,
        };
        return {
          ...p,
          monetization: {
            ...currentMon,
            ...monetizationUpdate,
          },
        };
      })
    );
    triggerShareToast('Monetization settings saved!');
  };

  const createSubscriptionPlan = async (planData: any) => {
    try {
      // @ts-ignore
      const planId = await createSubscriptionPlanMutation(planData);
      triggerShareToast('Subscription plan created!');
      return planId;
    } catch (error: any) {
      triggerShareToast(`Error: ${error.message}`);
      throw error;
    }
  };

  const updateSubscriptionPlan = async (planId: string, updates: any) => {
    try {
      // @ts-ignore
      await updateSubscriptionPlanMutation({ planId, ...updates });
      triggerShareToast('Subscription plan updated!');
    } catch (error: any) {
      triggerShareToast(`Error: ${error.message}`);
      throw error;
    }
  };

  const subscribeToPlan = async (planId: string) => {
    try {
      // @ts-ignore
      const subId = await subscribeToPlanMutation({ planId });
      triggerShareToast('Subscription initiated! Complete payment to activate.');
      return subId;
    } catch (error: any) {
      triggerShareToast(`Error: ${error.message}`);
      throw error;
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      // @ts-ignore
      await cancelSubscriptionMutation({ subscriptionId });
      triggerShareToast('Subscription will be cancelled at the end of the billing period.');
    } catch (error: any) {
      triggerShareToast(`Error: ${error.message}`);
      throw error;
    }
  };

  const addPageProduct = async (pageId: string, productData: Partial<ShopProduct>) => {
    try {
      await addProductMutation({
        pageId: pageId as any,
        name: productData.name || 'New Product',
        description: productData.description || '',
        price: productData.price || 0,
        currency: productData.currency || 'NGN',
        category: productData.category,
        inStock: productData.inStock ?? true,
        image: productData.image,
      });
      triggerShareToast('Product added successfully!');
    } catch (e) {
      console.error('Failed to add product', e);
      triggerShareToast('Failed to add product');
    }
  };

  const deletePageProduct = async (pageId: string, productId: string) => {
    try {
      await deleteProductMutation({
        pageId: pageId as any,
        productId: productId as any,
      });
      triggerShareToast('Product removed');
    } catch (e) {
      console.error('Failed to delete product', e);
      triggerShareToast('Failed to delete product');
    }
  };

  const toggleJoinCycle = (cycleId: string) => {
    setCycles((prev) =>
      prev.map((c) => {
        if (c.id === cycleId) {
          const cycleMembers = c.members ?? [];
          const isMember = !c.isMember;
          const members = isMember
            ? [...cycleMembers, { ...currentUser, role: 'member' as const }]
            : cycleMembers.filter((m) => m.id !== currentUser.id);
          const nextCount = (c.memberCount ?? cycleMembers.length) || 0;

          return {
            ...c,
            isMember,
            memberCount: isMember ? nextCount + 1 : Math.max(1, nextCount - 1),
            members,
          };
        }
        return c;
      })
    );
  };

  const createCycle = ({
    name,
    description,
    category,
    location: cycleLoc,
  }: {
    name: string;
    description: string;
    category: string;
    location: string;
  }) => {
    const newCycle: Cycle = {
      id: `cycle_${Date.now()}`,
      name,
      description,
      avatar: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&auto=format&fit=crop&q=80',
      user: currentUser,
      items: [
        {
          id: `item_${Date.now()}`,
          mediaType: 'text',
          text: `Welcome to my new cycle "${name}"! ${description}`,
          backgroundColor: '#5E43F3',
          textColor: '#ffffff',
          createdAt: 'Just now',
          timeRemaining: '24h left',
          location: cycleLoc || location.name,
          viewsCount: 0,
          viewers: [],
          likesCount: 0,
        },
      ],
      hasUnseen: false,
      updatedAt: 'Just now',
      memberCount: 1,
      members: [{ ...currentUser, role: 'admin' }],
      lastActive: 'Just now',
      recentMessagesCount: 0,
      isMember: true,
      category,
      location: cycleLoc || location.name,
      messages: [
        {
          id: `cm_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          text: `Welcome to ${name}! Let's build something great together.`,
          timestamp: 'Just now',
          isMine: true,
        },
      ],
    };

    setCycles([newCycle, ...cycles]);
    setActiveCycleId(newCycle.id);
    setActiveTab('messages');
    triggerShareToast(`Cycle "${name}" created!`);
  };

  const sendCycleMessage = (cycleId: string, text: string) => {
    if (!text.trim()) return;
    const newMsg = {
      id: `cm_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: text.trim(),
      timestamp: 'Just now',
      isMine: true,
    };

    setCycles((prev) =>
      prev.map((c) => {
        if (c.id === cycleId) {
          return {
            ...c,
            lastActive: 'Just now',
            messages: c.messages ? [...c.messages, newMsg] : [newMsg],
          };
        }
        return c;
      })
    );
  };

  // Cycle (WhatsApp-Status / Instagram-Story with Hyperlocal twist)
  const openCycleStory = (cycleId: string, itemIndex: number = 0) => {
    setActiveCycleId(cycleId);
    setActiveStoryIndex(itemIndex);
    // Mark cycle as viewed
    setCycles((prev) =>
      prev.map((c) => (c.id === cycleId ? { ...c, hasUnseen: false } : c))
    );
  };

  const closeCycleStory = () => {
    setActiveCycleId(null);
    setActiveStoryIndex(0);
  };

  const postCycleStory = ({
    mediaType,
    mediaUrl,
    text,
    backgroundColor,
    caption,
    audience,
    location: storyLoc,
  }: {
    mediaType: 'image' | 'video' | 'audio' | 'text';
    mediaUrl?: string;
    text?: string;
    backgroundColor?: string;
    caption?: string;
    audience?: 'community' | 'nearby' | 'friends';
    location?: string;
  }) => {
    const newItem: CycleStoryItem = {
      id: `si_${Date.now()}`,
      mediaType,
      mediaUrl,
      text,
      backgroundColor: backgroundColor || 'from-violet-600 to-indigo-700',
      caption,
      audience,
      createdAt: 'Just now',
      timeRemaining: '24h left',
      location: storyLoc || location.name,
      distanceMeters: 0,
      viewsCount: 0,
      likesCount: 0,
      isLiked: false,
      viewers: [],
    };

    setCycles((prev) => {
      const myIndex = prev.findIndex((c) => c.user?.id === currentUser.id || c.id === 'cycle_user_me');
      if (myIndex >= 0) {
        const updated = [...prev];
        updated[myIndex] = {
          ...updated[myIndex],
          updatedAt: 'Just now',
          items: [newItem, ...updated[myIndex].items],
        };
        return updated;
      } else {
        const newCycle: Cycle = {
          id: `cycle_user_${currentUser.id}`,
          user: currentUser,
          name: currentUser.name,
          avatar: currentUser.avatar,
          description: 'My 24-hour Cycle status updates',
          location: storyLoc || location.name,
          distanceMeters: 0,
          hasUnseen: false,
          updatedAt: 'Just now',
          items: [newItem],
        };
        return [newCycle, ...prev];
      }
    });

    setIsCreateCycleOpen(false);
    triggerShareToast('Status posted to your 24h Cycle!');
  };

  const reactToCycleStory = (cycleId: string, itemId: string, emoji: string) => {
    setCycles((prev) =>
      prev.map((c) => {
        if (c.id !== cycleId) return c;
        return {
          ...c,
          items: c.items.map((item) => {
            if (item.id !== itemId) return item;
            const isLiked = !item.isLiked;
            return {
              ...item,
              isLiked,
              likesCount: (item.likesCount || 0) + (isLiked ? 1 : -1),
            };
          }),
        };
      })
    );
    triggerShareToast(`Reacted ${emoji} to status`);
  };

  const replyToCycleStory = (cycleId: string, itemId: string, messageText: string) => {
    if (!messageText.trim()) return;
    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle) return;

    const targetUser = cycle.user;
    const dmText = `Replied to your Cycle status: "${messageText.trim()}"`;

    // Add reply to cycle item state
    const newReply = {
      id: `rep_${Date.now()}`,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      text: messageText.trim(),
      createdAt: 'Just now',
    };

    setCycles((prev) =>
      prev.map((c) => {
        if (c.id !== cycleId) return c;
        return {
          ...c,
          items: c.items.map((item) => {
            if (item.id !== itemId) return item;
            const prevReplies = item.replies || [];
            return {
              ...item,
              repliesCount: (item.repliesCount || prevReplies.length) + 1,
              replies: [newReply, ...prevReplies],
            };
          }),
        };
      })
    );

    let conv = conversations.find((c) => c.participant.id === targetUser.id);
    if (conv) {
      sendDirectMessage(conv.id, dmText);
    } else {
      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        participant: targetUser,
        lastMessage: dmText,
        timestamp: 'Just now',
        unreadCount: 0,
        messages: [
          {
            id: `dm_${Date.now()}`,
            senderId: currentUser.id,
            text: dmText,
            timestamp: 'Just now',
            isMine: true,
            status: 'sent',
          },
        ],
      };
      setConversations([newConv, ...conversations]);
    }
    triggerShareToast(`Comment sent to @${targetUser.username || targetUser.name}!`);
  };

  const deleteCycleStoryItem = (itemId: string) => {
    setCycles((prev) =>
      prev
        .map((c) => ({
          ...c,
          items: (c.items || []).filter((item) => item.id !== itemId),
        }))
        .filter((c) => (c.items?.length || 0) > 0 || c.user?.id !== currentUser?.id)
    );
    triggerShareToast('Status removed from Cycle');
  };

  const sendMessageMutation = useMutation(api.social.sendMessage);
  
  const sendDirectMessage = async (conversationId: string, text: string, stickerId?: string) => {
    if (!text.trim() && !stickerId) return;
    const msgText = stickerId ? (text.trim() || 'Sent a sticker') : text.trim();
    const msgId = `dm_${Date.now()}`;
    
    const conv = conversations.find(c => c.id === conversationId);
    let pageSenderId: string | undefined = undefined;
    
    // If it's a page convo and I am not UserA, I must be the Page owner
    if (conv && (conv as any).isPageConvo && !(conv as any).amIUserA) {
      pageSenderId = (conv as any).pageId;
    }

    const newMsg: DirectMessage = {
      id: msgId,
      senderId: currentUser.id,
      text: msgText,
      timestamp: 'Just now',
      isMine: true,
      isSticker: !!stickerId,
      stickerId,
      status: 'sent',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: msgText,
            timestamp: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
    
    try {
      await sendMessageMutation({
        conversationId: conversationId as any,
        text: msgText,
        pageSenderId: pageSenderId as any,
      });
      
      // Simulate delivered status
      setTimeout(() => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === msgId ? { ...m, status: 'delivered' } : m
                ),
              };
            }
            return c;
          })
        );
      }, 500);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const markConversationReadMutation = useMutation(api.social.markConversationRead);

  const markConversationRead = async (conversationId: string) => {
    try {
      await markConversationReadMutation({ conversationId: conversationId as any });
      // Optimistically clear unreadCount locally
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              unreadCount: 0,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to mark conversation read', err);
    }
  };

  const startPageConversation = async (pageId: string) => {
    try {
      const conversationId = await startPageConversationMutation({ pageId });
      setActiveChatId(conversationId);
      setActiveTab('messages');
    } catch (err) {
      console.error('Failed to start page conversation:', err);
      triggerShareToast('Could not start conversation');
    }
  };

  const markNotificationsAsRead = () => {
    try {
      markAllNotificationsReadMutation();
    } catch {}
  };

  const openChatWithUser = (user: User) => {
    const existing = conversations.find(
      (c) => c.participant.id === user.id || c.participant.username === user.username
    );
    if (existing) {
      setActiveChatId(existing.id);
    } else {
      const newConv: Conversation = {
        id: `conv_${user.id}_${Date.now()}`,
        participant: user,
        lastMessage: 'Say hello by sending a sticker',
        timestamp: 'Just now',
        unreadCount: 0,
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveChatId(newConv.id);
    }
    setActiveTab('messages');
  };


  return (
    <LalaoContext.Provider
      value={{
        activeTopics: activeTopicsQuery,
        updateHomePreference: async (slug, enabled) => {
          await updateUserHomePreferenceMutation({ slug, enabled });
        },
        users,
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        feedTab,
        setFeedTab,
        location,
        setLocation,
        radiusKm: location.radiusKm,
        setRadiusKm: updateRadius,
        locationPrivacy,
        setLocationPrivacy,
        updateRadius,
        nearbySort,
        setNearbySort,
        detectGpsLocation,
        isDetectingGps,
        posts,
        isFeedLoading: feedPostsQuery === undefined,
        rallies,
        pages,
        cycles,
        conversations,
        notifications,
        unreadNotifsCount,
        suggestedUsers,
        messageContacts,
        drafts,
        markAllNotificationsRead,
        saveDraft,
        deleteDraft,
        toggleLikePost,
        toggleRepostPost,
        addComment,
        deleteComment,
        toggleLikeComment,
        createPost,
        generateUploadUrl,
        generateCloudinarySignature,
        platformSettings: platformSettingsQuery || {},
        deletePost,
        toggleJoinRally,
        joinRally: toggleJoinRally,
        createRally,
        toggleFollowPage,
        myPages,
        createPage,
        updatePage,
        createPagePost,
        createPageEvent,
        updatePageEvent,
        deletePageEvent,
        updatePageMonetization,
        currentPage: currentPageQuery as Page | null | undefined,
        pageProducts: (pageProductsQuery || []) as ShopProduct[],
        addPageProduct,
        deletePageProduct,
        toggleJoinCycle,
        createCycle,
        sendCycleMessage,
        permissions,
        activePermissionPrompt,
        setActivePermissionPrompt,
        isPermissionsModalOpen,
        setIsPermissionsModalOpen,
        requestPermission,
        updatePermission,
        activeStoryIndex,
        setActiveStoryIndex,
        openCycleStory,
        closeCycleStory,
        postCycleStory,
        reactToCycleStory,
        replyToCycleStory,
        deleteCycleStoryItem,
        isCreateCycleOpen,
        setIsCreateCycleOpen,
        sendDirectMessage,
        markConversationRead,
        startPageConversation,
        markNotificationsAsRead,
        isCreateSheetOpen,
        setIsCreateSheetOpen,
        createFlowType,
        setCreateFlowType,
        isLocationModalOpen,
        setIsLocationModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isMySubscriptionsOpen,
        setIsMySubscriptionsOpen,
        isManageSubscriptionsOpen,
        setIsManageSubscriptionsOpen,
        isSubscriptionCheckoutOpen,
        setIsSubscriptionCheckoutOpen,
        selectedSubscriptionPlan,
        setSelectedSubscriptionPlan,
        mySubscriptions: (mySubscriptionsQuery || []) as any[],
        pageSubscriptionPlans: (pageSubscriptionPlansQuery || []) as any[],
        createSubscriptionPlan,
        updateSubscriptionPlan,
        subscribeToPlan,
        cancelSubscription,
        activeChatId,
        setActiveChatId,
        openChatWithUser,
        activeCycleId,
        setActiveCycleId,
        activePageId,
        setActivePageId,
        activeUserProfile,
        setActiveUserProfile,
        toggleFollowUser,
        composerInitialText,
        setComposerInitialText,
        activeCommentsPostId,
        setActiveCommentsPostId,
        shareToast,
        triggerShareToast,
        isEditProfileOpen,
        setIsEditProfileOpen,
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        savedProductIds,
        toggleSaveProduct,
        isProductSaved,
        selectedShopProduct,
        setSelectedShopProduct,
        selectedProductStore,
        setSelectedProductStore,
        orders,
        userOrders,
        addOrder,
        isShoppingHistoryOpen,
        setIsShoppingHistoryOpen,
        selectedOrderForDetail,
        setSelectedOrderForDetail,
        events,
        tickets,
        activeTickets,
        ticketHistory,
        activeTicketsCount,
        addTicket,
        isMyTicketsOpen,
        setIsMyTicketsOpen,
        selectedTicketForPass,
        setSelectedTicketForPass,
        selectedEventForDetail,
        setSelectedEventForDetail,
        isEventDetailOpen,
        setIsEventDetailOpen,
        isTournamentRegisterOpen,
        setIsTournamentRegisterOpen,
        registeringEvent,
        setRegisteringEvent,
        isTicketPurchaseOpen,
        setIsTicketPurchaseOpen,
        purchasingEvent,
        setPurchasingEvent,
        teamRegistrations,
        addTeamRegistration,
        openHonorOfKingsPage,
        savedTeams,
        saveTeam,
        deleteTeam,
        wallet,
        isWalletModalOpen,
        setIsWalletModalOpen,
        topUpWallet,
        payWithWallet,
        enablePushNotifications,
        pushEnabled,
        updateUserProfile,
      }}
    >
      {children}
    </LalaoContext.Provider>
  );
};

export const useLalao = () => {
  const context = useContext(LalaoContext);
  if (!context) {
    throw new Error('useLalao must be used within a LalaoProvider');
  }
  return context;
};
