import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'dart:ui';
import 'feed_screen.dart';
import 'messages_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'create_post_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const FeedScreen(),
    const MessagesScreen(),
    const SizedBox(), // Placeholder for Create
    const NotificationsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true, 
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: _buildCustomBottomNav(),
    );
  }

  void _handleCreate() {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostScreen()));
  }

  Widget _buildCustomBottomNav() {
    return Container(
      color: Colors.transparent,
      height: 80 + MediaQuery.of(context).padding.bottom + 16,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          Positioned(
            left: 0, right: 0, bottom: 0,
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  height: 80 + MediaQuery.of(context).padding.bottom,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.95),
                    border: const Border(top: BorderSide(color: Color(0xFFF5F5F5), width: 1)),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF0F172A).withOpacity(0.06), offset: const Offset(0, -8), blurRadius: 24),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            left: 0, right: 0, bottom: 0,
            child: Container(
              height: 80 + MediaQuery.of(context).padding.bottom,
              padding: EdgeInsets.only(left: 24, right: 24, top: 8, bottom: 8 + MediaQuery.of(context).padding.bottom),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  _buildNavItem(0, LucideIcons.house, 'Home'),
                  _buildNavItem(1, LucideIcons.message_square, 'Messages'),
                  const SizedBox(width: 52),
                  _buildNavItem(3, LucideIcons.heart, 'Notifications'),
                  _buildNavItem(4, LucideIcons.user, 'Profile'),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 30 + MediaQuery.of(context).padding.bottom,
            child: _buildCenterCreateButton(),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData outlineIcon, String label) {
    final isActive = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(outlineIcon, color: isActive ? const Color(0xFF5E43F3) : const Color(0xFF737373), size: isActive ? 28 : 26),
            const SizedBox(height: 4),
            Container(width: 6, height: 6, decoration: BoxDecoration(color: isActive ? const Color(0xFF5E43F3) : Colors.transparent, shape: BoxShape.circle)),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterCreateButton() {
    return GestureDetector(
      onTap: _handleCreate,
      child: Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          color: const Color(0xFF5E43F3),
          shape: BoxShape.circle,
          boxShadow: [BoxShadow(color: const Color(0xFF5E43F3).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: const Icon(LucideIcons.plus, color: Colors.white, size: 32),
      ),
    );
  }
}
