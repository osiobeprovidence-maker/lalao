import 'package:flutter/material.dart';
import '../services/backend_service.dart';

class User {
  final String id;
  String name;
  String username;
  String avatarUrl;
  String bio;
  String location;
  final String joinedDate;
  int followers;
  int following;
  int totalLikes;
  bool isOnline;
  final String? distance;
  final int? distanceMeters;
  bool isFollowing;
  bool isVerified;
  String userType; // 'person', 'business', 'organization', 'club', 'community'
  String? badge; // 'BIZ', 'ORG', 'CLUB', 'COMMUNITY'
  String verificationTier; // 'none', 'verified', 'priority', 'creator', 'creator_premium'
  String? creatorCategory;
  int creatorLevel;
  double creatorEarnings;
  double creatorPendingEarnings;
  String? mutualInfo;
  String publicIdentityType; // 'display_name', 'username', 'both'
  String birthDateVisibility; // 'public', 'age_only', 'private'
  List<String> interests;

  User({
    required this.id,
    required this.name,
    required this.username,
    required this.avatarUrl,
    this.bio = 'Building local tech & creative communities in Delta State. ✨',
    this.location = 'Udu, Delta State',
    this.joinedDate = 'September 2026',
    this.followers = 342,
    this.following = 188,
    this.totalLikes = 4500,
    this.isOnline = false,
    this.distance,
    this.distanceMeters,
    this.isFollowing = false,
    this.isVerified = false,
    this.userType = 'person',
    this.badge,
    this.verificationTier = 'none',
    this.creatorCategory,
    this.creatorLevel = 1,
    this.creatorEarnings = 0,
    this.creatorPendingEarnings = 0,
    this.mutualInfo,
    this.publicIdentityType = 'both',
    this.birthDateVisibility = 'private',
    this.interests = const ['Gaming', 'Anime', 'Tech'],
  });
}

class UserStatus {
  final String id;
  final User user;
  bool hasUnviewed;
  final String? imageUrl;
  final String? text;
  final String? caption;
  final String location;
  final String timeRemaining;
  int viewsCount;
  int likesCount;
  bool isLiked;
  final Color backgroundColor;

  UserStatus({
    required this.id,
    required this.user,
    this.hasUnviewed = true,
    this.imageUrl,
    this.text,
    this.caption,
    this.location = 'Udu, Delta State',
    this.timeRemaining = '22h left',
    this.viewsCount = 28,
    this.likesCount = 9,
    this.isLiked = false,
    this.backgroundColor = const Color(0xFF5E43F3),
  });
}

class ChatMessage {
  final String id;
  final String text;
  final bool isMe;
  final String timestamp;
  final String? senderName;
  final String? mediaUrl;
  final String type; // 'text', 'image', 'video', 'call', 'sticker'
  final String? replyToText;
  final String status; // 'sent', 'delivered', 'read'

  ChatMessage({
    required this.id,
    required this.text,
    required this.isMe,
    required this.timestamp,
    this.senderName,
    this.mediaUrl,
    this.type = 'text',
    this.replyToText,
    this.status = 'read',
  });
}

class Conversation {
  final String id;
  final User contact;
  String lastMessage;
  String timestamp;
  final bool isBusinessChat;
  bool isUnread;
  int unreadCount;
  List<ChatMessage> messages;
  final bool isChatroom;
  final bool isGroup;
  final String? category;
  final String? roomIcon;

  Conversation({
    required this.id,
    required this.contact,
    required this.lastMessage,
    required this.timestamp,
    this.isBusinessChat = false,
    this.isUnread = false,
    this.unreadCount = 0,
    this.messages = const [],
    this.isChatroom = false,
    this.isGroup = false,
    this.category,
    this.roomIcon,
  });
}

class Chatroom {
  final String id;
  final String name;
  final String category;
  final String description;
  final String roomIcon;
  final String coverImage;
  int memberCount;
  final List<String> rules;
  bool isJoined;

  Chatroom({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.roomIcon,
    required this.coverImage,
    required this.memberCount,
    required this.rules,
    this.isJoined = false,
  });
}

enum NotificationType {
  like,
  reply,
  follow,
  repost,
  rallyJoin,
  payment,
  missedCall,
}

class AppNotification {
  final String id;
  final NotificationType type;
  final User triggerUser;
  final String? previewText;
  final String date;
  bool isRead;
  final double? amount;
  final String? reference;

  AppNotification({
    required this.id,
    required this.type,
    required this.triggerUser,
    this.previewText,
    required this.date,
    this.isRead = false,
    this.amount,
    this.reference,
  });
}

class Comment {
  final String id;
  final User author;
  final String text;
  final String date;
  int likesCount;
  bool isLiked;
  final bool isPinned;
  final List<Comment> replies;

  Comment({
    required this.id,
    required this.author,
    required this.text,
    required this.date,
    this.likesCount = 0,
    this.isLiked = false,
    this.isPinned = false,
    this.replies = const [],
  });
}

class PollData {
  final String question;
  final List<String> options;
  List<int> votes;
  int? selectedOption;

  PollData({
    this.question = 'Community Poll',
    required this.options,
    required this.votes,
    this.selectedOption,
  });

  int get totalVotes => votes.fold(0, (a, b) => a + b);
  int? get selectedIndex => selectedOption;
  set selectedIndex(int? v) => selectedOption = v;
}

class Post {
  final String id;
  final User author;
  final String content;
  final String date;
  final String? location;
  final int? distanceMeters;
  final String? videoUrl;
  final String? imageUrl;
  final String? localImagePath;
  int likes;
  int commentsCount;
  int reposts;
  bool isLiked;
  bool isReposted;
  bool isBookmarked;
  List<Comment> comments;
  final String? rallyRefId;
  final String? pageRefId;
  final String? soundTitle;
  final String? soundAuthor;
  final PollData? poll;
  final List<String> topics;
  final bool isSponsored;
  final String? ctaLabel;
  final String? ctaUrl;

  Post({
    required this.id,
    required this.author,
    required this.content,
    required this.date,
    this.location,
    this.distanceMeters,
    this.videoUrl,
    this.imageUrl,
    this.localImagePath,
    required this.likes,
    required this.commentsCount,
    required this.reposts,
    required this.isLiked,
    required this.isReposted,
    this.isBookmarked = false,
    required this.comments,
    this.rallyRefId,
    this.pageRefId,
    this.soundTitle,
    this.soundAuthor,
    this.poll,
    this.topics = const [],
    this.isSponsored = false,
    this.ctaLabel,
    this.ctaUrl,
  });
}

class Rally {
  final String id;
  final User creator;
  final String title;
  final String description;
  final String location;
  final int distanceMeters;
  final String timeDate;
  final String category; // 'Sports', 'Help', 'Civic', 'Meetup'
  final String type; // 'ASK', 'HELP', 'JOIN'
  final String urgency; // 'normal', 'urgent'
  int joinedUsersCount;
  final int? maxNeeded;
  bool isJoined;
  final List<String> tags;
  final List<User> interestedUsers;

  Rally({
    required this.id,
    required this.creator,
    required this.title,
    required this.description,
    required this.location,
    this.distanceMeters = 500,
    required this.timeDate,
    this.category = 'Meetup',
    this.type = 'JOIN',
    this.urgency = 'normal',
    this.joinedUsersCount = 1,
    this.maxNeeded,
    this.isJoined = false,
    this.tags = const [],
    this.interestedUsers = const [],
  });
}

class ShopProduct {
  final String id;
  final String pageId;
  final String storeName;
  final String name;
  final double price;
  final String currency;
  final String image;
  final List<String> images;
  final String description;
  final String category;
  final bool inStock;
  final double rating;
  final int reviewsCount;
  final Map<String, List<String>> variants;
  final List<String> details;

  ShopProduct({
    required this.id,
    required this.pageId,
    required this.storeName,
    required this.name,
    required this.price,
    this.currency = 'NGN',
    required this.image,
    this.images = const [],
    required this.description,
    required this.category,
    this.inStock = true,
    this.rating = 4.9,
    this.reviewsCount = 12,
    this.variants = const {},
    this.details = const [],
  });
}

class CartItem {
  final String id;
  final ShopProduct product;
  int quantity;
  final Map<String, String> selectedOptions;

  CartItem({
    required this.id,
    required this.product,
    this.quantity = 1,
    this.selectedOptions = const {},
  });
}

class OrderItem {
  final ShopProduct product;
  final int quantity;
  final double unitPrice;
  final Map<String, String> options;

  OrderItem({
    required this.product,
    required this.quantity,
    required this.unitPrice,
    this.options = const {},
  });

  double get totalPrice => unitPrice * quantity;
}

class Order {
  final String id;
  final String storeId;
  final String storeName;
  final String storeAvatar;
  final String storeBadge;
  final String storeLocation;
  final List<OrderItem> items;
  final double subtotal;
  final double deliveryFee;
  final double discount;
  final double totalAmount;
  final String currency;
  final String dateFormatted;
  final String paymentStatus; // 'paid', 'pending'
  final String paymentMethod; // 'wallet', 'transfer', 'card'
  String orderStatus; // 'processing', 'shipped', 'delivered', 'completed'
  final String deliveryType; // 'delivery', 'pickup'
  final String deliveryAddress;

  Order({
    required this.id,
    required this.storeId,
    required this.storeName,
    required this.storeAvatar,
    this.storeBadge = 'BIZ',
    required this.storeLocation,
    required this.items,
    required this.subtotal,
    this.deliveryFee = 2500,
    this.discount = 0,
    required this.totalAmount,
    this.currency = 'NGN',
    required this.dateFormatted,
    this.paymentStatus = 'paid',
    this.paymentMethod = 'wallet',
    this.orderStatus = 'delivered',
    this.deliveryType = 'delivery',
    required this.deliveryAddress,
  });
}

class OrgEvent {
  final String id;
  final String pageId;
  final String organizationName;
  final String organizationAvatar;
  final String organizationBadge;
  final String title;
  final String type; // 'tournament', 'community', 'live'
  final String coverImage;
  final String date;
  final String time;
  final String location;
  final double ticketPrice;
  final bool isTicketed;
  final bool isTournament;
  int availableTickets;
  final int totalTickets;
  final String description;
  final List<String> rules;
  final List<Map<String, String>> schedule;
  final double? prizePool;

  OrgEvent({
    required this.id,
    required this.pageId,
    required this.organizationName,
    required this.organizationAvatar,
    this.organizationBadge = 'COMMUNITY',
    required this.title,
    this.type = 'community',
    required this.coverImage,
    required this.date,
    required this.time,
    required this.location,
    this.ticketPrice = 0,
    this.isTicketed = false,
    this.isTournament = false,
    this.availableTickets = 100,
    this.totalTickets = 100,
    required this.description,
    this.rules = const [],
    this.schedule = const [],
    this.prizePool,
  });
}

