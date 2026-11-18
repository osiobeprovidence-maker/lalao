import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../theme/app_theme.dart';
import '../../widgets/hamburger_menu.dart';
import 'feed_screen.dart';
import 'explore_screen.dart';
import 'messages_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _currentIndex = 0;

  void _openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      FeedScreen(onOpenDrawer: _openDrawer),
      ExploreScreen(onOpenDrawer: _openDrawer),
      const MessagesScreen(),
      NotificationsScreen(onOpenDrawer: _openDrawer),
      ProfileScreen(onOpenDrawer: _openDrawer),
    ];

    return Scaffold(
      key: _scaffoldKey,
      drawer: HamburgerMenu(
        onNavigateTab: (index) {
          setState(() => _currentIndex = index);
        },
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        indicatorColor: AppTheme.primaryBrand.withOpacity(0.15),
        destinations: const [
          NavigationDestination(
            icon: Icon(LucideIcons.house),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.compass),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.message_square),
            label: 'Messages',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.bell),
            label: 'Alerts',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.user),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
