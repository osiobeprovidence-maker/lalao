import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../theme/app_theme.dart';
import '../../data/mock_repository.dart';
import '../main/main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Modes: 'signin', 'signup', 'otp', 'forgot', 'onboarding'
  String _mode = 'signin';
  int _onboardingStep = 0;

  final _emailController = TextEditingController(text: 'providence@lalao.app');
  final _passwordController = TextEditingController(text: '••••••••');
  final _nameController = TextEditingController();
  final _handleController = TextEditingController();
  final _phoneController = TextEditingController(text: '+234 803 000 0000');
  final _otpController = TextEditingController(text: '482910');
  String _selectedCity = 'Udu';
  final Set<String> _selectedInterests = {'Afrobeats & Sounds', 'Streetwear & Shop', 'Tech & Startups'};

  void _enterApp() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
    );
  }

  void _completeSignupAndOnboarding() {
    final repo = MockRepository();
    if (_nameController.text.trim().isNotEmpty) {
      repo.updateCurrentUser(
        name: _nameController.text.trim(),
        handle: _handleController.text.trim().isEmpty
            ? _nameController.text.trim().toLowerCase().replaceAll(' ', '_')
            : _handleController.text.trim(),
        location: _selectedCity,
      );
    }
    _enterApp();
  }

  @override
  Widget build(BuildContext context) {
    if (_mode == 'onboarding') {
      return _buildOnboardingWizard();
    }

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 28.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              Center(
                child: Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primaryBrand, AppTheme.secondaryBrand],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryBrand.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(LucideIcons.flame, size: 36, color: Colors.white),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                _mode == 'signin'
                    ? 'Welcome to Lalao'
                    : (_mode == 'signup'
                        ? 'Create Your Lalao Account'
                        : (_mode == 'otp' ? 'Verify Your Phone / Email' : 'Reset Your Password')),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displayMedium?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 6),
              Text(
                'Hyper-local social, Rallies, Bachs Wallet, VTU & Creator Economy.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondaryLight),
              ),
              const SizedBox(height: 28),

              if (_mode == 'signin') ...[
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email, Phone or @Handle',
                    prefixIcon: Icon(LucideIcons.mail, size: 20),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(LucideIcons.lock, size: 20),
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => setState(() => _mode = 'forgot'),
                    child: const Text('Forgot Password?'),
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: _enterApp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBrand,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Sign In to Lalao', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 12),
                // Playsole One SSO Button
                OutlinedButton.icon(
                  onPressed: _enterApp,
                  icon: const Icon(LucideIcons.sparkles, color: AppTheme.primaryBrand, size: 18),
                  label: const Text('Continue with Playsole One SSO', style: TextStyle(fontWeight: FontWeight.w700)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppTheme.primaryBrand),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Don't have an account?"),
                    TextButton(
                      onPressed: () => setState(() => _mode = 'signup'),
                      child: const Text('Sign Up', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ] else if (_mode == 'signup') ...[
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: Icon(LucideIcons.user, size: 20),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _handleController,
                  decoration: const InputDecoration(
                    labelText: 'Username (@handle)',
                    prefixIcon: Icon(LucideIcons.at_sign, size: 20),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    prefixIcon: Icon(LucideIcons.phone, size: 20),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email Address',
                    prefixIcon: Icon(LucideIcons.mail, size: 20),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Create Password',
                    prefixIcon: Icon(LucideIcons.lock, size: 20),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => setState(() => _mode = 'otp'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBrand,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Continue & Verify OTP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
                TextButton(
                  onPressed: () => setState(() => _mode = 'signin'),
                  child: const Text('Already have an account? Sign In'),
                ),
              ] else if (_mode == 'otp') ...[
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                  decoration: const InputDecoration(labelText: '6-Digit Verification Code'),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => setState(() {
                    _mode = 'onboarding';
                    _onboardingStep = 0;
                  }),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBrand,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Verify & Start Onboarding', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ] else if (_mode == 'forgot') ...[
                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Registered Email or Phone',
                    prefixIcon: Icon(LucideIcons.mail, size: 20),
                  ),
                ),
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Password reset code sent!'),
                        backgroundColor: AppTheme.successColor,
                      ),
                    );
                    setState(() => _mode = 'signin');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBrand,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Send Reset Link'),
                ),
                TextButton(
                  onPressed: () => setState(() => _mode = 'signin'),
                  child: const Text('Back to Sign In'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOnboardingWizard() {
    final cities = ['Udu', 'Warri', 'Effurun', 'Asaba', 'Benin City', 'Lagos', 'Abuja', 'Port Harcourt'];
    final interests = [
      'Afrobeats & Sounds',
      'Streetwear & Shop',
      'Tech & Startups',
      'Football & Sports',
      'Local Events & Nightlife',
      'Roomy Housing',
      'Crypto & Web3',
      'Plum 18+ Dating',
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text('Setup Step ${_onboardingStep + 1} of 3', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          TextButton(
            onPressed: _completeSignupAndOnboarding,
            child: const Text('Skip'),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            LinearProgressIndicator(
              value: (_onboardingStep + 1) / 3,
              color: AppTheme.primaryBrand,
              backgroundColor: AppTheme.primaryBrand.withOpacity(0.15),
            ),
            const SizedBox(height: 24),
            if (_onboardingStep == 0) ...[
              const Text('Where is your local hub?', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              const Text('Lalao connects you with Rallies, Events, and Shops within your neighborhood radius.'),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: cities.map((c) {
                  final sel = _selectedCity == c;
                  return ChoiceChip(
                    label: Text(c),
                    selected: sel,
                    selectedColor: AppTheme.primaryBrand.withOpacity(0.2),
                    onSelected: (_) => setState(() => _selectedCity = c),
                  );
                }).toList(),
              ),
            ] else if (_onboardingStep == 1) ...[
              const Text('Pick your vibe & interests', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              const Text('We’ll personalize your For You feed, Live Rooms, and Creator rankings.'),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: interests.map((item) {
                  final sel = _selectedInterests.contains(item);
                  return FilterChip(
                    label: Text(item),
                    selected: sel,
                    selectedColor: AppTheme.primaryBrand.withOpacity(0.2),
                    onSelected: (v) {
                      setState(() {
                        if (v) {
                          _selectedInterests.add(item);
                        } else {
                          _selectedInterests.remove(item);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
            ] else ...[
              const Icon(LucideIcons.party_popper, size: 64, color: AppTheme.primaryBrand),
              const SizedBox(height: 16),
              const Text(
                'You’re all set for Lalao!',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 10),
              Text(
                'Your $_selectedCity feed, Bachs Wallet, and +100 Welcome Reward Points are ready.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textSecondaryLight),
              ),
            ],
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                if (_onboardingStep < 2) {
                  setState(() => _onboardingStep++);
                } else {
                  _completeSignupAndOnboarding();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryBrand,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(
                _onboardingStep < 2 ? 'Next Step' : 'Enter Lalao Now',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
