import 'package:flutter/material.dart';
import '../../data/mock_repository.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final repo = MockRepository();
  String _activeFilter = 'All';
  final List<String> _filters = ['All', 'Suggested for you', 'Recent Activity'];

  @override
  void initState() {
    super.initState();
    repo.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    repo.removeListener(() {});
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text('Notifications', style: TextStyle(color: Colors.black87, fontSize: 24, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all, color: Colors.black87),
            onPressed: () => repo.markAllNotificationsRead(),
            tooltip: 'Mark all as read',
          ),
          const SizedBox(width: 8),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6), width: 1)),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: _filters.map((filter) {
                  final isActive = _activeFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: GestureDetector(
                      onTap: () {
                        setState(() { _activeFilter = filter; });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: isActive ? Colors.black87 : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: isActive ? Colors.black87 : Colors.grey.shade300),
                        ),
                        child: Text(
                          filter,
                          style: TextStyle(
                            color: isActive ? Colors.white : Colors.black87,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ),
      body: _buildNotificationList(),
    );
  }

  Widget _buildNotificationList() {
    List<AppNotification> filtered = repo.notifications;
    if (_activeFilter != 'All') {
      // In a real app this would query the DB. For now, filter locally.
      filtered = []; 
    }

    if (filtered.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.notifications_none, size: 64, color: Colors.grey[300]),
              const SizedBox(height: 16),
              const Text('No notifications yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
              const SizedBox(height: 8),
              const Text('Likes, replies, follows, and local activity will appear here when they happen.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      itemCount: filtered.length,
      separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFFF3F4F6)),
      itemBuilder: (context, index) {
        return _buildNotificationItem(filtered[index]);
      },
    );
  }

  Widget _buildNotificationItem(AppNotification notification) {
    IconData actionIcon;
    Color actionColor;
    String actionText;

    switch (notification.type) {
      case NotificationType.like:
        actionIcon = Icons.favorite;
        actionColor = const Color(0xFF5E43F3);
        actionText = 'liked your post';
        break;
      case NotificationType.reply:
        actionIcon = Icons.chat_bubble;
        actionColor = Colors.blue;
        actionText = 'replied to you';
        break;
      case NotificationType.follow:
        actionIcon = Icons.person;
        actionColor = Colors.green;
        actionText = 'followed you';
        break;
      case NotificationType.repost:
        actionIcon = Icons.repeat;
        actionColor = Colors.green;
        actionText = 'reposted your post';
        break;
    }

    return InkWell(
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.all(16),
        color: notification.isRead ? Colors.white : const Color(0xFFF5F3FF),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(actionIcon, color: actionColor, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: Colors.grey[200],
                    backgroundImage: notification.triggerUser.avatarUrl.isNotEmpty ? NetworkImage(notification.triggerUser.avatarUrl) : null,
                    child: notification.triggerUser.avatarUrl.isEmpty ? const Icon(Icons.person, size: 20, color: Colors.grey) : null,
                  ),
                  const SizedBox(height: 8),
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(color: Colors.black87, fontSize: 15, height: 1.4),
                      children: [
                        TextSpan(text: "\ ", style: const TextStyle(fontWeight: FontWeight.bold)),
                        TextSpan(text: actionText),
                      ],
                    ),
                  ),
                  if (notification.previewText != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      notification.previewText!,
                      style: const TextStyle(color: Color(0xFF6B7280), fontSize: 14),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
