import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getOrRequestWebPushSubscription } from '../lib/push';
import { useAuth } from './AuthContext';
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
  | 'create-page'
  | 'liked';
export type FeedTab = 'for_you' | 'following' | 'drama' | 'nearby';
export type CreateOption = 'post' | 'rally' | 'page' | 'cycle' | null;

interface LalaoContextType {
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
  isFeedLoading: boolean;
  posts: Post[];
  rallies: Rally[];
  pages: Page[];
  cycles: Cycle[];
  conversations: Conversation[];
  messageContacts: User[];
  notifications: NotificationItem[];
  unreadNotifsCount: number;

  // Actions
  toggleLikePost: (postId: string) => void;
  toggleRepostPost: (postId: string) => void;
  deletePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string, parentCommentId?: string, mediaStorageId?: string, mediaType?: 'image' | 'voice' | 'gif' | 'sticker') => Promise<void>;
  toggleLikeComment: (postId: string, commentId: string, replyId?: string) => void;
  createPost: (post: { text: string; mediaUrl?: string; mediaStorageId?: string; mediaType?: 'image' | 'video'; location: string; audience?: string; replyPermission?: string; gifUrl?: string; pollQuestion?: string; pollOptions?: string[]; rallyRefId?: string; pageRefId?: string; contentTopics?: string[]; }) => Promise<any>;
  saveDraft: (draft: any) => Promise<any>;
  getDrafts: () => Promise<any>;
  deleteDraft: (draftId: string) => Promise<any>;
  
  toggleJoinRally: (rallyId: string) => void;
  joinRally: (rallyId: string) => void;
  createRally: (rally: { title: string; description: string; location: string; timeDate: string; category: Rally['category'] }) => void;

  toggleFollowPage: (pageId: string) => void;
  createPage: (pageData: { name: string; username: string; category: string; description: string; type: Page['type']; location: string; avatar?: string; coverImage?: string }) => void;
  updatePage: (pageId: string, updatedData: Partial<Page>) => void;
  createPagePost: (pageId: string, postData: { text: string; mediaUrl?: string; mediaType?: 'image' | 'video'; location?: string }) => void;
  createPageEvent: (pageId: string, eventData: Partial<OrgEvent>) => void;
  updatePageEvent: (eventId: string, eventData: Partial<OrgEvent>) => void;
  deletePageEvent: (eventId: string) => void;
  updatePageMonetization: (pageId: string, monetization: Partial<PageMonetization>) => void;
  addPageProduct: (pageId: string, product: Partial<ShopProduct>) => void;
  deletePageProduct: (pageId: string, productId: string) => void;

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
  pushEnabled: boolean;
  enablePushNotifications: () => Promise<boolean>;

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
  
  // Drilldown modals
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  openChatWithUser: (user: User, initialMessage?: string) => void;
  activeCycleId: string | null;
  setActiveCycleId: (id: string | null) => void;
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
  activeUserProfile: User | null;
  setActiveUserProfile: (user: User | null) => void;
  toggleFollowUser: (userId: string) => void;
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
  isAuthPromptOpen: boolean;
  authPromptMessage: string;
  showAuthPrompt: (message?: string) => void;
  closeAuthPrompt: () => void;
  requireAuth: (action: () => void, message?: string) => void;
  [key: string]: any;
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

