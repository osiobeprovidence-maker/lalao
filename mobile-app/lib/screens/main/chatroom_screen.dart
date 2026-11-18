import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';

class ChatroomScreen extends StatefulWidget {
  final Chatroom chatroom;
  const ChatroomScreen({super.key, required this.chatroom});

  @override
  State<ChatroomScreen> createState() => _ChatroomScreenState();
}

class _ChatroomScreenState extends State<ChatroomScreen> {
  final _repo = MockRepository();
  final _msgCtrl = TextEditingController();
  final List<String> _liveMessages = [
    'Welcome to the live room! Respect everyone and enjoy the vibe.',
    'Anyone heading to the Udu 5-Aside football match later?',
  ];

  @override
  Widget build(BuildContext context) {
    final room = widget.chatroom;
    return Scaffold(
      appBar: AppBar(
        title: Text(room.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        actions: [
          TextButton(
            onPressed: () {
              if (room.isJoined) {
                _repo.leaveChatroom(room.id);
              } else {
                _repo.joinChatroom(room.id);
              }
              setState(() {});
            },
            child: Text(room.isJoined ? 'Joined ✓' : 'Join Room', style: const TextStyle(color: AppTheme.primaryBrand, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            color: AppTheme.primaryBrand.withOpacity(0.08),
            child: Text('${room.description} · ${room.memberCount} members online', style: const TextStyle(fontSize: 12)),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _liveMessages.length,
              itemBuilder: (context, idx) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: const Icon(LucideIcons.message_circle, color: AppTheme.primaryBrand),
                  title: Text(_liveMessages[idx], style: const TextStyle(fontSize: 14)),
                ),
              ),
            ),
          ),
          Container(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 8 + MediaQuery.of(context).padding.bottom),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgCtrl,
                    decoration: const InputDecoration(hintText: 'Say something to the room...'),
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.send, color: AppTheme.primaryBrand),
                  onPressed: () {
                    if (_msgCtrl.text.trim().isNotEmpty) {
                      setState(() {
                        _liveMessages.add('${_repo.currentUser.name}: ${_msgCtrl.text.trim()}');
                        _msgCtrl.clear();
                      });
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class CameraRecordScreen extends StatelessWidget {
  const CameraRecordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Lalao Camera Studio'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.camera, size: 72, color: Colors.white54),
            const SizedBox(height: 16),
            const Text('Camera Preview Ready', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(LucideIcons.check),
              label: const Text('Done'),
            ),
          ],
        ),
      ),
    );
  }
}
