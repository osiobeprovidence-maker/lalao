import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  final Conversation conversation;
  const ChatScreen({super.key, required this.conversation});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final repo = MockRepository();

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_textController.text.trim().isEmpty) return;
    repo.sendMessage(widget.conversation.id, _textController.text);
    _textController.clear();
    setState(() {});
  }

  void _startCall(User user, {required bool isVideo}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _ActiveCallDialog(user: user, isVideo: isVideo),
    );
  }

  @override
  Widget build(BuildContext context) {
    final convo = repo.conversations.firstWhere((c) => c.id == widget.conversation.id);
    final user = convo.contact;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrow_left),
          onPressed: () => Navigator.pop(context),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: user.avatarUrl.isNotEmpty ? NetworkImage(user.avatarUrl) : null,
                  child: user.avatarUrl.isEmpty ? const Icon(LucideIcons.user, color: Colors.grey, size: 20) : null,
                ),
                if (user.isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  )
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          user.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (convo.isBusinessChat) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5F3FF),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Business',
                            style: TextStyle(color: Color(0xFF5E43F3), fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        )
                      ]
                    ],
                  ),
                  Text(user.isOnline ? 'Online' : 'Offline', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.phone, color: AppTheme.primaryBrand),
            tooltip: 'Voice Call',
            onPressed: () => _startCall(user, isVideo: false),
          ),
          IconButton(
            icon: const Icon(LucideIcons.video, color: AppTheme.primaryBrand),
            tooltip: 'Video Call',
            onPressed: () => _startCall(user, isVideo: true),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: convo.messages.length,
              itemBuilder: (context, index) {
                final msg = convo.messages[index];
                return _buildMessageBubble(msg);
              },
            ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    return Align(
      alignment: msg.isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: msg.isMe ? AppTheme.primaryBrand : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16).copyWith(
            bottomRight: msg.isMe ? const Radius.circular(4) : const Radius.circular(16),
            bottomLeft: msg.isMe ? const Radius.circular(16) : const Radius.circular(4),
          ),
          boxShadow: msg.isMe
              ? []
              : [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: msg.isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(msg.text, style: TextStyle(color: msg.isMe ? Colors.white : null, fontSize: 15)),
            const SizedBox(height: 4),
            Text(msg.timestamp, style: TextStyle(color: msg.isMe ? Colors.white70 : Colors.grey, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 12 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(LucideIcons.smile, color: Colors.grey),
            onPressed: () {
              repo.sendMessage(widget.conversation.id, '🔥🙌✨');
              setState(() {});
            },
          ),
          Expanded(
            child: TextField(
              controller: _textController,
              decoration: const InputDecoration(
                hintText: 'Message...',
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(color: AppTheme.primaryBrand, shape: BoxShape.circle),
              child: const Icon(LucideIcons.send, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActiveCallDialog extends StatefulWidget {
  final User user;
  final bool isVideo;

  const _ActiveCallDialog({required this.user, required this.isVideo});

  @override
  State<_ActiveCallDialog> createState() => _ActiveCallDialogState();
}

class _ActiveCallDialogState extends State<_ActiveCallDialog> {
  bool _muted = false;
  bool _speaker = true;
  late bool _videoOn;

  @override
  void initState() {
    super.initState();
    _videoOn = widget.isVideo;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog.fullscreen(
      backgroundColor: const Color(0xFF0F172A),
      child: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white12,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _videoOn ? 'LALAO HD VIDEO CALL' : 'LALAO VOICE CALL',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const Text('00:42 · Encrypted', style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            Column(
              children: [
                CircleAvatar(
                  radius: 64,
                  backgroundImage: NetworkImage(widget.user.avatarUrl),
                ),
                const SizedBox(height: 20),
                Text(
                  widget.user.name,
                  style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 6),
                Text(
                  '@${widget.user.username} · Connected',
                  style: const TextStyle(color: Colors.greenAccent, fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 36),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  IconButton.filled(
                    onPressed: () => setState(() => _muted = !_muted),
                    style: IconButton.styleFrom(
                      backgroundColor: _muted ? Colors.redAccent : Colors.white24,
                      padding: const EdgeInsets.all(18),
                    ),
                    icon: Icon(_muted ? LucideIcons.mic_off : LucideIcons.mic, color: Colors.white),
                  ),
                  IconButton.filled(
                    onPressed: () => setState(() => _videoOn = !_videoOn),
                    style: IconButton.styleFrom(
                      backgroundColor: _videoOn ? AppTheme.primaryBrand : Colors.white24,
                      padding: const EdgeInsets.all(18),
                    ),
                    icon: Icon(_videoOn ? LucideIcons.video : LucideIcons.video_off, color: Colors.white),
                  ),
                  IconButton.filled(
                    onPressed: () => setState(() => _speaker = !_speaker),
                    style: IconButton.styleFrom(
                      backgroundColor: _speaker ? AppTheme.primaryBrand : Colors.white24,
                      padding: const EdgeInsets.all(18),
                    ),
                    icon: Icon(_speaker ? LucideIcons.volume_2 : LucideIcons.volume_x, color: Colors.white),
                  ),
                  IconButton.filled(
                    onPressed: () => Navigator.pop(context),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.red,
                      padding: const EdgeInsets.all(18),
                    ),
                    icon: const Icon(LucideIcons.phone_off, color: Colors.white),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
