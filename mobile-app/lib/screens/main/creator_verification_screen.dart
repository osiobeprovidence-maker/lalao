import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';

class CreatorHubScreen extends StatefulWidget {
  const CreatorHubScreen({super.key});

  @override
  State<CreatorHubScreen> createState() => _CreatorHubScreenState();
}

class _CreatorHubScreenState extends State<CreatorHubScreen> with SingleTickerProviderStateMixin {
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

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final u = _repo.currentUser;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Creator Hub & Studio', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            bottom: TabBar(
              controller: _tabController,
              labelColor: AppTheme.primaryBrand,
              indicatorColor: AppTheme.primaryBrand,
              isScrollable: true,
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Monetization'),
                Tab(text: 'Performance'),
                Tab(text: 'Milestones'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              // Overview
              ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primaryBrand, AppTheme.secondaryBrand],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(radius: 26, backgroundImage: NetworkImage(u.avatarUrl)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(u.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
                                  Text(
                                    'Tier: ${u.verificationTier.toUpperCase()} · ${u.followersCount} Followers',
                                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildHeroStat('Creator Balance', '₦${_repo.creatorEarningsNgn.toStringAsFixed(0)}'),
                            _buildHeroStat('30d Reach', '48.2K'),
                            _buildHeroStat('Engagement', '11.4%'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  ListTile(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    tileColor: Theme.of(context).cardColor,
                    leading: const Icon(LucideIcons.badge_check, color: AppTheme.primaryBrand),
                    title: const Text('Upgrade Verification Badge', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: const Text('Unlock priority ranking, HD video & lower platform fees'),
                    trailing: const Icon(LucideIcons.chevron_right),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const VerificationScreen()));
                    },
                  ),
                ],
              ),