class EventTicket {
  final String id;
  final String eventId;
  final String eventTitle;
  final String organizationName;
  final String holderName;
  final String ticketType;
  final double price;
  final String date;
  final String time;
  final String venue;
  final String status; // 'active', 'used'
  final String qrCodeData;

  EventTicket({
    required this.id,
    required this.eventId,
    required this.eventTitle,
    required this.organizationName,
    required this.holderName,
    this.ticketType = 'General Admission',
    required this.price,
    required this.date,
    required this.time,
    required this.venue,
    this.status = 'active',
    required this.qrCodeData,
  });
}

class PageModel {
  final String id;
  String name;
  String username;
  final String type; // 'business', 'organization', 'club', 'community'
  final String badge; // 'BIZ', 'ORG', 'CLUB', 'COMMUNITY'
  final String avatar;
  final String coverImage;
  String description;
  String location;
  int followersCount;
  bool isFollowing;
  final bool isOwner;
  final String category;
  final Map<String, String> aboutInfo;
  final List<ShopProduct> products;
  final List<OrgEvent> events;
  final double totalEarnings;
  final double availableBalance;
  final int views30d;
  final int reach30d;

  PageModel({
    required this.id,
    required this.name,
    required this.username,
    required this.type,
    required this.badge,
    required this.avatar,
    required this.coverImage,
    required this.description,
    required this.location,
    required this.followersCount,
    this.isFollowing = false,
    this.isOwner = false,
    required this.category,
    this.aboutInfo = const {},
    this.products = const [],
    this.events = const [],
    this.totalEarnings = 185000,
    this.availableBalance = 95000,
    this.views30d = 4820,
    this.reach30d = 12400,
  });
}

class WalletTransaction {
  final String id;
  final String type; // 'deposit', 'transfer_out', 'bill_payment', 'ticket_purchase', 'shop_order', 'reward'
  final double amount;
  final String description;
  final String reference;
  final String status; // 'successful', 'pending', 'failed'
  final String date;
  final String paymentMethod;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.reference,
    this.status = 'successful',
    required this.date,
    this.paymentMethod = 'wallet',
  });
}

class WithdrawalAccount {
  final String id;
  final String accountName;
  final String bankName;
  final String accountNumber;
  bool isDefault;

  WithdrawalAccount({
    required this.id,
    required this.accountName,
    required this.bankName,
    required this.accountNumber,
    this.isDefault = false,
  });
}

class SoundItem {
  final String id;
  final String title;
  final String creatorName;
  final String category; // 'music', 'original', 'effects'
  final String genre;
  final int durationSeconds;
  int usageCount;
  int favoritesCount;
  bool isFavorited;

  SoundItem({
    required this.id,
    required this.title,
    required this.creatorName,
    required this.category,
    required this.genre,
    required this.durationSeconds,
    this.usageCount = 120,
    this.favoritesCount = 45,
    this.isFavorited = false,
  });
}

class AdCampaign {
  final String id;
  final String name;
  final String headline;
  final String bodyText;
  final String ctaLabel;
  final String targetLocation;
  final String placement; // 'Feed & Discover', 'Live Chatrooms', 'All Surfaces'
  String status; // 'active', 'paused', 'pending_review'
  final double budgetNgn;
  final double spentNgn;
  final int impressions;
  final int clicks;
  final String imageUrl;

  AdCampaign({
    required this.id,
    required this.name,
    required this.headline,
    required this.bodyText,
    this.ctaLabel = 'Visit Now',
    required this.targetLocation,
    this.placement = 'Feed & Discover',
    this.status = 'active',
    required this.budgetNgn,
    this.spentNgn = 0,
    this.impressions = 0,
    this.clicks = 0,
    required this.imageUrl,
  });
}

class PlumMember {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String location;
  final double distanceKm;
  final String bio;
  final String avatarUrl;
  final List<String> photos;
  final List<String> interests;
  final String lookingFor;
  final bool isVerified;
  bool isLiked;

  PlumMember({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.location,
    required this.distanceKm,
    required this.bio,
    required this.avatarUrl,
    required this.photos,
    required this.interests,
    required this.lookingFor,
    this.isVerified = true,
    this.isLiked = false,
  });
}

class RewardItem {
  final String id;
  final String name;
  final String description;
  final int pointsCost;
  final String category; // 'airtime', 'data', 'voucher', 'badge'

  RewardItem({
    required this.id,
    required this.name,
    required this.description,
    required this.pointsCost,
    required this.category,
  });
}

class MockRepository extends ChangeNotifier {
  static final MockRepository _instance = MockRepository._internal();
  factory MockRepository() => _instance;

  ThemeMode themeMode = ThemeMode.light;
  String activeLocationName = 'Udu';
  String activeLocationSubArea = 'Delta State';
  int radiusKm = 5;
  bool approximateDistance = false;
  bool ghostMode = false;
  bool showNeighborhoodOnly = true;
  bool shareLocationOnPosts = true;

  // Wallet & Rewards state
  double walletBalance = 148500.0;
  double cryptoBalanceUsdc = 125.50;
  String? connectedCryptoAddress = '0x71C...89A4';
  String walletPin = '1234';
  int rewardPoints = 2450;
  int totalPointsEarned = 3200;
  int totalPointsRedeemed = 750;
  String referralCode = 'LALAO-PROV26';

  // Plum 18+ state
  bool isPlumAgeConfirmed = false;
  bool hasPlumProfile = true;

  final User currentUser = User(
    id: 'user_providence',
    name: 'Providence Osiobe',
    username: 'osiobeprovidence',
    avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio:
        'Building local tech & creative communities in Delta State. Football on Thursdays, building everyday.',
    location: 'Udu, Delta State',
    joinedDate: 'September 2026',
    followers: 342,
    following: 188,
    totalLikes: 4520,
    isOnline: true,
    isVerified: true,
    verificationTier: 'creator_premium',
    creatorCategory: 'Tech & Community',
    creatorLevel: 3,
    creatorEarnings: 24500,
    creatorPendingEarnings: 8200,
  );

  late List<User> nearbyUsers;
  List<UserStatus> statuses = [];
  List<Conversation> conversations = [];
  List<AppNotification> notifications = [];
  List<Post> posts = [];
  List<Post> videoPosts = [];
  List<Rally> rallies = [];
  List<PageModel> pages = [];
  List<CartItem> cart = [];
  List<Order> orders = [];
  List<EventTicket> myTickets = [];
  List<WalletTransaction> walletTransactions = [];
  List<WithdrawalAccount> withdrawalAccounts = [];
  List<SoundItem> sounds = [];
  List<AdCampaign> adCampaigns = [];
  List<PlumMember> plumMembers = [];
  List<RewardItem> rewardCatalogue = [];
  List<String> recentSearches = [
    'Subteen Wear',
    'Warri Tech Hub',
    'Udu Lions FC',
    '#DeltaBuilders',
    'Plum',
  ];

  List<Chatroom> chatrooms = [
    Chatroom(
      id: 'room_general',
      name: 'General Chat',
      category: 'General',
      description:
          'Talk about anything, introduce yourself, ask questions and meet new people.',
      roomIcon: 'users',
      coverImage:
          'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
      memberCount: 148,
      rules: [
        'Be kind and welcoming to everyone.',
        'Keep discussions clean and family-friendly.',
        'No spam, excessive links, or unsolicited advertising.',
        'Respect diverse viewpoints and privacy.'
      ],
    ),
    Chatroom(
      id: 'room_social',
      name: 'Meet & Connect',
      category: 'Social',
      description:
          'Make new friends, discover shared interests and build meaningful friendships.',
      roomIcon: 'user_plus',
      coverImage:
          'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80',
      memberCount: 94,
      rules: [
        'Introduce yourself genuinely.',
        'Respect boundaries and personal space.',
        'Harassment and unsolicited solicitation are strictly prohibited.',
        'Support and encourage your peers.'
      ],
    ),
    Chatroom(
      id: 'room_entertainment',
      name: 'Entertainment Zone',
      category: 'Entertainment',
      description: 'Discuss games, anime, music, movies and entertainment.',
      roomIcon: 'gamepad',
      coverImage:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
      memberCount: 215,
      rules: [
        'Use spoiler alerts for recent plotlines.',
        'Constructive debate is welcome.',
        'No piracy or unauthorized links.'
      ],
    ),
    Chatroom(
      id: 'room_ideas',
      name: 'Ideas & Trending',
      category: 'Discussion',
      description:
          'Share opinions, discuss interesting topics, technology and trending conversations.',
      roomIcon: 'lightbulb',
      coverImage:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      memberCount: 182,
      rules: [
        'Ground arguments with factual insights and respect.',
        'Encourage innovation and technology.',
        'Stay on-topic.'
      ],
    ),
    Chatroom(
      id: 'room_nigeria',
      name: 'Naija Connect',
      category: 'Nigeria',
      description:
          'Discuss Nigerian culture, everyday life, opportunities and local happenings.',
      roomIcon: 'map_pin',
      coverImage:
          'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=1200&auto=format&fit=crop&q=80',
      memberCount: 310,
      rules: [
        'Celebrate Nigerian culture, innovation, and unity.',
        'Keep conversations constructive.',
        'No hate speech or tribalism.'
      ],
    ),
  ];

