import 'package:flutter/material.dart';
import '../../data/mock_repository.dart';
import 'post_detail_screen.dart';

class SavedPostsScreen extends StatelessWidget {
  const SavedPostsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final saved = repo.posts.where((p) => p.isBookmarked).toList();
        return Scaffold(
          appBar: AppBar(title: const Text('Saved Posts', style: TextStyle(fontWeight: FontWeight.w800))),
          body: saved.isEmpty
              ? const Center(child: Text('No saved posts yet.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: saved.length,
                  itemBuilder: (context, idx) {
                    final p = saved[idx];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(backgroundImage: NetworkImage(p.author.avatarUrl)),
                        title: Text(p.author.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(p.content, maxLines: 2, overflow: TextOverflow.ellipsis),
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PostDetailScreen(post: p))),
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}

class LikedPostsScreen extends StatelessWidget {
  const LikedPostsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final liked = repo.posts.where((p) => p.isLiked).toList();
        return Scaffold(
          appBar: AppBar(title: const Text('Liked Posts', style: TextStyle(fontWeight: FontWeight.w800))),
          body: liked.isEmpty
              ? const Center(child: Text('No liked posts yet.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: liked.length,
                  itemBuilder: (context, idx) {
                    final p = liked[idx];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(backgroundImage: NetworkImage(p.author.avatarUrl)),
                        title: Text(p.author.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(p.content, maxLines: 2, overflow: TextOverflow.ellipsis),
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PostDetailScreen(post: p))),
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}

class FollowingScreen extends StatelessWidget {
  const FollowingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final following = repo.nearbyUsers.where((u) => u.isFollowing).toList();
        return Scaffold(
          appBar: AppBar(title: const Text('Following', style: TextStyle(fontWeight: FontWeight.w800))),
          body: following.isEmpty
              ? const Center(child: Text('You are not following anyone yet.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: following.length,
                  itemBuilder: (context, idx) {
                    final u = following[idx];
                    return ListTile(
                      leading: CircleAvatar(backgroundImage: NetworkImage(u.avatarUrl)),
                      title: Text(u.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('@${u.username}'),
                      trailing: OutlinedButton(
                        onPressed: () => repo.toggleFollow(u.id),
                        child: const Text('Following'),
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}