              // Monetization
              ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Available Creator Payout', style: TextStyle(color: AppTheme.textSecondaryLight)),
                          const SizedBox(height: 6),
                          Text(
                            '₦${_repo.creatorEarningsNgn.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.successColor),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _repo.creatorEarningsNgn > 0
                                  ? () {
                                      _repo.transferCreatorEarningsToWallet();
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Creator earnings moved to main Bachs Wallet!'),
                                          backgroundColor: AppTheme.successColor,
                                        ),
                                      );
                                    }
                                  : null,
                              icon: const Icon(LucideIcons.arrow_down_to_line),
                              label: const Text('Withdraw to Bachs Wallet'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryBrand,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const ListTile(
                    leading: Icon(LucideIcons.coins, color: Colors.amber),
                    title: Text('Post & Live Room Tips'),
                    subtitle: Text('Active · Fans can tip you Credits & Bachs directly'),
                  ),
                  const ListTile(
                    leading: Icon(LucideIcons.shopping_bag, color: AppTheme.primaryBrand),
                    title: Text('Page Shop Affiliates'),
                    subtitle: Text('Active · Earn 10% commission on tagged products'),
                  ),
                ],
              ),

              // Performance
              ListView(
                padding: const EdgeInsets.all(16),
                children: const [
                  ListTile(
                    leading: Icon(LucideIcons.eye, color: AppTheme.primaryBrand),
                    title: Text('Post Impressions (Last 30 Days)'),
                    trailing: Text('48,290 (+24%)', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.successColor)),
                  ),
                  ListTile(
                    leading: Icon(LucideIcons.flame, color: Colors.orange),
                    title: Text('Rallies Hosted'),
                    trailing: Text('6 Rallies · 312 Joined', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  ListTile(
                    leading: Icon(LucideIcons.music, color: Colors.purple),
                    title: Text('Original Sounds Used'),
                    trailing: Text('1,420 Reels/Posts', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),

              // Milestones
              ListView(
                padding: const EdgeInsets.all(16),
                children: const [
                  ListTile(
                    leading: Icon(LucideIcons.award, color: AppTheme.successColor),
                    title: Text('1,000+ Followers Milestone'),
                    subtitle: Text('Completed · Unlocked Creator Tips'),
                  ),
                  ListTile(
                    leading: Icon(LucideIcons.award, color: AppTheme.successColor),
                    title: Text('Verified Local Leader'),
                    subtitle: Text('Completed · Priority Udu/Warri Feed Placement'),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeroStat(String label, String val) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(val, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
      ],
    );
  }
}

class VerificationScreen extends StatelessWidget {
  const VerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    final plans = [
      {
        'tier': 'basic',
        'name': 'Standard Verified',
        'price': 800.0,
        'period': '/ month',
        'color': Colors.blue,
        'features': [
          'Official Blue Verification Checkmark',
          'Impersonation Protection',
          'Verified Comment Placement',
        ],
      },
      {
        'tier': 'business',
        'name': 'Priority Verified',
        'price': 1700.0,
        'period': '/ month',
        'color': AppTheme.primaryBrand,
        'features': [
          'Gold/Indigo Business & Leader Checkmark',
          '2x Feed Discovery Boost in Your Area',
          'Shop & Event Listing Priority',
          '500 Bonus Ad Credits Monthly',
        ],
      },
      {
        'tier': 'premium',
        'name': 'Creator Premium Pro',
        'price': 3500.0,
        'period': '/ month',
        'color': Colors.purple,
        'features': [
          'Diamond Creator Badge + Custom Profile Theme',
          '0% Platform Fee on Tips & Event Tickets',
          '4K Video Uploads & Unlimited Sound Library Uploads',
          'Dedicated Partner Support',
        ],
      },
    ];

    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final currentTier = repo.currentUser.verificationTier;
        return Scaffold(
          appBar: AppBar(title: const Text('Lalao Verification & Plans', style: TextStyle(fontWeight: FontWeight.w800))),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text(
                'Choose Your Verification Tier',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 6),
              Text(
                'Pay seamlessly with your Bachs Wallet (Balance: ₦${repo.walletBalanceNgn.toStringAsFixed(0)}).',
                style: const TextStyle(color: AppTheme.textSecondaryLight),
              ),
              const SizedBox(height: 16),
              ...plans.map((p) {
                final isCurrent = currentTier == p['tier'];
                final color = p['color'] as Color;
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(color: isCurrent ? color : Theme.of(context).dividerColor, width: isCurrent ? 2 : 1),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Icon(LucideIcons.badge_check, color: color),
                                const SizedBox(width: 8),
                                Text(p['name'] as String, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                              ],
                            ),
                            Text(
                              '₦${(p['price'] as double).toStringAsFixed(0)}${p['period']}',
                              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: color),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ...(p['features'] as List<String>).map((f) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                children: [
                                  Icon(LucideIcons.check, size: 15, color: color),
                                  const SizedBox(width: 8),
                                  Expanded(child: Text(f, style: const TextStyle(fontSize: 13))),
                                ],
                              ),
                            )),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: isCurrent
                                ? null
                                : () {
                                    final ok = repo.subscribeVerification(p['tier'] as String, p['price'] as double);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(ok
                                            ? 'Subscribed to ${p['name']}!'
                                            : 'Insufficient Bachs Wallet balance!'),
                                        backgroundColor: ok ? AppTheme.successColor : AppTheme.errorColor,
                                      ),
                                    );
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: color,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(
                              isCurrent ? 'Current Active Plan' : 'Subscribe — ₦${(p['price'] as double).toStringAsFixed(0)}',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

class SoundsLibraryScreen extends StatefulWidget {
  const SoundsLibraryScreen({super.key});

  @override
  State<SoundsLibraryScreen> createState() => _SoundsLibraryScreenState();
}

class _SoundsLibraryScreenState extends State<SoundsLibraryScreen> {
  final _repo = MockRepository();
  String? _playingId;

  void _showUploadSoundDialog() {
    final titleCtrl = TextEditingController();
    final artistCtrl = TextEditingController(text: _repo.currentUser.name);
    final durCtrl = TextEditingController(text: '0:30');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Upload Original Sound', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Sound Title')),
            const SizedBox(height: 10),
            TextField(controller: artistCtrl, decoration: const InputDecoration(labelText: 'Artist / Creator')),
            const SizedBox(height: 10),
            TextField(controller: durCtrl, decoration: const InputDecoration(labelText: 'Duration (e.g. 0:45)')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (titleCtrl.text.trim().isNotEmpty) {
                _repo.addSound(titleCtrl.text.trim(), artistCtrl.text.trim(), durCtrl.text.trim());
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sound added to Lalao Library!'), backgroundColor: AppTheme.successColor),
                );
              }
            },
            child: const Text('Upload'),
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
        final sounds = _repo.sounds;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Sounds & Audio Library', style: TextStyle(fontWeight: FontWeight.w800)),
            actions: [
              IconButton(
                icon: const Icon(LucideIcons.upload, color: AppTheme.primaryBrand),
                onPressed: _showUploadSoundDialog,
              ),
            ],
          ),
          body: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: sounds.length,
            itemBuilder: (context, index) {
              final s = sounds[index];
              final isPlaying = _playingId == s.id;
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: ListTile(
                  leading: GestureDetector(
                    onTap: () => setState(() => _playingId = isPlaying ? null : s.id),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(s.coverUrl, width: 52, height: 52, fit: BoxFit.cover),
                        ),
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.black38,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            isPlaying ? LucideIcons.pause : LucideIcons.play,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ],
                    ),
                  ),
                  title: Text(s.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${s.artist} · ${s.duration} · ${s.usesCount} posts'),
                  trailing: IconButton(
                    icon: Icon(
                      s.isBookmarked ? LucideIcons.bookmark_check : LucideIcons.bookmark,
                      color: s.isBookmarked ? AppTheme.primaryBrand : null,
                    ),
                    onPressed: () => _repo.toggleBookmarkSound(s.id),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class BetaTesterScreen extends StatefulWidget {
  const BetaTesterScreen({super.key});

  @override
  State<BetaTesterScreen> createState() => _BetaTesterScreenState();
}

class _BetaTesterScreenState extends State<BetaTesterScreen> {
  final _repo = MockRepository();
  final _feedbackCtrl = TextEditingController();
  String _type = 'Feature Suggestion';

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(title: const Text('Lalao Beta Tester Lab', style: TextStyle(fontWeight: FontWeight.w800))),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBrand.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppTheme.primaryBrand.withOpacity(0.3)),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(LucideIcons.flask_conical, color: AppTheme.primaryBrand),
                        SizedBox(width: 8),
                        Text('Early Access Beta Program', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Test upcoming Lalao experimental features before anyone else and earn +15 Reward Points for every bug report or idea submitted.',
                      style: TextStyle(fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('Submit Beta Feedback', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: _type,
                items: const [
                  DropdownMenuItem(value: 'Feature Suggestion', child: Text('Feature Suggestion')),
                  DropdownMenuItem(value: 'Bug Report', child: Text('Bug Report')),
                  DropdownMenuItem(value: 'UI / Performance Feedback', child: Text('UI / Performance Feedback')),
                ],
                onChanged: (v) => setState(() => _type = v!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _feedbackCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Describe what you noticed or what we should build next...',
                ),
              ),
              const SizedBox(height: 14),
              ElevatedButton.icon(
                onPressed: () {
                  if (_feedbackCtrl.text.trim().isNotEmpty) {
                    _repo.submitBetaFeedback('[$_type] ${_feedbackCtrl.text.trim()}');
                    _feedbackCtrl.clear();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Feedback logged! +15 Reward Points added.'),
                        backgroundColor: AppTheme.successColor,
                      ),
                    );
                  }
                },
                icon: const Icon(LucideIcons.send),
                label: const Text('Submit & Earn +15 Pts'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBrand,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
              const SizedBox(height: 24),
              const Text('Recent Beta Submissions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 8),
              ..._repo.betaFeedbackList.map((f) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: const Icon(LucideIcons.check_check, color: AppTheme.successColor),
                      title: Text(f, style: const TextStyle(fontSize: 13)),
                    ),
                  )),
            ],
          ),
        );
      },
    );
  }
}
