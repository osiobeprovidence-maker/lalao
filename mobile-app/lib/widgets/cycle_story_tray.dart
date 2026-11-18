import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../data/mock_repository.dart';
import '../theme/app_theme.dart';
import '../screens/main/create_cycle_screen.dart';
import '../screens/main/cycle_viewer_screen.dart';

class CycleStoryTray extends StatelessWidget {
  const CycleStoryTray({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final statuses = repo.statuses;
        return SizedBox(
          height: 110,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            itemCount: statuses.length + 1,
            itemBuilder: (context, idx) {
              if (idx == 0) {
                return GestureDetector(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateCycleScreen()));
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(right: 14),
                    child: Column(
                      children: [
                        Stack(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundImage: NetworkImage(repo.currentUser.avatarUrl),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(3),
                                decoration: const BoxDecoration(
                                  color: AppTheme.primaryBrand,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(LucideIcons.plus, size: 12, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text('Your Cycle', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                );
              }
              final st = statuses[idx - 1];
              return GestureDetector(
                onTap: () {
                  repo.markStatusViewed(st.id);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => CycleViewerScreen(status: st),
                    ),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.only(right: 14),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(2.5),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: st.hasUnviewed
                              ? const LinearGradient(
                                  colors: [AppTheme.primaryBrand, AppTheme.accentBrand],
                                )
                              : null,
                          border: st.hasUnviewed ? null : Border.all(color: Colors.grey.shade400, width: 2),
                        ),
                        child: CircleAvatar(
                          radius: 26,
                          backgroundImage: NetworkImage(st.user.avatarUrl),
                        ),
                      ),
                      const SizedBox(height: 6),
                      SizedBox(
                        width: 64,
                        child: Text(
                          st.user.name.split(' ').first,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
