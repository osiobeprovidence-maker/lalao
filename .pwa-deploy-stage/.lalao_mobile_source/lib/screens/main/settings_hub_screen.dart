import 'package:flutter/material.dart';
import '../../data/mock_repository.dart';
import '../../widgets/settings_row_item.dart';

class SettingsHubScreen extends StatefulWidget {
  const SettingsHubScreen({super.key});

  @override
  State<SettingsHubScreen> createState() => _SettingsHubScreenState();
}

class _SettingsHubScreenState extends State<SettingsHubScreen> {
  final repo = MockRepository();

  int radiusKm = 5;
  String theme = 'System';
  List<String> selectedFeeds = ['Gaming', 'Anime'];
  bool publicVisibility = true;
  bool activeStoryIndicator = true;
  String kycStatus = 'Not verified';

  @override
  Widget build(BuildContext context) {
    const primaryPurple = Color(0xFF5E43F3);
    final user = repo.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Settings & Profile',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              'Select a category to manage',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 11),
            ),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Profile Card Banner
          InkWell(
            onTap: () => _openProfileDetails(context, user),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: primaryPurple.withOpacity(0.25)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.grey[200],
                    backgroundImage:
                        user.avatarUrl.isNotEmpty ? NetworkImage(user.avatarUrl) : null,
                    child: user.avatarUrl.isEmpty
                        ? const Icon(Icons.person, color: Colors.grey, size: 28)
                        : null,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        Text(
                          '@${user.username}',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Edit Profile Details & Photo →',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: primaryPurple,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Section 1: Profile & Identity
          _buildSectionHeader('PROFILE & IDENTITY'),
          SettingsRowItem(
            icon: Icons.person_outline,
            title: 'Profile Details',
            description: 'Photo, display name, handle, public identity, bio & birthday',
            onTap: () => _openProfileDetails(context, user),
          ),
          const SizedBox(height: 20),

          // Section 2: Content & Exploration
          _buildSectionHeader('CONTENT & EXPLORATION'),
          SettingsRowItem(
            icon: Icons.tune,
            title: 'Feed & Content Discovery',
            description: 'Feed category tabs and personalized story topics',
            statusText: '${selectedFeeds.length} active',
            onTap: () => _openFeedDiscovery(context),
          ),
          const SizedBox(height: 10),
          SettingsRowItem(
            icon: Icons.near_me_outlined,
            title: 'Community Radius & Discovery',
            description: 'Filter stories and rallies by distance from you',
            statusText: '$radiusKm km',
            badge: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: primaryPurple.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$radiusKm km',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: primaryPurple,
                ),
              ),
            ),
            onTap: () => _openRadiusSelector(context),
          ),
          const SizedBox(height: 10),
          SettingsRowItem(
            icon: Icons.notifications_none,
            title: 'Notifications',
            description: 'Messages, comments, reactions, new followers & push alerts',
            onTap: () => _openNotifications(context),
          ),
          const SizedBox(height: 10),
          SettingsRowItem(
            icon: Icons.palette_outlined,
            title: 'Appearance',
            description: 'Theme display mode (Light, Dark, or Automatic)',
            statusText: theme,
            onTap: () => _openAppearance(context),
          ),
          const SizedBox(height: 20),

          // Section 3: Privacy & Security
          _buildSectionHeader('PRIVACY & SECURITY'),
          SettingsRowItem(
            icon: Icons.shield_outlined,
            title: 'Privacy & Community Safety',
            description: 'Profile visibility, active story indicator & location privacy',
            onTap: () => _openPrivacySafety(context),
          ),
          const SizedBox(height: 10),
          SettingsRowItem(
            icon: Icons.lock_outline,
            title: 'Security & Authentication',
            description: 'Registered phone number & session protection',
            statusText: 'Protected',
            onTap: () => _openSecurity(context),
          ),
          const SizedBox(height: 20),

          // Section 4: Creator & Verification
          _buildSectionHeader('CREATOR & VERIFICATION'),
          SettingsRowItem(
            icon: Icons.verified_outlined,
            title: 'Verification & Creator Subscriptions',
            description: 'Verified badge, Creator Hub monetization & audience analytics',
            statusText: 'Standard',
            onTap: () => _openCreatorSubscriptions(context),
          ),
          const SizedBox(height: 10),
          SettingsRowItem(
            icon: Icons.badge_outlined,
            title: 'KYC / Verification',
            description: 'Government ID & official identity verification review',
            statusText: kycStatus,
            badge: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                kycStatus,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
            ),
            onTap: () => _openKyc(context),
          ),
          const SizedBox(height: 20),

          // Section 5: App & Session
          _buildSectionHeader('APP & SESSION'),
          SettingsRowItem(
            icon: Icons.logout,
            title: 'Log Out from Lalao',
            description: 'Sign out of your active account session',
            isDestructive: true,
            onTap: () {
              Navigator.pop(context);
            },
          ),
          const SizedBox(height: 32),

          // Footer
          const Center(
            child: Column(
              children: [
                Text(
                  'Lalao Community Mobile',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
                ),
                SizedBox(height: 2),
                Text(
                  'Version 2.4.0 (Warri & Delta State Edition)',
                  style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          color: Color(0xFF9CA3AF),
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.1,
        ),
      ),
    );
  }

  void _openProfileDetails(BuildContext context, User user) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _ProfileDetailsScreen(user: user),
      ),
    );
  }

  void _openFeedDiscovery(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _FeedDiscoveryScreen(
          selectedFeeds: selectedFeeds,
          onChanged: (feeds) => setState(() => selectedFeeds = feeds),
        ),
      ),
    );
  }

  void _openRadiusSelector(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _CommunityRadiusScreen(
          currentRadius: radiusKm,
          onSelected: (km) => setState(() => radiusKm = km),
        ),
      ),
    );
  }

  void _openNotifications(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const _NotificationsScreen(),
      ),
    );
  }

  void _openAppearance(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _AppearanceScreen(
          currentTheme: theme,
          onSelected: (t) => setState(() => theme = t),
        ),
      ),
    );
  }

  void _openPrivacySafety(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _PrivacySafetyScreen(
          publicVisibility: publicVisibility,
          activeStoryIndicator: activeStoryIndicator,
          onChanged: (vis, story) {
            setState(() {
              publicVisibility = vis;
              activeStoryIndicator = story;
            });
          },
        ),
      ),
    );
  }

  void _openSecurity(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const _SecurityScreen(),
      ),
    );
  }

  void _openCreatorSubscriptions(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const _CreatorSubscriptionsScreen(),
      ),
    );
  }

  void _openKyc(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _KycScreen(
          kycStatus: kycStatus,
          onStatusChange: (status) => setState(() => kycStatus = status),
        ),
      ),
    );
  }
}

