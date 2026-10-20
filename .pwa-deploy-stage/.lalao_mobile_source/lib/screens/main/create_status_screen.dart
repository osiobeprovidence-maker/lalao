import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../data/mock_repository.dart';

class CreateStatusScreen extends StatefulWidget {
  const CreateStatusScreen({super.key});

  @override
  State<CreateStatusScreen> createState() => _CreateStatusScreenState();
}

class _CreateStatusScreenState extends State<CreateStatusScreen> {
  final TextEditingController _textController = TextEditingController();
  final repo = MockRepository();
  bool _isPosting = false;
  File? _selectedImage;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
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

  void _post() async {
    if (_textController.text.isEmpty && _selectedImage == null) return;
    
    setState(() {
      _isPosting = true;
    });

    await Future.delayed(const Duration(seconds: 2));

    repo.createStatus(_selectedImage?.path, _textController.text);

    if (mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Background/Media layer
          if (_selectedImage != null)
            Positioned.fill(
              child: Image.file(_selectedImage!, fit: BoxFit.cover),
            )
          else
            Positioned.fill(
              child: Container(
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
                    child: TextField(
                      controller: _textController,
                      textAlign: TextAlign.center,
                      maxLines: null,
                      style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                      decoration: const InputDecoration(
                        hintText: 'Type a status',
                        hintStyle: TextStyle(color: Colors.white54),
                        border: InputBorder.none,
                      ),
                      onChanged: (v) => setState((){}),
                    ),
                  ),
                ),
              ),
            ),

          // Top Header
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 16, right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                    child: const Icon(LucideIcons.x, color: Colors.white),
                  ),
                ),
                if (_selectedImage != null)
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                      child: const Icon(LucideIcons.image, color: Colors.white),
                    ),
                  )
              ],
            ),
          ),

          // Bottom Action Bar
          Positioned(
            bottom: MediaQuery.of(context).padding.bottom + 16,
            right: 16, left: 16,
            child: Row(
              children: [
                if (_selectedImage == null)
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                      child: const Icon(LucideIcons.image, color: Colors.white),
                    ),
                  )
                else
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Add a caption...',
                        hintStyle: const TextStyle(color: Colors.white70),
                        filled: true,
                        fillColor: Colors.black45,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      ),
                      onChanged: (v) => setState((){}),
                    ),
                  ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: (_textController.text.isNotEmpty || _selectedImage != null) && !_isPosting ? _post : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF5E43F3),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  ),
                  child: _isPosting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Share', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
