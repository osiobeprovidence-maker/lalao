import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';
import 'chat_screen.dart';

class UserProfileScreen extends StatelessWidget {
  final User user;
  const UserProfileScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final posts = repo.getUserPosts(user.id);
        return Scaffold(
          appBar: AppBar(title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold))),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  CircleAvatar(radius: 36, backgroundImage: NetworkImage(user.avatarUrl)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(child: Text(user.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))),
                            if (user.isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(LucideIcons.badge_check, size: 16, color: AppTheme.primaryBrand),
                            ],
                          ],
                        ),
                        Text('@${user.username} · ${user.location}', style: const TextStyle(color: AppTheme.textSecondaryLight)),
                        const SizedBox(height: 6),
                        Text('${user.followers} followers · ${user.following} following', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(user.bio),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => repo.toggleFollow(user.id),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: user.isFollowing ? Colors.grey.shade200 : AppTheme.primaryBrand,
                        foregroundColor: user.isFollowing ? Colors.black87 : Colors.white,
                      ),
                      child: Text(user.isFollowing ? 'Following' : 'Follow'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        final convo = repo.getOrCreateConversationWithUser(user);
                        Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(conversation: convo)));
                      },
                      icon: const Icon(LucideIcons.message_square, size: 16),
                      label: const Text('Message'),
                    ),
                  ),
                ],
              ),
              const Divider(height: 28),
              Text('Posts (${posts.length})', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 10),
              ...posts.map((p) => Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      title: Text(p.content),
                      subtitle: Text('${p.date} · ${p.likes} likes'),
                    ),
                  )),
            ],
          ),
        );
      },
    );
  }
}
