import 'package:flutter/material.dart';
import '../../data/mock_repository.dart';

class CommentSheet extends StatefulWidget {
  final Post post;
  const CommentSheet({super.key, required this.post});

  @override
  State<CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends State<CommentSheet> {
  final TextEditingController _controller = TextEditingController();
  final repo = MockRepository();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submitComment() {
    final text = _controller.text.trim();
    if (text.isNotEmpty) {
      repo.addComment(widget.post.id, text);
      _controller.clear();
      FocusScope.of(context).unfocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom, // Keyboard handling
      ),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            const Text('Comments', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const Divider(),
            Expanded(
              child: widget.post.comments.isEmpty
                ? const Center(child: Text('No comments yet.', style: TextStyle(color: Colors.grey)))
                : ListView.builder(
                    itemCount: widget.post.comments.length,
                    itemBuilder: (context, index) {
                      final c = widget.post.comments[index];
                      return ListTile(
                        leading: CircleAvatar(backgroundColor: Colors.grey[200], child: const Icon(Icons.person, color: Colors.grey)),
                        title: Row(
                          children: [
                            Text(c.author.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(width: 6),
                            Text('@', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                            const SizedBox(width: 6),
                            Text(c.date, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                          ],
                        ),
                        subtitle: Text(c.text, style: const TextStyle(color: Colors.black87, fontSize: 14)),
                      );
                    },
                  ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                children: [
                  CircleAvatar(radius: 18, backgroundColor: Colors.grey[200], child: const Icon(Icons.person, color: Colors.grey)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: 'Post your reply...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                        filled: true,
                        fillColor: const Color(0xFFF3F4F6),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _submitComment(),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.send, color: Color(0xFF5E43F3)),
                    onPressed: _submitComment,
                  )
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

void showComments(BuildContext context, Post post) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => CommentSheet(post: post),
  );
}
