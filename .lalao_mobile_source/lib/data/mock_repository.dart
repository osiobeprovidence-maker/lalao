import 'package:flutter/foundation.dart';

class User {
  final String id;
  final String name;
  final String username;
  final String avatarUrl;
  final String bio;
  final String location;
  final String joinedDate;
  final int followers;
  final int following;
  final int totalLikes;
  final bool isOnline;
  final String? distance;
  bool isFollowing;
  final bool isVerified;

  User({
    required this.id, 
    required this.name, 
    required this.username, 
    required this.avatarUrl,
    this.bio = 'Flutter Developer | Building awesome mobile apps with beautiful UIs. ✨',
    this.location = 'Lagos, Nigeria',
    this.joinedDate = 'September 2026',
    this.followers = 1200,
    this.following = 350,
    this.totalLikes = 4500,
    this.isOnline = false,
    this.distance,
    this.isFollowing = false,
    this.isVerified = false,
  });
}

class UserStatus {
  final String id;
  final User user;
  bool hasUnviewed;
  final String? imageUrl;
  final String? text;
  
  UserStatus({required this.id, required this.user, this.hasUnviewed = true, this.imageUrl, this.text});
}

class ChatMessage {
  final String id;
  final String text;
  final bool isMe;
  final String timestamp;
  ChatMessage({required this.id, required this.text, required this.isMe, required this.timestamp});
}

class Conversation {
  final String id;
  final User contact;
  String lastMessage;
  String timestamp;
  final bool isBusinessChat;
  bool isUnread;
  List<ChatMessage> messages;

  Conversation({
    required this.id,
    required this.contact,
    required this.lastMessage,
    required this.timestamp,
    this.isBusinessChat = false,
    this.isUnread = false,
    this.messages = const [],
  });
}

enum NotificationType { like, reply, follow, repost }

class AppNotification {
  final String id;
  final NotificationType type;
  final User triggerUser;
  final String? previewText;
  final String date;
  bool isRead;

  AppNotification({
    required this.id,
    required this.type,
    required this.triggerUser,
    this.previewText,
    required this.date,
    this.isRead = false,
  });
}

class Comment {
  final String id;
  final User author;
  final String text;
  final String date;
  Comment({required this.id, required this.author, required this.text, required this.date});
}

class Post {
  final String id;
  final User author;
  final String content;
  final String date;
  final String? location;
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

  Post({
    required this.id,
    required this.author,
    required this.content,
    required this.date,
    this.location,
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
  });
}

class MockRepository extends ChangeNotifier {
  static final MockRepository _instance = MockRepository._internal();
  factory MockRepository() => _instance;

  final User currentUser = User(id: 'me', name: 'Providence Osiobe', username: 'rider_ezzy', avatarUrl: '', isOnline: true, isVerified: true);
  
  List<User> nearbyUsers = [
    User(id: 'u4', name: 'Isbae', username: 'isbae', avatarUrl: '', isOnline: false, distance: '< 50m'),
    User(id: 'u5', name: 'Matthew', username: 'matthew', avatarUrl: '', isOnline: true, distance: '2.3 km'),
    User(id: 'u6', name: 'Ikedinachi', username: 'ikedinachi', avatarUrl: '', isOnline: false, distance: '2.5 km'),
    User(id: 'u10', name: 'Franklin Anumaka', username: 'franklin', avatarUrl: '', isOnline: true, distance: '4.1 km'),
  ];

  List<UserStatus> statuses = [];
  List<Conversation> conversations = [];
  List<AppNotification> notifications = [];
  List<Post> posts = [];
  List<Post> videoPosts = [];

