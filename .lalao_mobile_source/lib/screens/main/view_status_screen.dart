import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'dart:io';
import '../../data/mock_repository.dart';

class ViewStatusScreen extends StatefulWidget {
  final UserStatus status;
  const ViewStatusScreen({super.key, required this.status});

  @override
  State<ViewStatusScreen> createState() => _ViewStatusScreenState();
}

class _ViewStatusScreenState extends State<ViewStatusScreen> with SingleTickerProviderStateMixin {
  late AnimationController _progressController;

  @override
  void initState() {
    super.initState();
    MockRepository().markStatusViewed(widget.status.id);
    _progressController = AnimationController(vsync: this, duration: const Duration(seconds: 5));
    _progressController.forward();
    _progressController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        if (mounted) Navigator.pop(context);
      }
    });
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: (_) => _progressController.stop(),
        onTapUp: (_) => _progressController.forward(),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Status Content
            if (widget.status.imageUrl != null)
              widget.status.imageUrl!.startsWith('http')
                  ? Image.network(widget.status.imageUrl!, fit: BoxFit.cover)
                  : Image.file(File(widget.status.imageUrl!), fit: BoxFit.cover)
            else
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [const Color(0xFF5E43F3), Colors.purple.shade700],
                  )
                ),
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      widget.status.text ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),

            // Top Gradient overlay
            Positioned(
              top: 0, left: 0, right: 0,
              height: 120,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black54, Colors.transparent]),
                ),
              ),
            ),

            // Progress Bar
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 8, right: 8,
              child: AnimatedBuilder(
                animation: _progressController,
                builder: (context, child) {
                  return LinearProgressIndicator(
                    value: _progressController.value,
                    backgroundColor: Colors.white.withOpacity(0.3),
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                    minHeight: 2,
                    borderRadius: BorderRadius.circular(1),
                  );
                },
              ),
            ),

            // Header info
            Positioned(
              top: MediaQuery.of(context).padding.top + 24,
              left: 16, right: 16,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20, backgroundColor: Colors.grey[800],
                    backgroundImage: widget.status.user.avatarUrl.isNotEmpty ? NetworkImage(widget.status.user.avatarUrl) : null,
                    child: widget.status.user.avatarUrl.isEmpty ? const Icon(LucideIcons.user, color: Colors.white) : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.status.user.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                        Text('Just now', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.more_vertical, color: Colors.white),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            
            // Bottom Action Bar (if text overlay exists on image)
            if (widget.status.imageUrl != null && widget.status.text != null && widget.status.text!.isNotEmpty)
              Positioned(
                bottom: MediaQuery.of(context).padding.bottom + 24,
                left: 16, right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(12)
                  ),
                  child: Text(
                    widget.status.text!,
                    style: const TextStyle(color: Colors.white, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
