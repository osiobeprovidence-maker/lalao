import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';

class PlumScreen extends StatefulWidget {
  const PlumScreen({super.key});

  @override
  State<PlumScreen> createState() => _PlumScreenState();
}

class _PlumScreenState extends State<PlumScreen> with SingleTickerProviderStateMixin {
  final _repo = MockRepository();
  late TabController _tabController;
  final _bioCtrl = TextEditingController(text: 'Creative mind in Udu. Love Afrobeats, beach hangouts & late night drives.');
  String _lookingFor = 'Serious Relationship & Vibe';

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

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        if (!_repo.plumAgeVerified) {
          return _buildAgeGate();
        }
        return Scaffold(
          appBar: AppBar(
            title: const Row(
              children: [
                Icon(LucideIcons.flame, color: Colors.pinkAccent, size: 22),
                SizedBox(width: 8),
                Text('Plum 18+ Dating & Vibe', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
              ],
            ),
            bottom: TabBar(
              controller: _tabController,
              labelColor: Colors.pinkAccent,
              indicatorColor: Colors.pinkAccent,
              tabs: const [
                Tab(text: 'Members'),
                Tab(text: 'Map Radar'),
                Tab(text: 'My Plum'),
                Tab(text: 'About'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildMembersTab(),
              _buildMapTab(),
              _buildProfileTab(),
              _buildAboutTab(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAgeGate() {
    return Scaffold(
      appBar: AppBar(title: const Text('Plum 18+ Verification')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.pinkAccent.withOpacity(0.4), width: 1.5),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.pinkAccent.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.flame, color: Colors.pinkAccent, size: 48),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Plum 18+ Community',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Plum is an exclusive 18+ dating, matchmaking, and local connections space inside Lalao. Please confirm you are at least 18 years old to enter.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondaryLight, height: 1.5),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      _repo.verifyPlumAge();
                    },
                    icon: const Icon(LucideIcons.shield_check),
                    label: const Text('I am 18 or older — Enter Plum', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.pinkAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Go Back'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMembersTab() {
    final members = _repo.plumMembers;
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 0.68,
      ),
      itemCount: members.length,
      itemBuilder: (context, idx) {
        final m = members[idx];
        return GestureDetector(
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => PlumMemberDetailScreen(member: m)));
          },
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              image: DecorationImage(
                image: NetworkImage(m.avatarUrl),
                fit: BoxFit.cover,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              children: [
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.transparent, Colors.black87],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
                if (m.isOnline)
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.successColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('ONLINE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                    ),
                  ),
                Positioned(
                  bottom: 12,
                  left: 12,
                  right: 12,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${m.name}, ${m.age}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                      ),
                      Text(
                        '${m.location} · ${m.distanceKm}km',
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () => _repo.togglePlumLike(m.id),
                          icon: Icon(
                            m.isLiked ? LucideIcons.heart : LucideIcons.sparkles,
                            size: 14,
                          ),
                          label: Text(m.isLiked ? 'Matched ♥' : 'Send Spark', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: m.isLiked ? Colors.pinkAccent : Colors.white24,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            minimumSize: Size.zero,
                          ),
                        ),
                      ),
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

  Widget _buildMapTab() {
    final members = _repo.plumMembers;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          height: 220,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.pinkAccent.withOpacity(0.15), AppTheme.primaryBrand.withOpacity(0.15)],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.pinkAccent.withOpacity(0.3)),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.pinkAccent.withOpacity(0.3), width: 1.5),
                ),
              ),
              Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.pinkAccent.withOpacity(0.5), width: 1.5),
                ),
              ),
              const CircleAvatar(
                radius: 22,
                backgroundColor: Colors.pinkAccent,
                child: Icon(LucideIcons.radar, color: Colors.white),
              ),
              const Positioned(
                bottom: 12,
                child: Text('Scanning Udu & Warri (5km radius)...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const Text('Nearby Singles on Radar', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 8),
        ...members.map((m) => ListTile(
              leading: CircleAvatar(backgroundImage: NetworkImage(m.avatarUrl)),
              title: Text('${m.name}, ${m.age}', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${m.location} · ${m.distanceKm} km away'),
              trailing: OutlinedButton(
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => PlumMemberDetailScreen(member: m)));
                },
                child: const Text('View'),
              ),
            )),
      ],
    );
  }

  Widget _buildProfileTab() {
    final user = _repo.currentUser;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(radius: 30, backgroundImage: NetworkImage(user.avatarUrl)),
          title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
          subtitle: Text(_repo.plumProfileCreated ? 'Plum Profile Active' : 'Draft Plum Profile'),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _lookingFor,
          decoration: const InputDecoration(labelText: 'What are you looking for?'),
          items: const [
            DropdownMenuItem(value: 'Serious Relationship & Vibe', child: Text('Serious Relationship & Vibe')),
            DropdownMenuItem(value: 'Casual Dating & Hangouts', child: Text('Casual Dating & Hangouts')),
            DropdownMenuItem(value: 'New Friends in My Area', child: Text('New Friends in My Area')),
          ],
          onChanged: (v) => setState(() => _lookingFor = v!),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _bioCtrl,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Plum Bio & Prompt'),
        ),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          onPressed: () {
            _repo.createPlumProfile();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Plum Dating Profile Updated!'), backgroundColor: Colors.pinkAccent),
            );
          },
          icon: const Icon(LucideIcons.heart_handshake),
          label: const Text('Save Plum Profile', style: TextStyle(fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.pinkAccent,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 15),
          ),
        ),
      ],
    );
  }

  Widget _buildAboutTab() {
    return ListView(
      padding: const EdgeInsets.all(18),
      children: const [
        Text('About Plum 18+', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        SizedBox(height: 10),
        Text(
          'Plum is Lalao’s hyper-local matchmaking experience designed for authentic connections across Udu, Warri, Effurun, and beyond. All members are age-verified and protected by community safety guidelines.',
          style: TextStyle(height: 1.5),
        ),
      ],
    );
  }
}

class PlumMemberDetailScreen extends StatelessWidget {
  final PlumMember member;
  const PlumMemberDetailScreen({super.key, required this.member});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(title: Text('${member.name}, ${member.age}')),
          body: ListView(
            children: [
              SizedBox(
                height: 320,
                width: double.infinity,
                child: Image.network(member.avatarUrl, fit: BoxFit.cover),
              ),
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('${member.name}, ${member.age}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.pinkAccent.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${member.distanceKm} km away',
                            style: const TextStyle(color: Colors.pinkAccent, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('${member.location} · Looking for: ${member.lookingFor}', style: const TextStyle(color: AppTheme.textSecondaryLight)),
                    const SizedBox(height: 14),
                    Text(member.bio, style: const TextStyle(fontSize: 15, height: 1.5)),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      children: member.interests
                          .map((i) => Chip(
                                label: Text(i, style: const TextStyle(fontSize: 12)),
                                backgroundColor: Colors.pinkAccent.withOpacity(0.1),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          repo.togglePlumLike(member.id);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(member.isLiked ? 'Spark sent to ${member.name}!' : 'Removed spark'),
                              backgroundColor: Colors.pinkAccent,
                            ),
                          );
                        },
                        icon: const Icon(LucideIcons.heart),
                        label: Text(member.isLiked ? 'Matched with ${member.name} ♥' : 'Send Spark ♥'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.pinkAccent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
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
