import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';
import 'wallet_screen.dart';

class NotificationsScreen extends StatefulWidget {
  final VoidCallback? onOpenDrawer;

  const NotificationsScreen({super.key, this.onOpenDrawer});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> with SingleTickerProviderStateMixin {
  final _repo = MockRepository();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  IconData _getIconForType(NotificationType type) {
    switch (type) {
      case NotificationType.like:
        return LucideIcons.heart;
      case NotificationType.reply:
        return LucideIcons.message_circle;
      case NotificationType.follow:
        return LucideIcons.user_plus;
      case NotificationType.payment:
        return LucideIcons.wallet;
      default:
        return LucideIcons.bell;
    }
  }

  Color _getColorForType(NotificationType type) {
    switch (type) {
      case NotificationType.like:
        return AppTheme.accentBrand;
      case NotificationType.reply:
        return AppTheme.primaryBrand;
      case NotificationType.follow:
        return AppTheme.secondaryBrand;
      case NotificationType.payment:
        return AppTheme.successColor;
      default:
        return AppTheme.primaryBrand;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final notifications = _repo.notifications;
        final recentActivity = notifications.where((n) => !n.isRead).toList();
        final txs = _repo.walletTransactions;

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(LucideIcons.menu),
              onPressed: widget.onOpenDrawer ?? () => Scaffold.of(context).openDrawer(),
            ),
            title: const Text('Notifications & Activity', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            actions: [
              IconButton(
                icon: const Icon(LucideIcons.check_check),
                tooltip: 'Mark all as read',
                onPressed: () {
                  _repo.markAllNotificationsRead();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('All notifications marked as read')),
                  );
                },
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: AppTheme.primaryBrand,
              labelColor: AppTheme.primaryBrand,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              tabs: const [
                Tab(text: 'All'),
                Tab(text: 'Unread'),
                Tab(text: 'Payment History'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildNotificationList(context, notifications),
              _buildNotificationList(context, recentActivity),
              _buildPaymentHistoryList(context, txs),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNotificationList(BuildContext context, List<AppNotification> list) {
    if (list.isEmpty) {
      return const Center(
        child: Text('You are all caught up!', style: TextStyle(color: AppTheme.textSecondaryLight)),
      );
    }

    return ListView.separated(
      itemCount: list.length,
      separatorBuilder: (context, index) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final notif = list[index];
        final color = _getColorForType(notif.type);

        return Container(
          color: notif.isRead ? Colors.transparent : AppTheme.primaryBrand.withOpacity(0.05),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Stack(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundImage: NetworkImage(notif.user.avatarUrl),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2),
                    ),
                    child: Icon(_getIconForType(notif.type), size: 10, color: Colors.white),
                  ),
                ),
              ],
            ),
            title: RichText(
              text: TextSpan(
                style: Theme.of(context).textTheme.bodyLarge,
                children: [
                  TextSpan(text: '${notif.user.name} ', style: const TextStyle(fontWeight: FontWeight.bold)),
                  TextSpan(text: notif.content),
                ],
              ),
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(notif.timestamp, style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12)),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPaymentHistoryList(BuildContext context, List<WalletTransaction> txs) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: txs.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, idx) {
        final tx = txs[idx];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(vertical: 6),
          leading: CircleAvatar(
            backgroundColor: (tx.isCredit ? AppTheme.successColor : AppTheme.primaryBrand).withOpacity(0.12),
            child: Icon(
              tx.isCredit ? LucideIcons.arrow_down_left : LucideIcons.arrow_up_right,
              color: tx.isCredit ? AppTheme.successColor : AppTheme.primaryBrand,
              size: 18,
            ),
          ),
          title: Text(tx.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          subtitle: Text('${tx.category.toUpperCase()} · ${tx.createdAt}', style: const TextStyle(fontSize: 11)),
          trailing: Text(
            tx.amountDisplay,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: tx.isCredit ? AppTheme.successColor : null,
            ),
          ),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletScreen()));
          },
        );
      },
    );
  }
}