  MockRepository._internal() {
    final userIsbae = User(
      id: 'user_isbae_u',
      name: 'Isbae U',
      username: 'isbae_u',
      avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio:
          'Alhamdullilahi ❤️🙏. Curator of curiosity. From Create Mode. Comedian, creator & storyteller.',
      location: 'Lagos & Warri',
      followers: 1450000,
      following: 320,
      isOnline: true,
      distance: '380m',
      distanceMeters: 380,
      isFollowing: true,
      isVerified: true,
      verificationTier: 'creator',
      creatorCategory: 'Comedy & Entertainment',
      creatorLevel: 5,
      mutualInfo: 'Followed by tundebalo and officialbovi',
    );

    final userAmaka = User(
      id: 'user_amaka',
      name: 'Amaka Nwosu',
      username: 'amaka_nwosu',
      avatarUrl:
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
      bio:
          'Product Designer & visual storyteller. Living between Lekki & Warri. Loves roasted plantain.',
      location: 'Udu, Delta State',
      followers: 920,
      following: 412,
      isOnline: true,
      distance: '450m',
      distanceMeters: 450,
      isFollowing: true,
      isVerified: true,
      verificationTier: 'priority',
      creatorCategory: 'Design & Visuals',
    );

    final userTunde = User(
      id: 'user_tunde',
      name: 'Tunde Balogun',
      username: 'tundebalo',
      avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio:
          'Documenting Niger Delta street architecture & lifestyle. Drone pilot & cinematographer.',
      location: 'Warri, Delta State',
      followers: 1540,
      following: 380,
      isOnline: false,
      distance: '1.2 km',
      distanceMeters: 1200,
      isFollowing: false,
      isVerified: true,
      verificationTier: 'creator',
      creatorCategory: 'Film & Tech',
    );

    final userDavid = User(
      id: 'user_david',
      name: 'Ikedinachukwu David Morgan',
      username: 'daveplayblogger',
      avatarUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      bio:
          "Don't quit. Street photographer & blogger documenting life across West Africa.",
      location: 'Lagos & Warri',
      followers: 461000,
      following: 380,
      isOnline: true,
      distance: '1.8 km',
      distanceMeters: 1800,
      isFollowing: false,
      isVerified: true,
      verificationTier: 'creator',
      creatorCategory: 'Photography & Stories',
      mutualInfo: 'You both follow instablog9ja',
    );

    final userMatthew = User(
      id: 'user_matthew',
      name: 'Matthew Mlew Lewis',
      username: 'm_lew_fayez_sun',
      avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio:
          'Documentary enthusiast, community voice & morning coffee connoisseur. Peace & positivity 💚👉✌️👉',
      location: 'Warri & Lagos',
      followers: 9288,
      following: 320,
      isOnline: true,
      distance: '450m',
      distanceMeters: 450,
      isFollowing: false,
      isVerified: true,
      verificationTier: 'priority',
      creatorCategory: 'Community & Culture',
    );

    final userFatima = User(
      id: 'user_fatima',
      name: 'Fatima Bello',
      username: 'fatimabello',
      avatarUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      bio:
          'Book lover, civil engineer, community activist. Host of Delta Readers Circle.',
      location: 'Udu, Delta State',
      followers: 780,
      following: 290,
      isOnline: false,
      distance: '800m',
      distanceMeters: 800,
      isFollowing: true,
    );

    final userSubteen = User(
      id: 'user_subteen',
      name: 'Subteen Wear',
      username: 'subteenwear',
      avatarUrl:
          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&auto=format&fit=crop&q=80',
      bio:
          'Contemporary streetwear made in Delta. Walk into our studio at Udu Express Junction.',
      location: 'Udu, Delta State',
      followers: 1840,
      following: 142,
      isOnline: true,
      distance: '21m',
      distanceMeters: 21,
      isFollowing: true,
      isVerified: true,
      userType: 'business',
      badge: 'BIZ',
    );

    final userUduLions = User(
      id: 'user_udulions',
      name: 'Udu Lions FC',
      username: 'udulionsfc',
      avatarUrl:
          'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
      bio:
          'Grassroots football club developing elite talents in Niger Delta. Home ground: Udu Township Stadium.',
      location: 'Udu, Delta State',
      followers: 2650,
      following: 95,
      isOnline: true,
      distance: '1.1 km',
      distanceMeters: 1100,
      isFollowing: true,
      isVerified: true,
      userType: 'club',
      badge: 'CLUB',
    );

    final userWarriTech = User(
      id: 'user_warritech',
      name: 'Warri Tech Hub',
      username: 'warritechhub',
      avatarUrl:
          'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
      bio:
          'The gathering place for software engineers, product designers, and founders across Delta.',
      location: 'Warri / Udu',
      followers: 3890,
      following: 230,
      isOnline: true,
      distance: '3.5 km',
      distanceMeters: 3500,
      isFollowing: true,
      isVerified: true,
      userType: 'community',
      badge: 'COMMUNITY',
    );

    final userGreenDelta = User(
      id: 'user_greendelta',
      name: 'Green Delta Initiative',
      username: 'greendelta',
      avatarUrl:
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
      bio:
          'Youth-led ecological preservation, street cleanups, and waterway conservation.',
      location: 'Udu & Warri',
      followers: 1210,
      following: 78,
      isOnline: false,
      distance: '1.9 km',
      distanceMeters: 1900,
      isFollowing: false,
      userType: 'organization',
      badge: 'ORG',
    );

    nearbyUsers = [
      userIsbae,
      userAmaka,
      userTunde,
      userDavid,
      userMatthew,
      userFatima,
      userSubteen,
      userUduLions,
      userWarriTech,
      userGreenDelta,
    ];

    statuses = [
      UserStatus(
        id: 'cycle_isbae',
        user: userIsbae,
        text: 'Alhamdullilahi ❤️🙏\nFrom Create Mode',
        location: 'Warri & Lagos',
        timeRemaining: '9h left',
        viewsCount: 14200,
        likesCount: 2940,
        backgroundColor: const Color(0xFF111827),
      ),
      UserStatus(
        id: 'cycle_amaka',
        user: userAmaka,
        imageUrl:
            'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
        text: 'Found this hidden gem cafe on Airport Road! Aesthetic 10/10 ☕️🥐✨',
        location: 'Airport Rd, Warri',
        timeRemaining: '21h left',
        viewsCount: 64,
        likesCount: 22,
      ),
      UserStatus(
        id: 'cycle_matthew',
        user: userMatthew,
        text:
            'Starting the week with clear intentions and warm tea. Peace to everyone building today! 💚☕',
        location: 'Warri Central',
        timeRemaining: '23h left',
        viewsCount: 210,
        likesCount: 54,
        backgroundColor: const Color(0xFF047857),
      ),
      UserStatus(
        id: 'cycle_tunde',
        user: userTunde,
        imageUrl:
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
        text: 'Pitch is booked! Evening 7-aside showdown in 45 mins. Boots on! ⚽️🔥',
        location: 'DSC Stadium, Udu',
        timeRemaining: '23h left',
        viewsCount: 42,
        likesCount: 19,
      ),
      UserStatus(
        id: 'cycle_fatima',
        user: userFatima,
        imageUrl:
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        text:
            'Fresh catfish banga soup and hot starch. Best spot in Udu hands down 🍲🤤',
        location: 'Old Market Rd, Udu',
        timeRemaining: '22h left',
        viewsCount: 88,
        likesCount: 35,
      ),
    ];

    rallies = [
      Rally(
        id: 'rally_football_udu',
        creator: currentUser,
        title: 'Need 2 people for football tonight',
        description:
            'Looking for two people to join our regular 7-aside game at 6pm. Pitch is booked, bibs and water provided. All skill levels welcome!',
        location: 'Udu Township Field',
        distanceMeters: 1200,
        timeDate: 'Today · 6:00 PM',
        category: 'Sports',
        type: 'JOIN',
        urgency: 'urgent',
        joinedUsersCount: 12,
        maxNeeded: 14,
        isJoined: true,
        tags: ['Football', 'CommunityGame', 'EveningSports'],
        interestedUsers: [userAmaka, userTunde],
      ),
      Rally(
        id: 'rally_laptop_repair',
        creator: userAmaka,
        title: 'Looking for a verified MacBook technician nearby',
        description:
            'Battery replacement needed today around Express Junction or DSC roundabout. Need someone reliable who works cleanly.',
        location: 'Udu Express Junction',
        distanceMeters: 440,
        timeDate: 'Today · ASAP',
        category: 'Help',
        type: 'ASK',
        urgency: 'urgent',
        joinedUsersCount: 3,
        isJoined: false,
        tags: ['TechHelp', 'MacBook', 'HardwareRepair'],
        interestedUsers: [currentUser],
      ),
      Rally(
        id: 'rally_clean_river',
        creator: userGreenDelta,
        title: 'Saturday morning cleanup drive at Riverbank',
        description:
            'Join 30+ young volunteers to clear plastics from the shoreline. Protective gloves, collection bags, and cold refreshments will be provided.',
        location: 'Udu Bridge Shoreline',
        distanceMeters: 2800,
        timeDate: 'Saturday · 7:30 AM',
        category: 'Civic',
        type: 'HELP',
        urgency: 'normal',
        joinedUsersCount: 28,
        isJoined: false,
        tags: ['Eco', 'Volunteer', 'CleanCommunity'],
        interestedUsers: [userFatima, currentUser, userTunde],
      ),
      Rally(
        id: 'rally_creatives_meet',
        creator: userWarriTech,
        title: 'Casual Sunday Coffee & Design Crit Meetup',
        description:
            'Bring your laptops, pitch decks, or UI mockups. Free pour-over coffee and critique session for indie builders.',
        location: 'Delta Roast Cafe, Warri',
        distanceMeters: 4200,
        timeDate: 'Sunday · 3:00 PM',
        category: 'Meetup',
        type: 'JOIN',
        urgency: 'normal',
        joinedUsersCount: 16,
        isJoined: true,
        tags: ['Design', 'Startups', 'Coffee'],
        interestedUsers: [currentUser, userAmaka],
      ),
    ];

    posts = [
      Post(
        id: 'post_isbae_1',
        author: userIsbae,
        content:
            'Alhamdullilahi ❤️🙏\nCuriosity made me ask the hard questions. Grateful for everyone supporting the journey from day one! Watch the latest drop on Lalao.',
        date: '15h',
        location: 'Warri & Lagos',
        distanceMeters: 380,
        imageUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
        likes: 14200,
        commentsCount: 842,
        reposts: 1950,
        isLiked: false,
        isReposted: false,
        soundTitle: 'Afrobeat Cruise Vibe',
        soundAuthor: 'Isbae U',
        topics: ['Entertainment', 'Gaming'],
        comments: [
          Comment(
            id: 'c_isbae_1',
            author: userTunde,
            text: 'Bae U! The energy is unmatched bro 🙌🔥',
            date: '14h',
            likesCount: 142,
            isLiked: true,
          ),
          Comment(
            id: 'c_isbae_2',
            author: userAmaka,
            text: 'Always inspiring! ❤️',
            date: '12h',
            likesCount: 89,
          ),
        ],
      ),
      Post(
        id: 'post_subteen_1',
        author: userSubteen,
        content:
            'Good morning chat! Our limited harmattan heavyweight boxy tee is now available in our Udu flagship showroom. 20% discount for anyone visiting via Lalao today!',
        date: '2h ago',
        location: 'Udu',
        distanceMeters: 21,
        imageUrl:
            'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80',
        likes: 38,
        commentsCount: 6,
        reposts: 5,
        isLiked: true,
        isReposted: false,
        pageRefId: 'page_subteen',
        comments: [
          Comment(
            id: 'c1',
            author: currentUser,
            text:
                'The cut on the sage green version is top tier! Coming by after work.',
            date: '1h ago',
            likesCount: 14,
            isPinned: true,
          ),
        ],
      ),
      Post(
        id: 'post_football_rally',
        author: currentUser,
        content:
            'We have 12 players confirmed for our 7-aside match tonight at Udu Field. Need 2 more midfielders or a goalie to complete both squads! Check the Rally below.',
        date: '2h ago',
        location: 'Udu',
        distanceMeters: 120,
        likes: 14,
        commentsCount: 3,
        reposts: 4,
        isLiked: false,
        isReposted: true,
        rallyRefId: 'rally_football_udu',
        topics: ['Sports', 'Gaming'],
        comments: [
          Comment(
            id: 'c3',
            author: userTunde,
            text: 'I can play holding mid! Bringing my boots.',
            date: '1h ago',
            likesCount: 2,
          ),
        ],
      ),
      Post(
        id: 'post_udulions_match',
        author: userUduLions,
        content:
            'Final whistle! 3-1 victory in our regional academy league showdown. Big thanks to the 400+ local fans who packed the stands. Full highlights clip below! 🦁⚽',
        date: '5h ago',
        location: 'Udu Township Stadium',
        distanceMeters: 1100,
        videoUrl:
            'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4',
        imageUrl:
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
        likes: 92,
        commentsCount: 18,
        reposts: 22,
        isLiked: true,
        isReposted: false,
        pageRefId: 'page_udulions',
        comments: [],
      ),
      Post(
        id: 'post_amaka_coffee',
        author: userAmaka,
        content:
            'Working remotely from Udu this week. It is so refreshing to hear birds and see trees rather than mainland Lagos traffic gridlock. Any recommendations for solar-powered co-working spots around here?',
        date: '1d ago',
        location: 'Udu Express Way',
        distanceMeters: 450,
        imageUrl:
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
        likes: 45,
        commentsCount: 12,
        reposts: 2,
        isLiked: false,
        isReposted: false,
        topics: ['Tech'],
        poll: PollData(
          question: 'Best remote work vibe in Delta?',
          options: [
            'Warri Tech Hub (24/7 Solar)',
            'Delta Creators Lab (Udu)',
            'Delta Roast Cafe',
          ],
          votes: [42, 31, 19],
        ),
        comments: [
          Comment(
            id: 'c5',
            author: userWarriTech,
            text:
                'Our innovation space is open 24/7 with dual solar inverters and fiber! You are always welcome.',
            date: '22h ago',
            likesCount: 9,
          ),
        ],
      ),
      Post(
        id: 'post_tunde_drone',
        author: userTunde,
        content:
            'Golden hour above the Udu river bridge yesterday. Niger Delta landscapes hold an unmatched rhythm when captured from 120 meters up.',
        date: '2d ago',
        location: 'Udu Bridge',
        distanceMeters: 2300,
        imageUrl:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        likes: 128,
        commentsCount: 14,
        reposts: 19,
        isLiked: true,
        isReposted: true,
        comments: [],
      ),
      Post(
        id: 'post_greendelta_update',
        author: userGreenDelta,
        content:
            'Community update: 14 new solar streetlamps have been installed along the school corridor by local youths and engineers. Safe walking for evening students!',
        date: '3d ago',
        location: 'Udu',
        distanceMeters: 1900,
        imageUrl:
            'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80',
        likes: 164,
        commentsCount: 8,
        reposts: 31,
        isLiked: false,
        isReposted: false,
        pageRefId: 'page_greendelta',
        comments: [],
      ),
    ];

    videoPosts = posts.where((p) => p.videoUrl != null).toList();

    final subteenProducts = [
      ShopProduct(
        id: 'prod_beach_blanket',
        pageId: 'page_subteen',
        storeName: 'Subteen Wear',
        name: 'The Beach Blanket',
        price: 169000,
        image:
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80',
        ],
        description:
            'Woven from 100% cotton in an extra-generous 68" x 68" scale. Finished with hand-knotted fringe edges.',
        category: 'Lifestyle',
        rating: 5.0,
        reviewsCount: 2,
        variants: {
          'Color': ['Sand Dune', 'Ocean Indigo', 'Terracotta Gold'],
          'Size': ['Standard (68" x 68")', 'Family Scale (84" x 84")'],
        },
        details: [
          '100% long-staple Turkish combed cotton',
          'Pre-washed for zero shrinkage',
          'Includes genuine rolled leather carry strap',
        ],
      ),
      ShopProduct(
        id: 'prod_sub_1',
        pageId: 'page_subteen',
        storeName: 'Subteen Wear',
        name: 'Heavyweight Boxy Tee (Raw Umber)',
        price: 18500,
        image:
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        description:
            '280 GSM combed cotton with dropped shoulders and thick ribbed neckline. Built for daily wear.',
        category: 'T-Shirts',
        rating: 4.9,
        reviewsCount: 18,
        variants: {
          'Size': ['Small', 'Medium', 'Large', 'Extra Large'],
          'Color': ['Raw Umber', 'Midnight Black', 'Vintage Bone'],
        },
      ),
      ShopProduct(
        id: 'prod_sub_2',
        pageId: 'page_subteen',
        storeName: 'Subteen Wear',
        name: 'Acid-Wash Cargo Utility Pant',
        price: 34000,
        image:
            'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
        description:
            'Relaxed fit multi-pocket tactical cargo trousers with custom metal hardware and drawcord hems.',
        category: 'Bottoms',
        rating: 4.8,
        reviewsCount: 9,
        variants: {
          'Size': ['30 Waist', '32 Waist', '34 Waist', '36 Waist'],
          'Color': ['Acid Grey', 'Washed Olive', 'Faded Obsidian'],
        },
      ),
      ShopProduct(
        id: 'prod_sub_3',
        pageId: 'page_subteen',
        storeName: 'Subteen Wear',
        name: 'Embroidered Delta Script Snapback',
        price: 9500,
        image:
            'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80',
        description:
            'Structured 6-panel cap featuring 3D embroidered typography and brass clasp.',
        category: 'Headwear',
        rating: 5.0,
        reviewsCount: 12,
      ),
      ShopProduct(
        id: 'prod_sub_4',
        pageId: 'page_subteen',
        storeName: 'Subteen Wear',
        name: 'Double-Zipper Heavy Fleece Hoodie',
        price: 38000,
        image:
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        description:
            '450 GSM brushed French terry with double metal zips and kangaroo pocket.',
        category: 'Outerwear',
        rating: 4.9,
        reviewsCount: 24,
      ),
    ];

