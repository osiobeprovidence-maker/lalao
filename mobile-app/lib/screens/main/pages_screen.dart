import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';
import 'shop_orders_screen.dart';
import 'events_tickets_screen.dart';

class MyPagesScreen extends StatefulWidget {
  const MyPagesScreen({super.key});

  @override
  State<MyPagesScreen> createState() => _MyPagesScreenState();
}

class _MyPagesScreenState extends State<MyPagesScreen> {
  final _repo = MockRepository();

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final myPages = _repo.pages;
        return Scaffold(
          appBar: AppBar(
            title: const Text('My Pages & Communities', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            actions: [
              IconButton(
                icon: const Icon(LucideIcons.plus, color: AppTheme.primaryBrand),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePageScreen()));
                },
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primaryBrand, AppTheme.secondaryBrand],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Build Your Presence',
                            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Create a Business, Organization, Club, or Community page with Shop, Events, Roomy & JointheQ.',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePageScreen()));
                            },
                            icon: const Icon(LucideIcons.plus, size: 16),
                            label: const Text('Create New Page', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppTheme.primaryBrand,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(LucideIcons.layout_grid, color: Colors.white30, size: 56),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('All Pages & Directory', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              ...myPages.map((page) => _buildPageCard(page)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPageCard(PageModel page) {
    final isOwner = page.ownerId == _repo.currentUser.id || page.id == 'page-subteen' || page.id == 'page-warri-tech';
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: Theme.of(context).dividerColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => PageDetailScreen(pageId: page.id)));
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 100,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    page.coverImageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: AppTheme.primaryBrand.withOpacity(0.2)),
                  ),
                  Container(color: Colors.black26),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        page.type.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundImage: NetworkImage(page.avatarUrl),
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
                                page.name,
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (page.isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(LucideIcons.badge_check, size: 16, color: AppTheme.primaryBrand),
                            ],
                          ],
                        ),
                        Text(
                          '${page.category} · ${page.followersCount} followers',
                          style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          page.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => PageDetailScreen(pageId: page.id)));
                      },
                      icon: const Icon(LucideIcons.eye, size: 15),
                      label: const Text('View Page'),
                    ),
                  ),
                  if (isOwner) ...[
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => PageManagementScreen(page: page)));
                        },
                        icon: const Icon(LucideIcons.settings_2, size: 15),
                        label: const Text('Manage'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryBrand,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CreatePageScreen extends StatefulWidget {
  const CreatePageScreen({super.key});

  @override
  State<CreatePageScreen> createState() => _CreatePageScreenState();
}

class _CreatePageScreenState extends State<CreatePageScreen> {
  final _nameCtrl = TextEditingController();
  final _handleCtrl = TextEditingController();
  final _categoryCtrl = TextEditingController(text: 'Retail & Fashion');
  final _descCtrl = TextEditingController();
  final _locationCtrl = TextEditingController(text: 'Udu, Delta State');
  String _selectedType = 'business';
  bool _hasShop = true;
  bool _hasEvents = false;
  bool _hasRoomy = false;
  bool _hasJointheQ = false;

  void _submit() {
    if (_nameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a page name')),
      );
      return;
    }
    MockRepository().createPage(
      name: _nameCtrl.text.trim(),
      handle: _handleCtrl.text.trim().isEmpty
          ? _nameCtrl.text.trim().toLowerCase().replaceAll(' ', '_')
          : _handleCtrl.text.trim(),
      type: _selectedType,
      category: _categoryCtrl.text.trim(),
      description: _descCtrl.text.trim().isEmpty
          ? 'Official Lalao page for ${_nameCtrl.text.trim()}'
          : _descCtrl.text.trim(),
      location: _locationCtrl.text.trim(),
      hasShop: _hasShop,
      hasEvents: _hasEvents,
    );
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Page created and published!'),
        backgroundColor: AppTheme.successColor,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final types = [
      {'id': 'business', 'label': 'Business / Brand', 'icon': LucideIcons.store},
      {'id': 'organization', 'label': 'Organization / NGO', 'icon': LucideIcons.building_2},
      {'id': 'club', 'label': 'Sports / Social Club', 'icon': LucideIcons.trophy},
      {'id': 'community', 'label': 'Local Community', 'icon': LucideIcons.users},
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Create New Page', style: TextStyle(fontWeight: FontWeight.w800))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Select Page Type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.2,
            children: types.map((t) {
              final selected = _selectedType == t['id'];
              return InkWell(
                onTap: () => setState(() => _selectedType = t['id'] as String),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: selected ? AppTheme.primaryBrand.withOpacity(0.12) : Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: selected ? AppTheme.primaryBrand : Theme.of(context).dividerColor,
                      width: selected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(t['icon'] as IconData, color: selected ? AppTheme.primaryBrand : AppTheme.textSecondaryLight),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          t['label'] as String,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: selected ? AppTheme.primaryBrand : null,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(labelText: 'Page Name *', hintText: 'e.g. Subteen Wear'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _handleCtrl,
            decoration: const InputDecoration(labelText: 'Handle (@username)', hintText: 'subteen_wear'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _categoryCtrl,
            decoration: const InputDecoration(labelText: 'Category', hintText: 'Streetwear & Fashion'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _locationCtrl,
            decoration: const InputDecoration(labelText: 'Location', hintText: 'Udu, Delta State'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descCtrl,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'About / Bio', hintText: 'Tell your community what you offer...'),
          ),
          const SizedBox(height: 20),
          const Text('Enable Page Modules', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          SwitchListTile(
            title: const Text('Shop & Product Catalog', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: const Text('Sell physical or digital items with Bachs checkout', style: TextStyle(fontSize: 12)),
            value: _hasShop,
            activeColor: AppTheme.primaryBrand,
            onChanged: (v) => setState(() => _hasShop = v),
          ),
          SwitchListTile(
            title: const Text('Events & Ticketing', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: const Text('Host events, tournaments, and issue QR tickets', style: TextStyle(fontSize: 12)),
            value: _hasEvents,
            activeColor: AppTheme.primaryBrand,
            onChanged: (v) => setState(() => _hasEvents = v),
          ),
          SwitchListTile(
            title: const Text('Roomy Housing Listings', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: const Text('List verified hostels, apartments, and lodges', style: TextStyle(fontSize: 12)),
            value: _hasRoomy,
            activeColor: AppTheme.primaryBrand,
            onChanged: (v) => setState(() => _hasRoomy = v),
          ),
          SwitchListTile(
            title: const Text('JointheQ Shared Subscriptions', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: const Text('Manage group subscription pools', style: TextStyle(fontSize: 12)),
            value: _hasJointheQ,
            activeColor: AppTheme.primaryBrand,
            onChanged: (v) => setState(() => _hasJointheQ = v),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryBrand,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Launch Page', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}

class PageDetailScreen extends StatefulWidget {
  final String pageId;
  const PageDetailScreen({super.key, required this.pageId});

  @override
  State<PageDetailScreen> createState() => _PageDetailScreenState();
}

class _PageDetailScreenState extends State<PageDetailScreen> with SingleTickerProviderStateMixin {
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
        final page = _repo.pages.firstWhere(
          (p) => p.id == widget.pageId,
          orElse: () => _repo.pages.first,
        );
        final pageProducts = _repo.products.where((pr) => pr.pageId == page.id).toList();
        final pageEvents = _repo.events.where((ev) => ev.pageId == page.id).toList();

        return Scaffold(
          appBar: AppBar(
            title: Text(page.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            actions: [
              IconButton(
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(LucideIcons.shopping_bag),
                    if (_repo.cart.isNotEmpty)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: CircleAvatar(
                          radius: 8,
                          backgroundColor: AppTheme.accentBrand,
                          child: Text(
                            '${_repo.cart.length}',
                            style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                  ],
                ),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
                },
              ),
            ],
          ),
          body: NestedScrollView(
            headerSliverBuilder: (context, _) => [
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      height: 150,
                      width: double.infinity,
                      child: Image.network(
                        page.coverImageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: AppTheme.primaryBrand.withOpacity(0.2)),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 34,
                                backgroundImage: NetworkImage(page.avatarUrl),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            page.name,
                                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                                          ),
                                        ),
                                        if (page.isVerified) ...[
                                          const SizedBox(width: 6),
                                          const Icon(LucideIcons.badge_check, size: 18, color: AppTheme.primaryBrand),
                                        ],
                                      ],
                                    ),
                                    Text('@${page.handle} · ${page.category}', style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 13)),
                                    const SizedBox(height: 4),
                                    Text('${page.followersCount} followers · ${page.location}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(page.description, style: const TextStyle(fontSize: 14, height: 1.4)),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () => _repo.toggleFollowPage(page.id),
                                  icon: Icon(page.isFollowing ? LucideIcons.check : LucideIcons.user_plus, size: 16),
                                  label: Text(page.isFollowing ? 'Following' : 'Follow Page'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: page.isFollowing ? Colors.grey.shade200 : AppTheme.primaryBrand,
                                    foregroundColor: page.isFollowing ? Colors.black87 : Colors.white,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => PageManagementScreen(page: page)));
                                },
                                icon: const Icon(LucideIcons.sliders_horizontal, size: 16),
                                label: const Text('Manage'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    TabBar(
                      controller: _tabController,
                      labelColor: AppTheme.primaryBrand,
                      indicatorColor: AppTheme.primaryBrand,
                      tabs: [
                        Tab(text: 'Shop (${pageProducts.length})'),
                        Tab(text: 'Events (${pageEvents.length})'),
                        const Tab(text: 'Roomy & Q'),
                        const Tab(text: 'About'),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            body: TabBarView(
              controller: _tabController,
              children: [
                // Shop tab
                pageProducts.isEmpty
                    ? const Center(child: Text('No products listed yet.'))
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 0.72,
                        ),
                        itemCount: pageProducts.length,
                        itemBuilder: (context, idx) {
                          final product = pageProducts[idx];
                          return InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product)),
                              );
                            },
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
                                    child: Image.network(
                                      product.imageUrl,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(10),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          product.name,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '₦${product.price.toStringAsFixed(0)}',
                                          style: const TextStyle(
                                            color: AppTheme.primaryBrand,
                                            fontWeight: FontWeight.w800,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        SizedBox(
                                          width: double.infinity,
                                          child: ElevatedButton(
                                            onPressed: () {
                                              _repo.addToCart(product);
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(content: Text('${product.name} added to cart')),
                                              );
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.primaryBrand,
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(vertical: 6),
                                              minimumSize: Size.zero,
                                            ),
                                            child: const Text('Add to Cart', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
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
                      ),

                // Events tab
                pageEvents.isEmpty
                    ? const Center(child: Text('No upcoming events on this page.'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: pageEvents.length,
                        itemBuilder: (context, idx) {
                          final ev = pageEvents[idx];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(12),
                              leading: ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(ev.coverUrl, width: 64, height: 64, fit: BoxFit.cover),
                              ),
                              title: Text(ev.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text('${ev.date} · ${ev.location}\n${ev.isFree ? 'FREE' : '₦${ev.price.toStringAsFixed(0)}'}'),
                              isThreeLine: true,
                              trailing: const Icon(LucideIcons.chevron_right),
                              onTap: () {
                                Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailScreen(event: ev)));
                              },
                            ),
                          );
                        },
                      ),

                // Roomy Housing & JointheQ tab
                ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    const Text('Roomy Verified Housing Listings', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 10),
                    _buildRoomyCard(
                      title: 'Deluxe Self-Contain near Otokutu Junction',
                      price: '₦320,000 / year',
                      specs: '24/7 Borehole · Security Gate · Tiled',
                      badge: 'Roomy Verified',
                    ),
                    _buildRoomyCard(
                      title: '2-Bedroom Flat at DSC Express, Udu',
                      price: '₦550,000 / year',
                      specs: 'POP Ceiling · Prepaid Meter · Parking',
                      badge: 'Roommate Match Available',
                    ),
                    const SizedBox(height: 20),
                    const Text('JointheQ Group Subscriptions', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 10),
                    _buildRoomyCard(
                      title: 'Starlink Community Wi-Fi Share (Udu Hub)',
                      price: '₦8,500 / month',
                      specs: '3/5 slots filled · Unlimited High-Speed',
                      badge: 'JointheQ Pool',
                    ),
                  ],
                ),

                // About tab
                ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    ListTile(
                      leading: const Icon(LucideIcons.map_pin, color: AppTheme.primaryBrand),
                      title: const Text('Location'),
                      subtitle: Text(page.location),
                    ),
                    ListTile(
                      leading: const Icon(LucideIcons.phone, color: AppTheme.primaryBrand),
                      title: const Text('Contact Phone'),
                      subtitle: Text(page.phone ?? '+234 800 LALAO NG'),
                    ),
                    ListTile(
                      leading: const Icon(LucideIcons.globe, color: AppTheme.primaryBrand),
                      title: const Text('Website'),
                      subtitle: Text(page.website ?? 'https://lalao.app/${page.handle}'),
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

  Widget _buildRoomyCard({
    required String title,
    required String price,
    required String specs,
    required String badge,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBrand.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(badge, style: const TextStyle(color: AppTheme.primaryBrand, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
              Text(price, style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.successColor)),
            ],
          ),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 4),
          Text(specs, style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12)),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Inquiry sent for $title!')),
                );
              },
              child: const Text('Book / Join Slot', style: TextStyle(fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }
}

class PageManagementScreen extends StatefulWidget {
  final PageModel page;
  const PageManagementScreen({super.key, required this.page});

  @override
  State<PageManagementScreen> createState() => _PageManagementScreenState();
}

class _PageManagementScreenState extends State<PageManagementScreen> {
  final _repo = MockRepository();

  void _showAddProductDialog() {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final catCtrl = TextEditingController(text: 'Apparel');
    final descCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Shop Product', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Product Name')),
              const SizedBox(height: 10),
              TextField(controller: priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price (₦)')),
              const SizedBox(height: 10),
              TextField(controller: catCtrl, decoration: const InputDecoration(labelText: 'Category')),
              const SizedBox(height: 10),
              TextField(controller: descCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Description')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final price = double.tryParse(priceCtrl.text.trim()) ?? 5000;
              if (nameCtrl.text.trim().isNotEmpty) {
                _repo.addProduct(
                  pageId: widget.page.id,
                  name: nameCtrl.text.trim(),
                  description: descCtrl.text.trim().isEmpty ? 'Official ${widget.page.name} item' : descCtrl.text.trim(),
                  price: price,
                  category: catCtrl.text.trim(),
                );
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Product added to shop!'), backgroundColor: AppTheme.successColor),
                );
              }
            },
            child: const Text('Save Product'),
          ),
        ],
      ),
    );
  }

  void _showAddEventDialog() {
    final titleCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: 'Sat, Dec 12 · 4:00 PM');
    final locCtrl = TextEditingController(text: widget.page.location);
    final priceCtrl = TextEditingController(text: '0');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Page Event', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Event Title')),
              const SizedBox(height: 10),
              TextField(controller: dateCtrl, decoration: const InputDecoration(labelText: 'Date & Time')),
              const SizedBox(height: 10),
              TextField(controller: locCtrl, decoration: const InputDecoration(labelText: 'Venue / Location')),
              const SizedBox(height: 10),
              TextField(controller: priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Ticket Price (₦, 0 for Free)')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final price = double.tryParse(priceCtrl.text.trim()) ?? 0;
              if (titleCtrl.text.trim().isNotEmpty) {
                _repo.createEvent(
                  pageId: widget.page.id,
                  organizerName: widget.page.name,
                  title: titleCtrl.text.trim(),
                  description: 'Hosted by ${widget.page.name}',
                  date: dateCtrl.text.trim(),
                  time: '4:00 PM',
                  location: locCtrl.text.trim(),
                  price: price,
                  category: widget.page.category,
                );
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Event published!'), backgroundColor: AppTheme.successColor),
                );
              }
            },
            child: const Text('Publish Event'),
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
        final products = _repo.products.where((p) => p.pageId == widget.page.id).toList();
        final events = _repo.events.where((e) => e.pageId == widget.page.id).toList();

        return Scaffold(
          appBar: AppBar(
            title: Text('Manage ${widget.page.name}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: _buildMetricTile('Followers', '${widget.page.followersCount}', LucideIcons.users),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildMetricTile('Shop Items', '${products.length}', LucideIcons.shopping_bag),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildMetricTile('Events', '${events.length}', LucideIcons.calendar),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _showAddProductDialog,
                      icon: const Icon(LucideIcons.plus, size: 16),
                      label: const Text('Add Product'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryBrand,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _showAddEventDialog,
                      icon: const Icon(LucideIcons.calendar_plus, size: 16),
                      label: const Text('Add Event'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text('Page Catalog', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 8),
              ...products.map((p) => ListTile(
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(p.imageUrl, width: 44, height: 44, fit: BoxFit.cover),
                    ),
                    title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('₦${p.price.toStringAsFixed(0)} · Stock: ${p.stock}'),
                  )),
              const SizedBox(height: 16),
              const Text('Page Events', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 8),
              ...events.map((e) => ListTile(
                    leading: const Icon(LucideIcons.calendar, color: AppTheme.primaryBrand),
                    title: Text(e.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${e.date} · ${e.attendeesCount} attending'),
                  )),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMetricTile(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.primaryBrand, size: 20),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight)),
        ],
      ),
    );
  }
}
