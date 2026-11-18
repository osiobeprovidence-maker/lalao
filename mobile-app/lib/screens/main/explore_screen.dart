import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';
import 'user_profile_screen.dart';
import 'chatroom_screen.dart';
import 'pages_screen.dart';
import 'events_tickets_screen.dart';
import 'shop_orders_screen.dart';
import 'plum_screen.dart';

class ExploreScreen extends StatefulWidget {
  final VoidCallback? onOpenDrawer;

  const ExploreScreen({super.key, this.onOpenDrawer});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> with SingleTickerProviderStateMixin {
  final _repo = MockRepository();
  final _searchCtrl = TextEditingController();
  late TabController _tabController;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(LucideIcons.menu),
              onPressed: widget.onOpenDrawer ?? () => Scaffold.of(context).openDrawer(),
            ),
            title: TextField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
              decoration: InputDecoration(
                hintText: 'Search creators, shops, events, rooms...',
                prefixIcon: const Icon(LucideIcons.search, size: 18),
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: AppTheme.primaryBrand,
              indicatorColor: AppTheme.primaryBrand,
              labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
              tabs: const [
                Tab(text: 'Ranking'),
                Tab(text: 'Live Rooms'),
                Tab(text: 'Pages'),
                Tab(text: 'Shop'),
                Tab(text: 'Events'),
                Tab(text: 'People'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildRankingAndEcosystemTab(),
              _buildChatroomsTab(),
              _buildPagesTab(),
              _buildShopTab(),
              _buildEventsTab(),
              _buildPeopleTab(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRankingAndEcosystemTab() {
    final creators = [..._repo.users]..sort((a, b) => b.followersCount.compareTo(a.followersCount));
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: _buildFeatureCard(
                title: 'Plum 18+',
                subtitle: 'Local Dating & Radar',
                icon: LucideIcons.flame,
                color: Colors.pinkAccent,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PlumScreen())),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildFeatureCard(
                title: 'Roomy & Q',
                subtitle: 'Housing & Shared Subs',
                icon: LucideIcons.building_2,
                color: AppTheme.primaryBrand,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyPagesScreen())),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        const Text('Top Creators & Community Leaders', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
        const SizedBox(height: 10),
        ...List.generate(creators.length, (idx) {
          final u = creators[idx];
          if (_query.isNotEmpty && !u.name.toLowerCase().contains(_query) && !u.username.toLowerCase().contains(_query)) {
            return const SizedBox.shrink();
          }
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => UserProfileScreen(user: u))),
              leading: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 24,
                    child: Text(
                      '#${idx + 1}',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        color: idx < 3 ? Colors.amber.shade800 : AppTheme.textSecondaryLight,
                      ),
                    ),
                  ),
                  CircleAvatar(backgroundImage: NetworkImage(u.avatarUrl)),
                ],
              ),
              title: Row(
                children: [
                  Flexible(child: Text(u.name, style: const TextStyle(fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis)),
                  if (u.isVerified) ...[
                    const SizedBox(width: 4),
                    const Icon(LucideIcons.badge_check, size: 15, color: AppTheme.primaryBrand),
                  ],
                ],
              ),
              subtitle: Text('@${u.username} · ${u.followersCount} followers'),
              trailing: u.id == _repo.currentUser.id
                  ? const Chip(label: Text('YOU', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)))
                  : ElevatedButton(
                      onPressed: () => _repo.toggleFollowUser(u.id),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: u.isFollowing ? Colors.grey.shade200 : AppTheme.primaryBrand,
                        foregroundColor: u.isFollowing ? Colors.black87 : Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                      child: Text(u.isFollowing ? 'Following' : 'Follow', style: const TextStyle(fontSize: 12)),
                    ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildFeatureCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withOpacity(0.35)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: color)),
            Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight)),
          ],
        ),
      ),
    );
  }

  Widget _buildChatroomsTab() {
    final rooms = _repo.chatrooms.where((r) => _query.isEmpty || r.name.toLowerCase().contains(_query)).toList();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: rooms.length,
      itemBuilder: (context, idx) {
        final room = rooms[idx];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(14),
            leading: CircleAvatar(radius: 26, backgroundImage: NetworkImage(room.imageUrl)),
            title: Row(
              children: [
                Flexible(child: Text(room.name, style: const TextStyle(fontWeight: FontWeight.w800))),
                if (room.isLive) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(6)),
                    child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
            subtitle: Text('${room.topic}\n${room.activeUsersCount} active listeners'),
            isThreeLine: true,
            trailing: ElevatedButton(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => ChatroomScreen(chatroom: room)));
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryBrand, foregroundColor: Colors.white),
              child: const Text('Join'),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPagesTab() {
    final pages = _repo.pages.where((p) => _query.isEmpty || p.name.toLowerCase().contains(_query)).toList();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: pages.length,
      itemBuilder: (context, idx) {
        final p = pages[idx];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            leading: CircleAvatar(radius: 24, backgroundImage: NetworkImage(p.avatarUrl)),
            title: Row(
              children: [
                Flexible(child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold))),
                if (p.isVerified) ...[
                  const SizedBox(width: 4),
                  const Icon(LucideIcons.badge_check, size: 15, color: AppTheme.primaryBrand),
                ],
              ],
            ),
            subtitle: Text('${p.category} · ${p.followersCount} followers'),
            trailing: OutlinedButton(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => PageDetailScreen(pageId: p.id)));
              },
              child: const Text('Open'),
            ),
          ),
        );
      },
    );
  }

  Widget _buildShopTab() {
    final products = _repo.products.where((p) => _query.isEmpty || p.name.toLowerCase().contains(_query)).toList();
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemCount: products.length,
      itemBuilder: (context, idx) {
        final pr = products[idx];
        return InkWell(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: pr))),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Image.network(pr.imageUrl, width: double.infinity, fit: BoxFit.cover),
                ),
                Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(pr.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text('₦${pr.price.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.primaryBrand, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEventsTab() {
    final events = _repo.events.where((e) => _query.isEmpty || e.title.toLowerCase().contains(_query)).toList();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (context, idx) {
        final ev = events[idx];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(ev.coverUrl, width: 56, height: 56, fit: BoxFit.cover),
            ),
            title: Text(ev.title, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('${ev.date} · ${ev.location}'),
            trailing: Text(ev.isFree ? 'FREE' : '₦${ev.price.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.primaryBrand)),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailScreen(event: ev))),
          ),
        );
      },
    );
  }

  Widget _buildPeopleTab() {
    final users = _repo.users.where((u) => _query.isEmpty || u.name.toLowerCase().contains(_query) || u.username.toLowerCase().contains(_query)).toList();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: users.length,
      itemBuilder: (context, idx) {
        final u = users[idx];
        return ListTile(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => UserProfileScreen(user: u))),
          leading: CircleAvatar(backgroundImage: NetworkImage(u.avatarUrl)),
          title: Row(
            children: [
              Text(u.name, style: const TextStyle(fontWeight: FontWeight.bold)),
              if (u.isVerified) ...[
                const SizedBox(width: 4),
                const Icon(LucideIcons.badge_check, size: 15, color: AppTheme.primaryBrand),
              ],
            ],
          ),
          subtitle: Text('@${u.username} · ${u.location}'),
          trailing: u.id == _repo.currentUser.id
              ? null
              : OutlinedButton(
                  onPressed: () => _repo.toggleFollowUser(u.id),
                  child: Text(u.isFollowing ? 'Following' : 'Follow'),
                ),
        );
      },
    );
  }
}
