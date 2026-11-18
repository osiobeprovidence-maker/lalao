import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:image_picker/image_picker.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';
import '../../widgets/video_post_widget.dart';
import 'settings_hub_screen.dart';
import 'creator_verification_screen.dart';
import 'wallet_screen.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onOpenDrawer;

  const ProfileScreen({super.key, this.onOpenDrawer});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _repo = MockRepository();

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file != null) {
      _repo.updateCurrentUser(avatarPath: file.path);
    }
  }

  void _showEditProfileDialog(BuildContext context, User user) {
    final nameCtrl = TextEditingController(text: user.name);
    final handleCtrl = TextEditingController(text: user.username);
    final bioCtrl = TextEditingController(text: user.bio);
    final locCtrl = TextEditingController(text: user.location);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full Name')),
              const SizedBox(height: 10),
              TextField(controller: handleCtrl, decoration: const InputDecoration(labelText: 'Username (@handle)')),
              const SizedBox(height: 10),
              TextField(controller: locCtrl, decoration: const InputDecoration(labelText: 'Location / Hub')),
              const SizedBox(height: 10),
              TextField(controller: bioCtrl, decoration: const InputDecoration(labelText: 'Bio'), maxLines: 3),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              _repo.updateCurrentUser(
                name: nameCtrl.text.trim(),
                handle: handleCtrl.text.trim(),
                bio: bioCtrl.text.trim(),
                location: locCtrl.text.trim(),
              );
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final user = _repo.currentUser;
        final userPosts = _repo.posts.where((p) => p.authorId == user.id).toList();
        final mediaPosts = userPosts.where((p) => p.imageUrl != null || p.videoUrl != null).toList();
        final likedPosts = _repo.posts.where((p) => p.isLiked).toList();

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(LucideIcons.menu),
              onPressed: widget.onOpenDrawer ?? () => Scaffold.of(context).openDrawer(),
            ),
            title: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(user.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17), overflow: TextOverflow.ellipsis),
                ),
                if (user.isVerified) ...[
                  const SizedBox(width: 4),
                  const Icon(LucideIcons.badge_check, size: 17, color: AppTheme.primaryBrand),
                ],
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(LucideIcons.sparkles, color: AppTheme.primaryBrand),
                tooltip: 'Creator Hub',
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatorHubScreen()));
                },
              ),
              IconButton(
                icon: const Icon(LucideIcons.settings),
                onPressed: () {
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsHubScreen()));
                },
              ),
            ],
          ),
          body: DefaultTabController(
            length: 3,
            child: NestedScrollView(
              headerSliverBuilder: (context, _) {
                return [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              GestureDetector(
                                onTap: _pickAvatar,
                                child: Stack(
                                  children: [
                                    CircleAvatar(
                                      radius: 40,
                                      backgroundImage: user.avatarUrl.startsWith('http')
                                          ? NetworkImage(user.avatarUrl) as ImageProvider
                                          : FileImage(File(user.avatarUrl)),
                                    ),
                                    Positioned(
                                      bottom: 0,
                                      right: 0,
                                      child: Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: const BoxDecoration(
                                          color: AppTheme.primaryBrand,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(LucideIcons.camera, size: 14, color: Colors.white),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 20),
                              Expanded(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  children: [
                                    _buildStatColumn('Posts', userPosts.length.toString()),
                                    _buildStatColumn('Followers', user.followersCount.toString()),
                                    _buildStatColumn('Following', user.followingCount.toString()),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Text(user.name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                              if (user.isVerified) ...[
                                const SizedBox(width: 6),
                                const Icon(LucideIcons.badge_check, size: 18, color: AppTheme.primaryBrand),
                              ],
                            ],
                          ),
                          Text(
                            '@${user.username} · ${user.location}',
                            style: const TextStyle(color: AppTheme.textSecondaryLight, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 8),
                          Text(user.bio, style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.4)),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => _showEditProfileDialog(context, user),
                                  icon: const Icon(LucideIcons.pencil, size: 15),
                                  label: const Text('Edit Profile'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatorHubScreen()));
                                  },
                                  icon: const Icon(LucideIcons.sparkles, size: 15),
                                  label: const Text('Creator Hub'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryBrand,
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          InkWell(
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryBrand.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Bachs: ₦${_repo.walletBalanceNgn.toStringAsFixed(0)} · Credits: ${_repo.walletCredits}',
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppTheme.primaryBrand),
                                  ),
                                  const Text('Open Wallet →', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryBrand)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverPersistentHeader(
                    delegate: _SliverAppBarDelegate(
                      const TabBar(
                        indicatorColor: AppTheme.primaryBrand,
                        labelColor: AppTheme.primaryBrand,
                        unselectedLabelColor: AppTheme.textSecondaryLight,
                        tabs: [
                          Tab(icon: Icon(LucideIcons.grid_3x3)),
                          Tab(icon: Icon(LucideIcons.video)),
                          Tab(icon: Icon(LucideIcons.heart)),
                        ],
                      ),
                    ),
                    pinned: true,
                  ),
                ];
              },
              body: TabBarView(
                children: [
                  _buildPostsList(userPosts, 'No posts yet'),
                  _buildPostsList(mediaPosts, 'No media posts yet'),
                  _buildPostsList(likedPosts, 'No liked posts yet'),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPostsList(List<Post> posts, String emptyMessage) {
    if (posts.isEmpty) {
      return Center(child: Text(emptyMessage, style: const TextStyle(color: AppTheme.textSecondaryLight)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: posts.length,
      separatorBuilder: (_, __) => const Divider(height: 24),
      itemBuilder: (context, index) {
        final p = posts[index];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(p.content, style: Theme.of(context).textTheme.bodyLarge),
            if (p.videoUrl != null) ...[
              const SizedBox(height: 12),
              VideoPostWidget(videoUrl: p.videoUrl!),
            ] else if (p.imageUrl != null) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: p.imageUrl!.startsWith('http')
                    ? Image.network(p.imageUrl!, height: 180, width: double.infinity, fit: BoxFit.cover)
                    : Image.file(File(p.imageUrl!), height: 180, width: double.infinity, fit: BoxFit.cover),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              '${p.createdAt} • ${p.likesCount} Likes • ${p.commentsCount} Comments',
              style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12),
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatColumn(String label, String count) {
    return Column(
      children: [
        Text(count, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12)),
      ],
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
