import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:share_plus/share_plus.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';
import '../../widgets/video_post_widget.dart';
import '../../widgets/cycle_story_tray.dart';
import 'post_detail_screen.dart';
import 'user_profile_screen.dart';
import 'wallet_screen.dart';
import 'pages_screen.dart';
import 'events_tickets_screen.dart';
import 'create_post_screen.dart';

class FeedScreen extends StatefulWidget {
  final VoidCallback? onOpenDrawer;

  const FeedScreen({super.key, this.onOpenDrawer});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> with SingleTickerProviderStateMixin {
  final _repo = MockRepository();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showLocationRadiusSheet() {
    final cities = ['Udu', 'Warri', 'Effurun', 'Asaba', 'Lagos', 'Abuja'];
    final radii = [2, 5, 10, 25, 50];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Hyper-Local Radius Filter', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              const Text('See posts, Rallies, and events happening around your area.', style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight)),
              const SizedBox(height: 14),
              const Text('Select City / Hub', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: cities.map((c) {
                  final sel = _repo.selectedLocation == c;
                  return ChoiceChip(
                    label: Text(c),
                    selected: sel,
                    selectedColor: AppTheme.primaryBrand.withOpacity(0.2),
                    onSelected: (_) {
                      _repo.setLocationConfig(c, _repo.selectedRadiusKm);
                      setModalState(() {});
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              const Text('Radius Distance (km)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: radii.map((r) {
                  final sel = _repo.selectedRadiusKm == r;
                  return ChoiceChip(
                    label: Text('$r km'),
                    selected: sel,
                    selectedColor: AppTheme.primaryBrand.withOpacity(0.2),
                    onSelected: (_) {
                      _repo.setLocationConfig(_repo.selectedLocation, r);
                      setModalState(() {});
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryBrand, foregroundColor: Colors.white),
                  child: const Text('Apply Filter'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showGiftDialog(BuildContext context, User author) {
    final gifts = [
      {'name': 'Spark', 'icon': '✨', 'cost': 10},
      {'name': 'Fire', 'icon': '🔥', 'cost': 50},
      {'name': 'Crown', 'icon': '👑', 'cost': 200},
      {'name': 'Rocket', 'icon': '🚀', 'cost': 500},
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Tip ${author.name}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                Chip(
                  avatar: const Icon(LucideIcons.coins, size: 16, color: Colors.amber),
                  label: Text('${_repo.walletCredits} Cr', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.8,
              ),
              itemCount: gifts.length,
              itemBuilder: (context, index) {
                final g = gifts[index];
                return InkWell(
                  onTap: () {
                    Navigator.pop(ctx);
                    final success = _repo.sendGift(g['cost'] as int, author.name, g['name'] as String);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(success
                            ? 'Sent ${g['name']} ${g['icon']} to ${author.name}!'
                            : 'Insufficient Credits! Top up in Wallet.'),
                        backgroundColor: success ? AppTheme.successColor : AppTheme.errorColor,
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Theme.of(context).dividerColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(g['icon'] as String, style: const TextStyle(fontSize: 28)),
                        const SizedBox(height: 6),
                        Text(g['name'] as String, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        Text('${g['cost']} Cr', style: const TextStyle(fontSize: 10, color: Colors.amber, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final allPosts = _repo.posts;
        final followingPosts = allPosts.where((p) {
          final author = _repo.getAuthor(p.authorId);
          return author.isFollowing || author.id == _repo.currentUser.id;
        }).toList();

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(LucideIcons.menu),
              onPressed: widget.onOpenDrawer ?? () => Scaffold.of(context).openDrawer(),
            ),
            title: Row(
              children: [
                const Text('Lalao', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 21, letterSpacing: -0.5)),
                const SizedBox(width: 10),
                InkWell(
                  onTap: _showLocationRadiusSheet,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryBrand.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.map_pin, size: 12, color: AppTheme.primaryBrand),
                        const SizedBox(width: 4),
                        Text(
                          '${_repo.selectedLocation} · ${_repo.selectedRadiusKm}km',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.primaryBrand),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            actions: [
              InkWell(
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.wallet, size: 14, color: AppTheme.successColor),
                      const SizedBox(width: 5),
                      Text(
                        '₦${_repo.walletBalanceNgn.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.successColor),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: AppTheme.primaryBrand,
              labelColor: AppTheme.primaryBrand,
              isScrollable: true,
              labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
              tabs: [
                const Tab(text: 'For You'),
                const Tab(text: 'Following'),
                Tab(text: 'Rallies (${_repo.rallies.length})'),
                const Tab(text: 'Directory'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildFeedList(allPosts, showCycleAndRallies: true),
              _buildFeedList(followingPosts, showCycleAndRallies: false),
              _buildRalliesTab(),
              _buildDirectoryTab(),
            ],
          ),
          floatingActionButton: FloatingActionButton(
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostScreen()));
            },
            backgroundColor: AppTheme.primaryBrand,
            child: const Icon(LucideIcons.plus, color: Colors.white),
          ),
        );
      },
    );
  }

  Widget _buildFeedList(List<Post> posts, {required bool showCycleAndRallies}) {
    return ListView(
      children: [
        if (showCycleAndRallies) ...[
          const CycleStoryTray(),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(LucideIcons.flame, size: 18, color: Colors.orange),
                    SizedBox(width: 6),
                    Text('Live Rallies Near You', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                  ],
                ),
                TextButton(
                  onPressed: () => _tabController.animateTo(2),
                  child: const Text('See All', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 128,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _repo.rallies.length,
              itemBuilder: (context, idx) {
                final r = _repo.rallies[idx];
                return Container(
                  width: 250,
                  margin: const EdgeInsets.only(right: 12, bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.orange.withOpacity(0.4)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              r.category.toUpperCase(),
                              style: const TextStyle(color: Colors.orange, fontSize: 9, fontWeight: FontWeight.w900),
                            ),
                          ),
                          const Spacer(),
                          Text('${r.participantsCount}/${r.maxParticipants} joined', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(r.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                      Text('${r.location} · ${r.startsAt}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight)),
                      const Spacer(),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => _repo.toggleJoinRally(r.id),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: r.isJoined ? Colors.grey.shade300 : Colors.orange,
                            foregroundColor: r.isJoined ? Colors.black87 : Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            minimumSize: Size.zero,
                          ),
                          child: Text(r.isJoined ? 'Joined ✓' : 'Join Rally', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),
        ],
        ...posts.map((post) {
          final author = _repo.getAuthor(post.authorId);
          return _buildPostCard(context, post, author);
        }),
      ],
    );
  }

  Widget _buildRalliesTab() {
    final rallies = _repo.rallies;
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: rallies.length,
      itemBuilder: (context, idx) {
        final r = rallies[idx];
        final author = _repo.getAuthor(r.authorId);
        return Card(
          margin: const EdgeInsets.only(bottom: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(radius: 18, backgroundImage: NetworkImage(author.avatarUrl)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(author.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text('Hosting in ${r.location} · ${r.startsAt}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight)),
                        ],
                      ),
                    ),
                    Chip(
                      label: Text(r.category, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(r.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(r.description, style: const TextStyle(fontSize: 13, height: 1.4)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${r.participantsCount} / ${r.maxParticipants} Participants', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryBrand)),
                    ElevatedButton.icon(
                      onPressed: () => _repo.toggleJoinRally(r.id),
                      icon: Icon(r.isJoined ? LucideIcons.check : LucideIcons.users, size: 16),
                      label: Text(r.isJoined ? 'Joined Rally' : 'Join Rally'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: r.isJoined ? Colors.grey.shade200 : AppTheme.primaryBrand,
                        foregroundColor: r.isJoined ? Colors.black87 : Colors.white,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDirectoryTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Verified Pages & Local Orgs', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 10),
        ..._repo.pages.map((p) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: CircleAvatar(backgroundImage: NetworkImage(p.avatarUrl)),
                title: Row(
                  children: [
                    Flexible(child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold))),
                    if (p.isVerified) ...[
                      const SizedBox(width: 4),
                      const Icon(LucideIcons.badge_check, size: 15, color: AppTheme.primaryBrand),
                    ],
                  ],
                ),
                subtitle: Text('${p.category} · ${p.location}'),
                trailing: const Icon(LucideIcons.chevron_right),
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => PageDetailScreen(pageId: p.id)));
                },
              ),
            )),
        const SizedBox(height: 16),
        const Text('Upcoming Local Events', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 10),
        ..._repo.events.map((ev) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: const Icon(LucideIcons.calendar, color: AppTheme.primaryBrand),
                title: Text(ev.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${ev.date} · ${ev.location}'),
                trailing: Text(ev.isFree ? 'FREE' : '₦${ev.price.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryBrand)),
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailScreen(event: ev)));
                },
              ),
            )),
      ],
    );
  }

  Widget _buildPostCard(BuildContext context, Post post, User author) {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => PostDetailScreen(post: post)));
      },
      child: Container(
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Theme.of(context).dividerColor, width: 1)),
        ),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                GestureDetector(
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => UserProfileScreen(user: author))),
                  child: CircleAvatar(
                    radius: 20,
                    backgroundImage: NetworkImage(author.avatarUrl),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => UserProfileScreen(user: author))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                author.name,
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (author.isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(LucideIcons.badge_check, size: 15, color: AppTheme.primaryBrand),
                            ],
                          ],
                        ),
                        Text(
                          '@${author.username} · ${post.location ?? 'Udu'} · ${post.createdAt}',
                          style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
                if (post.isSponsored)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('SPONSORED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.amber)),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(post.content, style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.4)),
            if (post.soundTitle != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBrand.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.music, size: 12, color: AppTheme.primaryBrand),
                    const SizedBox(width: 6),
                    Text(post.soundTitle!, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryBrand)),
                  ],
                ),
              ),
            ],
            if (post.poll != null) ...[
              const SizedBox(height: 12),
              _buildPollWidget(post),
            ],
            if (post.videoUrl != null) ...[
              const SizedBox(height: 12),
              VideoPostWidget(videoUrl: post.videoUrl!),
            ] else if (post.imageUrl != null) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: post.imageUrl!.startsWith('http')
                    ? Image.network(
                        post.imageUrl!,
                        width: double.infinity,
                        height: 220,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(height: 180, color: Colors.grey.shade200),
                      )
                    : Image.file(
                        File(post.imageUrl!),
                        width: double.infinity,
                        height: 220,
                        fit: BoxFit.cover,
                      ),
              ),
            ],
            if (post.isSponsored && post.sponsorCta != null) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const MyPagesScreen()));
                  },
                  icon: const Icon(LucideIcons.external_link, size: 15),
                  label: Text(post.sponsorCta!),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBrand,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildInteractionButton(
                  icon: post.isLiked ? Icons.favorite : LucideIcons.heart,
                  label: post.likesCount.toString(),
                  color: post.isLiked ? AppTheme.accentBrand : AppTheme.textSecondaryLight,
                  onTap: () => _repo.toggleLike(post.id),
                ),
                _buildInteractionButton(
                  icon: LucideIcons.message_circle,
                  label: post.commentsCount.toString(),
                  color: AppTheme.textSecondaryLight,
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => PostDetailScreen(post: post)));
                  },
                ),
                _buildInteractionButton(
                  icon: LucideIcons.gift,
                  label: 'Tip',
                  color: AppTheme.textSecondaryLight,
                  onTap: () => _showGiftDialog(context, author),
                ),
                _buildInteractionButton(
                  icon: post.isSaved ? Icons.bookmark : LucideIcons.bookmark,
                  label: post.isSaved ? 'Saved' : 'Save',
                  color: post.isSaved ? AppTheme.primaryBrand : AppTheme.textSecondaryLight,
                  onTap: () => _repo.toggleSave(post.id),
                ),
                _buildInteractionButton(
                  icon: LucideIcons.share_2,
                  label: '',
                  color: AppTheme.textSecondaryLight,
                  onTap: () {
                    Share.share('${author.name} (@${author.username}) on Lalao: "${post.content}"');
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPollWidget(Post post) {
    final poll = post.poll!;
    final totalVotes = poll.totalVotes == 0 ? 1 : poll.totalVotes;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...List.generate(poll.options.length, (i) {
            final votes = poll.votes[i];
            final pct = ((votes / totalVotes) * 100).round();
            final isSelected = poll.selectedIndex == i;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () => _repo.votePoll(post.id, i),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primaryBrand.withOpacity(0.15) : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? AppTheme.primaryBrand : Theme.of(context).dividerColor,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          poll.options[i],
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Text('$pct% ($votes)', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            );
          }),
          Text('${poll.totalVotes} total votes · Tap an option to vote', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight)),
        ],
      ),
    );
  }

  Widget _buildInteractionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
