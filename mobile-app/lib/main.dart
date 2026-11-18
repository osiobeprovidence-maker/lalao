import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/main/main_navigation_screen.dart';
import 'data/mock_repository.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LalaoApp());
}

class LalaoApp extends StatelessWidget {
  const LalaoApp({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        return MaterialApp(
          title: 'Lalao',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: repo.themeMode,
          home: const MainNavigationScreen(),
        );
      },
    );
  }
}
