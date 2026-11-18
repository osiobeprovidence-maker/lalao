import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';

class PostDetailScreen extends StatefulWidget {
  final Post post;
  const PostDetailScreen({super.key, required this.post});

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  final _repo = MockRepository();
  final _commentCtrl = TextEditingController();

  void _submitComment() {
    if (_commentCtrl.text.trim().isEmpty) return;
    _repo.addComment(widget.post.id, _commentCtrl.text.trim());
    _commentCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final p = widget.post;
        final author = p.author;
        return Scaffold(
          appBar: AppBar(title: const Text('Post & Comments', style: TextStyle(fontWeight: FontWeight.w800))),
          body: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      children: [
                        CircleAvatar(radius: 20, backgroundImage: NetworkImage(author.avatarUrl)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(author.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                              Text('@${author.username} · ${p.date}', style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(p.content, style: const TextStyle(fontSize: 16, height: 1.4)),
                    if (p.imageUrl != null) ...[
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(p.imageUrl!, fit: BoxFit.cover),
                      ),
                    ],
                    const Divider(height: 28),
                    Text('Comments (${p.comments.length})', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                    const SizedBox(height: 10),
                    ...p.comments.map((c) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(radius: 16, backgroundImage: NetworkImage(c.author.avatarUrl)),
                          title: Text('${c.author.name} · ${c.date}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          subtitle: Text(c.text),
                        )),
                  ],
                ),
              ),
              Container(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 8 + MediaQuery.of(context).padding.bottom),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _commentCtrl,
                        decoration: const InputDecoration(hintText: 'Write a comment...'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(LucideIcons.send, color: AppTheme.primaryBrand),
                      onPressed: _submitComment,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
