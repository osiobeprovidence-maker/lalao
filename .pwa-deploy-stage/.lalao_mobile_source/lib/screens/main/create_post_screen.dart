import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../data/mock_repository.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final TextEditingController _textController = TextEditingController();
  final repo = MockRepository();
  bool _isPosting = false;
  File? _selectedImage;
  String? _location;

  @override
  void initState() {
    super.initState();
    _textController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<bool> _onWillPop() async {
    if (_textController.text.isNotEmpty || _selectedImage != null) {
      final shouldPop = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Discard post?', style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text('Your changes will be lost.'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Keep editing', style: TextStyle(color: Colors.black87)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Discard', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return shouldPop ?? false;
    }
    return true;
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
      });
    }
  }

  void _addLocation() {
    setState(() {
      _location = _location == null ? 'Lagos, Nigeria' : null;
    });
  }

  void _post() async {
    if (_textController.text.isEmpty && _selectedImage == null) return;
    
    setState(() {
      _isPosting = true;
    });

    // Simulate backend upload delay
    await Future.delayed(const Duration(seconds: 2));

    repo.createPost(_textController.text, _selectedImage?.path, _location);

    if (mounted) {
      Navigator.pop(context); // Close composer
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = repo.currentUser;
    final canPost = _textController.text.isNotEmpty || _selectedImage != null;

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          leading: IconButton(
            icon: const Icon(LucideIcons.x, color: Colors.black87),
            onPressed: () async {
              if (await _onWillPop()) {
                Navigator.pop(context);
              }
            },
          ),
          title: const Text('Create Post', style: TextStyle(color: Colors.black87, fontSize: 18, fontWeight: FontWeight.bold)),
          actions: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: ElevatedButton(
                onPressed: canPost && !_isPosting ? _post : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF5E43F3),
                  disabledBackgroundColor: const Color(0xFF5E43F3).withOpacity(0.5),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: _isPosting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Post', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: Colors.grey[200],
                        backgroundImage: user.avatarUrl.isNotEmpty ? NetworkImage(user.avatarUrl) : null,
                        child: user.avatarUrl.isEmpty ? const Icon(LucideIcons.user, color: Colors.grey) : null,
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              if (user.isVerified) ...[
                                const SizedBox(width: 4),
                                const Icon(Icons.verified, color: Colors.blue, size: 14),
                              ]
                            ],
                          ),
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade300),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Text('Everyone', style: TextStyle(color: Color(0xFF5E43F3), fontSize: 12, fontWeight: FontWeight.bold)),
                                SizedBox(width: 4),
                                Icon(LucideIcons.chevron_down, size: 14, color: Color(0xFF5E43F3)),
                              ],
                            ),
                          )
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _textController,
                    maxLines: null,
                    textInputAction: TextInputAction.newline,
                    decoration: const InputDecoration(
                      hintText: "What's happening?",
                      hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 18),
                      border: InputBorder.none,
                    ),
                    style: const TextStyle(fontSize: 18, color: Colors.black87),
                  ),
                  if (_selectedImage != null) ...[
                    const SizedBox(height: 16),
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(_selectedImage!, width: double.infinity, fit: BoxFit.cover),
                        ),
                        Positioned(
                          top: 8, right: 8,
                          child: GestureDetector(
                            onTap: () => setState(() => _selectedImage = null),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                              child: const Icon(LucideIcons.x, color: Colors.white, size: 18),
                            ),
                          ),
                        )
                      ],
                    )
                  ],
                  if (_location != null) ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(LucideIcons.map_pin, size: 16, color: Color(0xFF5E43F3)),
                        const SizedBox(width: 8),
                        Text(_location!, style: const TextStyle(color: Color(0xFF5E43F3), fontWeight: FontWeight.bold)),
                        const Spacer(),
                        IconButton(icon: const Icon(LucideIcons.x, size: 18, color: Colors.grey), onPressed: _addLocation),
                      ],
                    )
                  ]
                ],
              ),
            ),
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFF3F4F6))),
                color: Colors.white,
              ),
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
              child: Row(
                children: [
                  IconButton(icon: const Icon(LucideIcons.image, color: Color(0xFF5E43F3)), onPressed: _pickImage),
                  IconButton(icon: const Icon(LucideIcons.map_pin, color: Color(0xFF5E43F3)), onPressed: _addLocation),
                  IconButton(icon: const Icon(LucideIcons.list, color: Color(0xFF5E43F3)), onPressed: () {}),
                  const Spacer(),
                  Padding(
                    padding: const EdgeInsets.only(right: 16.0),
                    child: Text('${_textController.text.length}/280', style: TextStyle(color: _textController.text.length > 280 ? Colors.red : Colors.grey)),
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