    pages = [
      PageModel(
        id: 'page_deltacreators',
        name: 'Delta Creators Lab',
        username: 'deltacreators',
        type: 'community',
        badge: 'COMMUNITY',
        avatar:
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
        coverImage:
            'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
        description:
            'Empowering local Delta State creators, designers, and creative founders. Co-working, workshops & digital exhibitions.',
        location: 'Airport Road / Udu Corridor',
        followersCount: 520,
        isFollowing: true,
        isOwner: true,
        category: 'Creative Studio',
        aboutInfo: {
          'address': 'Plot 12, Express Way, Udu Corridor, Delta State',
          'phone': '+234 814 555 0192',
          'email': 'contact@deltacreators.africa',
          'website': 'deltacreators.africa',
          'hours': 'Mon - Fri: 8:00 AM - 8:00 PM',
        },
        events: [
          OrgEvent(
            id: 'event_creator_meetup',
            pageId: 'page_deltacreators',
            organizationName: 'Delta Creators Lab',
            organizationAvatar:
                'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
            organizationBadge: 'COMMUNITY',
            title: 'Delta Creative Founders Meetup & Portfolio Showcase',
            type: 'community',
            coverImage:
                'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
            date: 'November 20, 2026',
            time: '4:00 PM',
            location: 'Plot 12, Express Way, Udu Corridor',
            description:
                'Monthly gathering of Delta graphic designers, photographers, writers, and digital makers.',
          ),
        ],
      ),
      PageModel(
        id: 'page_subteen',
        name: 'Subteen Wear',
        username: 'subteenwear',
        type: 'business',
        badge: 'BIZ',
        avatar:
            'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&auto=format&fit=crop&q=80',
        coverImage:
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        description:
            'Contemporary streetwear studio crafting heavy cotton apparel, caps, and bespoke denim for the bold.',
        location: 'Plot 4, Express Junction, Udu',
        followersCount: 1840,
        isFollowing: true,
        isOwner: true,
        category: 'Fashion & Retail',
        aboutInfo: {
          'address': 'Plot 4, Express Junction, Udu, Delta State',
          'phone': '+234 814 200 4591',
          'website': 'subteen.africa',
          'hours': 'Mon - Sat: 9:00 AM - 7:30 PM',
        },
        products: subteenProducts,
        events: [
          OrgEvent(
            id: 'event_subteen_runway',
            pageId: 'page_subteen',
            organizationName: 'Subteen Wear',
            organizationAvatar:
                'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&auto=format&fit=crop&q=80',
            organizationBadge: 'BIZ',
            title: 'Harmattan Streetwear Runway & Pop-up Showcase',
            type: 'live',
            coverImage:
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
            date: 'November 5, 2026',
            time: '5:00 PM',
            location: 'Plot 4, Express Junction, Udu',
            description:
                'Exclusive streetwear exhibition previewing Subteen’s 2026 Harmattan line.',
            schedule: [
              {'time': '5:00 PM', 'activity': 'Showroom Doors Open & Pop-up Shop'},
              {'time': '6:30 PM', 'activity': 'Runway Showcase & Designer Q&A'},
              {'time': '8:00 PM', 'activity': 'Streetwear After-Party & Music'},
            ],
          ),
        ],
      ),
      PageModel(
        id: 'page_udulions',
        name: 'Udu Lions FC',
        username: 'udulionsfc',
        type: 'club',
        badge: 'CLUB',
        avatar:
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
        coverImage:
            'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&auto=format&fit=crop&q=80',
        description:
            'Premier grassroots soccer club nurturing youth players into professional academy athletes.',
        location: 'Udu Township Stadium, Delta State',
        followersCount: 2650,
        isFollowing: true,
        category: 'Sports Club',
        aboutInfo: {
          'address': 'Udu Township Stadium Sports Complex',
          'phone': '+234 803 555 8190',
          'website': 'udulions.ng',
        },
        events: [
          OrgEvent(
            id: 'event_udulions_derby',
            pageId: 'page_udulions',
            organizationName: 'Udu Lions FC',
            organizationAvatar:
                'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
            organizationBadge: 'CLUB',
            title: 'Delta Grassroots Derby: Udu Lions vs Warri Wolves',
            type: 'tournament',
            coverImage:
                'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&auto=format&fit=crop&q=80',
            date: 'November 28, 2026',
            time: '3:30 PM',
            location: 'Udu Township Stadium Main Bowl',
            ticketPrice: 1500,
            isTicketed: true,
            isTournament: true,
            availableTickets: 320,
            totalTickets: 500,
            prizePool: 500000,
            description:
                'The heavyweight grassroots soccer derby of Delta State! Spectator passes include stadium stands seating and match program entry.',
            rules: [
              'Official NFF Grassroots Tournament Rules',
              'Ticket holders must show digital QR pass at Gate 2',
              'Gates open 2 hours prior to kickoff',
            ],
          ),
        ],
      ),
      PageModel(
        id: 'page_warritech',
        name: 'Warri Tech Hub',
        username: 'warritechhub',
        type: 'community',
        badge: 'COMMUNITY',
        avatar:
            'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
        coverImage:
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
        description:
            'Empowering local software talents, hardware makers, and young tech founders across the Niger Delta.',
        location: 'Airport Road / Udu Corridor',
        followersCount: 3890,
        isFollowing: true,
        category: 'Innovation & Tech',
        events: [
          OrgEvent(
            id: 'event_warritech_hackathon',
            pageId: 'page_warritech',
            organizationName: 'Warri Tech Hub',
            organizationAvatar:
                'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
            organizationBadge: 'COMMUNITY',
            title: 'Delta Builders Hackathon & Tech Demo Day',
            type: 'community',
            coverImage:
                'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
            date: 'December 4, 2026',
            time: '10:00 AM',
            location: 'Innovation Way, off DSC Expressway',
            ticketPrice: 2000,
            isTicketed: true,
            availableTickets: 85,
            totalTickets: 120,
            description:
                'Hardware and software demo day uniting local engineers, designers, and founders across Delta State.',
          ),
        ],
      ),
    ];

