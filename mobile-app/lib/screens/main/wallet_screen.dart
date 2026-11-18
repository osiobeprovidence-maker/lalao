import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:share_plus/share_plus.dart';
import '../../data/mock_repository.dart';

class WalletScreen extends StatefulWidget {
  final int initialTab;
  const WalletScreen({super.key, this.initialTab = 0});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen>
    with SingleTickerProviderStateMixin {
  final repo = MockRepository();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController =
        TabController(length: 4, vsync: this, initialIndex: widget.initialTab);
    repo.addListener(_onRepoUpdate);
  }

  void _onRepoUpdate() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    repo.removeListener(_onRepoUpdate);
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const primaryPurple = Color(0xFF5E43F3);
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrow_left, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Klyro Wallet & Market',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
            Text(
              'Credits · Web3 USDC · Bills · Rewards',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.lock, color: Colors.black87, size: 20),
            tooltip: 'Wallet PIN Settings',
            onPressed: () => _showPinSettingsSheet(context),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: primaryPurple,
          labelColor: primaryPurple,
          unselectedLabelColor: const Color(0xFF6B7280),
          labelStyle:
              const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'Wallet'),
            Tab(text: 'Bills & Data'),
            Tab(text: 'Crypto'),
            Tab(text: 'Rewards'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildCreditsTab(context),
          _buildMarketTab(context),
          _buildCryptoTab(context),
          _buildRewardsTab(context),
        ],
      ),
    );
  }

  Widget _buildCreditsTab(BuildContext context) {
    const primaryPurple = Color(0xFF5E43F3);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Main Balance Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF5E43F3), Color(0xFF3B24B8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: primaryPurple.withOpacity(0.28),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'LALAO CREDITS BALANCE',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _tabController.animateTo(3),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            LucideIcons.gift,
                            size: 13,
                            color: Colors.amberAccent,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${repo.rewardPoints} pts',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                '₦${repo.walletBalance.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _showFundModal(context),
                      icon: const Icon(LucideIcons.plus, size: 16),
                      label: const Text('Fund'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: primaryPurple,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _showTransferModal(context),
                      icon: const Icon(LucideIcons.send, size: 16),
                      label: const Text('Send'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.18),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _showWithdrawModal(context),
                      icon: const Icon(LucideIcons.building, size: 16),
                      label: const Text('Withdraw'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.18),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        // Creator Earnings Banner
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  LucideIcons.trending_up,
                  color: Colors.green,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Creator Monetization Ledger',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      'Earned: ₦${repo.currentUser.creatorEarnings.toStringAsFixed(0)} · Pending: ₦${repo.currentUser.creatorPendingEarnings.toStringAsFixed(0)}',
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'RECENT TRANSACTIONS',
          style: TextStyle(
            color: Color(0xFF9CA3AF),
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.1,
          ),
        ),
        const SizedBox(height: 10),
        ...repo.walletTransactions.map((tx) {
          final isPositive = tx.amount >= 0;
          return Card(
            color: Colors.white,
            elevation: 0,
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            child: ListTile(
              onTap: () => _showReceiptDialog(context, tx),
              leading: CircleAvatar(
                backgroundColor: isPositive
                    ? Colors.green.withOpacity(0.1)
                    : primaryPurple.withOpacity(0.1),
                child: Icon(
                  isPositive
                      ? LucideIcons.arrow_down_left
                      : LucideIcons.arrow_up_right,
                  color: isPositive ? Colors.green : primaryPurple,
                  size: 18,
                ),
              ),
              title: Text(
                tx.description,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              subtitle: Text(
                '${tx.date} · Ref: ${tx.reference}',
                style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
              ),
              trailing: Text(
                '${isPositive ? "+" : ""}₦${tx.amount.abs().toStringAsFixed(0)}',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  color: isPositive ? Colors.green.shade700 : Colors.black87,
                  fontSize: 14,
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildMarketTab(BuildContext context) {
    final services = [
      {'name': 'Airtime VTU', 'icon': LucideIcons.smartphone, 'type': 'airtime'},
      {'name': 'Data Plans', 'icon': LucideIcons.wifi, 'type': 'data'},
      {'name': 'Electricity', 'icon': LucideIcons.zap, 'type': 'electricity'},
      {'name': 'Cable TV', 'icon': LucideIcons.tv, 'type': 'cable'},
      {'name': 'Betting Wallet', 'icon': LucideIcons.dices, 'type': 'betting'},
      {'name': 'Smile 4G', 'icon': LucideIcons.globe, 'type': 'smile'},
      {'name': 'Spectranet', 'icon': LucideIcons.wifi, 'type': 'spectranet'},
      {'name': 'WAEC / JAMB', 'icon': LucideIcons.graduation_cap, 'type': 'exam'},
      {'name': 'JointheQ Subs', 'icon': LucideIcons.crown, 'type': 'subs'},
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'ClubKonnect & JointheQ Marketplace',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        const SizedBox(height: 4),
        const Text(
          'Instant airtime, data bundles, electricity tokens, cable TV, and shared subscriptions.',
          style: TextStyle(color: Color(0xFF6B7280), fontSize: 13),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.05,
          ),
          itemCount: services.length,
          itemBuilder: (context, index) {
            final s = services[index];
            return InkWell(
              onTap: () => _openBillServiceSheet(
                context,
                s['name'] as String,
                s['type'] as String,
              ),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF5E43F3).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        s['icon'] as IconData,
                        color: const Color(0xFF5E43F3),
                        size: 22,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      s['name'] as String,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildCryptoTab(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'WEB3 USDC WALLET (BASE / POLYGON)',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: repo.connectedCryptoAddress != null
                          ? Colors.green.withOpacity(0.2)
                          : Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      repo.connectedCryptoAddress ?? 'Disconnected',
                      style: TextStyle(
                        color: repo.connectedCryptoAddress != null
                            ? Colors.greenAccent
                            : Colors.orangeAccent,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '${repo.cryptoBalanceUsdc.toStringAsFixed(2)} USDC',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          if (repo.connectedCryptoAddress == null) {
                            repo.connectedCryptoAddress = '0x71C...89A4';
                          } else {
                            repo.connectedCryptoAddress = null;
                          }
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF5E43F3),
                        foregroundColor: Colors.white,
                      ),
                      child: Text(
                        repo.connectedCryptoAddress == null
                            ? 'Connect Web3 Wallet'
                            : 'Disconnect Wallet',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRewardsTab(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF5E43F3).withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'AVAILABLE REWARD POINTS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF5E43F3),
                    ),
                  ),
                  Text(
                    'Code: ${repo.referralCode}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${repo.rewardPoints} pts',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Total Earned: ${repo.totalPointsEarned} · Redeemed: ${repo.totalPointsRedeemed}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () {
                  Share.share(
                    'Join me on Lalao with referral code ${repo.referralCode} and earn instant reward points! https://lalao.app/referral/${repo.referralCode}',
                  );
                },
                icon: const Icon(LucideIcons.share_2, size: 16),
                label: const Text('Share Referral Code'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'REWARD CATALOGUE',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Color(0xFF9CA3AF),
          ),
        ),
        const SizedBox(height: 10),
        ...repo.rewardCatalogue.map((r) {
          final canClaim = repo.rewardPoints >= r.pointsCost;
          return Card(
            color: Colors.white,
            elevation: 0,
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.all(14),
              leading: CircleAvatar(
                backgroundColor: const Color(0xFF5E43F3).withOpacity(0.1),
                child: const Icon(
                  LucideIcons.gift,
                  color: Color(0xFF5E43F3),
                ),
              ),
              title: Text(
                r.name,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                '${r.description}\nCost: ${r.pointsCost} points',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: ElevatedButton(
                onPressed: canClaim
                    ? () {
                        final ok = repo.redeemReward(r);
                        if (ok) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Redeemed ${r.name}!'),
                            ),
                          );
                        }
                      }
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF5E43F3),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Claim'),
              ),
            ),
          );
        }),
      ],
    );
  }

  void _showFundModal(BuildContext context) {
    final amountCtrl = TextEditingController(text: '10000');
    String selectedMethod = 'Bachs Instant Checkout';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Fund Lalao Wallet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Amount (NGN)',
                prefixText: '₦ ',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final amt = double.tryParse(amountCtrl.text) ?? 0;
                  if (amt > 0) {
                    repo.fundWallet(amt, selectedMethod);
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Wallet funded with ₦${amt.toStringAsFixed(0)} via Bachs!',
                        ),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF5E43F3),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text(
                  'Complete Bachs Funding',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showTransferModal(BuildContext context) {
    final amountCtrl = TextEditingController(text: '5000');
    final pinCtrl = TextEditingController(text: repo.walletPin);
    User selectedUser = repo.nearbyUsers.first;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Send Lalao Credits',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<User>(
                value: selectedUser,
                decoration: const InputDecoration(
                  labelText: 'Select Recipient',
                  border: OutlineInputBorder(),
                ),
                items: repo.nearbyUsers
                    .map(
                      (u) => DropdownMenuItem(
                        value: u,
                        child: Text('${u.name} (@${u.username})'),
                      ),
                    )
                    .toList(),
                onChanged: (u) {
                  if (u != null) setSheetState(() => selectedUser = u);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Amount (NGN)',
                  prefixText: '₦ ',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: pinCtrl,
                obscureText: true,
                maxLength: 4,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: '4-Digit Wallet PIN',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final amt = double.tryParse(amountCtrl.text) ?? 0;
                    final ok =
                        repo.transferCredits(selectedUser, amt, pinCtrl.text);
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          ok
                              ? 'Sent ₦${amt.toStringAsFixed(0)} to ${selectedUser.name}!'
                              : 'Transfer failed: check balance or PIN',
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF5E43F3),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Confirm Transfer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showWithdrawModal(BuildContext context) {
    final amountCtrl = TextEditingController(text: '15000');
    final pinCtrl = TextEditingController(text: repo.walletPin);
    WithdrawalAccount selectedBank = repo.withdrawalAccounts.first;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Withdraw to Bank Account',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              'Destination: ${selectedBank.bankName} · ${selectedBank.accountNumber} (${selectedBank.accountName})',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Withdrawal Amount (NGN)',
                prefixText: '₦ ',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: pinCtrl,
              obscureText: true,
              maxLength: 4,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: '4-Digit Wallet PIN',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final amt = double.tryParse(amountCtrl.text) ?? 0;
                  final ok =
                      repo.withdrawFunds(selectedBank, amt, pinCtrl.text);
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        ok
                            ? 'Withdrawal of ₦${amt.toStringAsFixed(0)} initiated!'
                            : 'Withdrawal failed: check balance or PIN',
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF5E43F3),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Confirm Withdrawal'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openBillServiceSheet(
    BuildContext context,
    String title,
    String serviceType,
  ) {
    final customerCtrl = TextEditingController(text: '08031234567');
    final amountCtrl = TextEditingController(text: '1500');
    final pinCtrl = TextEditingController(text: repo.walletPin);
    String selectedProvider = 'MTN';
    String selectedPlan = '5GB Monthly Data Plan (₦1,500)';

    final providers = serviceType == 'electricity'
        ? ['IKEDC', 'EKEDC', 'BEDC (Delta)', 'AEDC']
        : serviceType == 'cable'
            ? ['DSTV', 'GOTV', 'Startimes']
            : ['MTN', 'Airtel', 'Glo', '9mobile'];
    selectedProvider = providers.first;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: providers.map((p) {
                  final active = selectedProvider == p;
                  return ChoiceChip(
                    label: Text(p),
                    selected: active,
                    onSelected: (_) =>
                        setSheetState(() => selectedProvider = p),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              if (serviceType == 'data') ...[
                DropdownButtonFormField<String>(
                  value: selectedPlan,
                  decoration: const InputDecoration(
                    labelText: 'Native Data Plan Selector',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: '1GB Daily Plan (₦350)',
                      child: Text('1GB Daily Plan (₦350)'),
                    ),
                    DropdownMenuItem(
                      value: '5GB Monthly Data Plan (₦1,500)',
                      child: Text('5GB Monthly Data Plan (₦1,500)'),
                    ),
                    DropdownMenuItem(
                      value: '12GB Monthly Data Plan (₦3,500)',
                      child: Text('12GB Monthly Data Plan (₦3,500)'),
                    ),
                    DropdownMenuItem(
                      value: '40GB Mega Plan (₦10,000)',
                      child: Text('40GB Mega Plan (₦10,000)'),
                    ),
                  ],
                  onChanged: (v) {
                    if (v != null) {
                      setSheetState(() => selectedPlan = v);
                      if (v.contains('350')) amountCtrl.text = '350';
                      if (v.contains('1,500')) amountCtrl.text = '1500';
                      if (v.contains('3,500')) amountCtrl.text = '3500';
                      if (v.contains('10,000')) amountCtrl.text = '10000';
                    }
                  },
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                controller: customerCtrl,
                decoration: InputDecoration(
                  labelText: serviceType == 'electricity'
                      ? 'Meter Number'
                      : serviceType == 'cable'
                          ? 'Smartcard / IUC Number'
                          : 'Phone Number / Account ID',
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Amount (NGN)',
                  prefixText: '₦ ',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: pinCtrl,
                obscureText: true,
                maxLength: 4,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: '4-Digit Wallet PIN',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final amt = double.tryParse(amountCtrl.text) ?? 0;
                    final ok = repo.purchaseBillService(
                      serviceName: '$selectedProvider $title',
                      customerIdentifier: customerCtrl.text,
                      amount: amt,
                      enteredPin: pinCtrl.text,
                    );
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          ok
                              ? '$selectedProvider $title purchase completed! (+25 reward pts)'
                              : 'Purchase failed: verify PIN & wallet balance',
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF5E43F3),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Pay Now'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPinSettingsSheet(BuildContext context) {
    final newPinCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Security & Wallet PIN',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            const Text(
              'Set or reset your 4-digit transaction PIN for transfers, withdrawals, and bill payments.',
              style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: newPinCtrl,
              obscureText: true,
              maxLength: 4,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'New 4-Digit PIN',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  if (newPinCtrl.text.length == 4) {
                    repo.walletPin = newPinCtrl.text;
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Wallet PIN updated successfully!'),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF5E43F3),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Save PIN'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showReceiptDialog(BuildContext context, WalletTransaction tx) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Transaction Receipt',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Amount: ₦${tx.amount.abs().toStringAsFixed(2)}'),
            const SizedBox(height: 6),
            Text('Description: ${tx.description}'),
            const SizedBox(height: 6),
            Text('Reference: ${tx.reference}'),
            const SizedBox(height: 6),
            Text('Date: ${tx.date}'),
            const SizedBox(height: 6),
            Text('Status: ${tx.status.toUpperCase()}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
