import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:image_picker/image_picker.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';
import '../../widgets/video_post_widget.dart';
import 'camera_record_screen.dart';

class CreatePostScreen extends StatefulWidget {
  final VoidCallback? onPostSuccess;

  const CreatePostScreen({super.key, this.onPostSuccess});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> with SingleTickerProviderStateMixin {
  final _repo = MockRepository();
  late TabController _modeController;

  // Post fields
  final _contentController = TextEditingController();
  final _locationController = TextEditingController(text: 'Udu');
  String? _selectedMediaPath;
  bool _isVideo = false;
  bool _hasPoll = false;
  final _pollOpt1 = TextEditingController(text: 'Yes, count me in!');
  final _pollOpt2 = TextEditingController(text: 'Maybe next weekend');
  String? _selectedSound;

  // Rally fields
  final _rallyTitleCtrl = TextEditingController();
  final _rallyDescCtrl = TextEditingController();
  final _rallyLocationCtrl = TextEditingController(text: 'Otokutu Junction, Udu');
  final _rallyTimeCtrl = TextEditingController(text: 'Today · 5:00 PM');
  String _rallyCategory = 'Sports & Fitness';
  int _rallyMaxParticipants = 20;

  @override
  void initState() {
    super.initState();
    _modeController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _modeController.dispose();
    _contentController.dispose();
    _locationController.dispose();
    _pollOpt1.dispose();
    _pollOpt2.dispose();
    _rallyTitleCtrl.dispose();
    _rallyDescCtrl.dispose();
    _rallyLocationCtrl.dispose();
    _rallyTimeCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickMedia(ImageSource source, {bool isVideo = false}) async {
    final picker = ImagePicker();
    final XFile? file = isVideo
        ? await picker.pickVideo(source: source)
        : await picker.pickImage(source: source, imageQuality: 80);

    if (file != null) {
      setState(() {
        _selectedMediaPath = file.path;
        _isVideo = isVideo;
      });
    }
  }

  Future<void> _openInAppCamera() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (_) => const CameraRecordScreen()),
    );
    if (result != null && result['path'] != null) {
      setState(() {
        _selectedMediaPath = result['path'] as String;
        _isVideo = result['isVideo'] as bool? ?? false;
      });
    }
  }

  void _submitPost() {
    if (_modeController.index == 1) {
      // Submit Rally
      if (_rallyTitleCtrl.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter a Rally title')),
        );
        return;
      }
      _repo.createRally(
        title: _rallyTitleCtrl.text.trim(),
        description: _rallyDescCtrl.text.trim().isEmpty
            ? 'Join our local Rally at ${_rallyLocationCtrl.text.trim()}!'
            : _rallyDescCtrl.text.trim(),
        category: _rallyCategory,
        location: _rallyLocationCtrl.text.trim(),
        startsAt: _rallyTimeCtrl.text.trim(),
        maxParticipants: _rallyMaxParticipants,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Rally published! Neighbors can now join.'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      if (widget.onPostSuccess != null) {
        widget.onPostSuccess!();
      } else {
        Navigator.pop(context);
      }
      return;
    }

    final text = _contentController.text.trim();
    if (text.isEmpty && _selectedMediaPath == null) return;

    PollData? poll;
    if (_hasPoll && _pollOpt1.text.trim().isNotEmpty && _pollOpt2.text.trim().isNotEmpty) {
      poll = PollData(
        options: [_pollOpt1.text.trim(), _pollOpt2.text.trim()],
        votes: [1, 0],
      );
    }

    _repo.addPost(
      text.isEmpty ? 'Shared a new moment ✨' : text,
      imageUrl: !_isVideo ? _selectedMediaPath : null,
      videoUrl: _isVideo ? _selectedMediaPath : null,
      location: _locationController.text.trim(),
      soundTitle: _selectedSound,
      poll: poll,
    );

    _contentController.clear();
    setState(() {
      _selectedMediaPath = null;
      _isVideo = false;
      _hasPoll = false;
      _selectedSound = null;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Post published! +5 Reward Points earned.'),
        backgroundColor: AppTheme.successColor,
      ),
    );

    if (widget.onPostSuccess != null) {
      widget.onPostSuccess!();
    } else if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _repo.currentUser;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create on Lalao', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: ElevatedButton(
              onPressed: _submitPost,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryBrand,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: const Text('Publish', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _modeController,
          labelColor: AppTheme.primaryBrand,
          indicatorColor: AppTheme.primaryBrand,
          tabs: const [
            Tab(icon: Icon(LucideIcons.feather, size: 16), text: 'Post / Poll'),
            Tab(icon: Icon(LucideIcons.flame, size: 16), text: 'Host a Rally'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _modeController,
        children: [
          // Post / Poll Creator
          Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(radius: 20, backgroundImage: NetworkImage(user.avatarUrl)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              controller: _locationController,
                              decoration: const InputDecoration(
                                labelText: 'Location Tag',
                                prefixIcon: Icon(LucideIcons.map_pin, size: 16),
                                isDense: true,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _contentController,
                        maxLines: 5,
                        autofocus: false,
                        decoration: const InputDecoration(
                          hintText: "What's happening in your area?",
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          fillColor: Colors.transparent,
                        ),
                        style: const TextStyle(fontSize: 17),
                      ),
                      if (_selectedSound != null)
                        Chip(
                          avatar: const Icon(LucideIcons.music, size: 14, color: AppTheme.primaryBrand),
                          label: Text(_selectedSound!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          onDeleted: () => setState(() => _selectedSound = null),
                        ),
                      if (_hasPoll) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Theme.of(context).dividerColor),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Interactive Poll', style: TextStyle(fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(LucideIcons.x, size: 16),
                                    onPressed: () => setState(() => _hasPoll = false),
                                  ),
                                ],
                              ),
                              TextField(controller: _pollOpt1, decoration: const InputDecoration(labelText: 'Option 1')),
                              const SizedBox(height: 8),
                              TextField(controller: _pollOpt2, decoration: const InputDecoration(labelText: 'Option 2')),
                            ],
                          ),
                        ),
                      ],
                      if (_selectedMediaPath != null) ...[
                        const SizedBox(height: 16),
                        Stack(
                          children: [
                            if (_isVideo)
                              VideoPostWidget(videoUrl: _selectedMediaPath!)
                            else
                              ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: Image.file(
                                  File(_selectedMediaPath!),
                                  width: double.infinity,
                                  height: 220,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: GestureDetector(
                                onTap: () => setState(() => _selectedMediaPath = null),
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                  child: const Icon(LucideIcons.x, color: Colors.white, size: 16),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
                ),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(LucideIcons.image, color: AppTheme.primaryBrand),
                        tooltip: 'Photo',
                        onPressed: () => _pickMedia(ImageSource.gallery, isVideo: false),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.video, color: AppTheme.secondaryBrand),
                        tooltip: 'Video',
                        onPressed: () => _pickMedia(ImageSource.gallery, isVideo: true),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.camera, color: AppTheme.accentBrand),
                        tooltip: 'Camera',
                        onPressed: _openInAppCamera,
                      ),
                      TextButton.icon(
                        onPressed: () => setState(() => _hasPoll = !_hasPoll),
                        icon: const Icon(LucideIcons.bar_chart_2, size: 18),
                        label: const Text('Poll'),
                      ),
                      TextButton.icon(
                        onPressed: () {
                          showModalBottomSheet(
                            context: context,
                            builder: (ctx) => ListView(
                              shrinkWrap: true,
                              children: _repo.sounds
                                  .map((s) => ListTile(
                                        leading: const Icon(LucideIcons.music, color: AppTheme.primaryBrand),
                                        title: Text(s.title),
                                        subtitle: Text(s.artist),
                                        onTap: () {
                                          setState(() => _selectedSound = '${s.title} — ${s.artist}');
                                          Navigator.pop(ctx);
                                        },
                                      ))
                                  .toList(),
                            ),
                          );
                        },
                        icon: const Icon(LucideIcons.music, size: 18),
                        label: const Text('Add Sound'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Rally Creator
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text(
                'Start a Local Rally',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              const Text(
                'Rallies are real-time local meetups, games, study groups, or community actions that people nearby can join.',
                style: TextStyle(color: AppTheme.textSecondaryLight, fontSize: 13),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _rallyTitleCtrl,
                decoration: const InputDecoration(labelText: 'Rally Title *', hintText: 'e.g. Evening 5-Aside Football at DSC'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _rallyCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: const [
                  DropdownMenuItem(value: 'Sports & Fitness', child: Text('Sports & Fitness')),
                  DropdownMenuItem(value: 'Tech & Study', child: Text('Tech & Study')),
                  DropdownMenuItem(value: 'Nightlife & Chill', child: Text('Nightlife & Chill')),
                  DropdownMenuItem(value: 'Community Action', child: Text('Community Action')),
                ],
                onChanged: (v) => setState(() => _rallyCategory = v!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _rallyLocationCtrl,
                decoration: const InputDecoration(labelText: 'Meetup Point / Location'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _rallyTimeCtrl,
                decoration: const InputDecoration(labelText: 'Start Time'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _rallyDescCtrl,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Rally Details & What to Bring'),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Max Participants', style: TextStyle(fontWeight: FontWeight.bold)),
                  DropdownButton<int>(
                    value: _rallyMaxParticipants,
                    items: [10, 20, 30, 50, 100]
                        .map((n) => DropdownMenuItem(value: n, child: Text('$n people')))
                        .toList(),
                    onChanged: (v) => setState(() => _rallyMaxParticipants = v!),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _submitPost,
                icon: const Icon(LucideIcons.flame),
                label: const Text('Launch Rally Now', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