// ---------------- SUBPAGES ---------------- //

class _ProfileDetailsScreen extends StatefulWidget {
  final User user;
  const _ProfileDetailsScreen({required this.user});

  @override
  State<_ProfileDetailsScreen> createState() => _ProfileDetailsScreenState();
}

class _ProfileDetailsScreenState extends State<_ProfileDetailsScreen> {
  late TextEditingController _nameController;
  late TextEditingController _usernameController;
  late TextEditingController _bioController;
  late TextEditingController _locationController;
  String _identityType = 'both'; // 'display_name', 'username', 'both'
  String _dobVisibility = 'private';

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user.name);
    _usernameController = TextEditingController(text: widget.user.username);
    _bioController = TextEditingController(text: widget.user.bio);
    _locationController = TextEditingController(text: widget.user.location);
  }

  @override
  Widget build(BuildContext context) {
    const primaryPurple = Color(0xFF5E43F3);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Profile Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.black87)),
        actions: [
          TextButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile details saved successfully!')),
              );
              Navigator.pop(context);
            },
            child: const Text('Save', style: TextStyle(color: primaryPurple, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 46,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: widget.user.avatarUrl.isNotEmpty ? NetworkImage(widget.user.avatarUrl) : null,
                  child: widget.user.avatarUrl.isEmpty ? const Icon(Icons.person, size: 46, color: Colors.grey) : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(color: primaryPurple, shape: BoxShape.circle),
                    child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Display Name', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _usernameController,
            decoration: const InputDecoration(labelText: 'Username', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 20),

          // Public Identity Display Choice
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Public Identity Display', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                const Text('Choose label shown across posts and discovery', style: TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildIdentityChoice('display_name', 'Name'),
                    const SizedBox(width: 8),
                    _buildIdentityChoice('username', 'Username'),
                    const SizedBox(width: 8),
                    _buildIdentityChoice('both', 'Both'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _bioController,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Bio', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _locationController,
            decoration: const InputDecoration(labelText: 'Neighborhood / Area', border: OutlineInputBorder(), prefixIcon: Icon(Icons.location_on_outlined)),
          ),
          const SizedBox(height: 20),

          // Birthday & Visibility
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.cake_outlined, size: 18, color: primaryPurple),
                    SizedBox(width: 6),
                    Text('Date of Birth & Privacy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildDobChoice('private', 'Private'),
                    const SizedBox(width: 8),
                    _buildDobChoice('age_only', 'Age Only'),
                    const SizedBox(width: 8),
                    _buildDobChoice('public', 'Public'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile details saved successfully!')),
              );
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryPurple,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Save Profile Details', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildIdentityChoice(String type, String label) {
    const primaryPurple = Color(0xFF5E43F3);
    final isSelected = _identityType == type;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _identityType = type),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? primaryPurple.withOpacity(0.1) : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? primaryPurple : const Color(0xFFD1D5DB)),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? primaryPurple : Colors.black87,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDobChoice(String val, String label) {
    const primaryPurple = Color(0xFF5E43F3);
    final isSelected = _dobVisibility == val;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _dobVisibility = val),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? primaryPurple.withOpacity(0.1) : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? primaryPurple : const Color(0xFFD1D5DB)),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? primaryPurple : Colors.black87,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FeedDiscoveryScreen extends StatelessWidget {
  final List<String> selectedFeeds;
  final ValueChanged<List<String>> onChanged;

  const _FeedDiscoveryScreen({required this.selectedFeeds, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    const primaryPurple = Color(0xFF5E43F3);
    final allFeeds = ['Gaming', 'Anime', 'STEM', 'Drama'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Feed & Content Discovery', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Feed Categories', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 6),
          const Text('Select category tabs to browse on your home feed', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: allFeeds.map((feed) {
              final isSelected = selectedFeeds.contains(feed);
              return FilterChip(
                label: Text(feed),
                selected: isSelected,
                selectedColor: primaryPurple.withOpacity(0.15),
                checkmarkColor: primaryPurple,
                labelStyle: TextStyle(
                  color: isSelected ? primaryPurple : Colors.black87,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
                onSelected: (selected) {
                  final next = List<String>.from(selectedFeeds);
                  if (selected) {
                    next.add(feed);
                  } else {
                    next.remove(feed);
                  }
                  onChanged(next);
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _CommunityRadiusScreen extends StatelessWidget {
  final int currentRadius;
  final ValueChanged<int> onSelected;

  const _CommunityRadiusScreen({required this.currentRadius, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    const primaryPurple = Color(0xFF5E43F3);
    final radii = [2, 5, 10, 25, 50];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Community Radius', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Discovery Distance Filter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 6),
          const Text('Filter stories and rallies within distance of you', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
          const SizedBox(height: 16),
          Row(
            children: radii.map((km) {
              final isSelected = currentRadius == km;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ElevatedButton(
                    onPressed: () => onSelected(km),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isSelected ? primaryPurple : Colors.grey[200],
                      foregroundColor: isSelected ? Colors.white : Colors.black87,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('${km}km', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _AppearanceScreen extends StatelessWidget {
  final String currentTheme;
  final ValueChanged<String> onSelected;

  const _AppearanceScreen({required this.currentTheme, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    final themes = ['Light', 'Dark', 'System'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appearance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: ListView(
        children: themes.map((t) {
          return RadioListTile<String>(
            title: Text(t, style: const TextStyle(fontWeight: FontWeight.bold)),
            value: t,
            groupValue: currentTheme,
            onChanged: (val) {
              if (val != null) onSelected(val);
            },
          );
        }).toList(),
      ),
    );
  }
}

class _NotificationsScreen extends StatelessWidget {
  const _NotificationsScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: ListView(
        children: const [
          SwitchListTile(value: true, onChanged: null, title: Text('Push Notifications')),
          SwitchListTile(value: true, onChanged: null, title: Text('Direct Messages')),
          SwitchListTile(value: true, onChanged: null, title: Text('Comments & Mentions')),
          SwitchListTile(value: true, onChanged: null, title: Text('Follow Alerts')),
        ],
      ),
    );
  }
}

class _PrivacySafetyScreen extends StatelessWidget {
  final bool publicVisibility;
  final bool activeStoryIndicator;
  final Function(bool, bool) onChanged;

  const _PrivacySafetyScreen({
    required this.publicVisibility,
    required this.activeStoryIndicator,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy & Community Safety', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: ListView(
        children: [
          SwitchListTile(
            value: publicVisibility,
            onChanged: (v) => onChanged(v, activeStoryIndicator),
            title: const Text('Public Community Profile'),
            subtitle: const Text('Allow local members to view your posts'),
          ),
          SwitchListTile(
            value: activeStoryIndicator,
            onChanged: (v) => onChanged(publicVisibility, v),
            title: const Text('Active Story Indicator'),
            subtitle: const Text('Show colorful ring when 24h cycle is active'),
          ),
        ],
      ),
    );
  }
}

class _SecurityScreen extends StatelessWidget {
  const _SecurityScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Security & Authentication', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: const Padding(
        padding: EdgeInsets.all(16.0),
        child: Text('Session protected with encrypted token verification.'),
      ),
    );
  }
}

class _CreatorSubscriptionsScreen extends StatelessWidget {
  const _CreatorSubscriptionsScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verification & Subscriptions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: const Padding(
        padding: EdgeInsets.all(16.0),
        child: Text('Manage your verified status, badges, and monetization options.'),
      ),
    );
  }
}

class _KycScreen extends StatelessWidget {
  final String kycStatus;
  final ValueChanged<String> onStatusChange;

  const _KycScreen({required this.kycStatus, required this.onStatusChange});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KYC Verification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Current Status: $kycStatus', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                onStatusChange('In progress');
                Navigator.pop(context);
              },
              child: const Text('Start / Continue KYC'),
            ),
          ],
        ),
      ),
    );
  }
}