    conversations = [
      Conversation(
        id: 'conv_amaka',
        contact: userAmaka,
        lastMessage: 'Friend request accepted. Say hello!',
        timestamp: '11:45 AM',
        isUnread: true,
        unreadCount: 1,
        messages: [
          ChatMessage(
            id: 'dm1',
            text:
                'Hey Providence! Heard you are organizing the community sports rally this evening.',
            isMe: false,
            timestamp: '11:30 AM',
          ),
          ChatMessage(
            id: 'dm2',
            text:
                'Yes! Kickoff is at 6pm. You should definitely pass by if you are free.',
            isMe: true,
            timestamp: '11:42 AM',
          ),
          ChatMessage(
            id: 'dm3',
            text: 'Friend request accepted. Say hello!',
            isMe: false,
            timestamp: '11:45 AM',
          ),
        ],
      ),
      Conversation(
        id: 'conv_subteen',
        contact: userSubteen,
        lastMessage:
            'Your custom embroidered jersey order is ready for pickup!',
        timestamp: '2:16 PM',
        isBusinessChat: true,
        messages: [
          ChatMessage(
            id: 'm4',
            text: 'Hi! Is my Raw Umber Boxy Tee ready?',
            isMe: true,
            timestamp: '1:00 PM',
          ),
          ChatMessage(
            id: 'm5',
            text: 'Your custom embroidered jersey order is ready for pickup!',
            isMe: false,
            timestamp: '2:16 PM',
          ),
        ],
      ),
      Conversation(
        id: 'conv_david',
        contact: userDavid,
        lastMessage: 'Say hello by sending a sticker',
        timestamp: 'Yesterday',
        messages: [
          ChatMessage(
            id: 'm1',
            text: 'Hey David, loved the river market photo series!',
            isMe: true,
            timestamp: '10:00 AM',
          ),
          ChatMessage(
            id: 'm2',
            text: 'Appreciate it brother! Let us link up in Warri.',
            isMe: false,
            timestamp: '10:05 AM',
          ),
        ],
      ),
      Conversation(
        id: 'conv_tunde',
        contact: userTunde,
        lastMessage: 'Sent the high-res aerial drone shots over Google Drive.',
        timestamp: '3d ago',
        messages: [
          ChatMessage(
            id: 'dm5',
            text: 'Sent the high-res aerial drone shots over Google Drive.',
            isMe: false,
            timestamp: '3d ago',
          ),
        ],
      ),
    ];

    notifications = [
      AppNotification(
        id: 'notif_like_1',
        type: NotificationType.like,
        triggerUser: userSubteen,
        previewText:
            'We have 12 players confirmed for our 7-aside match tonight at Udu Field...',
        date: '15m ago',
        isRead: false,
      ),
      AppNotification(
        id: 'notif_like_2',
        type: NotificationType.like,
        triggerUser: userAmaka,
        previewText: 'Early morning run across the town in Udu ✨',
        date: '45m ago',
        isRead: false,
      ),
      AppNotification(
        id: 'notif_follow_1',
        type: NotificationType.follow,
        triggerUser: userDavid,
        date: '2h ago',
        isRead: true,
      ),
      AppNotification(
        id: 'notif_rally_1',
        type: NotificationType.rallyJoin,
        triggerUser: userFatima,
        previewText: 'joined your Rally "Need 2 people for football tonight"',
        date: '4h ago',
        isRead: true,
      ),
      AppNotification(
        id: 'notif_pay_1',
        type: NotificationType.payment,
        triggerUser: userSubteen,
        previewText: 'MTN 5GB Data Plan Purchase Successful',
        date: 'Yesterday',
        isRead: true,
        amount: 1500,
        reference: 'CK-DATA-984120',
      ),
    ];

    orders = [
      Order(
        id: 'LZ-10284',
        storeId: 'page_subteen',
        storeName: 'Subteen Wear',
        storeAvatar: userSubteen.avatarUrl,
        storeLocation: 'Udu Express Junction, Delta State',
        items: [
          OrderItem(
            product: subteenProducts[1],
            quantity: 2,
            unitPrice: 17500,
            options: {'Size': 'Large', 'Color': 'Vintage Bone'},
          ),
        ],
        subtotal: 35000,
        deliveryFee: 2500,
        discount: 2500,
        totalAmount: 35000,
        dateFormatted: 'September 14, 2026',
        orderStatus: 'delivered',
        deliveryAddress: '14 Enerhen Road, Effurun, Delta State',
      ),
      Order(
        id: 'LZ-10221',
        storeId: 'page_subteen',
        storeName: 'Business & Pleasure Co.',
        storeAvatar:
            'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400&auto=format&fit=crop&q=80',
        storeLocation: 'Warri / Delta Mall',
        items: [
          OrderItem(
            product: subteenProducts[0],
            quantity: 1,
            unitPrice: 169000,
            options: {'Color': 'Sand Dune', 'Size': 'Standard (68" x 68")'},
          ),
        ],
        subtotal: 169000,
        deliveryFee: 0,
        totalAmount: 169000,
        dateFormatted: 'September 10, 2026',
        orderStatus: 'completed',
        deliveryType: 'pickup',
        deliveryAddress: 'Delta Mall Boutique, Warri, Delta State',
      ),
    ];

    myTickets = [
      EventTicket(
        id: 'LL-DERBY-2026-00128',
        eventId: 'event_udulions_derby',
        eventTitle: 'Delta Grassroots Derby: Udu Lions vs Warri Wolves',
        organizationName: 'Udu Lions FC',
        holderName: currentUser.name,
        ticketType: 'VIP Covered Stand',
        price: 1500,
        date: 'November 28, 2026',
        time: '3:30 PM',
        venue: 'Udu Township Stadium Main Bowl',
        qrCodeData: 'LALAO-TICKET-LL-DERBY-2026-00128-VERIFIED',
      ),
    ];

    walletTransactions = [
      WalletTransaction(
        id: 'tx_1',
        type: 'deposit',
        amount: 50000,
        description: 'Wallet Funded via Bachs Checkout',
        reference: 'BACHS_FUND_9920184',
        date: 'Today, 09:40 AM',
        paymentMethod: 'bachs',
      ),
      WalletTransaction(
        id: 'tx_2',
        type: 'bill_payment',
        amount: -1500,
        description: 'MTN 5GB Monthly Data Plan (08031234567)',
        reference: 'CK_DATA_884120',
        date: 'Yesterday, 04:15 PM',
      ),
      WalletTransaction(
        id: 'tx_3',
        type: 'ticket_purchase',
        amount: -1500,
        description: 'Ticket: Delta Grassroots Derby (Udu Lions FC)',
        reference: 'LL_TKT_00128',
        date: 'Nov 10, 2026',
      ),
      WalletTransaction(
        id: 'tx_4',
        type: 'deposit',
        amount: 24500,
        description: 'Creator Hub Monthly Monetization Payout',
        reference: 'LL_CREATOR_PAY_11',
        date: 'Nov 1, 2026',
      ),
    ];

    withdrawalAccounts = [
      WithdrawalAccount(
        id: 'bank_1',
        accountName: 'Providence Osiobe',
        bankName: 'Zenith Bank',
        accountNumber: '2209481029',
        isDefault: true,
      ),
      WithdrawalAccount(
        id: 'bank_2',
        accountName: 'Providence Osiobe',
        bankName: 'Guaranty Trust Bank (GTBank)',
        accountNumber: '0159283741',
      ),
    ];

    sounds = [
      SoundItem(
        id: 'snd_1',
        title: 'Warri Street Bounce (Afrobeat Synth)',
        creatorName: 'Lalao Studio',
        category: 'music',
        genre: 'Afrobeats',
        durationSeconds: 30,
        usageCount: 1420,
        favoritesCount: 412,
        isFavorited: true,
      ),
      SoundItem(
        id: 'snd_2',
        title: 'Delta Rain & Lo-Fi Keys',
        creatorName: 'Amaka Nwosu',
        category: 'music',
        genre: 'Lo-Fi Chill',
        durationSeconds: 45,
        usageCount: 890,
        favoritesCount: 210,
      ),
      SoundItem(
        id: 'snd_3',
        title: 'Alhamdullilahi Original Voiceover',
        creatorName: 'Isbae U',
        category: 'original',
        genre: 'Comedy / Voice',
        durationSeconds: 18,
        usageCount: 3420,
        favoritesCount: 980,
        isFavorited: true,
      ),
      SoundItem(
        id: 'snd_4',
        title: 'Stadium Goal Horn & Crowd Roar',
        creatorName: 'Udu Lions FC',
        category: 'effects',
        genre: 'Sports FX',
        durationSeconds: 12,
        usageCount: 340,
        favoritesCount: 95,
      ),
    ];