  MockRepository._internal() {
    statuses = [
      UserStatus(id: 's1', user: nearbyUsers[0], text: 'Feeling great today!'),
      UserStatus(id: 's2', user: nearbyUsers[1], imageUrl: 'https://flutter.github.io/assets-for-api-docs/assets/widgets/owl.jpg'),
      UserStatus(id: 's3', user: nearbyUsers[2], text: 'Working on a new Flutter app...'),
    ];

    conversations = [
      Conversation(
        id: 'c1', 
        contact: User(id: 'u7', name: 'qwertlyjointheq', username: 'qwertlyjointheq', avatarUrl: '', isOnline: true), 
        lastMessage: 'Say hello by sending a sticker', 
        timestamp: 'Just now',
        messages: [
          ChatMessage(id: 'm1', text: 'Hey, how are you doing?', isMe: true, timestamp: '10:00 AM'),
          ChatMessage(id: 'm2', text: 'I am doing great! You?', isMe: false, timestamp: '10:05 AM'),
          ChatMessage(id: 'm3', text: 'Say hello by sending a sticker', isMe: false, timestamp: 'Just now'),
        ]
      ),
      Conversation(
        id: 'c2', 
        contact: User(id: 'u8', name: 'JOINTHEQ', username: 'jointheq', avatarUrl: '', isOnline: false), 
        lastMessage: 'Sent Wavy Eye', 
        timestamp: '2:16 PM', 
        isBusinessChat: true,
        messages: [
          ChatMessage(id: 'm4', text: 'Can I get a quote?', isMe: true, timestamp: '1:00 PM'),
          ChatMessage(id: 'm5', text: 'Sent Wavy Eye', isMe: false, timestamp: '2:16 PM'),
        ]
      ),
    ];
    
    notifications = [
      AppNotification(id: 'n1', type: NotificationType.like, triggerUser: User(id: 'u2', name: 'Jane Doe', username: 'janedoe', avatarUrl: '', isOnline: false), previewText: 'Just exploring the new Lalao mobile app! The UI feels incredibly smooth and modern. ✨', date: '2m', isRead: false),
    ];

    posts = [
      Post(id: '1', author: User(id: 'u3', name: 'Lalao Official', username: 'lalao', avatarUrl: '', isVerified: true), content: 'Check out this amazing vertical video experience! Let us know what you think.', date: 'Just now', videoUrl: 'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4', likes: 587, commentsCount: 51, reposts: 161, isLiked: false, isReposted: false, comments: []),
      Post(id: '2', author: currentUser, content: 'Just exploring the new Lalao mobile app! The UI feels incredibly smooth and modern. ✨', date: '9/20/2026', location: 'Udu', likes: 1205, commentsCount: 342, reposts: 89, isLiked: false, isReposted: false, comments: []),
    ];

    videoPosts = posts.where((p) => p.videoUrl != null).toList();
    if (videoPosts.isEmpty) {
      videoPosts.add(Post(id: '100', author: User(id: 'u3', name: 'Lalao Official', username: 'lalao', avatarUrl: '', isVerified: true), content: 'Vertical video test', date: 'Just now', videoUrl: 'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4', likes: 587, commentsCount: 51, reposts: 161, isLiked: false, isReposted: false, comments: []));
    }
  }

  void sendMessage(String conversationId, String text) {
    final convo = conversations.firstWhere((c) => c.id == conversationId);
    convo.messages.add(ChatMessage(
      id: DateTime.now().toString(),
      text: text,
      isMe: true,
      timestamp: 'Just now'
    ));
    convo.lastMessage = text;
    convo.timestamp = 'Just now';
    notifyListeners();
  }

  void markStatusViewed(String statusId) {
    final status = statuses.firstWhere((s) => s.id == statusId);
    status.hasUnviewed = false;
    notifyListeners();
  }

  void createPost(String content, String? localImagePath, String? location) {
    final newPost = Post(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      author: currentUser,
      content: content,
      date: 'Just now',
      localImagePath: localImagePath,
      location: location,
      likes: 0,
      commentsCount: 0,
      reposts: 0,
      isLiked: false,
      isReposted: false,
      comments: [],
    );
    posts.insert(0, newPost);
    notifyListeners();
  }

  void createStatus(String? localImagePath, String? text) {
    final newStatus = UserStatus(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      user: currentUser,
      hasUnviewed: true,
      imageUrl: localImagePath,
      text: text,
    );
    statuses.insert(0, newStatus);
    notifyListeners();
  }

  void toggleFollow(String userId) {
    final user = nearbyUsers.firstWhere((u) => u.id == userId);
    user.isFollowing = !user.isFollowing;
    notifyListeners();
  }

  void markAllNotificationsRead() {
    for (var n in notifications) n.isRead = true;
    notifyListeners();
  }

  List<Post> getUserPosts(String userId) {
    return posts.where((p) => p.author.id == userId).toList();
  }

  void toggleLike(String postId) {
    Post post = posts.firstWhere((p) => p.id == postId, orElse: () => videoPosts.firstWhere((vp) => vp.id == postId));
    post.isLiked = !post.isLiked;
    post.isLiked ? post.likes++ : post.likes--;
    notifyListeners();
  }

  void toggleRepost(String postId) {
    Post post = posts.firstWhere((p) => p.id == postId, orElse: () => videoPosts.firstWhere((vp) => vp.id == postId));
    post.isReposted = !post.isReposted;
    post.isReposted ? post.reposts++ : post.reposts--;
    notifyListeners();
  }

  void toggleBookmark(String postId) {
    Post post = posts.firstWhere((p) => p.id == postId, orElse: () => videoPosts.firstWhere((vp) => vp.id == postId));
    post.isBookmarked = !post.isBookmarked;
    notifyListeners();
  }

  void addComment(String postId, String text) {
    Post post = posts.firstWhere((p) => p.id == postId, orElse: () => videoPosts.firstWhere((vp) => vp.id == postId));
    post.comments.insert(0, Comment(id: DateTime.now().toString(), author: currentUser, text: text, date: 'Just now'));
    post.commentsCount++;
    notifyListeners();
  }
}
