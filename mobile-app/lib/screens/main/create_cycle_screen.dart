import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../data/mock_repository.dart';

class CreateCycleScreen extends StatefulWidget {
  const CreateCycleScreen({super.key});

  @override
  State<CreateCycleScreen> createState() => _CreateCycleScreenState();
}

class _CreateCycleScreenState extends State<CreateCycleScreen> {
  final TextEditingController _textController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  String? _imagePath;
  Color _backgroundColor = Colors.purple;

  final List<Color> _bgColors = [
    Colors.purple,
    Colors.blueAccent,
    Colors.deepOrange,
    Colors.teal,
    Colors.pinkAccent,
    Colors.black87,
  ];

  Future<void> _pickImage(ImageSource source) async {
    final XFile? image = await _picker.pickImage(source: source);
    if (image != null) {
      setState(() {
        _imagePath = image.path;
      });
    }
  }

  void _shareCycle() {
    MockRepository().createStatus(_imagePath, _textController.text);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.color_lens, color: Colors.white),
            onPressed: () {
              setState(() {
                int currentIndex = _bgColors.indexOf(_backgroundColor);
                _backgroundColor = _bgColors[(currentIndex + 1) % _bgColors.length];
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.emoji_emotions, color: Colors.white),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.music_note, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (_imagePath != null)
                    Image.file(File(_imagePath!), fit: BoxFit.cover),
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32.0),
                      child: TextField(
                        controller: _textController,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: null,
                        decoration: const InputDecoration(
                          hintText: 'Type a status...',
                          hintStyle: TextStyle(color: Colors.white54),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              color: Colors.black45,
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.photo_library, color: Colors.white, size: 28),
                        onPressed: () => _pickImage(ImageSource.gallery),
                      ),
                      IconButton(
                        icon: const Icon(Icons.camera_alt, color: Colors.white, size: 28),
                        onPressed: () => _pickImage(ImageSource.camera),
                      ),
                      IconButton(
                        icon: const Icon(Icons.mic, color: Colors.white, size: 28),
                        onPressed: () {},
                      ),
                    ],
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: _backgroundColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                    onPressed: _shareCycle,
                    child: const Text('Share Cycle', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