    adCampaigns = [
      AdCampaign(
        id: 'camp_1',
        name: 'Harmattan Collection Launch',
        headline: 'Subteen 2026 Harmattan Streetwear Drop — 20% Off',
        bodyText:
            'Visit our Udu Express Junction studio or shop directly on Lalao.',
        ctaLabel: 'Shop Collection',
        targetLocation: 'Udu & Warri (10km)',
        placement: 'Feed & Discover',
        status: 'active',
        budgetNgn: 50000,
        spentNgn: 18400,
        impressions: 14820,
        clicks: 642,
        imageUrl:
            'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80',
      ),
      AdCampaign(
        id: 'camp_2',
        name: 'Delta Builders Hackathon Promo',
        headline: 'Register for Warri Tech Demo Day 2026',
        bodyText:
            '120 seats for software engineers, designers, and founders across Delta State.',
        ctaLabel: 'Get Pass',
        targetLocation: 'Delta State',
        placement: 'Live Chatrooms',
        status: 'active',
        budgetNgn: 30000,
        spentNgn: 11200,
        impressions: 8930,
        clicks: 410,
        imageUrl:
            'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      ),
    ];

    plumMembers = [
      PlumMember(
        id: 'plum_1',
        name: 'Zainab',
        age: 24,
        gender: 'Female',
        location: 'Effurun, Warri',
        distanceKm: 2.4,
        bio:
            'Architect & weekend chef. Looking for someone genuine who enjoys art galleries, good music, and evening drives.',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
        ],
        interests: ['Architecture', 'Cooking', 'Afrobeats', 'Travel'],
        lookingFor: 'Long-term relationship',
      ),
      PlumMember(
        id: 'plum_2',
        name: 'Kemi',
        age: 26,
        gender: 'Female',
        location: 'Udu Express',
        distanceKm: 1.1,
        bio:
            'UI/UX Designer & fitness lover. Coffee dates at Delta Roast or evening tennis at DSC.',
        avatarUrl:
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
        ],
        interests: ['Design', 'Tennis', 'Coffee', 'Photography'],
        lookingFor: 'Dating & Connections',
      ),
      PlumMember(
        id: 'plum_3',
        name: 'Tobi',
        age: 28,
        gender: 'Male',
        location: 'Airport Road, Warri',
        distanceKm: 3.8,
        bio:
            'Energy engineer & jazz saxophonist. Always down for live music and meaningful conversations.',
        avatarUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
        ],
        interests: ['Live Music', 'Engineering', 'Fitness', 'Cinema'],
        lookingFor: 'Serious relationship',
      ),
      PlumMember(
        id: 'plum_4',
        name: 'Efe',
        age: 25,
        gender: 'Female',
        location: 'DSC Township',
        distanceKm: 1.9,
        bio:
            'Medical doctor & bookworm. Lover of quiet beaches, poetry, and spontaneous road trips.',
        avatarUrl:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
        ],
        interests: ['Reading', 'Medicine', 'Beach', 'Poetry'],
        lookingFor: 'Long-term partner',
      ),
    ];

    rewardCatalogue = [
      RewardItem(
        id: 'rew_airtime_500',
        name: '₦500 Instant Airtime Voucher',
        description: 'Redeemable on MTN, Airtel, Glo, or 9mobile instantly.',
        pointsCost: 500,
        category: 'airtime',
      ),
      RewardItem(
        id: 'rew_data_2gb',
        name: '2GB Monthly Data Bundle',
        description: '30-day data bundle credited directly to your phone line.',
        pointsCost: 1200,
        category: 'data',
      ),
      RewardItem(
        id: 'rew_subteen_discount',
        name: '₦5,000 Subteen Wear Shopping Credit',
        description: 'Valid on any streetwear item in the Lalao Shop.',
        pointsCost: 2000,
        category: 'voucher',
      ),
      RewardItem(
        id: 'rew_priority_month',
        name: '1 Month Priority Verified Badge',
        description: 'Unlock priority feed ranking and official verification seal.',
        pointsCost: 1700,
        category: 'badge',
      ),
    ];
  }

  void setThemeMode(String mode) {
    if (mode == 'Dark') {
      themeMode = ThemeMode.dark;
    } else if (mode == 'System') {
      themeMode = ThemeMode.system;
    } else {
      themeMode = ThemeMode.light;
    }
    notifyListeners();
  }

  void setLocationConfig(String name, dynamic subAreaOrKm, [int? km]) {
    activeLocationName = name;
    if (subAreaOrKm is int) {
      radiusKm = subAreaOrKm;
    } else if (subAreaOrKm is String) {
      activeLocationSubArea = subAreaOrKm;
      if (km != null) radiusKm = km;
    }
    notifyListeners();
  }

  void joinChatroom(String roomId) {
    final room = chatrooms.firstWhere((r) => r.id == roomId);
    if (!room.isJoined) {
      room.isJoined = true;
      room.memberCount++;
    }
    final existingConvo = conversations.where((c) => c.id == roomId).toList();
    if (existingConvo.isEmpty) {
      conversations.insert(
        0,
        Conversation(
          id: room.id,
          contact: User(
            id: 'room_user_${room.id}',
            name: room.name,
            username: room.category.toLowerCase(),
            avatarUrl: room.coverImage,
            isOnline: true,
          ),
          lastMessage: 'Welcome to ${room.name}!',
          timestamp: 'Just now',
          isChatroom: true,
          category: room.category,
          roomIcon: room.roomIcon,
          messages: [
            ChatMessage(
              id: 'init_${room.id}',
              text: 'Welcome to ${room.name}! ${room.description}',
              isMe: false,
              timestamp: 'Just now',
              senderName: 'Room Bot',
            ),
          ],
        ),
      );
    }
    BackendService().mutation('groups:requestToJoin', {'groupId': roomId});
    notifyListeners();
  }

  void leaveChatroom(String roomId) {
    final room = chatrooms.firstWhere((r) => r.id == roomId);
    if (room.isJoined && room.memberCount > 1) {
      room.memberCount--;
    }
    room.isJoined = false;
    conversations.removeWhere((c) => c.id == roomId);
    notifyListeners();
  }

  void sendMessage(String conversationId, String text, {String type = 'text'}) {
    final convo = conversations.firstWhere((c) => c.id == conversationId);
    convo.messages = List<ChatMessage>.from(convo.messages)
      ..add(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: text,
        isMe: true,
        timestamp: 'Just now',
        type: type,
      ));
    convo.lastMessage = text;
    convo.timestamp = 'Just now';
    convo.isUnread = false;
    convo.unreadCount = 0;
    BackendService().mutation('social:sendMessage', {
      'conversationId': conversationId,
      'text': text,
      'type': type,
    });
    notifyListeners();
  }

  void markStatusViewed(String statusId) {
    final idx = statuses.indexWhere((s) => s.id == statusId);
    if (idx != -1) {
      statuses[idx].hasUnviewed = false;
      notifyListeners();
    }
  }

  void createPost(
    String content,
    String? localImagePath,
    String? location, {
    String? soundTitle,
    PollData? poll,
  }) {
    final newPost = Post(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      author: currentUser,
      content: content,
      date: 'Just now',
      localImagePath: localImagePath,
      location: location ?? activeLocationName,
      distanceMeters: 10,
      likes: 0,
      commentsCount: 0,
      reposts: 0,
      isLiked: false,
      isReposted: false,
      comments: [],
      soundTitle: soundTitle,
      poll: poll,
    );
    posts.insert(0, newPost);
    BackendService().mutation('posts:createPost', {
      'text': content,
      'location': location ?? activeLocationName,
    });
    notifyListeners();
  }

  void createRally({
    required String title,
    required String description,
    required String location,
    String? timeDate,
    String? startsAt,
    required String category,
    String type = 'JOIN',
    String urgency = 'normal',
    int? maxNeeded,
    int? maxParticipants,
  }) {
    final rally = Rally(
      id: 'rally_${DateTime.now().millisecondsSinceEpoch}',
      creator: currentUser,
      title: title,
      description: description,
      location: location,
      timeDate: timeDate ?? startsAt ?? 'Today · 5:00 PM',
      category: category,
      type: type,
      urgency: urgency,
      maxNeeded: maxNeeded ?? maxParticipants ?? 20,
      joinedUsersCount: 1,
      isJoined: true,
      interestedUsers: [currentUser],
    );
    rallies.insert(0, rally);
    posts.insert(
      0,
      Post(
        id: 'post_${rally.id}',
        author: currentUser,
        content: '$title — $description',
        date: 'Just now',
        location: location,
        distanceMeters: 50,
        likes: 1,
        commentsCount: 0,
        reposts: 0,
        isLiked: true,
        isReposted: false,
        rallyRefId: rally.id,
        comments: [],
      ),
    );
    notifyListeners();
  }

  void toggleJoinRally(String rallyId) {
    final idx = rallies.indexWhere((r) => r.id == rallyId);
    if (idx != -1) {
      final r = rallies[idx];
      r.isJoined = !r.isJoined;
      r.joinedUsersCount += r.isJoined ? 1 : -1;
      notifyListeners();
    }
  }

  void createStatus(
    String? localImagePath,
    String? text, {
    Color backgroundColor = const Color(0xFF5E43F3),
  }) {
    final newStatus = UserStatus(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      user: currentUser,
      hasUnviewed: true,
      imageUrl: localImagePath,
      text: text,
      location: activeLocationName,
      backgroundColor: backgroundColor,
    );
    statuses.insert(0, newStatus);
    notifyListeners();
  }

  void toggleFollow(String userId) {
    final idx = nearbyUsers.indexWhere((u) => u.id == userId);
    if (idx != -1) {
      nearbyUsers[idx].isFollowing = !nearbyUsers[idx].isFollowing;
      nearbyUsers[idx].followers += nearbyUsers[idx].isFollowing ? 1 : -1;
      notifyListeners();
    }
  }

  void toggleFollowPage(String pageId) {
    final idx = pages.indexWhere((p) => p.id == pageId);
    if (idx != -1) {
      pages[idx].isFollowing = !pages[idx].isFollowing;
      pages[idx].followersCount += pages[idx].isFollowing ? 1 : -1;
      notifyListeners();
    }
  }

  void createPage({
    required String name,
    String? username,
    String? handle,
    required String type,
    required String category,
    required String description,
    required String location,
    bool hasShop = true,
    bool hasEvents = false,
  }) {
    final badgeMap = {
      'business': 'BIZ',
      'organization': 'ORG',
      'club': 'CLUB',
      'community': 'COMMUNITY',
    };
    final newPage = PageModel(
      id: 'page_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      username: username ?? handle ?? name.toLowerCase().replaceAll(' ', '_'),
      type: type,
      badge: badgeMap[type] ?? 'COMMUNITY',
      avatar:
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
      coverImage:
          'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
      description: description,
      location: location,
      followersCount: 1,
      isFollowing: true,
      isOwner: true,
      category: category,
    );
    pages.insert(0, newPage);
    notifyListeners();
  }

  // Cart & Shop Actions
  int get cartCount => cart.fold(0, (sum, item) => sum + item.quantity);
  double get cartSubtotal =>
      cart.fold(0, (sum, item) => sum + (item.product.price * item.quantity));
  double get cartTotal => cartSubtotal + (cart.isEmpty ? 0 : 1500);

  void addToCart(
    ShopProduct product, {
    Map<String, String> options = const {},
    String? size,
    String? color,
  }) {
    final mergedOptions = Map<String, String>.from(options);
    if (size != null) mergedOptions['Size'] = size;
    if (color != null) mergedOptions['Color'] = color;
    final existingIdx = cart.indexWhere((c) => c.product.id == product.id);
    if (existingIdx != -1) {
      cart[existingIdx].quantity++;
    } else {
      cart.add(CartItem(
        id: 'cart_${DateTime.now().millisecondsSinceEpoch}',
        product: product,
        quantity: 1,
        selectedOptions: mergedOptions,
      ));
    }
    notifyListeners();
  }

  void removeFromCart(String cartItemId) {
    cart.removeWhere((c) => c.id == cartItemId);
    notifyListeners();
  }

  Order placeOrder({
    required String deliveryType,
    required String deliveryAddress,
    required String paymentMethod,
  }) {
    final subtotal = cartSubtotal;
    final deliveryFee = deliveryType == 'delivery' ? 2500.0 : 0.0;
    final total = subtotal + deliveryFee;
    if (paymentMethod == 'wallet' && walletBalance >= total) {
      walletBalance -= total;
      walletTransactions.insert(
        0,
        WalletTransaction(
          id: 'tx_${DateTime.now().millisecondsSinceEpoch}',
          type: 'shop_order',
          amount: -total,
          description: 'Shop Order (${cart.length} items)',
          reference: 'LZ-${10300 + orders.length}',
          date: 'Just now',
        ),
      );
    }
    final order = Order(
      id: 'LZ-${10300 + orders.length}',
      storeId: cart.isNotEmpty ? cart.first.product.pageId : 'page_subteen',
      storeName: cart.isNotEmpty ? cart.first.product.storeName : 'Subteen Wear',
      storeAvatar:
          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&auto=format&fit=crop&q=80',
      storeLocation: 'Udu Express Junction, Delta State',
      items: cart
          .map((c) => OrderItem(
                product: c.product,
                quantity: c.quantity,
                unitPrice: c.product.price,
                options: c.selectedOptions,
              ))
          .toList(),
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      totalAmount: total,
      dateFormatted: 'Just now',
      paymentMethod: paymentMethod,
      orderStatus: 'processing',
      deliveryType: deliveryType,
      deliveryAddress: deliveryAddress,
    );
    orders.insert(0, order);
    cart.clear();
    rewardPoints += 50;
    totalPointsEarned += 50;
    notifyListeners();
    return order;
  }

  // Wallet & Bill Payment Actions
  void fundWallet(double amount, String method) {
    walletBalance += amount;
    final ref = 'BACHS_FUND_${DateTime.now().millisecondsSinceEpoch}';
    walletTransactions.insert(
      0,
      WalletTransaction(
        id: 'tx_${DateTime.now().millisecondsSinceEpoch}',
        type: 'deposit',
        amount: amount,
        description: 'Wallet Funded via $method',
        reference: ref,
        date: 'Just now',
        paymentMethod: method.toLowerCase(),
      ),
    );
    notifications.insert(
      0,
      AppNotification(
        id: 'notif_${DateTime.now().millisecondsSinceEpoch}',
        type: NotificationType.payment,
        triggerUser: currentUser,
        previewText: 'Wallet funded with ₦${amount.toStringAsFixed(0)}',
        date: 'Just now',
        amount: amount,
        reference: ref,
      ),
    );
    notifyListeners();
  }

  bool transferCredits(User recipient, double amount, String enteredPin) {
    if (enteredPin != walletPin || walletBalance < amount) return false;
    walletBalance -= amount;
    final ref = 'LL_TRF_${DateTime.now().millisecondsSinceEpoch}';
    walletTransactions.insert(
      0,
      WalletTransaction(
        id: 'tx_${DateTime.now().millisecondsSinceEpoch}',
        type: 'transfer_out',
        amount: -amount,
        description: 'Transfer to ${recipient.name} (@${recipient.username})',
        reference: ref,
        date: 'Just now',
      ),
    );
    notifyListeners();
    return true;
  }

  bool withdrawFunds(
    WithdrawalAccount account,
    double amount,
    String enteredPin,
  ) {
    if (enteredPin != walletPin || walletBalance < amount) return false;
    walletBalance -= amount;
    final ref = 'LL_WDR_${DateTime.now().millisecondsSinceEpoch}';
    walletTransactions.insert(
      0,
      WalletTransaction(
        id: 'tx_${DateTime.now().millisecondsSinceEpoch}',
        type: 'transfer_out',
        amount: -amount,
        description:
            'Withdrawal to ${account.bankName} (${account.accountNumber})',
        reference: ref,
        date: 'Just now',
      ),
    );
    notifyListeners();
    return true;
  }

  bool purchaseBillService({
    required String serviceName,
    required String customerIdentifier,
    required double amount,
    required String enteredPin,
  }) {
    if (enteredPin != walletPin || walletBalance < amount) return false;
    walletBalance -= amount;
    rewardPoints += 25;
    totalPointsEarned += 25;
    final ref = 'CK_${DateTime.now().millisecondsSinceEpoch}';
    walletTransactions.insert(
      0,
      WalletTransaction(
        id: 'tx_${DateTime.now().millisecondsSinceEpoch}',
        type: 'bill_payment',
        amount: -amount,
        description: '$serviceName ($customerIdentifier)',
        reference: ref,
        date: 'Just now',
      ),
    );
    notifications.insert(
      0,
      AppNotification(
        id: 'notif_${DateTime.now().millisecondsSinceEpoch}',
        type: NotificationType.payment,
        triggerUser: currentUser,
        previewText: '$serviceName for $customerIdentifier successful',
        date: 'Just now',
        amount: amount,
        reference: ref,
      ),
    );
    notifyListeners();
    return true;
  }

  EventTicket? purchaseEventTicket(
    OrgEvent event, [
    String ticketType = 'General Admission',
    int quantity = 1,
  ]) {
    final price = event.ticketPrice * quantity;
    if (price > 0 && walletBalance < price) return null;
    if (price > 0) {
      walletBalance -= price;
      walletTransactions.insert(
        0,
        WalletTransaction(
          id: 'tx_${DateTime.now().millisecondsSinceEpoch}',
          type: 'ticket_purchase',
          amount: -price,
          description: 'Ticket: ${event.title}',
          reference: 'LL_TKT_${DateTime.now().millisecondsSinceEpoch}',
          date: 'Just now',
        ),
      );
    }
    if (event.availableTickets > 0) {
      event.availableTickets--;
    }
    final ticket = EventTicket(
      id: 'LL-TKT-${1000 + myTickets.length}',
      eventId: event.id,
      eventTitle: event.title,
      organizationName: event.organizationName,
      holderName: currentUser.name,
      ticketType: ticketType,
      price: price,
      date: event.date,
      time: event.time,
      venue: event.location,
      qrCodeData: 'LALAO-VERIFIED-${event.id}-${DateTime.now().millisecondsSinceEpoch}',
    );
    myTickets.insert(0, ticket);
    notifyListeners();
    return ticket;
  }

  bool redeemReward(RewardItem reward) {
    if (rewardPoints < reward.pointsCost) return false;
    rewardPoints -= reward.pointsCost;
    totalPointsRedeemed += reward.pointsCost;
    walletTransactions.insert(
      0,
      WalletTransaction(
        id: 'tx_rew_${DateTime.now().millisecondsSinceEpoch}',
        type: 'reward',
        amount: 0,
        description: 'Redeemed Reward: ${reward.name}',
        reference: 'REW_${DateTime.now().millisecondsSinceEpoch}',
        date: 'Just now',
      ),
    );
    notifyListeners();
    return true;
  }

  bool createAdCampaign({
    String? name,
    String? title,
    String? headline,
    String? brandName,
    String? bodyText,
    String? body,
    String? ctaText,
    required String targetLocation,
    String placement = 'Feed & Discover',
    required double budgetNgn,
  }) {
    if (walletBalance < budgetNgn) return false;
    walletBalance -= budgetNgn;
    final camp = AdCampaign(
      id: 'camp_${DateTime.now().millisecondsSinceEpoch}',
      name: name ?? title ?? 'Campaign',
      headline: headline ?? brandName ?? 'Sponsored',
      bodyText: bodyText ?? body ?? '',
      ctaLabel: ctaText ?? 'Learn More',
      targetLocation: targetLocation,
      placement: placement,
      budgetNgn: budgetNgn,
      status: 'active',
      imageUrl:
          'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80',
    );
    adCampaigns.insert(0, camp);
    notifyListeners();
    return true;
  }

  List<User> get allAvailableUsers {
    final Map<String, User> userMap = {};
    for (var u in nearbyUsers) {
      if (u.id != currentUser.id) userMap[u.id] = u;
    }
    for (var c in conversations) {
      if (c.contact.id != currentUser.id && !c.isChatroom) {
        userMap[c.contact.id] = c.contact;
      }
    }
    return userMap.values.toList();
  }

  Conversation? findConversationWithUser(String userId) {
    try {
      return conversations.firstWhere((c) => c.contact.id == userId);
    } catch (_) {
      return null;
    }
  }

  Conversation getOrCreateConversationWithUser(User user) {
    final existing = findConversationWithUser(user.id);
    if (existing != null) return existing;
    final newConvo = Conversation(
      id: 'c_${DateTime.now().millisecondsSinceEpoch}',
      contact: user,
      lastMessage: 'Started a chat',
      timestamp: 'Just now',
      messages: [],
    );
    conversations.insert(0, newConvo);
    notifyListeners();
    return newConvo;
  }

  void markAllNotificationsRead() {
    for (var n in notifications) {
      n.isRead = true;
    }
    notifyListeners();
  }

  List<Post> getUserPosts(String userId) {
    return posts.where((p) => p.author.id == userId).toList();
  }

  void toggleLike(String postId) {
    final post = posts.firstWhere(
      (p) => p.id == postId,
      orElse: () => videoPosts.firstWhere((vp) => vp.id == postId),
    );
    post.isLiked = !post.isLiked;
    post.isLiked ? post.likes++ : post.likes--;
    notifyListeners();
  }

  void toggleRepost(String postId) {
    final post = posts.firstWhere(
      (p) => p.id == postId,
      orElse: () => videoPosts.firstWhere((vp) => vp.id == postId),
    );
    post.isReposted = !post.isReposted;
    post.isReposted ? post.reposts++ : post.reposts--;
    notifyListeners();
  }

  void toggleBookmark(String postId) {
    final post = posts.firstWhere(
      (p) => p.id == postId,
      orElse: () => videoPosts.firstWhere((vp) => vp.id == postId),
    );
    post.isBookmarked = !post.isBookmarked;
    notifyListeners();
  }

  void addComment(String postId, String text) {
    final post = posts.firstWhere(
      (p) => p.id == postId,
      orElse: () => videoPosts.firstWhere((vp) => vp.id == postId),
    );
    post.comments.insert(
      0,
      Comment(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        author: currentUser,
        text: text,
        date: 'Just now',
      ),
    );
    post.commentsCount++;
    notifyListeners();
  }

  // Compatibility getters & methods for all screens
  List<User> get users => [currentUser, ...nearbyUsers];
  List<ShopProduct> get products => pages.expand((p) => p.products).toList();
  List<OrgEvent> get events => pages.expand((p) => p.events).toList();
  List<EventTicket> get tickets => myTickets;
  double get walletBalanceNgn => walletBalance;
  int get walletCredits => (walletBalance / 100).round();
  double get creatorEarningsNgn => currentUser.creatorEarnings;
  String get selectedLocation => activeLocationName;
  int get selectedRadiusKm => radiusKm;
  bool get plumAgeVerified => isPlumAgeConfirmed;
  bool get plumProfileCreated => hasPlumProfile;
  final List<String> betaFeedbackList = [
    '[Feature Suggestion] Add dark mode schedule toggle for night reading',
    '[UI / Performance Feedback] ClubKonnect VTU data plan selector is super fast!',
  ];

  void verifyPlumAge() {
    isPlumAgeConfirmed = true;
    notifyListeners();
  }

  void createPlumProfile() {
    hasPlumProfile = true;
    notifyListeners();
  }

  void togglePlumLike(String memberId) {
    final idx = plumMembers.indexWhere((m) => m.id == memberId);
    if (idx != -1) {
      plumMembers[idx].isLiked = !plumMembers[idx].isLiked;
      notifyListeners();
    }
  }

  void updateCurrentUser({
    String? name,
    String? handle,
    String? bio,
    String? location,
    String? avatarPath,
  }) {
    if (name != null && name.isNotEmpty) currentUser.name = name;
    if (handle != null && handle.isNotEmpty) currentUser.username = handle;
    if (bio != null) currentUser.bio = bio;
    if (location != null && location.isNotEmpty) currentUser.location = location;
    if (avatarPath != null) currentUser.avatarUrl = avatarPath;
    notifyListeners();
  }

  User getAuthor(String authorId) {
    if (authorId == currentUser.id) return currentUser;
    return nearbyUsers.firstWhere(
      (u) => u.id == authorId,
      orElse: () => currentUser,
    );
  }

  void toggleFollowUser(String userId) => toggleFollow(userId);
  void toggleSave(String postId) => toggleBookmark(postId);

  void votePoll(String postId, int optionIndex) {
    final idx = posts.indexWhere((p) => p.id == postId);
    if (idx != -1 && posts[idx].poll != null) {
      final poll = posts[idx].poll!;
      if (poll.selectedOption == null && optionIndex < poll.votes.length) {
        poll.votes[optionIndex]++;
        poll.selectedOption = optionIndex;
        notifyListeners();
      }
    }
  }

  bool sendGift(int costCredits, String recipientName, String giftName) {
    final costNgn = costCredits * 10.0;
    if (walletBalance < costNgn) return false;
    walletBalance -= costNgn;
    walletTransactions.insert(
      0,
      WalletTransaction(
        id: 'tx_gift_${DateTime.now().millisecondsSinceEpoch}',
        type: 'transfer_out',
        amount: -costNgn,
        description: 'Sent $giftName gift to $recipientName',
        reference: 'GIFT_${DateTime.now().millisecondsSinceEpoch}',
        date: 'Just now',
      ),
    );
    notifyListeners();
    return true;
  }

  void addPost(
    String content, {
    String? imageUrl,
    String? videoUrl,
    String? location,
    String? soundTitle,
    PollData? poll,
  }) {
    final newPost = Post(
      id: 'post_${DateTime.now().millisecondsSinceEpoch}',
      author: currentUser,
      content: content,
      date: 'Just now',
      imageUrl: imageUrl != null && imageUrl.startsWith('http') ? imageUrl : null,
      localImagePath: imageUrl != null && !imageUrl.startsWith('http') ? imageUrl : null,
      videoUrl: videoUrl,
      location: location ?? activeLocationName,
      likes: 0,
      commentsCount: 0,
      reposts: 0,
      isLiked: false,
      isReposted: false,
      comments: [],
      soundTitle: soundTitle,
      poll: poll,
    );
    posts.insert(0, newPost);
    rewardPoints += 5;
    totalPointsEarned += 5;
    notifyListeners();
  }

  void transferCreatorEarningsToWallet() {
    if (currentUser.creatorEarnings <= 0) return;
    final amt = currentUser.creatorEarnings;
    walletBalance += amt;
    currentUser.creatorEarnings = 0;
    walletTransactions.insert(
      0,
      WalletTransaction(
        id: 'tx_creator_${DateTime.now().millisecondsSinceEpoch}',
        type: 'deposit',
        amount: amt,
        description: 'Creator Hub Payout Transfer',
        reference: 'CR_${DateTime.now().millisecondsSinceEpoch}',
        date: 'Just now',
      ),
    );
    notifyListeners();
  }

  bool subscribeVerification(String tier, double price) {
    if (walletBalance < price) return false;
    walletBalance -= price;
    currentUser.isVerified = true;
    currentUser.verificationTier = tier;
    walletTransactions.insert(
      0,
      WalletTransaction(
        id: 'tx_ver_${DateTime.now().millisecondsSinceEpoch}',
        type: 'bill_payment',
        amount: -price,
        description: 'Verification Subscription ($tier)',
        reference: 'VER_${DateTime.now().millisecondsSinceEpoch}',
        date: 'Just now',
      ),
    );
    notifyListeners();
    return true;
  }

  void addSound(String title, String artist, String duration) {
    sounds.insert(
      0,
      SoundItem(
        id: 'snd_${DateTime.now().millisecondsSinceEpoch}',
        title: title,
        creatorName: artist,
        category: 'original',
        genre: 'Afrobeats',
        durationSeconds: 30,
      ),
    );
    notifyListeners();
  }

  void toggleBookmarkSound(String soundId) {
    final idx = sounds.indexWhere((s) => s.id == soundId);
    if (idx != -1) {
      sounds[idx].isFavorited = !sounds[idx].isFavorited;
      notifyListeners();
    }
  }

  void submitBetaFeedback(String text) {
    betaFeedbackList.insert(0, text);
    rewardPoints += 15;
    totalPointsEarned += 15;
    notifyListeners();
  }

  void toggleAdCampaignStatus(String campaignId) {
    final idx = adCampaigns.indexWhere((c) => c.id == campaignId);
    if (idx != -1) {
      adCampaigns[idx].status = adCampaigns[idx].status == 'active' ? 'paused' : 'active';
      notifyListeners();
    }
  }

  void addProduct({
    required String pageId,
    required String name,
    required String description,
    required double price,
    required String category,
  }) {
    final pIdx = pages.indexWhere((p) => p.id == pageId);
    if (pIdx != -1) {
      final page = pages[pIdx];
      page.products.insert(
        0,
        ShopProduct(
          id: 'prod_${DateTime.now().millisecondsSinceEpoch}',
          pageId: pageId,
          storeName: page.name,
          name: name,
          price: price,
          image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80',
          description: description,
          category: category,
        ),
      );
      notifyListeners();
    }
  }

  void createEvent({
    required String pageId,
    required String organizerName,
    required String title,
    required String description,
    required String date,
    required String time,
    required String location,
    required double price,
    required String category,
  }) {
    final pIdx = pages.indexWhere((p) => p.id == pageId);
    if (pIdx != -1) {
      pages[pIdx].events.insert(
        0,
        OrgEvent(
          id: 'evt_${DateTime.now().millisecondsSinceEpoch}',
          pageId: pageId,
          organizationName: organizerName,
          organizationAvatar: pages[pIdx].avatar,
          title: title,
          coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
          date: date,
          time: time,
          location: location,
          ticketPrice: price,
          isTicketed: price > 0,
          description: description,
        ),
      );
      notifyListeners();
    }
  }

  Order? checkoutCart({
    required String deliveryAddress,
    required String deliveryMethod,
    required String paymentMethod,
  }) {
    if (cart.isEmpty) return null;
    final total = cartTotal;
    if (paymentMethod.toLowerCase().contains('wallet') && walletBalance < total) {
      return null;
    }
    return placeOrder(
      deliveryType: deliveryMethod.toLowerCase().contains('pickup') ? 'pickup' : 'delivery',
      deliveryAddress: deliveryAddress,
      paymentMethod: paymentMethod.toLowerCase().contains('wallet') ? 'wallet' : paymentMethod,
    );
  }
}

