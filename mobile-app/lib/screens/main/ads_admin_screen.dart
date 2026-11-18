import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';

class AdvertiserDashboardScreen extends StatefulWidget {
  const AdvertiserDashboardScreen({super.key});

  @override
  State<AdvertiserDashboardScreen> createState() => _AdvertiserDashboardScreenState();
}

class _AdvertiserDashboardScreenState extends State<AdvertiserDashboardScreen> {
  final _repo = MockRepository();

  void _showCreateCampaignModal() {
    final titleCtrl = TextEditingController();
    final brandCtrl = TextEditingController(text: 'Subteen Wear');
    final bodyCtrl = TextEditingController();
    final ctaCtrl = TextEditingController(text: 'Shop Now');
    final locCtrl = TextEditingController(text: 'Udu & Warri (15km)');
    final budgetCtrl = TextEditingController(text: '10000');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Launch New Ad Campaign', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 14),
              TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Campaign Title *')),
              const SizedBox(height: 10),
              TextField(controller: brandCtrl, decoration: const InputDecoration(labelText: 'Brand / Page Name')),
              const SizedBox(height: 10),
              TextField(controller: bodyCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Ad Copy / Headline')),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: TextField(controller: ctaCtrl, decoration: const InputDecoration(labelText: 'CTA Label'))),
                  const SizedBox(width: 10),
                  Expanded(child: TextField(controller: budgetCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Budget (₦)'))),
                ],
              ),
              const SizedBox(height: 10),
              TextField(controller: locCtrl, decoration: const InputDecoration(labelText: 'Target Geo Radius')),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    final budget = double.tryParse(budgetCtrl.text.trim()) ?? 5000;
                    if (titleCtrl.text.trim().isEmpty) return;
                    final ok = _repo.createAdCampaign(
                      title: titleCtrl.text.trim(),
                      brandName: brandCtrl.text.trim(),
                      body: bodyCtrl.text.trim().isEmpty
                          ? 'Discover ${brandCtrl.text.trim()} on Lalao today!'
                          : bodyCtrl.text.trim(),
                      ctaText: ctaCtrl.text.trim(),
                      targetLocation: locCtrl.text.trim(),
                      budgetNgn: budget,
                    );
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(ok ? 'Ad Campaign Launched!' : 'Insufficient Bachs Wallet Balance!'),
                        backgroundColor: ok ? AppTheme.successColor : AppTheme.errorColor,
                      ),
                    );
                  },
                  icon: const Icon(LucideIcons.rocket),
                  label: const Text('Pay from Bachs Wallet & Launch', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBrand,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final campaigns = _repo.adCampaigns;
        final totalImpressions = campaigns.fold<int>(0, (s, c) => s + c.impressions);
        final totalClicks = campaigns.fold<int>(0, (s, c) => s + c.clicks);
        final totalSpent = campaigns.fold<double>(0, (s, c) => s + c.spentNgn);

        return Scaffold(
          appBar: AppBar(
            title: const Text('Lalao Ads Manager', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            actions: [
              IconButton(
                icon: const Icon(LucideIcons.plus_circle, color: AppTheme.primaryBrand),
                onPressed: _showCreateCampaignModal,
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(child: _buildKpi('Impressions', '$totalImpressions', LucideIcons.eye)),
                  const SizedBox(width: 10),
                  Expanded(child: _buildKpi('Ad Clicks', '$totalClicks', LucideIcons.mouse_pointer_click)),
                  const SizedBox(width: 10),
                  Expanded(child: _buildKpi('Spent', '₦${totalSpent.toStringAsFixed(0)}', LucideIcons.wallet)),
                ],
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _showCreateCampaignModal,
                  icon: const Icon(LucideIcons.megaphone),
                  label: const Text('Create Sponsored Ad Campaign', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBrand,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(height: 22),
              const Text('Your Campaigns', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 10),
              ...campaigns.map((c) => Card(
                    margin: const EdgeInsets.only(bottom: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                              ),
                              Chip(
                                label: Text(
                                  c.status.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: c.status == 'active' ? AppTheme.successColor : Colors.orange,
                                  ),
                                ),
                                backgroundColor: (c.status == 'active' ? AppTheme.successColor : Colors.orange).withOpacity(0.12),
                              ),
                            ],
                          ),
                          Text('${c.brandName} · Target: ${c.targetLocation}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight)),
                          const SizedBox(height: 8),
                          Text(c.body, style: const TextStyle(fontSize: 13)),
                          const Divider(height: 22),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Reach: ${c.impressions} · Clicks: ${c.clicks}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              Text('Budget: ₦${c.budgetNgn.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              onPressed: () => _repo.toggleAdCampaignStatus(c.id),
                              icon: Icon(c.status == 'active' ? LucideIcons.pause : LucideIcons.play, size: 15),
                              label: Text(c.status == 'active' ? 'Pause Campaign' : 'Resume Campaign'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )),
            ],
          ),
        );
      },
    );
  }

  Widget _buildKpi(String label, String val, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.primaryBrand, size: 20),
          const SizedBox(height: 6),
          Text(val, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight)),
        ],
      ),
    );
  }
}

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final _repo = MockRepository();
  int _selectedSection = 0;

  final List<Map<String, dynamic>> _sections = [
    {'title': 'Overview', 'icon': LucideIcons.layout_dashboard},
    {'title': 'Users & Creators', 'icon': LucideIcons.users},
    {'title': 'Pages & Shops', 'icon': LucideIcons.store},
    {'title': 'VTU & Bills', 'icon': LucideIcons.receipt},
    {'title': 'Ad Approvals', 'icon': LucideIcons.megaphone},
    {'title': 'Moderation & Flags', 'icon': LucideIcons.shield_alert},
  ];

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Lalao SuperAdmin Console', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          ),
          body: Column(
            children: [
              SizedBox(
                height: 52,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  itemCount: _sections.length,
                  itemBuilder: (context, idx) {
                    final sec = _sections[idx];
                    final active = _selectedSection == idx;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        avatar: Icon(sec['icon'] as IconData, size: 15, color: active ? Colors.white : AppTheme.primaryBrand),
                        label: Text(sec['title'] as String),
                        selected: active,
                        selectedColor: AppTheme.primaryBrand,
                        labelStyle: TextStyle(color: active ? Colors.white : null, fontWeight: FontWeight.bold, fontSize: 12),
                        onSelected: (_) => setState(() => _selectedSection = idx),
                      ),
                    );
                  },
                ),
              ),
              const Divider(height: 1),
              Expanded(child: _buildSectionBody()),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionBody() {
    switch (_selectedSection) {
      case 0:
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _buildAdminStat('Total Users', '${_repo.users.length + 1420}', '+14% this week', AppTheme.primaryBrand),
                _buildAdminStat('Active Pages', '${_repo.pages.length}', '4 Verified Orgs', AppTheme.secondaryBrand),
                _buildAdminStat('Wallet TVL', '₦4,850,000', 'Monnify + Paystack', AppTheme.successColor),
                _buildAdminStat('VTU Volume', '₦1,290,400', 'ClubKonnect API Live', Colors.orange),
              ],
            ),
            const SizedBox(height: 20),
            const Text('Recent Audit Log', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 8),
            ..._repo.walletTransactions.take(6).map((tx) => ListTile(
                  leading: const Icon(LucideIcons.activity, size: 18, color: AppTheme.primaryBrand),
                  title: Text(tx.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  subtitle: Text('${tx.category} · ${tx.createdAt}'),
                  trailing: Text(tx.amountDisplay, style: const TextStyle(fontWeight: FontWeight.bold)),
                )),
          ],
        );
      case 1:
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _repo.users.length,
          itemBuilder: (context, idx) {
            final u = _repo.users[idx];
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
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
                subtitle: Text('@${u.username} · ${u.location} · ${u.followersCount} followers'),
                trailing: Text(u.role.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            );
          },
        );
      case 2:
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _repo.pages.length,
          itemBuilder: (context, idx) {
            final p = _repo.pages[idx];
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: CircleAvatar(backgroundImage: NetworkImage(p.avatarUrl)),
                title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${p.type.toUpperCase()} · ${p.followersCount} followers'),
                trailing: const Icon(LucideIcons.badge_check, color: AppTheme.primaryBrand),
              ),
            );
          },
        );
      default:
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SwitchListTile(
              title: const Text('ClubKonnect VTU Live Gateway', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Enable instant Airtime, Data, Cable TV & Electricity fulfillment'),
              value: true,
              activeColor: AppTheme.primaryBrand,
              onChanged: (_) {},
            ),
            SwitchListTile(
              title: const Text('Plum 18+ Age Gate Enforcement', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Require mandatory 18+ confirmation before entering Plum'),
              value: true,
              activeColor: AppTheme.primaryBrand,
              onChanged: (_) {},
            ),
            SwitchListTile(
              title: const Text('Playsole One Unified SSO', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Allow one-tap sign-in with Playsole ecosystem accounts'),
              value: true,
              activeColor: AppTheme.primaryBrand,
              onChanged: (_) {},
            ),
          ],
        );
    }
  }

  Widget _buildAdminStat(String label, String value, String sub, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
          const SizedBox(height: 2),
          Text(sub, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight)),
        ],
      ),
    );
  }
}
