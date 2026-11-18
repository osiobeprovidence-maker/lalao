import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../theme/app_theme.dart';
import '../data/mock_repository.dart';
import '../screens/main/settings_hub_screen.dart';
import '../screens/main/saved_posts_screen.dart';
import '../screens/main/liked_posts_screen.dart';
import '../screens/main/following_screen.dart';
import '../screens/main/wallet_screen.dart';
import '../screens/main/pages_screen.dart';
import '../screens/main/events_tickets_screen.dart';
import '../screens/main/shop_orders_screen.dart';
import '../screens/main/plum_screen.dart';
import '../screens/main/creator_verification_screen.dart';
import '../screens/main/ads_admin_screen.dart';
import '../screens/auth/login_screen.dart';

class HamburgerMenu extends StatelessWidget {
  final Function(int)? onNavigateTab;

  const HamburgerMenu({super.key, this.onNavigateTab});

  void _navigateToTab(BuildContext context, int index) {
    Navigator.pop(context);
    if (onNavigateTab != null) {
      onNavigateTab!(index);
    }
  }

  void _pushScreen(BuildContext context, Widget screen) {
    Navigator.pop(context);
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final user = repo.currentUser;
        return Drawer(
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Profile & Wallet Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          GestureDetector(
                            onTap: () => _navigateToTab(context, 4),
                            child: CircleAvatar(
                              radius: 28,
                              backgroundImage: NetworkImage(user.avatarUrl),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        user.name,
                                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (user.isVerified) ...[
                                      const SizedBox(width: 4),
                                      const Icon(LucideIcons.badge_check, size: 16, color: AppTheme.primaryBrand),
                                    ],
                                  ],
                                ),
                                Text(
                                  '@${user.username} · ${user.location}',
                                  style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      // Quick Wallet Summary Bar
                      InkWell(
                        onTap: () => _pushScreen(context, const WalletScreen()),
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppTheme.primaryBrand, AppTheme.secondaryBrand],
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Bachs Wallet', style: TextStyle(color: Colors.white70, fontSize: 10)),
                                  Text(
                                    '₦${repo.walletBalanceNgn.toStringAsFixed(0)}',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15),
                                  ),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const Text('Credits / Rewards', style: TextStyle(color: Colors.white70, fontSize: 10)),
                                  Text(
                                    '${repo.walletCredits} Cr · ${repo.rewardPoints} Pts',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                // Menu Items
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    children: [
                      _buildSectionHeader('MAIN NAVIGATION'),
                      _buildDrawerItem(
                        icon: LucideIcons.house,
                        title: 'Home Feed & Rallies',
                        onTap: () => _navigateToTab(context, 0),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.compass,
                        title: 'Explore & Ranking',
                        onTap: () => _navigateToTab(context, 1),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.message_square,
                        title: 'Messages & Live Rooms',
                        onTap: () => _navigateToTab(context, 2),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.bell,
                        title: 'Notifications',
                        onTap: () => _navigateToTab(context, 3),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.user,
                        title: 'My Profile',
                        onTap: () => _navigateToTab(context, 4),
                      ),

                      const Divider(height: 20),
                      _buildSectionHeader('WALLET, SHOP & EVENTS'),
                      _buildDrawerItem(
                        icon: LucideIcons.wallet,
                        title: 'Wallet, Bills & Crypto',
                        badge: 'VTU',
                        onTap: () => _pushScreen(context, const WalletScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.gift,
                        title: 'Rewards & Referrals',
                        badge: '${repo.rewardPoints} pts',
                        onTap: () => _pushScreen(context, const WalletScreen(initialTab: 3)),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.layout_grid,
                        title: 'My Pages & Directory',
                        onTap: () => _pushScreen(context, const MyPagesScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.plus_square,
                        title: 'Create a Page',
                        onTap: () => _pushScreen(context, const CreatePageScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.calendar,
                        title: 'Events & Tournaments',
                        onTap: () => _pushScreen(context, const EventsScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.ticket,
                        title: 'My Event Tickets',
                        badge: '${repo.tickets.length}',
                        onTap: () => _pushScreen(context, const MyTicketsScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.shopping_bag,
                        title: 'Order & Shopping History',
                        onTap: () => _pushScreen(context, const ShoppingHistoryScreen()),
                      ),

                      const Divider(height: 20),
                      _buildSectionHeader('CREATOR & ECOSYSTEM'),
                      _buildDrawerItem(
                        icon: LucideIcons.flame,
                        title: 'Plum 18+ Dating & Vibe',
                        badge: '18+',
                        badgeColor: Colors.pinkAccent,
                        onTap: () => _pushScreen(context, const PlumScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.sparkles,
                        title: 'Creator Hub & Earnings',
                        onTap: () => _pushScreen(context, const CreatorHubScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.badge_check,
                        title: 'Verification Subscriptions',
                        onTap: () => _pushScreen(context, const VerificationScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.megaphone,
                        title: 'Lalao Ads Manager',
                        onTap: () => _pushScreen(context, const AdvertiserDashboardScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.music,
                        title: 'Sounds Library',
                        onTap: () => _pushScreen(context, const SoundsLibraryScreen()),
                      ),

                      const Divider(height: 20),
                      _buildSectionHeader('SAVED & SETTINGS'),
                      _buildDrawerItem(
                        icon: LucideIcons.users,
                        title: 'Following',
                        onTap: () => _pushScreen(context, const FollowingScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.bookmark,
                        title: 'Saved Posts',
                        onTap: () => _pushScreen(context, const SavedPostsScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.heart,
                        title: 'Liked Posts',
                        onTap: () => _pushScreen(context, const LikedPostsScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.flask_conical,
                        title: 'Beta Tester Lab',
                        onTap: () => _pushScreen(context, const BetaTesterScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.shield_check,
                        title: 'SuperAdmin Console',
                        onTap: () => _pushScreen(context, const AdminDashboardScreen()),
                      ),
                      _buildDrawerItem(
                        icon: LucideIcons.settings,
                        title: 'Settings & Privacy',
                        onTap: () => _pushScreen(context, const SettingsHubScreen()),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    leading: const Icon(LucideIcons.log_out, color: AppTheme.errorColor, size: 20),
                    title: const Text(
                      'Log Out',
                      style: TextStyle(color: AppTheme.errorColor, fontWeight: FontWeight.w700),
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onTap: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                        (route) => false,
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 6, 24, 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.1,
          color: AppTheme.textSecondaryLight,
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    String? badge,
    Color? badgeColor,
  }) {
    return ListTile(
      leading: Icon(icon, size: 20),
      title: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      trailing: badge != null
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: (badgeColor ?? AppTheme.primaryBrand).withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                badge,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: badgeColor ?? AppTheme.primaryBrand,
                ),
              ),
            )
          : null,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24),
      visualDensity: const VisualDensity(vertical: -1.5),
      onTap: onTap,
    );
  }
}
