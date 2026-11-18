import 'package:flutter/material.dart';
import '../../data/mock_repository.dart'; // Using mock data for now

class CycleViewerScreen extends StatefulWidget {
  final UserStatus status;
  
  const CycleViewerScreen({super.key, required this.status});

  @override
  State<CycleViewerScreen> createState() => _CycleViewerScreenState();
}

class _CycleViewerScreenState extends State<CycleViewerScreen> with SingleTickerProviderStateMixin {
  late AnimationController _progressController;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..addListener(() {
        setState(() {});
      })
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          Navigator.pop(context);
        }
      });
      
    _progressController.forward();
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    final double screenWidth = MediaQuery.of(context).size.width;
    final double dx = details.globalPosition.dx;
    
    if (dx < screenWidth / 3) {
      // Tap left: go back (for now just resets)
      _progressController.value = 0;
      _progressController.forward();
    } else {
      // Tap right: go forward (for now just close)
      Navigator.pop(context);
    }
  }

  void _onLongPressDown(details) {
    _progressController.stop();
  }

  void _onLongPressUp() {
    _progressController.forward();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: GestureDetector(
          onTapDown: _onTapDown,
          onLongPressDown: _onLongPressDown,
          onLongPressUp: _onLongPressUp,
          onVerticalDragUpdate: (details) {
            if (details.delta.dy > 8) {
              Navigator.pop(context);
            }
          },
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Cycle Content (Mocking a colorful background with text)
              Container(
                color: Colors.purple,
                child: const Center(
                  child: Text(
                    "This is a Cycle!",
                    style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              
              // Progress Bar & Header
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: Column(
                  children: [
                    LinearProgressIndicator(
                      value: _progressController.value,
                      backgroundColor: Colors.white.withOpacity(0.3),
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundImage: widget.status.user.avatarUrl.isNotEmpty 
                              ? NetworkImage(widget.status.user.avatarUrl) 
                              : null,
                          child: widget.status.user.avatarUrl.isEmpty 
                              ? const Icon(Icons.person, size: 20) 
                              : null,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          widget.status.user.name,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          "2h", // Mock time
                          style: TextStyle(color: Colors.white70),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