extension UserCompatExt on User {
  int get followersCount => followers;
  int get followingCount => following;
  String get role => userType;
}

extension PostCompatExt on Post {
  String get authorId => author.id;
  String get createdAt => date;
  int get likesCount => likes;
  bool get isSaved => isBookmarked;
  String? get sponsorCta => ctaLabel;
}

extension RallyCompatExt on Rally {
  String get authorId => creator.id;
  String get startsAt => timeDate;
  int get participantsCount => joinedUsersCount;
  int get maxParticipants => maxNeeded ?? 25;
}

extension ShopProductCompatExt on ShopProduct {
  String get imageUrl => image;
  List<String> get sizes => variants['Size'] ?? const ['S', 'M', 'L', 'XL'];
  List<String> get colors => variants['Color'] ?? const ['Black', 'White'];
  int get stock => inStock ? 25 : 0;
}

extension CartItemCompatExt on CartItem {
  String? get selectedSize => selectedOptions['Size'];
}

extension OrderItemCompatExt on OrderItem {
  String get imageUrl => product.image;
  String get productName => product.name;
  double get price => unitPrice;
}

extension OrderCompatExt on Order {
  String get createdAt => dateFormatted;
  String get status => orderStatus;
  String get deliveryMethod => deliveryType == 'pickup' ? 'Store Pickup' : 'Door Delivery';
}

