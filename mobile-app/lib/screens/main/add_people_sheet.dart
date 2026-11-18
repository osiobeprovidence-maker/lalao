import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import 'chat_screen.dart';

class AddPeopleSheet extends StatefulWidget {
  const AddPeopleSheet({super.key});

  /// Helper to open the Add People interface as a modal bottom sheet
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const AddPeopleSheet(),
    );
  }

  @override
  State<AddPeopleSheet> createState() => _AddPeopleSheetState();
}

class _AddPeopleSheetState extends State<AddPeopleSheet> {
  final repo = MockRepository();
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  final bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    repo.addListener(_onRepoChange);
  }

  void _onRepoChange() {
    if (mounted) setState(() {});
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim().toLowerCase();
    if (query != _searchQuery) {
      setState(() {
        _searchQuery = query;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    repo.removeListener(_onRepoChange);
    super.dispose();
  }

  List<User> _getFilteredUsers() {
    final allUsers = repo.allAvailableUsers;
    if (_searchQuery.isEmpty) {
      return allUsers;
    }
    return allUsers.where((u) {
      final matchName = u.name.toLowerCase().contains(_searchQuery);
      final matchUsername = u.username.toLowerCase().contains(_searchQuery);
      final matchBio = u.bio.toLowerCase().contains(_searchQuery);
      final matchLocation = u.location.toLowerCase().contains(_searchQuery);
      return matchName || matchUsername || matchBio || matchLocation;
    }).toList();
  }

  void _handleStartChat(User user) {
    final conversation = repo.getOrCreateConversationWithUser(user);
    Navigator.pop(context);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChatScreen(conversation: conversation),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final users = _getFilteredUsers();
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      height: screenHeight * 0.85,
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Grabber Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Section
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 12, 12),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFF5E43F3).withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.user_plus,
                      color: Color(0xFF5E43F3),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Add People',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Colors.black87,
                            letterSpacing: -0.3,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Find people to start a chat.',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.x,
                      size: 20,
                      color: Color(0xFF6B7280),
                    ),
                    onPressed: () => Navigator.pop(context),
                    tooltip: 'Close',
                  ),
                ],
              ),
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: TextField(
                  controller: _searchController,
                  autofocus: false,
                  style: const TextStyle(fontSize: 14, color: Colors.black87),
                  decoration: InputDecoration(
                    hintText: 'Search people by name or @username...',
                    hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
                    prefixIcon: const Icon(
                      LucideIcons.search,
                      color: Color(0xFF9CA3AF),
                      size: 18,
                    ),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(LucideIcons.x, size: 16),
                            onPressed: () => _searchController.clear(),
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Section Label
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _searchQuery.isEmpty ? 'SUGGESTED PEOPLE' : 'SEARCH RESULTS',
                    style: const TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Text(
                    '${users.length} available',
                    style: const TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 4),

            // Results List
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF5E43F3),
                        strokeWidth: 2.5,
                      ),
                    )
                  : users.isEmpty
                      ? _buildEmptyState()
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          itemCount: users.length,
                          separatorBuilder: (context, index) => const Divider(
                            height: 1,
                            thickness: 1,
                            indent: 64,
                            color: Color(0xFFF3F4F6),
                          ),
                          itemBuilder: (context, index) {
                            return _buildUserTile(users[index]);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserTile(User user) {
    final existingConvo = repo.findConversationWithUser(user.id);
    final hasExistingChat = existingConvo != null;

    return InkWell(
      onTap: () => _handleStartChat(user),
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 10.0),
        child: Row(
          children: [
            // User Avatar with Online Indicator
            Stack(
              clipBehavior: Clip.none,
              children: [
                CircleAvatar(
                  radius: 23,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: user.avatarUrl.isNotEmpty ? NetworkImage(user.avatarUrl) : null,
                  child: user.avatarUrl.isEmpty ? const Icon(LucideIcons.user, size: 24, color: Colors.grey) : null,
                ),
                if (user.isOnline)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),

            // User Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          user.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (user.isVerified) ...[
                        const SizedBox(width: 4),
                        const Icon(Icons.verified, color: Color(0xFF5E43F3), size: 14),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(
                        '@${user.username}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                      if (user.distance != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          width: 3,
                          height: 3,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          user.distance!,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF5E43F3),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (user.bio.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      user.bio,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),

            // Action: Add / Chat
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: hasExistingChat
                    ? const Color(0xFFF3F4F6)
                    : const Color(0xFF5E43F3),
                foregroundColor: hasExistingChat
                    ? Colors.black87
                    : Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              onPressed: () => _handleStartChat(user),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    hasExistingChat ? LucideIcons.message_square : LucideIcons.user_plus,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    hasExistingChat ? 'Chat' : 'Add',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.user_x,
                size: 26,
                color: Color(0xFF9CA3AF),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              _searchQuery.isEmpty
                  ? 'No people found'
                  : 'No results for "$_searchQuery"',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              _searchQuery.isEmpty
                  ? 'When more people join your community, they will appear here.'
                  : 'Try searching by their full name or exact handle.',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF6B7280),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
