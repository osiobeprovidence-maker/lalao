import 'package:flutter/material.dart';
import 'dart:io';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../widgets/hamburger_menu.dart';
import '../../widgets/comment_sheet.dart';
import 'explore_screen.dart';
import 'video_feed_screen.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final List<String> _tabs = ['For You', 'Following', 'Nearby', 'Community'];
  String _activeTab = 'For You';
  
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

  Future<void> _handleRefresh() async {
    await Future.delayed(const Duration(seconds: 1));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: _buildAppBar(),
      drawer: const HamburgerMenu(),
      body: RefreshIndicator(
        color: const Color(0xFF5E43F3),
        onRefresh: _handleRefresh,
        child: ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(),
          itemCount: repo.posts.length,
          separatorBuilder: (context, index) => Container(height: 8, color: const Color(0xFFF9FAFB)),
          itemBuilder: (context, index) {
            return _buildPostCard(repo.posts[index]);
          },
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      leading: Builder(
        builder: (context) => IconButton(
          icon: const Icon(LucideIcons.menu, color: Colors.black87),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      title: const Text('lalao', style: TextStyle(color: Color(0xFF5E43F3), fontFamily: 'Inter', fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: -0.5)),
      actions: [
        IconButton(
          icon: const Icon(LucideIcons.search, color: Colors.black87),
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const ExploreScreen()));
          },
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(48),
        child: Container(
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6), width: 1))),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: _tabs.map((tab) {
                final isActive = _activeTab == tab;
                return Padding(
                  padding: const EdgeInsets.only(right: 24.0),
                  child: GestureDetector(
                    onTap: () => setState(() => _activeTab = tab),
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.only(bottom: 14, top: 4),
                      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: isActive ? const Color(0xFF5E43F3) : Colors.transparent, width: 3))),
                      child: Text(tab, style: TextStyle(fontWeight: isActive ? FontWeight.bold : FontWeight.w600, color: isActive ? Colors.black87 : const Color(0xFF6B7280), fontSize: 15)),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPostCard(Post post) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 20, backgroundColor: Colors.grey[200],
                backgroundImage: post.author.avatarUrl.isNotEmpty ? NetworkImage(post.author.avatarUrl) : null,
                child: post.author.avatarUrl.isEmpty ? const Icon(LucideIcons.user, color: Colors.grey) : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(post.author.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87), maxLines: 1, overflow: TextOverflow.ellipsis),
                        if (post.author.isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.verified, color: Colors.blue, size: 14),
                        ],
                        const SizedBox(width: 6),
                        Flexible(child: Text('@${post.author.username}', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(post.date, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
                        if (post.location != null) ...[
                          const Padding(padding: EdgeInsets.symmetric(horizontal: 4), child: Text('·', style: TextStyle(color: Color(0xFF9CA3AF)))),
                          const Icon(LucideIcons.map_pin, size: 12, color: Color(0xFF9CA3AF)),
                          const SizedBox(width: 2),
                          Text(post.location!, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
                        ]
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(icon: const Icon(Icons.more_horiz, color: Color(0xFF6B7280)), onPressed: () {}, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
            ],
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.only(left: 52),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(post.content, style: const TextStyle(fontSize: 15, height: 1.5, color: Colors.black87)),
                if (post.localImagePath != null) ...[ const SizedBox(height: 12), ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.file(File(post.localImagePath!), fit: BoxFit.cover)) ], if (post.videoUrl != null) ...[
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () {
                      final videoIndex = repo.videoPosts.indexOf(post);
                      Navigator.push(context, MaterialPageRoute(builder: (context) => VideoFeedScreen(initialIndex: videoIndex >= 0 ? videoIndex : 0)));
                    },
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          height: 200,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black45,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.play, color: Colors.white, size: 32),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildActionItem(icon: post.isLiked ? LucideIcons.heart : LucideIcons.heart, isSolid: post.isLiked, count: _formatCount(post.likes), color: post.isLiked ? const Color(0xFF5E43F3) : const Color(0xFF6B7280), onTap: () => repo.toggleLike(post.id)),
                    _buildActionItem(icon: LucideIcons.message_square, count: _formatCount(post.commentsCount), color: const Color(0xFF6B7280), onTap: () => showComments(context, post)),
                    _buildActionItem(icon: LucideIcons.repeat, count: _formatCount(post.reposts), color: post.isReposted ? Colors.green : const Color(0xFF6B7280), onTap: () => repo.toggleRepost(post.id)),
                    _buildActionItem(icon: LucideIcons.share, count: '', color: const Color(0xFF6B7280), onTap: () => Share.share('Check out this post on Lalao! https://lalao.com/post/')),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem({required IconData icon, bool isSolid = false, required String count, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
        child: Row(
          children: [
            Icon(icon, size: 20, color: color),
            if (count.isNotEmpty) ...[
              const SizedBox(width: 6),
              Text(count, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w500)),
            ]
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count == 0) return '';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return count.toString();
  }
}



