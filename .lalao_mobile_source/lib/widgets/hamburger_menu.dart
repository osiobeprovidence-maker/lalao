import 'package:flutter/material.dart';

class HamburgerMenu extends StatelessWidget {
  const HamburgerMenu({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  CircleAvatar(radius: 24, backgroundColor: Colors.grey[200], child: const Icon(Icons.person, color: Colors.grey)),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Providence Osiobe', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('@rider ezzy', style: TextStyle(color: Color(0xFF6B7280), fontSize: 14)),
                    ],
                  )
                ],
              ),
            ),
            const Divider(color: Color(0xFFF3F4F6)),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildSectionHeader('MAIN'),
                  _buildMenuItem(Icons.home_outlined, 'Home'),
                  _buildMenuItem(Icons.explore_outlined, 'Explore'),
                  _buildMenuItem(Icons.chat_bubble_outline, 'Messages'),
                  _buildMenuItem(Icons.notifications_none, 'Notifications'),
                  _buildMenuItem(Icons.person_outline, 'Profile'),
                  
                  _buildSectionHeader('ACCOUNT'),
                  _buildMenuItem(Icons.account_balance_wallet_outlined, 'Wallet'),
                  _buildMenuItem(Icons.history, 'Order History'),
                  
                  _buildSectionHeader('MY PAGES'),
                  _buildMenuItem(Icons.pages_outlined, 'My Pages'),
                  _buildMenuItem(Icons.add_box_outlined, 'Create Page'),
                  
                  _buildSectionHeader('DISCOVER'),
                  _buildMenuItem(Icons.people_outline, 'Following'),
                  _buildMenuItem(Icons.bookmark_border, 'Saved'),
                  _buildMenuItem(Icons.favorite_border, 'Liked'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 16, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title) {
    return ListTile(
      leading: Icon(icon, color: Colors.black87),
      title: Text(title, style: const TextStyle(fontSize: 16, color: Colors.black87)),
      onTap: () {},
      dense: true,
      visualDensity: const VisualDensity(vertical: -2),
    );
  }
}
