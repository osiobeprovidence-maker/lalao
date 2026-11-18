import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:video_player/video_player.dart';
import '../../data/mock_repository.dart';
import '../../widgets/comment_sheet.dart';

class VideoFeedScreen extends StatefulWidget {
  final int initialIndex;
  
  const VideoFeedScreen({super.key, this.initialIndex = 0});

  @override
  State<VideoFeedScreen> createState() => _VideoFeedScreenState();
}

class _VideoFeedScreenState extends State<VideoFeedScreen> {
  late PageController _pageController;
  final repo = MockRepository();

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: widget.initialIndex);
    repo.addListener(_onRepoChange);
  }
  
  void _onRepoChange() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    repo.removeListener(_onRepoChange);
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final videoPosts = repo.videoPosts;
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: videoPosts.length,
            itemBuilder: (context, index) {
              return FullScreenVideoPlayer(
                post: videoPosts[index],
                isActive: true, // simplified for now
              );
            },
          ),
          // Top Navigation overlay
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildCircularIconButton(LucideIcons.arrow_left, () => Navigator.pop(context)),
                _buildCircularIconButton(Icons.more_vert, () {}),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircularIconButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.4),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 24),
      ),
    );
  }
}

class FullScreenVideoPlayer extends StatefulWidget {
  final Post post;
  final bool isActive;

  const FullScreenVideoPlayer({super.key, required this.post, required this.isActive});

  @override
  State<FullScreenVideoPlayer> createState() => _FullScreenVideoPlayerState();
}

class _FullScreenVideoPlayerState extends State<FullScreenVideoPlayer> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.post.videoUrl!))
      ..initialize().then((_) {
        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
          if (widget.isActive) {
            _controller.setLooping(true);
            _controller.play();
          }
        }
      });
  }

  @override
  void didUpdateWidget(FullScreenVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !_controller.value.isPlaying) {
      _controller.play();
    } else if (!widget.isActive && _controller.value.isPlaying) {
      _controller.pause();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    
    return Stack(
      fit: StackFit.expand,
      children: [
        // Video Layer
        GestureDetector(
          onTap: () {
            if (_controller.value.isPlaying) {
              _controller.pause();
            } else {
              _controller.play();
            }
          },
          child: _isInitialized
              ? SizedBox.expand(
                  child: FittedBox(
                    fit: BoxFit.cover,
                    child: SizedBox(
                      width: _controller.value.size.width,
                      height: _controller.value.size.height,
                      child: VideoPlayer(_controller),
                    ),
                  ),
                )
              : const Center(child: CircularProgressIndicator(color: Colors.white)),
        ),
        
        // Bottom Gradient Overlay for text readability
        Positioned(
          bottom: 0, left: 0, right: 0,
          height: 250,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [Colors.black.withOpacity(0.8), Colors.transparent],
              ),
            ),
          ),
        ),

        // Creator Info and Engagement Row
        Positioned(
          bottom: 24, left: 16, right: 16,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Creator Info
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: Colors.grey[800],
                    backgroundImage: widget.post.author.avatarUrl.isNotEmpty ? NetworkImage(widget.post.author.avatarUrl) : null,
                    child: widget.post.author.avatarUrl.isEmpty ? const Icon(LucideIcons.user, color: Colors.white) : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              widget.post.author.name,
                              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, shadows: [Shadow(color: Colors.black45, blurRadius: 2, offset: Offset(0, 1))]),
                            ),
                            if (widget.post.author.isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(Icons.verified, color: Colors.blue, size: 16),
                            ]
                          ],
                        ),
                        Text(
                          '@${widget.post.author.username}',
                          style: const TextStyle(color: Colors.white70, fontSize: 14, shadows: [Shadow(color: Colors.black45, blurRadius: 2, offset: Offset(0, 1))]),
                        ),
                      ],
                    ),
                  ),
                  // Optional Follow button could go here
                ],
              ),
              const SizedBox(height: 12),
              // Caption
              Text(
                widget.post.content,
                style: const TextStyle(color: Colors.white, fontSize: 15, shadows: [Shadow(color: Colors.black45, blurRadius: 2, offset: Offset(0, 1))]),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
              // Horizontal Engagement Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildEngagementButton(LucideIcons.message_square, _formatCount(widget.post.commentsCount), false, () => showComments(context, widget.post)),
                  _buildEngagementButton(LucideIcons.repeat, _formatCount(widget.post.reposts), widget.post.isReposted, () => repo.toggleRepost(widget.post.id), activeColor: Colors.green),
                  _buildEngagementButton(widget.post.isLiked ? LucideIcons.heart : LucideIcons.heart, _formatCount(widget.post.likes), widget.post.isLiked, () => repo.toggleLike(widget.post.id), activeColor: Colors.red),
                  _buildEngagementButton(widget.post.isBookmarked ? LucideIcons.bookmark : LucideIcons.bookmark, '', widget.post.isBookmarked, () => repo.toggleBookmark(widget.post.id), activeColor: Colors.amber),
                  _buildEngagementButton(LucideIcons.send, '', false, () {}),
                ],
              ),
            ],
          ),
        ),

        // Progress Bar
        Positioned(
          bottom: 0, left: 0, right: 0,
          child: _isInitialized
              ? VideoProgressIndicator(
                  _controller,
                  allowScrubbing: true,
                  padding: EdgeInsets.zero,
                  colors: const VideoProgressColors(
                    playedColor: Colors.white,
                    bufferedColor: Colors.white30,
                    backgroundColor: Colors.transparent,
                  ),
                )
              : const SizedBox.shrink(),
        ),
      ],
    );
  }

  Widget _buildEngagementButton(IconData icon, String count, bool isActive, VoidCallback onTap, {Color activeColor = const Color(0xFF5E43F3)}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.4),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: isActive ? activeColor : Colors.white, size: 20),
            if (count.isNotEmpty) ...[
              const SizedBox(width: 6),
              Text(count, style: TextStyle(color: isActive ? activeColor : Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
            ]
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count == 0) return '';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return count.toString();
  }
}