const normalizeConvexUser = (user: Record<string, any> | null | undefined): User => {
  if (!user) return EMPTY_CURRENT_USER;

  return {
    id: user._id ?? user.id ?? EMPTY_CURRENT_USER.id,
    name: user.name ?? 'New user',
    username: user.username ?? 'newuser',
    avatar: user.avatarUrl ?? EMPTY_CURRENT_USER.avatar,
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
  const currentUserQuery = useQuery(api.users.getCurrentUser);
  const pushEnabledQuery = useQuery(api.push.hasActivePushToken);
  const upsertWebPushSubscription = useMutation(api.push.upsertWebPushSubscription);
  const toggleRepostPostMutation = useMutation(api.social.toggleRepost);
  const deletePostMutation = useMutation(api.social.deletePost);
  const createPostMutation = useMutation(api.social.createPost);
  const addCommentToPostMutation = useMutation(api.social.addCommentToPost);
  const saveDraftMutation = useMutation(api.social.saveDraft);
  const deleteDraftMutation = useMutation(api.social.deleteDraft);

  // ---- Topics / Home Feed Preferences ----
  const activeTopics = useQuery(api.topics.listActiveTopics) ?? [];
  const updateHomePreferenceMutation = useMutation(api.topics.updateUserHomePreference);
  const updateHomePreference = (slug: string, enabled: boolean) => {
    updateHomePreferenceMutation({ slug, enabled });
  };

  // ---- Profile Update ----
  const updateUserProfileMutation = useMutation(api.users.updateUserProfile);
  const updateUserProfile = async (args: { name?: string; username?: string; bio?: string; locationName?: string; avatarUrl?: string; avatarStorageId?: any }) => {
    return await updateUserProfileMutation(args);
  };

  // ---- Cloudinary Signature ----
  const generateCloudinarySignatureAction = useAction(api.cloudinary.generateSignature);
  const generateCloudinarySignature = async (folder?: string) => {
    return await generateCloudinarySignatureAction({ folder });
  };
  const messageContactsQuery = useQuery(api.social.getMessageContacts);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  useEffect(() => {
    setPushEnabled(Boolean(pushEnabledQuery));
  }, [pushEnabledQuery]);

  const enablePushNotifications = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !( 'Notification' in window ) || !( 'serviceWorker' in navigator )) {
      updatePermission('notifications', 'denied');
      return false;
    }

    if (Notification.permission === 'denied') {
      updatePermission('notifications', 'denied');
      return false;
    }

    try {
      const granted = await requestPermission('notifications');
      if (!granted) return false;

      const subscription = await getOrRequestWebPushSubscription();
      if (!subscription) {
        updatePermission('notifications', 'denied');
        return false;
      }

      const subJson: any = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh || (subscription as any).keys?.p256dh;
      const auth = subJson.keys?.auth || (subscription as any).keys?.auth;

      await upsertWebPushSubscription({
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        userAgent: navigator.userAgent,
      });

      setPushEnabled(true);
      updatePermission('notifications', 'granted');
      return true;
    } catch (err) {
      console.error('[LalaoContext] Failed to enable push notifications:', err);
      updatePermission('notifications', 'prompt');
      return false;
    }
  };

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

  const hydratedCurrentUser = useMemo(
    () => normalizeConvexUser(currentUserQuery),
    [currentUserQuery]
  );

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
    try {
      localStorage.setItem('lalao_current_user', JSON.stringify(currentUser));
    } catch {
      // ignore storage issues
    }
  }, [currentUser]);

  const [activeTab, setRawActiveTab] = useState<NavTab>('home');
  const { isAuthenticated } = useAuth();

  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('');

  const showAuthPrompt = (message = 'Sign in to continue') => {
    setAuthPromptMessage(message);
    setIsAuthPromptOpen(true);
  };

  const closeAuthPrompt = () => {
    setIsAuthPromptOpen(false);
  };

  const requireAuth = (action: () => void, message?: string) => {
    if (isAuthenticated) {
      action();
    } else {
      showAuthPrompt(message);
    }
  };

  const setActiveTab = (tab: NavTab) => {
    const protectedTabs = ['messages', 'profile', 'notifications', 'create-post', 'following', 'saved', 'liked', 'create-page'];
    if (protectedTabs.includes(tab) && !isAuthenticated) {
      showAuthPrompt(`Sign in to view ${tab.replace('-', ' ')}`);
      return;
    }
    setRawActiveTab(tab);
  };
  const [feedTab, setFeedTab] = useState<FeedTab>('for_you');
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

  const feedPostsQuery = useQuery(api.social.listFeedPosts, {
    feedType: feedTab,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusKm: location.radiusKm,
    locationName: location.name,
  });

  const [locationPrivacy, setLocationPrivacy] = useState<LocationPrivacySettings>(() => {
    try {
      const saved = localStorage.getItem('lalao_location_privacy');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION_PRIVACY;
    } catch {
      return DEFAULT_LOCATION_PRIVACY;
    }
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_posts');
      return saved ? JSON.parse(saved) : EMPTY_POSTS;
    } catch {
      return EMPTY_POSTS;
    }
  });

  const [rallies, setRallies] = useState<Rally[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_rallies');
      return saved ? JSON.parse(saved) : EMPTY_RALLIES;
    } catch {
      return EMPTY_RALLIES;
    }
  });

  const [pages, setPages] = useState<Page[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_pages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return EMPTY_PAGES;
  });

  // Fetch live discoverable pages from Convex and sync with local state
  const backendPages = useQuery(api.pages.listDiscoverablePages);
  useEffect(() => {
    if (backendPages && backendPages.length > 0) {
      const userCoords = {
        lat: location.latitude ?? getCoordinatesForLocation(location.name).lat,
        lng: location.longitude ?? getCoordinatesForLocation(location.name).lng,
      };

      setPages((prev) => {
        const merged = [...prev];
        for (const bp of backendPages) {
          const coords =
            bp.latitude && bp.longitude
              ? { lat: bp.latitude, lng: bp.longitude }
              : getCoordinatesForLocation(bp.location);
          const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
          const pageWithDist = { ...bp, distanceMeters: dist };

          // Prevent duplicates by ID
          if (!merged.find(p => p.id === bp.id)) {
            merged.push(pageWithDist as any);
          } else {
            // Update existing with fresh backend data
            const idx = merged.findIndex(p => p.id === bp.id);
            merged[idx] = { ...merged[idx], ...pageWithDist };
          }
        }
        return merged;
      });
    }
  }, [backendPages, location.latitude, location.longitude, location.name]);

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

  const [messageContacts, setMessageContacts] = useState<User[]>([]);

  useEffect(() => {
    if (messageContactsQuery !== undefined) {
      setMessageContacts(messageContactsQuery as User[]);
    }
  }, [messageContactsQuery]);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('lalao_notifications');
      return saved ? JSON.parse(saved) : EMPTY_NOTIFICATIONS;
    } catch {
      return EMPTY_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    if (feedPostsQuery) {
      setPosts(feedPostsQuery as Post[]);
    }
  }, [feedPostsQuery]);

  const deletePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      await deletePostMutation({ postId: postId as any });
      
      // Update local state immediately so feed reflects deletion
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      
      triggerShareToast('Post deleted successfully');
    } catch (err: any) {
      console.error('Error deleting post:', err);
      triggerShareToast('Failed to delete post: ' + err.message);
    }
  };

  // Modal States
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [createFlowType, setCreateFlowType] = useState<CreateOption>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

  // Drilldowns
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeUserProfile, setActiveUserProfile] = useState<User | null>(null);
  const [composerInitialText, setComposerInitialText] = useState<string>('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

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

  const toggleLikePost = (postId: string) => requireAuth(() => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            likesCount: isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
          };
        }
        return post;
      })
    );
  }, 'Sign in to like this post');

  const toggleRepostPost = (postId: string) => requireAuth(() => {
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
  }, 'Sign in to repost this');

  const addComment = async (
    postId: string,
    text: string,
    parentCommentId?: string,
    mediaStorageId?: string,
    mediaType?: 'image' | 'voice' | 'gif' | 'sticker'
  ) => {
    if (!isAuthenticated) {
      showAuthPrompt('Sign in to comment');
      return;
    }
    
    if (!text.trim() && !mediaStorageId) return;

    try {
      await addCommentToPostMutation({
        postId: postId as any,
        text: text.trim(),
        parentCommentId: parentCommentId as any,
        mediaStorageId: mediaStorageId as any,
        mediaType
      });
    } catch (err) {
      console.error('Failed to add comment:', err);
      throw err;
    }
  };

  const toggleLikeComment = (postId: string, commentId: string, replyId?: string) => requireAuth(() => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const updatedComments = p.comments.map((comm) => {
          if (replyId && comm.replies) {
            const updatedReplies = comm.replies.map((rep) => {
              if (rep.id === replyId) {
                const isLiked = !rep.isLiked;
                return {
                  ...rep,
                  isLiked,
                  likesCount: isLiked ? rep.likesCount + 1 : Math.max(0, rep.likesCount - 1),
                };
              }
              return rep;
            });
            return { ...comm, replies: updatedReplies };
          }

          if (comm.id === commentId) {
            const isLiked = !comm.isLiked;
            return {
              ...comm,
              isLiked,
              likesCount: isLiked ? comm.likesCount + 1 : Math.max(0, comm.likesCount - 1),
            };
          }
          return comm;
        });

        return { ...p, comments: updatedComments };
      })
    );
  }, 'Sign in to like this comment');

  const createPost = async (args: {
    text: string;
    mediaUrl?: string;
    mediaStorageId?: string;
    mediaType?: 'image' | 'video';
    location: string;
    audience?: string;
    replyPermission?: string;
    gifUrl?: string;
    pollQuestion?: string;
    pollOptions?: string[];
    rallyRefId?: string;
    pageRefId?: string;
    visibility?: string;
    contentTopics?: string[];
  }) => {
    if (!isAuthenticated) {
      showAuthPrompt('Sign in to create a post');
      return;
    }
    try {
      const postId = await createPostMutation({
        text: args.text,
        mediaUrl: args.mediaUrl,
        mediaStorageId: args.mediaStorageId as any,
        mediaType: args.mediaType as 'image' | 'video' | undefined,
        location: args.location || location.name,
        audience: args.audience as any,
        replyPermission: args.replyPermission as any,
        gifUrl: args.gifUrl,
        pollQuestion: args.pollQuestion,
        pollOptions: args.pollOptions,
        rallyRefId: args.rallyRefId,
        pageRefId: args.pageRefId,
        contentTopics: args.contentTopics,
      });

      // Create a local post object to push to feed instantly
      const newPost: Post = {
        id: postId as string,
        author: currentUser,
        text: args.text,
        mediaUrl: args.mediaUrl,
        mediaType: args.mediaType as 'image' | 'video' | undefined,
        location: args.location || location.name,
        distanceMeters: 0,
        createdAt: 'Just now',
        likesCount: 0,
        repostsCount: 0,
        commentsCount: 0,
        isLiked: false,
        isReposted: false,
        comments: [],
        rallyRefId: args.rallyRefId,
        pageRefId: args.pageRefId,
      };

      setPosts((prev) => [newPost, ...prev]);

      setCreateFlowType(null);
      setIsCreateSheetOpen(false);
      setActiveTab('home');
      triggerShareToast('Post published!');
      
      return { id: postId };
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  };

  const saveDraft = async (draft: any) => {
    return await saveDraftMutation(draft);
  };

  const getDrafts = async () => {
    // Actually, getDrafts is better as a useQuery or just fetched directly, but we can return empty for now, or the component can use useQuery(api.social.getDrafts) directly.
    return [];
  };

  const deleteDraft = async (draftId: string) => {
    return await deleteDraftMutation({ draftId: draftId as any });
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

  const toggleFollowPage = (pageId: string) => requireAuth(() => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id === pageId) {
          const isFollowing = !page.isFollowing;
          return {
            ...page,
            isFollowing,
            followersCount: isFollowing
              ? page.followersCount + 1
              : Math.max(0, page.followersCount - 1),
          };
        }
        return page;
      })
    );
  }, 'Sign in to follow this page');

  const toggleFollowUser = (userId: string) => requireAuth(() => {
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
        ? (prev.followingCount ?? 0) + 1
        : Math.max(0, (prev.followingCount ?? 0) - 1),
    }));

    triggerShareToast(nowFollowing ? `Following @${targetUsername || 'user'}` : `Unfollowed @${targetUsername || 'user'}`);
  }, 'Sign in to follow this user');

  const createPage = ({
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
    category: string;
    description: string;
    type: Page['type'];
    location: string;
    avatar?: string;
    coverImage?: string;
  }) => {
    const badgeMap: Record<Page['type'], Page['badge']> = {
      business: 'BIZ',
      organization: 'ORG',
      club: 'CLUB',
      community: 'COMMUNITY',
    };

    const newPage: Page = {
      id: `page_${Date.now()}`,
      name,
      username: username.replace('@', ''),
      type,
      badge: badgeMap[type],
      avatar: avatar || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      description,
      location: pageLoc || `${location.name}, ${location.subArea}`,
      followersCount: 1,
      isFollowing: true,
      isOwner: true,
      ownerId: currentUser.id,
      category,
      aboutInfo: {
        address: `${pageLoc || location.name}, Delta State`,
        hours: 'Standard local operating hours',
        founded: '2026',
      },
    };

    setPages([newPage, ...pages]);
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    setActivePageId(newPage.id);
    triggerShareToast(`Page "${name}" successfully created!`);
  };

  const updatePage = (pageId: string, updatedData: Partial<Page>) => {
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
    triggerShareToast('Page details updated successfully!');
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

  const addPageProduct = (pageId: string, productData: Partial<ShopProduct>) => {
    const newProduct: ShopProduct = {
      id: `prod_${Date.now()}`,
      name: productData.name || 'New Product',
      price: productData.price || 0,
      currency: productData.currency || 'NGN',
      image:
        productData.image ||
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      description: productData.description || '',
      category: productData.category || 'General',
      inStock: productData.inStock ?? true,
      rating: 5.0,
      reviewsCount: 1,
    };

    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? { ...p, products: [newProduct, ...(p.products || [])] }
          : p
      )
    );
    triggerShareToast('Product added to storefront!');
  };

  const deletePageProduct = (pageId: string, productId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? {
              ...p,
              products: (p.products || []).filter((prod) => prod.id !== productId),
            }
          : p
      )
    );
    triggerShareToast('Product removed from storefront');
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

  const sendDirectMessage = (conversationId: string, text: string, stickerId?: string) => {
    if (!text.trim() && !stickerId) return;
    const msgText = stickerId ? (text.trim() || 'Sent a sticker') : text.trim();
    const msgId = `dm_${Date.now()}`;
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
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: msgText,
            timestamp: 'Just now',
            messages: [...conv.messages, newMsg],
          };
        }
        return conv;
      })
    );

    // Simulate realistic delivery and read receipt status transitions
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === msgId && m.status === 'sent' ? { ...m, status: 'delivered' } : m
              ),
            };
          }
          return conv;
        })
      );
    }, 1000);

    setTimeout(() => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === msgId && (m.status === 'delivered' || m.status === 'sent')
                  ? { ...m, status: 'read' }
                  : m
              ),
            };
          }
          return conv;
        })
      );
    }, 2400);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const openChatWithUser = (user: User, initialMessage?: string) => {
    let targetChatId: string;
    const existing = conversations.find(
      (c) => c.participant.id === user.id || c.participant.username === user.username
    );
    if (existing) {
      targetChatId = existing.id;
    } else {
      const newConv: Conversation = {
        id: `conv_${user.id}_${Date.now()}`,
        participant: user,
        lastMessage: initialMessage || 'Say hello by sending a sticker',
        timestamp: 'Just now',
        unreadCount: 0,
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      targetChatId = newConv.id;
    }
    setActiveChatId(targetChatId);
    
    // If an initialMessage is provided, send it
    if (initialMessage) {
      sendDirectMessage(targetChatId, initialMessage);
    }
    
    setActiveTab('messages');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <LalaoContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        isAuthPromptOpen,
        authPromptMessage,
        showAuthPrompt,
        closeAuthPrompt,
        requireAuth,
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
        isFeedLoading: feedPostsQuery === undefined,
        posts,
        rallies,
        pages,
        cycles,
        conversations,
        messageContacts,
        notifications,
        unreadNotifsCount,
        toggleLikePost,
        toggleRepostPost,
        deletePost,
        addComment,
        toggleLikeComment,
        createPost,
        saveDraft,
        getDrafts,
        deleteDraft,
        toggleJoinRally,
        joinRally: toggleJoinRally,
        createRally,
        toggleFollowPage,
        createPage,
        updatePage,
        createPagePost,
        createPageEvent,
        updatePageEvent,
        deletePageEvent,
        updatePageMonetization,
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
        pushEnabled,
        enablePushNotifications,
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
        markNotificationsAsRead,
        isCreateSheetOpen,
        setIsCreateSheetOpen,
        createFlowType,
        setCreateFlowType,
        isLocationModalOpen,
        setIsLocationModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
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
        activeTopics,
        updateHomePreference,
        updateUserProfile,
        generateCloudinarySignature,
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
