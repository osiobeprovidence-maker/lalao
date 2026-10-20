import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final repo = MockRepository();
  String _activeFilter = 'All';
  final List<String> _filters = ['All', 'People', 'Pages', 'Video', 'Trending'];

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: const BackButton(color: Colors.black87),
        title: Row(
          children: [
            Expanded(
              child: Container(
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(20)),
                child: const Row(
                  children: [
                    Icon(LucideIcons.search, color: Color(0xFF9CA3AF), size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(hintText: 'Search people, content, ...', hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14), border: InputBorder.none, isDense: true),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Location filter', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 10, fontWeight: FontWeight.bold)),
                Row(
                  children: const [
                    Text('≤ 50 km', style: TextStyle(color: Colors.black87, fontSize: 13, fontWeight: FontWeight.bold)),
                    Icon(LucideIcons.chevron_down, size: 14, color: Colors.black87),
                  ],
                )
              ],
            )
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6), width: 1))),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: _filters.map((filter) {
                  final isActive = _activeFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 24.0),
                    child: GestureDetector(
                      onTap: () => setState(() => _activeFilter = filter),
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        padding: const EdgeInsets.only(bottom: 14, top: 4),
                        decoration: BoxDecoration(
                          border: Border(bottom: BorderSide(color: isActive ? const Color(0xFF5E43F3) : Colors.transparent, width: 3)),
                        ),
                        child: Text(
                          filter,
                          style: TextStyle(fontWeight: isActive ? FontWeight.bold : FontWeight.w600, color: isActive ? Colors.black87 : const Color(0xFF6B7280), fontSize: 15),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Roomy Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: const Color(0xFF5E43F3), borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('Roomy', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      SizedBox(height: 4),
                      Text('Find rooms, roommates, and housing around you.', style: TextStyle(color: Colors.white70, fontSize: 14)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                  child: const Icon(LucideIcons.chevron_right, color: Colors.white),
                )
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          Row(
            children: [
              const Text('People Near You', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(12)),
                child: Text('${repo.nearbyUsers.length}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...repo.nearbyUsers.map((user) => _buildPeopleCard(user)).toList(),
        ],
      ),
    );
  }

  Widget _buildPeopleCard(User user) {
    return Card(
      color: Colors.white,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Stack(
          clipBehavior: Clip.none,
          children: [
            CircleAvatar(radius: 24, backgroundColor: Colors.grey[200], child: const Icon(LucideIcons.user, color: Colors.grey)),
            if (user.isOnline)
              Positioned(bottom: 0, right: 0, child: Container(width: 12, height: 12, decoration: BoxDecoration(color: Colors.green, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)))),
          ],
        ),
        title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('@${user.username}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
            if (user.distance != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(LucideIcons.map_pin, size: 12, color: Color(0xFF5E43F3)),
                  const SizedBox(width: 4),
                  Text(user.distance!, style: const TextStyle(color: Color(0xFF5E43F3), fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              )
            ]
          ],
        ),
        trailing: OutlinedButton(
          onPressed: () => repo.toggleFollow(user.id),
          style: OutlinedButton.styleFrom(
            backgroundColor: user.isFollowing ? Colors.white : const Color(0xFF5E43F3),
            foregroundColor: user.isFollowing ? Colors.black87 : Colors.white,
            side: BorderSide(color: user.isFollowing ? Colors.grey.shade300 : Colors.transparent),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          ),
          child: Text(user.isFollowing ? 'Following' : 'Follow'),
        ),
      ),
    );
  }
}