extension OrgEventCompatExt on OrgEvent {
  String get coverUrl => coverImage;
  String get category => type;
  bool get isFree => ticketPrice <= 0;
  double get price => ticketPrice;
  int get attendeesCount => totalTickets - availableTickets;
  int get capacity => totalTickets;
  String get organizerName => organizationName;
}

extension EventTicketCompatExt on EventTicket {
  String get eventDate => '$date · $time';
  String get eventLocation => venue;
  String get qrCode => qrCodeData;
  int get quantity => 1;
}

extension PageModelCompatExt on PageModel {
  String get ownerId => isOwner ? 'user_providence' : 'other';
  String get coverImageUrl => coverImage;
  String get avatarUrl => avatar;
  bool get isVerified => true;
  String get handle => username;
  String? get phone => aboutInfo['Phone'] ?? '+234 800 LALAO NG';
  String? get website => aboutInfo['Website'] ?? 'https://lalao.app/$username';
}

extension WalletTransactionCompatExt on WalletTransaction {
  String get title => description;
  String get category => type;
  String get createdAt => date;
  bool get isCredit => amount >= 0;
  String get amountDisplay => '${amount >= 0 ? '+' : '-'}₦${amount.abs().toStringAsFixed(0)}';
}

extension SoundItemCompatExt on SoundItem {
  String get artist => creatorName;
  String get duration => '0:${durationSeconds.toString().padLeft(2, '0')}';
  int get usesCount => usageCount;
  bool get isBookmarked => isFavorited;
  String get coverUrl => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
}

extension AdCampaignCompatExt on AdCampaign {
  String get title => name;
  String get brandName => headline;
  String get body => bodyText;
}

extension PlumMemberCompatExt on PlumMember {
  bool get isOnline => true;
}

extension ChatroomCompatExt on Chatroom {
  String get imageUrl => coverImage;
  bool get isLive => true;
  String get topic => description;
  int get activeUsersCount => memberCount;
}

extension AppNotificationCompatExt on AppNotification {
  User get user => triggerUser;
  String get content => previewText ?? 'interacted with your post';
  String get timestamp => date;
}

