import 'package:flutter/material.dart';
import '../../data/mock_repository.dart';
import 'create_cycle_screen.dart';
import 'cycle_viewer_screen.dart';
import 'chat_screen.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final repo = MockRepository();

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
        title: const Text('Messages', style: TextStyle(color: Colors.black87, fontSize: 24, fontWeight: FontWeight.bold)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search messages & contacts...',
                hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF9CA3AF)),
                filled: true,
                fillColor: const Color(0xFFF3F4F6),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // CYCLE SECTION
            const Padding(
              padding: EdgeInsets.only(left: 16, top: 16, bottom: 12),
              child: Text('CYCLE', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            ),
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildMyCycleItem(),
                  const SizedBox(width: 16),
                  ...repo.statuses.map((status) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: _buildCycleItem(status),
                    );
                  }).toList(),
                ],
              ),
            ),
            const Divider(height: 32, color: Color(0xFFF3F4F6)),
            // DIRECT CHATS SECTION
            const Padding(
              padding: EdgeInsets.only(left: 16, bottom: 8),
              child: Text('DIRECT CHATS', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            ),
            repo.conversations.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: repo.conversations.length,
                  itemBuilder: (context, index) {
                    return _buildConversationItem(repo.conversations[index]);
                  },
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildMyCycleItem() {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateCycleScreen()));
      },
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 64, height: 64,
                decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.grey.shade300, width: 2)),
                child: Padding(
                  padding: const EdgeInsets.all(2.0),
                  child: CircleAvatar(
                    backgroundColor: Colors.grey[200],
                    backgroundImage: repo.currentUser.avatarUrl.isNotEmpty ? NetworkImage(repo.currentUser.avatarUrl) : null,
                    child: repo.currentUser.avatarUrl.isEmpty ? const Icon(Icons.person, color: Colors.grey, size: 32) : null,
                  ),
                ),
              ),
              Positioned(
                bottom: 0, right: 0,
                child: Container(
                  width: 20, height: 20,
                  decoration: BoxDecoration(color: const Color(0xFF5E43F3), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                  child: const Icon(Icons.add, color: Colors.white, size: 14),
                ),
              )
            ],
          ),
          const SizedBox(height: 8),
          const Text('My Cycle', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildCycleItem(UserStatus status) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => CycleViewerScreen(status: status)));
      },
      child: Column(
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: status.hasUnviewed ? const Color(0xFF5E43F3) : Colors.grey.shade300, width: 2)
            ),
            child: Padding(
              padding: const EdgeInsets.all(2.0),
              child: CircleAvatar(
                backgroundColor: Colors.grey[200],
                backgroundImage: status.user.avatarUrl.isNotEmpty ? NetworkImage(status.user.avatarUrl) : null,
                child: status.user.avatarUrl.isEmpty ? const Icon(Icons.person, color: Colors.grey, size: 32) : null,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(status.user.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.black87), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _buildConversationItem(Conversation chat) {
    return InkWell(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(conversation: chat)));
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: chat.contact.avatarUrl.isNotEmpty ? NetworkImage(chat.contact.avatarUrl) : null,
                  child: chat.contact.avatarUrl.isEmpty ? const Icon(Icons.person, color: Colors.grey, size: 28) : null,
                ),
                if (chat.contact.isOnline)
                  Positioned(
                    bottom: 2, right: 2,
                    child: Container(
                      width: 14, height: 14,
                      decoration: BoxDecoration(color: Colors.green, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(child: Text(chat.contact.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      if (chat.isBusinessChat) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: const Color(0xFF5E43F3).withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                          child: const Text('BUSINESS CHAT', style: TextStyle(color: Color(0xFF5E43F3), fontSize: 10, fontWeight: FontWeight.bold)),
                        )
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(chat.lastMessage, style: TextStyle(color: chat.isUnread ? Colors.black87 : const Color(0xFF6B7280), fontWeight: chat.isUnread ? FontWeight.bold : FontWeight.normal, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(chat.timestamp, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                const SizedBox(height: 4),
                const Icon(Icons.chevron_right, color: Color(0xFFD1D5DB), size: 20),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          children: [
            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            const Text('No conversations yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 8),
            const Text('Start a chat with your friends or contacts.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

