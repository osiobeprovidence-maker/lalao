import 'package:flutter/material.dart';
import '../../data/mock_repository.dart';
import 'feed_screen.dart'; // To reuse FeedScreen components if needed, though we will build local post card for now

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  final repo = MockRepository();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    repo.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    repo.removeListener(() {});
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = repo.currentUser;
    final userPosts = repo.getUserPosts(user.id);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text('Profile', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 20)),
        actions: [
          IconButton(icon: const Icon(Icons.favorite_border, color: Colors.black87), onPressed: () {}),
          IconButton(icon: const Icon(Icons.ios_share, color: Colors.black87), onPressed: () {}),
          IconButton(icon: const Icon(Icons.settings_outlined, color: Colors.black87), onPressed: () {}),
          const SizedBox(width: 8),
        ],
      ),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile Info
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: Colors.grey[200],
                            backgroundImage: user.avatarUrl.isNotEmpty ? NetworkImage(user.avatarUrl) : null,
                            child: user.avatarUrl.isEmpty ? const Icon(Icons.person, size: 40, color: Colors.grey) : null,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Colors.black87)),
                                const SizedBox(height: 2),
                                Text('@', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 15)),
                                const SizedBox(height: 12),
                                Text(user.bio, style: const TextStyle(fontSize: 15, color: Colors.black87, height: 1.4)),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFF6B7280)),
                                    const SizedBox(width: 4),
                                    Text(user.location, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 14)),
                                    const SizedBox(width: 16),
                                    const Icon(Icons.calendar_today_outlined, size: 16, color: Color(0xFF6B7280)),
                                    const SizedBox(width: 4),
                                    Text('Joined ', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 14)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Stats
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                      child: Row(
                        children: [
                          _buildStatColumn(user.followers.toString(), 'Followers'),
                          const SizedBox(width: 24),
                          _buildStatColumn(user.following.toString(), 'Following'),
                          const SizedBox(width: 24),
                          _buildStatColumn(user.totalLikes.toString(), 'Likes'),
                        ],
                      ),
                    ),

                    // Action Buttons
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {},
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.black87,
                                side: const BorderSide(color: Color(0xFFE5E7EB)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              child: const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {},
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.black87,
                                side: const BorderSide(color: Color(0xFFE5E7EB)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              child: const Text('Share Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverAppBarDelegate(
                TabBar(
                  controller: _tabController,
                  indicatorColor: const Color(0xFF5E43F3),
                  indicatorWeight: 3,
                  labelColor: Colors.black87,
                  unselectedLabelColor: const Color(0xFF6B7280),
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 15),
                  tabs: const [
                    Tab(text: 'Posts'),
                    Tab(text: 'Replies'),
                    Tab(text: 'Media'),
                    Tab(text: 'Reposts'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            // Posts Tab
            userPosts.isEmpty
              ? _buildEmptyState('No posts yet')
              : ListView.separated(
                  padding: EdgeInsets.zero,
                  itemCount: userPosts.length,
                  separatorBuilder: (context, index) => Container(height: 8, color: const Color(0xFFF9FAFB)),
                  itemBuilder: (context, index) => _buildProfilePostCard(userPosts[index]),
                ),
            // Replies Tab
            _buildEmptyState('No replies yet'),
            // Media Tab
            _buildEmptyState('No media yet'),
            // Reposts Tab
            _buildEmptyState('No reposts yet'),
          ],
        ),
      ),
    );
  }

  Widget _buildStatColumn(String count, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(count, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87)),
        Text(label, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 14)),
      ],
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.feed_outlined, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  // Duplicate the post card from FeedScreen specifically for profile
  Widget _buildProfilePostCard(Post post) {
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
                radius: 20,
                backgroundColor: Colors.grey[200],
                backgroundImage: post.author.avatarUrl.isNotEmpty ? NetworkImage(post.author.avatarUrl) : null,
                child: post.author.avatarUrl.isEmpty ? const Icon(Icons.person, color: Colors.grey) : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(post.author.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(width: 6),
                        Flexible(child: Text('@', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(post.date, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
                        if (post.location != null) ...[
                          const Padding(padding: EdgeInsets.symmetric(horizontal: 4), child: Text('·', style: TextStyle(color: Color(0xFF9CA3AF)))),
                          const Icon(Icons.location_on, size: 12, color: Color(0xFF9CA3AF)),
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
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildActionItem(icon: post.isLiked ? Icons.favorite : Icons.favorite_border, count: _formatCount(post.likes), color: post.isLiked ? const Color(0xFF5E43F3) : const Color(0xFF6B7280), onTap: () => repo.toggleLike(post.id)),
                    _buildActionItem(icon: Icons.chat_bubble_outline, count: _formatCount(post.commentsCount), color: const Color(0xFF6B7280), onTap: () {}),
                    _buildActionItem(icon: Icons.repeat, count: _formatCount(post.reposts), color: post.isReposted ? Colors.green : const Color(0xFF6B7280), onTap: () => repo.toggleRepost(post.id)),
                    _buildActionItem(icon: Icons.share_outlined, count: '', color: const Color(0xFF6B7280), onTap: () {}),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem({required IconData icon, required String count, required Color color, required VoidCallback onTap}) {
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
    if (count >= 1000) return 'k';
    return count.toString();
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
      color: Colors.white,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}

