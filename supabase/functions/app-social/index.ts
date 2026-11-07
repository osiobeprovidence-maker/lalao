import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';
import { isPostMatchingTopic } from '../_shared/topicKeywords.ts';

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function formatRelativeTime(ms: number | undefined | null): string {
  if (!ms) return 'Just now';
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1 || Number.isNaN(minutes)) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days === 1) return 'Yesterday';
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return 'Just now';
  }
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radius = 6371e3;
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function resolveUserVerification(user: Record<string, any> | null | undefined) {
  if (!user) return { isVerified: false, verificationTier: 'none' };
  const tier = user.verificationTier;
  const status = user.verificationStatus;
  const verified = Boolean(
    tier && tier !== 'none'
    && (!status || status === 'active')
    && (!user.verificationExpiresAt || user.verificationExpiresAt > Date.now()),
  );
  return {
    isVerified: verified,
    verificationTier: verified ? tier : 'none',
  };
}

function jsonArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.toLowerCase())
    : [];
}

const connectionUserSelect = [
  '_id', 'name', 'username', 'avatarUrl', 'avatar', 'bio', 'locationName',
  'followersCount', 'followingCount', 'verificationTier', 'verificationStatus',
  'verificationExpiresAt', 'suspended',
].join(',');

const feedPostSelect = [
  '_id', 'authorId', 'text', 'mediaUrl', 'mediaStorageId', 'muxUploadId',
  'muxAssetId', 'muxPlaybackId', 'mediaType', 'location', 'latitude',
  'longitude', 'createdAt', 'likesCount', 'commentsCount', 'repostsCount',
  'audience', 'replyPermission', 'gifUrl', 'contentTopics', 'pollQuestion',
  'pollOptions', 'rallyRefId', 'pageRefId', 'groupRefId', 'soundId',
  'soundTitle', 'soundAuthorName', 'soundAudioUrl', 'soundStartOffset',
  'soundVolume', 'originalAudioVolume', 'moderationStatus', 'nearbyEnabled',
].join(',');

const profilePostSelect = [
  '_id', 'authorId', 'text', 'mediaUrl', 'mediaStorageId', 'mediaType',
  'createdAt', 'location', 'likesCount', 'commentsCount', 'repostsCount',
  'audience', 'replyPermission', 'gifUrl', 'contentTopics', 'pollQuestion',
  'pollOptions', 'rallyRefId', 'pageRefId', 'groupRefId', 'soundId',
  'soundTitle', 'soundAuthorName', 'soundAudioUrl', 'soundStartOffset',
  'soundVolume', 'originalAudioVolume',
].join(',');

const feedUserSelect = [
  '_id', 'name', 'username', 'avatarUrl', 'avatar', 'userType', 'bio',
  'locationName', 'location', 'followersCount', 'followingCount',
  'publicIdentityType', 'verificationTier', 'verificationStatus',
  'verificationExpiresAt',
].join(',');

const feedPageSelect = [
  '_id', 'name', 'username', 'avatar', 'type', 'followersCount', 'location',
].join(',');

function projectConnectionUser(
  user: Record<string, any>,
  followedAt: number,
  isFollowing: boolean,
) {
  return {
    id: user._id,
    name: user.name ?? 'User',
    username: user.username ?? 'user',
    avatar: user.avatarUrl || user.avatar || '',
    bio: user.bio ?? '',
    location: (user.locationName ?? user.location ?? '')
      .replace(/\s*\(Detected\)\s*/i, '')
      .replace(/^GPS Detected$/i, '')
      .trim(),
    isFollowing,
    followersCount: user.followersCount ?? 0,
    followingCount: user.followingCount ?? 0,
    ...resolveUserVerification(user),
    followedAt,
  };
}

export default {
  fetch: withLalaoAuth(async (request, context) => {
    if (request.method !== 'POST') return jsonError('Method not allowed.', 405);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid request.', 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError('Invalid request.', 400);
    }

    const input = body as { operation?: unknown; payload?: unknown };
    const operation = input.operation;
    if (![
      'listFeedPosts', 'getRelationship', 'getMyFollowers', 'getMyFollowing', 'toggleFollowUser',
      'listNotifications', 'getUnreadNotificationCount', 'markAllNotificationsRead',
      'markNotificationRead', 'hasActivePushToken', 'upsertWebPushSubscription',
      'deactivateWebPushSubscription', 'toggleLikePost', 'toggleLikeComment',
      'createPost', 'deletePost', 'addCommentToPost', 'deleteComment',
      'getCommentsForPost', 'toggleRepost', 'listUserPosts', 'listVideoPosts',
      'getDiscoverablePeople', 'getDiscoverablePeopleCount',
      'getMessageContacts',
      'getOrCreateConversation', 'listConversations', 'sendMessage',
      'editMessage', 'deleteMessage', 'markConversationRead',
      'createGroupChat', 'inviteUserToGroupChat', 'startPageConversation',
    ].includes(String(operation))) {
      return jsonError('Unsupported social operation.', 400);
    }
    if (input.payload !== undefined && (!input.payload || typeof input.payload !== 'object' || Array.isArray(input.payload))) {
      return jsonError('Invalid social parameters.', 400);
    }

    const args = (input.payload ?? {}) as Record<string, unknown>;
    if (operation === 'listFeedPosts') {
      const currentUser = context.currentUser as Record<string, any> | null;
      if (typeof currentUser?._id !== 'string') return jsonError('Authentication required.', 401);
    }
    if (operation !== 'listFeedPosts') {
      const currentUser = context.currentUser as Record<string, any> | null;
      if (typeof currentUser?._id !== 'string') return jsonError('Lalao profile not found.', 404);
      const admin = context.supabaseAdmin;

      if (operation === 'getDiscoverablePeople') {
        if (Object.keys(args).some((key) => key !== 'limit')
          || (args.limit !== undefined
            && (typeof args.limit !== 'number' || !Number.isInteger(args.limit) || args.limit < 0 || args.limit > 100))) {
          return jsonError('Invalid people discovery request.', 400);
        }
        const { data, error } = await admin.rpc('get_lalao_discoverable_people', {
          p_viewer_id: currentUser._id,
          p_limit: typeof args.limit === 'number' ? args.limit : 25,
        });
        if (error) return jsonError('Could not load discoverable people. Please try again.', 500);
        if (!Array.isArray(data)) return jsonError('Could not load discoverable people. Please try again.', 500);
        return Response.json(data);
      }

      if (operation === 'getDiscoverablePeopleCount') {
        if (Object.keys(args).length !== 0) return jsonError('Invalid people discovery count request.', 400);
        const { data, error } = await admin.rpc('get_lalao_discoverable_people_count', {
          p_viewer_id: currentUser._id,
        });
        if (error || typeof data !== 'number' || !Number.isSafeInteger(data) || data < 0) {
          return jsonError('Could not load discoverable people count. Please try again.', 500);
        }
        return Response.json(data);
      }

      if (operation === 'getMessageContacts') {
        if (Object.keys(args).length !== 0) return jsonError('Invalid message contacts request.', 400);
        const { data, error } = await admin.rpc('get_lalao_message_contacts', {
          p_viewer_id: currentUser._id,
        });
        if (error) return jsonError('Could not load message contacts. Please try again.', 500);
        if (!Array.isArray(data)) return jsonError('Could not load message contacts. Please try again.', 500);
        return Response.json(data);
      }

      if (operation === 'getOrCreateConversation') {
        if (Object.keys(args).some((key) => key !== 'otherUserId')) return jsonError('Invalid conversation request.', 400);
        const otherUserId = typeof args.otherUserId === 'string' ? args.otherUserId : '';
        if (!otherUserId) return jsonError('Other user ID is required.', 400);
        const { data, error } = await admin.rpc('create_lalao_conversation', {
          p_caller_id: currentUser._id,
          p_other_user_id: otherUserId,
        });
        if (error) return jsonError(error.message || 'Could not create conversation. Please try again.', 400);
        if (typeof data !== 'string') return jsonError('Could not create conversation. Please try again.', 500);
        return Response.json({ conversationId: data });
      }

      if (operation === 'listConversations') {
        if (Object.keys(args).length !== 0) return jsonError('Invalid conversation list request.', 400);
        const { data, error } = await admin.rpc('get_lalao_conversations', { p_caller_id: currentUser._id });
        if (error) return jsonError('Could not load conversations. Please try again.', 500);
        if (!Array.isArray(data)) return jsonError('Could not load conversations. Please try again.', 500);
        return Response.json(data);
      }


      if (operation === 'sendMessage') {
        if (Object.keys(args).some((key) => !['conversationId', 'text', 'pageSenderId', 'replyToMessageId', 'type', 'mediaStorageId', 'mimeType', 'fileName', 'fileSize', 'audioStorageId', 'audioDuration', 'viewOnce'].includes(key))) return jsonError('Invalid message request.', 400);
        const conversationId = typeof args.conversationId === 'string' ? args.conversationId : '';
        const text = typeof args.text === 'string' ? args.text : '';
        const pageSenderId = typeof args.pageSenderId === 'string' ? args.pageSenderId : null;
        const replyToMessageId = typeof args.replyToMessageId === 'string' ? args.replyToMessageId : null;
        const type = typeof args.type === 'string' ? args.type : 'text';
        const mediaStorageId = typeof args.mediaStorageId === 'string' ? args.mediaStorageId : null;
        const mimeType = typeof args.mimeType === 'string' ? args.mimeType : null;
        const fileName = typeof args.fileName === 'string' ? args.fileName : null;
        const fileSize = typeof args.fileSize === 'number' ? args.fileSize : null;
        const audioStorageId = typeof args.audioStorageId === 'string' ? args.audioStorageId : null;
        const audioDuration = typeof args.audioDuration === 'number' ? args.audioDuration : null;
        const viewOnce = Boolean(args.viewOnce);

        if (!conversationId) return jsonError('Conversation ID is required.', 400);
        if (!text && !mediaStorageId) return jsonError('Message text or media is required.', 400);

        const { data, error } = await admin.rpc('send_lalao_message', {
          p_caller_id: currentUser._id,
          p_conversation_id: conversationId,
          p_text: text,
          p_page_sender_id: pageSenderId,
          p_reply_to_message_id: replyToMessageId,
          p_type: type,
          p_media_storage_id: mediaStorageId,
          p_mime_type: mimeType,
          p_file_name: fileName,
          p_file_size: fileSize,
          p_audio_storage_id: audioStorageId,
          p_audio_duration: audioDuration,
          p_view_once: viewOnce,
        });
        if (error) return jsonError(error.message || 'Could not send message. Please try again.', 400);
        if (typeof data !== 'string') return jsonError('Could not send message. Please try again.', 500);
        return Response.json({ messageId: data });
      }

      if (operation === 'editMessage') {
        if (Object.keys(args).some((key) => key !== 'messageId' && key !== 'text')) return jsonError('Invalid message edit request.', 400);
        const messageId = typeof args.messageId === 'string' ? args.messageId : '';
        const text = typeof args.text === 'string' ? args.text : '';
        if (!messageId) return jsonError('Message ID is required.', 400);
        if (!text) return jsonError('Text is required.', 400);

        const { data, error } = await admin.rpc('edit_lalao_message', {
          p_caller_id: currentUser._id,
          p_message_id: messageId,
          p_text: text,
        });
        if (error) return jsonError(error.message || 'Could not edit message. Please try again.', 400);
        return Response.json({ messageId: data });
      }

      if (operation === 'deleteMessage') {
        if (Object.keys(args).some((key) => key !== 'messageId')) return jsonError('Invalid message delete request.', 400);
        const messageId = typeof args.messageId === 'string' ? args.messageId : '';
        if (!messageId) return jsonError('Message ID is required.', 400);

        const { data, error } = await admin.rpc('delete_lalao_message', {
          p_caller_id: currentUser._id,
          p_message_id: messageId,
        });
        if (error) return jsonError(error.message || 'Could not delete message. Please try again.', 400);
        return Response.json({ messageId: data });
      }

      if (operation === 'markConversationRead') {
        if (Object.keys(args).some((key) => key !== 'conversationId')) return jsonError('Invalid conversation read request.', 400);
        const conversationId = typeof args.conversationId === 'string' ? args.conversationId : '';
        if (!conversationId) return jsonError('Conversation ID is required.', 400);

        const { data, error } = await admin.rpc('mark_lalao_conversation_read', {
          p_caller_id: currentUser._id,
          p_conversation_id: conversationId,
        });
        if (error) return jsonError(error.message || 'Could not mark conversation as read. Please try again.', 400);
        return Response.json({ conversationId: data });
      }

      if (operation === 'createGroupChat') {
        if (Object.keys(args).some((key) => !['name', 'description', 'memberIds', 'avatarUrl', 'interests'].includes(key))) return jsonError('Invalid group chat request.', 400);
        const name = typeof args.name === 'string' ? args.name : '';
        const description = typeof args.description === 'string' ? args.description : null;
        if (args.memberIds !== undefined && !Array.isArray(args.memberIds)) return jsonError('Invalid group member list.', 400);
        const memberIds = Array.isArray(args.memberIds) ? args.memberIds : [];
        const avatarUrl = typeof args.avatarUrl === 'string' ? args.avatarUrl : null;
        const interests = Array.isArray(args.interests) ? args.interests : null;

        if (!name) return jsonError('Group name is required.', 400);
        if (memberIds.some((id) => typeof id !== 'string' || !id)) return jsonError('Invalid group member list.', 400);

        const { data, error } = await admin.rpc('create_lalao_group_chat', {
          p_caller_id: currentUser._id,
          p_name: name,
          p_description: description,
          p_member_ids: memberIds,
          p_avatar_url: avatarUrl,
          p_interests: interests,
        });
        if (error) return jsonError(error.message || 'Could not create group chat. Please try again.', 400);
        if (!data || typeof data !== 'object') return jsonError('Could not create group chat. Please try again.', 500);
        return Response.json(data);
      }

      if (operation === 'inviteUserToGroupChat') {
        if (Object.keys(args).some((key) => key !== 'groupChatId' && key !== 'userId')) return jsonError('Invalid group invitation request.', 400);
        const groupChatId = typeof args.groupChatId === 'string' ? args.groupChatId : '';
        const userId = typeof args.userId === 'string' ? args.userId : '';
        if (!groupChatId) return jsonError('Group chat ID is required.', 400);
        if (!userId) return jsonError('User ID is required.', 400);
        if (userId === currentUser._id) return jsonError('Cannot invite yourself to a group chat.', 400);

        const { data, error } = await admin.rpc('invite_lalao_to_group_chat', {
          p_caller_id: currentUser._id,
          p_group_chat_id: groupChatId,
          p_user_id: userId,
        });
        if (error) return jsonError(error.message || 'Could not invite user to group chat. Please try again.', 400);
        return Response.json({ groupChatId: data });
      }

      if (operation === 'startPageConversation') {
        if (Object.keys(args).some((key) => key !== 'pageId')) return jsonError('Invalid page conversation request.', 400);
        const pageId = typeof args.pageId === 'string' ? args.pageId : '';
        if (!pageId) return jsonError('Page ID is required.', 400);
        const { data, error } = await admin.rpc('start_lalao_page_conversation', {
          p_caller_id: currentUser._id,
          p_page_id: pageId,
        });
        if (error) return jsonError(error.message || 'Could not start page conversation. Please try again.', 400);
        if (typeof data !== 'string') return jsonError('Could not start page conversation. Please try again.', 500);
        return Response.json({ conversationId: data });
      }

      if (operation === 'listNotifications') {
        if (Object.keys(args).length !== 0) return jsonError('Invalid notification request.', 400);
        const { data: recent, error: notificationError } = await admin.from('notifications')
          .select('_id,actorId,type,postId,targetExcerpt,isRead,createdAt')
          .eq('recipientId', currentUser._id)
          .order('createdAt', { ascending: false })
          .limit(100);
        if (notificationError) return jsonError('Could not load notifications. Please try again.', 500);

        const notifications = (recent ?? []).filter((item: any) => item.type !== 'message').slice(0, 50);
        const actorIds = [...new Set(notifications
          .filter((item: any) => item.type !== 'system_alert' && typeof item.actorId === 'string')
          .map((item: any) => item.actorId))];
        let usersById = new Map<string, Record<string, any>>();
        let followingIds = new Set<string>();
        if (actorIds.length) {
          const [usersResult, followsResult] = await Promise.all([
            admin.from('users').select([
              '_id', 'name', 'username', 'avatarUrl', 'avatar', 'userType',
              'followersCount', 'followingCount', 'verificationTier',
              'verificationStatus', 'verificationExpiresAt',
            ].join(',')).in('_id', actorIds),
            admin.from('follows').select('followingId')
              .eq('followerId', currentUser._id).in('followingId', actorIds),
          ]);
          if (usersResult.error || followsResult.error) {
            return jsonError('Could not load notifications. Please try again.', 500);
          }
          usersById = new Map<string, Record<string, any>>(
            (usersResult.data ?? []).map((user: any): [string, Record<string, any>] => [user._id, user]),
          );
          followingIds = new Set((followsResult.data ?? [])
            .map((row: any) => String(row.followingId)));
        }

        const textByType: Record<string, string> = {
          like: 'liked your post',
          comment: 'commented on your post',
          reply: 'replied to your comment',
          comment_like: 'liked your comment',
          reply_like: 'liked your reply',
          follow: 'started following you',
          rally_join: 'joined your rally',
          system_alert: 'sent you a system alert',
          message: 'sent you a message',
          mention: 'mentioned you',
        };
        const result = notifications.map((item: any) => {
          const actor = item.type === 'system_alert' ? null : usersById.get(item.actorId);
          const verification = resolveUserVerification(actor);
          return {
            id: item._id,
            type: item.type,
            text: textByType[item.type] ?? 'interacted with your content',
            actor: actor ? {
              id: actor._id,
              name: actor.name ?? 'User',
              username: actor.username ?? 'user',
              avatar: actor.avatarUrl || actor.avatar || '',
              userType: actor.userType ?? 'person',
              followersCount: actor.followersCount ?? 0,
              followingCount: actor.followingCount ?? 0,
              isFollowing: followingIds.has(actor._id),
              ...verification,
            } : null,
            targetId: item.postId ?? null,
            targetExcerpt: item.targetExcerpt ?? null,
            isRead: item.isRead,
            timestamp: formatRelativeTime(item.createdAt),
            createdAt: item.createdAt,
          };
        });
        return Response.json(result);
      }

      if (operation === 'getUnreadNotificationCount') {
        if (Object.keys(args).length !== 0) return jsonError('Invalid notification request.', 400);
        const { data: unread, error } = await admin.from('notifications')
          .select('_id,type')
          .eq('recipientId', currentUser._id)
          .eq('isRead', false)
          .order('createdAt', { ascending: true })
          .limit(150);
        if (error) return jsonError('Could not load unread notifications. Please try again.', 500);
        const socialUnread = (unread ?? []).filter((item: any) => item.type !== 'message');
        return Response.json(Math.min(socialUnread.length, 100));
      }

      if (operation === 'markAllNotificationsRead' || operation === 'markNotificationRead') {
        const notificationId = operation === 'markNotificationRead' ? args.id : undefined;
        if (
          (operation === 'markNotificationRead' &&
            (Object.keys(args).length !== 1 || typeof notificationId !== 'string' || !notificationId)) ||
          (operation === 'markAllNotificationsRead' && Object.keys(args).length !== 0)
        ) {
          return jsonError('Invalid notification request.', 400);
        }
        const { data, error } = await admin.rpc('mark_lalao_user_notifications_read', {
          p_user_id: currentUser._id,
          p_notification_id: notificationId ?? null,
        });
        if (error) {
          if (error.code === 'P0002') return jsonError('Notification not found.', 404);
          if (error.code === '42501') return jsonError('Unauthorized notification access.', 403);
          if (error.code === '22023') return jsonError('Invalid notification request.', 400);
          return jsonError('Could not update notifications. Please try again.', 500);
        }
        return Response.json(operation === 'markAllNotificationsRead' ? { count: data } : null);
      }

      if (operation === 'hasActivePushToken') {
        if (Object.keys(args).length !== 0) return jsonError('Invalid push status request.', 400);
        const [webPushResult, fcmResult] = await Promise.all([
          admin.from('pushSubscriptions').select('_id')
            .eq('userId', currentUser._id).eq('isActive', true).limit(1),
          admin.from('fcmTokens').select('_id')
            .eq('userId', currentUser._id).limit(1),
        ]);
        if (webPushResult.error || fcmResult.error) {
          return jsonError('Could not load push status. Please try again.', 500);
        }
        return Response.json(Boolean(webPushResult.data?.length || fcmResult.data?.length));
      }

      if (operation === 'upsertWebPushSubscription') {
        if (
          Object.keys(args).some((key) => !['endpoint', 'p256dh', 'auth', 'userAgent'].includes(key)) ||
          typeof args.endpoint !== 'string' ||
          typeof args.p256dh !== 'string' ||
          typeof args.auth !== 'string' ||
          (args.userAgent !== undefined && typeof args.userAgent !== 'string')
        ) {
          return jsonError('Invalid Web Push subscription.', 400);
        }
        let endpoint: URL;
        try {
          endpoint = new URL(args.endpoint);
        } catch {
          return jsonError('Invalid Web Push subscription.', 400);
        }
        if (
          endpoint.protocol !== 'https:' ||
          endpoint.username ||
          endpoint.password ||
          endpoint.hash ||
          args.endpoint.length > 4096 ||
          args.p256dh.length < 16 ||
          args.p256dh.length > 256 ||
          args.auth.length < 8 ||
          args.auth.length > 128 ||
          (typeof args.userAgent === 'string' && args.userAgent.length > 1024)
        ) {
          return jsonError('Invalid Web Push subscription.', 400);
        }
        const { data, error } = await admin.rpc('upsert_lalao_web_push_subscription', {
          p_user_id: currentUser._id,
          p_endpoint: args.endpoint,
          p_p256dh: args.p256dh,
          p_auth: args.auth,
          p_user_agent: args.userAgent ?? null,
        });
        if (error) {
          if (error.code === '22023') return jsonError('Invalid Web Push subscription.', 400);
          return jsonError('Could not save push subscription. Please try again.', 500);
        }
        return Response.json(data);
      }

      if (operation === 'deactivateWebPushSubscription') {
        if (Object.keys(args).length !== 1 || typeof args.endpoint !== 'string' || !args.endpoint) {
          return jsonError('Invalid Web Push subscription request.', 400);
        }
        const { data, error } = await admin.rpc('deactivate_lalao_web_push_subscription', {
          p_user_id: currentUser._id,
          p_endpoint: args.endpoint,
        });
        if (error) return jsonError('Could not deactivate push subscription. Please try again.', 500);
        return Response.json(Boolean(data));
      }

      if (operation === 'toggleLikePost' || operation === 'toggleLikeComment') {
        const targetKey = operation === 'toggleLikePost' ? 'postId' : 'commentId';
        if (
          Object.keys(args).length !== 1 ||
          typeof args[targetKey] !== 'string' ||
          !args[targetKey]
        ) {
          return jsonError('Invalid like request.', 400);
        }
        const { data, error } = await admin.rpc(
          operation === 'toggleLikePost' ? 'toggle_lalao_post_like' : 'toggle_lalao_comment_like',
          operation === 'toggleLikePost'
            ? { p_user_id: currentUser._id, p_post_id: args.postId }
            : { p_user_id: currentUser._id, p_comment_id: args.commentId },
        );
        if (error) {
          if (error.code === 'P0002') return jsonError('Post or comment not found.', 404);
          if (error.code === '22023') return jsonError('Invalid like request.', 400);
          return jsonError('Could not update this like. Please try again.', 500);
        }
        if (!data || typeof data !== 'object' || typeof data.liked !== 'boolean' || typeof data.likesCount !== 'number') {
          return jsonError('Could not update this like. Please try again.', 500);
        }
        return Response.json({ liked: data.liked, likesCount: data.likesCount });
      }

      if (operation === 'toggleFollowUser') {
        if (Object.keys(args).length !== 1 || typeof args.targetUserId !== 'string' || !args.targetUserId) {
          return jsonError('Invalid follow request.', 400);
        }
        if (args.targetUserId === currentUser._id) return jsonError('Cannot follow yourself.', 400);

        const { data, error } = await admin.rpc('toggle_lalao_user_follow', {
          p_follower_id: currentUser._id,
          p_target_user_id: args.targetUserId,
        });
        if (error) {
          if (error.code === 'P0002') return jsonError('User not found.', 404);
          if (error.code === '22023') return jsonError('Invalid follow request.', 400);
          if (error.code === '23505') return jsonError('Could not update this follow. Please try again.', 409);
          return jsonError('Could not update this follow. Please try again.', 500);
        }
        if (!data || typeof data !== 'object' || typeof data.following !== 'boolean') {
          return jsonError('Could not update this follow. Please try again.', 500);
        }
        return Response.json({ following: data.following });
      }

        if (operation === 'createPost') {
          const text = typeof args.text === 'string' ? args.text : '';
          const location = typeof args.location === 'string' ? args.location : '';
          if (!text || !location) return jsonError('Post text and location are required.', 400);
          const { data, error } = await admin.rpc('create_lalao_post', {
            p_author_id: currentUser._id,
            p_text: text,
            p_location: location,
            p_media_url: typeof args.mediaUrl === 'string' ? args.mediaUrl : null,
            p_media_storage_id: typeof args.mediaStorageId === 'string' ? args.mediaStorageId : null,
            p_media_type: typeof args.mediaType === 'string' ? args.mediaType : null,
            p_media_width: typeof args.mediaWidth === 'number' ? args.mediaWidth : null,
            p_media_height: typeof args.mediaHeight === 'number' ? args.mediaHeight : null,
            p_audience: typeof args.audience === 'string' ? args.audience : 'everyone',
            p_reply_permission: typeof args.replyPermission === 'string' ? args.replyPermission : 'everyone',
            p_gif_url: typeof args.gifUrl === 'string' ? args.gifUrl : null,
            p_poll_question: typeof args.pollQuestion === 'string' ? args.pollQuestion : null,
            p_poll_options: typeof args.pollOptions === 'object' && args.pollOptions !== null ? args.pollOptions : null,
            p_rally_ref_id: typeof args.rallyRefId === 'string' ? args.rallyRefId : null,
            p_page_ref_id: typeof args.pageRefId === 'string' ? args.pageRefId : null,
            p_group_ref_id: typeof args.groupRefId === 'string' ? args.groupRefId : null,
            p_content_topics: Array.isArray(args.contentTopics) ? args.contentTopics : null,
            p_mux_upload_id: typeof args.muxUploadId === 'string' ? args.muxUploadId : null,
            p_mux_asset_id: typeof args.muxAssetId === 'string' ? args.muxAssetId : null,
            p_mux_playback_id: typeof args.muxPlaybackId === 'string' ? args.muxPlaybackId : null,
            p_media_status: typeof args.mediaStatus === 'string' ? args.mediaStatus : 'ready',
            p_sound_id: typeof args.soundId === 'string' ? args.soundId : null,
            p_sound_title: typeof args.soundTitle === 'string' ? args.soundTitle : null,
            p_sound_author_name: typeof args.soundAuthorName === 'string' ? args.soundAuthorName : null,
            p_sound_audio_url: typeof args.soundAudioUrl === 'string' ? args.soundAudioUrl : null,
            p_sound_start_offset: typeof args.soundStartOffset === 'number' ? args.soundStartOffset : null,
            p_sound_volume: typeof args.soundVolume === 'number' ? args.soundVolume : null,
            p_original_audio_volume: typeof args.originalAudioVolume === 'number' ? args.originalAudioVolume : null,
            p_location_accuracy: typeof args.locationAccuracy === 'number' ? args.locationAccuracy : null,
            p_location_captured_at: typeof args.locationCapturedAt === 'number' ? args.locationCapturedAt : null,
            p_location_country: typeof args.locationCountry === 'string' ? args.locationCountry : null,
            p_location_state: typeof args.locationState === 'string' ? args.locationState : null,
            p_location_city: typeof args.locationCity === 'string' ? args.locationCity : null,
            p_location_neighborhood: typeof args.locationNeighborhood === 'string' ? args.locationNeighborhood : null,
            p_location_status: typeof args.locationStatus === 'string' ? args.locationStatus : 'unverified',
            p_nearby_enabled: Boolean(args.nearbyEnabled),
            p_latitude: typeof args.latitude === 'number' ? args.latitude : null,
            p_longitude: typeof args.longitude === 'number' ? args.longitude : null,
          });
          if (error) return jsonError(error.message || 'Could not create post.', 400);
          return Response.json(data);
        }

        if (operation === 'deletePost') {
          const postId = typeof args.postId === 'string' ? args.postId : '';
          if (!postId) return jsonError('Post ID is required.', 400);
          const { data, error } = await admin.rpc('delete_lalao_post', {
            p_user_id: currentUser._id, p_post_id: postId,
          });
          if (error) {
            if (error.code === 'P0002') return jsonError('Post not found.', 404);
            if (error.code === '42501') return jsonError('Not authorized to delete this post.', 403);
            return jsonError('Could not delete post. Please try again.', 400);
          }
          return Response.json(data);
        }

        if (operation === 'addCommentToPost') {
          const postId = typeof args.postId === 'string' ? args.postId : '';
          const text = typeof args.text === 'string' ? args.text : '';
          const parentCommentId = typeof args.parentCommentId === 'string' ? args.parentCommentId : null;
          if (!postId || (!text.trim() && !args.mediaStorageId)) return jsonError('Invalid comment request.', 400);
          const { data, error } = await admin.rpc('create_lalao_comment', {
            p_author_id: currentUser._id,
            p_post_id: postId,
            p_text: text,
            p_parent_comment_id: parentCommentId,
            p_media_url: typeof args.mediaUrl === 'string' ? args.mediaUrl : null,
            p_media_storage_id: typeof args.mediaStorageId === 'string' ? args.mediaStorageId : null,
            p_media_type: typeof args.mediaType === 'string' ? args.mediaType : null,
            p_duration: typeof args.duration === 'number' ? args.duration : null,
          });
          if (error) return jsonError(error.message || 'Could not add comment.', 400);
          return Response.json(data);
        }

        if (operation === 'deleteComment') {
          const commentId = typeof args.commentId === 'string' ? args.commentId : '';
          if (!commentId) return jsonError('Comment ID is required.', 400);
          const { data, error } = await admin.rpc('delete_lalao_comment', {
            p_user_id: currentUser._id, p_comment_id: commentId,
          });
          if (error) {
            if (error.code === 'P0002') return jsonError('Comment not found.', 404);
            if (error.code === '42501') return jsonError('Unauthorized', 403);
            return jsonError('Could not delete comment. Please try again.', 400);
          }
          return Response.json(data);
        }

        if (operation === 'getCommentsForPost') {
          const postId = typeof args.postId === 'string' ? args.postId : '';
          if (!postId) return jsonError('Post ID is required.', 400);
          const limit = Math.min(100, Math.max(1, Number(args.limit || 50)));
          const { data, error } = await admin.from('comments')
            .select('*')
            .eq('postId', postId)
            .eq('isDeleted', false)
            .order('createdAt', { ascending: true })
            .limit(limit);
          if (error) return jsonError('Could not load comments. Please try again.', 500);
          const comments = (data ?? []).map((c: any) => ({
            id: c._id,
            postId: c.postId,
            authorId: c.authorId,
            parentCommentId: c.parentCommentId,
            text: c.text,
            createdAt: c.createdAt,
            likesCount: c.likesCount ?? 0,
            mediaUrl: c.mediaUrl,
            mediaStorageId: c.mediaStorageId,
            mediaType: c.mediaType,
            duration: c.duration,
            isDeleted: c.isDeleted,
          }));
          return Response.json(comments);
        }

        if (operation === 'toggleRepost') {
          const postId = typeof args.postId === 'string' ? args.postId : '';
          if (!postId) return jsonError('Post ID is required.', 400);
          const { data, error } = await admin.rpc('toggle_lalao_post_repost', {
            p_user_id: currentUser._id, p_post_id: postId,
          });
          if (error) return jsonError(error.message || 'Could not update repost.', 400);
          return Response.json(data);
        }

        if (operation === 'listUserPosts') {
          const allowedKeys = new Set(['userId', 'username', 'limit', 'cursor']);
          if (Object.keys(args).some((key) => !allowedKeys.has(key))
            || (args.userId !== undefined
              && (typeof args.userId !== 'string' || !args.userId.trim() || args.userId.length > 128))
            || (args.username !== undefined
              && (typeof args.username !== 'string' || !args.username.trim() || args.username.length > 64))
            || (args.limit !== undefined
              && (typeof args.limit !== 'number' || !Number.isInteger(args.limit) || args.limit < 1))) {
            return jsonError('Invalid profile posts request.', 400);
          }

          const username = typeof args.username === 'string'
            ? args.username.replace(/^@+/, '').trim().toLowerCase()
            : null;
          const cursor = args.cursor;
          if (cursor !== undefined && (
            !cursor || typeof cursor !== 'object' || Array.isArray(cursor)
            || Object.keys(cursor).length !== 2
            || typeof (cursor as Record<string, unknown>).createdAt !== 'number'
            || !Number.isFinite((cursor as Record<string, number>).createdAt)
            || typeof (cursor as Record<string, unknown>).id !== 'string'
            || !/^[A-Za-z0-9_-]{1,128}$/.test((cursor as Record<string, string>).id)
          )) {
            return jsonError('Invalid profile posts cursor.', 400);
          }

          let targetQuery = admin.from('users').select('_id,username,suspended');
          if (typeof args.userId === 'string') targetQuery = targetQuery.eq('_id', args.userId);
          else if (username) targetQuery = targetQuery.eq('username', username);
          else targetQuery = targetQuery.eq('_id', currentUser._id);
          const { data: target, error: targetError } = await targetQuery.maybeSingle();
          if (targetError) return jsonError('Could not load user posts. Please try again.', 500);
          if (!target || target.suspended
            || (username && String(target.username ?? '').toLowerCase() !== username)) {
            return Response.json({ posts: [], nextCursor: null });
          }

          const limit = Math.min(100, typeof args.limit === 'number' ? args.limit : 40);
          const isOwner = target._id === currentUser._id;
          let query = admin.from('posts').select(profilePostSelect)
            .eq('authorId', target._id)
            .neq('moderationStatus', 'removed');
          if (!isOwner) query = query.or('audience.is.null,audience.eq.everyone');
          if (cursor !== undefined) {
            const value = cursor as { createdAt: number; id: string };
            query = query.or(
              `createdAt.lt.${value.createdAt},and(createdAt.eq.${value.createdAt},_id.lt.${value.id})`,
            );
          }
          const { data, error } = await query
            .order('createdAt', { ascending: false })
            .order('_id', { ascending: false })
            .limit(limit + 1);
          if (error) return jsonError('Could not load user posts. Please try again.', 500);

          const rows = (data ?? []) as Record<string, any>[];
          const hasMore = rows.length > limit;
          const posts = rows.slice(0, limit);
          const lastPost = posts[posts.length - 1];
          return Response.json({
            posts,
            nextCursor: hasMore && lastPost
              ? { createdAt: lastPost.createdAt, id: lastPost._id }
              : null,
          });
        }

        if (operation === 'listVideoPosts') {
          const limit = Math.min(100, Math.max(1, Number(args.limit || 24)));
          const cursor = typeof args.cursor === 'number' ? args.cursor : undefined;
          let query = admin.from('posts').select('*')
            .neq('moderationStatus', 'removed')
            .order('createdAt', { ascending: false })
            .limit(300);
          const { data, error } = await query;
          if (error) return jsonError('Could not load video posts. Please try again.', 500);
          const currentUserId = typeof currentUser?._id === 'string' ? currentUser._id : null;
          const candidates = (data ?? []).filter((post: any) => {
            const isVideo = post.mediaType === 'video' || Boolean(post.muxPlaybackId);
            if (!isVideo) return false;
            if (post.audience === 'closeFriends' && post.authorId !== currentUserId) return false;
            return true;
          });
          const eligible = cursor === undefined ? candidates : candidates.filter((p) => Number(p.createdAt) < cursor);
          return Response.json(eligible.slice(0, limit));
        }

        if (operation === 'getRelationship') {
          if (Object.keys(args).length !== 1 || typeof args.targetUserId !== 'string' || !args.targetUserId) {
            return jsonError('Invalid relationship request.', 400);
          }
          const [followingResult, followerResult] = await Promise.all([
            admin.from('follows').select('followingId')
              .eq('followerId', currentUser._id).eq('followingId', args.targetUserId),
            admin.from('follows').select('followerId')
              .eq('followerId', args.targetUserId).eq('followingId', currentUser._id),
          ]);
          if (followingResult.error || followerResult.error) {
            return jsonError('Could not load this relationship. Please try again.', 500);
          }

          const isFollowing = Boolean(followingResult.data?.length);
          const followsMe = Boolean(followerResult.data?.length);
          const relationship = isFollowing && followsMe
            ? 'friends'
            : isFollowing ? 'following' : followsMe ? 'follower' : 'none';
          return Response.json({ isFollowing, followsMe, isFriend: relationship === 'friends', relationship });
        }

        if (Object.keys(args).some((key) => key !== 'userId')
          || (args.userId !== undefined && typeof args.userId !== 'string')) {
          return jsonError('Invalid connection-list request.', 400);
        }
        const targetUserId = typeof args.userId === 'string' ? args.userId : currentUser._id;

        if (operation === 'getMyFollowers') {
          const [recordsResult, viewerFollowingResult] = await Promise.all([
            admin.from('follows').select('followerId,createdAt')
              .eq('followingId', targetUserId).order('createdAt', { ascending: true }),
            admin.from('follows').select('followingId')
              .eq('followerId', currentUser._id),
          ]);
          if (recordsResult.error || viewerFollowingResult.error) {
            return jsonError('Could not load followers. Please try again.', 500);
          }

          const records = recordsResult.data ?? [];
          const followerIds = [...new Set(records
            .map((record: any) => record.followerId)
            .filter((id: unknown): id is string => typeof id === 'string'))];
          if (!followerIds.length) return Response.json([]);

          const usersResult = await admin.from('users').select(connectionUserSelect).in('_id', followerIds);
          if (usersResult.error) return jsonError('Could not load followers. Please try again.', 500);
          const usersById = new Map<string, Record<string, any>>(
            (usersResult.data ?? []).map((user: any): [string, Record<string, any>] => [user._id, user]),
          );
          const viewerFollowingIds = new Set((viewerFollowingResult.data ?? [])
            .map((record: any) => String(record.followingId)));
          const followers = records.flatMap((record: any) => {
            const user = usersById.get(record.followerId);
            return user && !user.suspended
              ? [projectConnectionUser(user, record.createdAt, viewerFollowingIds.has(user._id))]
              : [];
          });
          return Response.json(followers);
        }

        const [recordsResult, pageRecordsResult, viewerFollowingResult] = await Promise.all([
          admin.from('follows').select('followingId,createdAt')
            .eq('followerId', targetUserId).order('createdAt', { ascending: true }),
          admin.from('pageFollowers').select('pageId,createdAt')
            .eq('userId', targetUserId).order('createdAt', { ascending: true }),
          admin.from('follows').select('followingId')
            .eq('followerId', currentUser._id),
        ]);
        if (recordsResult.error || pageRecordsResult.error || viewerFollowingResult.error) {
          return jsonError('Could not load following. Please try again.', 500);
        }

        const records = recordsResult.data ?? [];
        const followingIds = [...new Set(records
          .map((record: any) => record.followingId)
          .filter((id: unknown): id is string => typeof id === 'string'))];
        const pageRecords = pageRecordsResult.data ?? [];
        const pageIds = [...new Set(pageRecords
          .map((record: any) => record.pageId)
          .filter((id: unknown): id is string => typeof id === 'string'))];
        const [usersResult, pagesResult] = await Promise.all([
          followingIds.length
            ? admin.from('users').select(connectionUserSelect).in('_id', followingIds)
            : Promise.resolve({ data: [], error: null }),
          pageIds.length
            ? admin.from('pages')
              .select('_id,name,username,avatar,description,location,followersCount,type,badge')
              .in('_id', pageIds)
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (usersResult.error || pagesResult.error) {
          return jsonError('Could not load following. Please try again.', 500);
        }

        const usersById = new Map<string, Record<string, any>>(
          (usersResult.data ?? []).map((user: any): [string, Record<string, any>] => [user._id, user]),
        );
        const pagesById = new Map<string, Record<string, any>>(
          (pagesResult.data ?? []).map((page: any): [string, Record<string, any>] => [page._id, page]),
        );
        const viewerFollowingIds = new Set((viewerFollowingResult.data ?? [])
          .map((record: any) => String(record.followingId)));
        const people = records.flatMap((record: any) => {
          const user = usersById.get(record.followingId);
          if (!user || user.suspended) return [];
          return [{
            ...projectConnectionUser(
              user,
              record.createdAt,
              currentUser._id === targetUserId || viewerFollowingIds.has(user._id),
            ),
            type: 'person' as const,
          }];
        });
        const pages = pageRecords.flatMap((record: any) => {
          const page = pagesById.get(record.pageId);
          if (!page) return [];
          return [{
            id: page._id,
            type: 'page' as const,
            name: page.name ?? 'Page',
            username: page.username ?? 'page',
            avatar: page.avatar ?? '',
            description: page.description ?? '',
            location: (page.location ?? '').trim(),
            followersCount: page.followersCount ?? 0,
            pageType: page.type,
            badge: page.badge,
            isFollowing: true,
            followedAt: record.createdAt,
          }];
        });
        return Response.json({
          people,
          pages,
          peopleCt: people.length,
          pagesCt: pages.length,
        });
    }

    const allowedFeedArgs = new Set([
      'feedType', 'latitude', 'longitude', 'radiusKm', 'locationName', 'cursor', 'limit',
    ]);
    if (Object.keys(args).some((key) => !allowedFeedArgs.has(key))) {
      return jsonError('Invalid feed request.', 400);
    }
    if (
      (args.feedType !== undefined && typeof args.feedType !== 'string') ||
      (args.latitude !== undefined && (typeof args.latitude !== 'number' || !Number.isFinite(args.latitude))) ||
      (args.longitude !== undefined && (typeof args.longitude !== 'number' || !Number.isFinite(args.longitude))) ||
      (args.radiusKm !== undefined && (typeof args.radiusKm !== 'number' || !Number.isFinite(args.radiusKm))) ||
      (args.locationName !== undefined && typeof args.locationName !== 'string') ||
      (args.cursor !== undefined && (typeof args.cursor !== 'number' || !Number.isFinite(args.cursor)))
    ) {
      return jsonError('Invalid feed request.', 400);
    }
    const requestedFeedType = typeof args.feedType === 'string' && args.feedType.trim()
      ? args.feedType.toLowerCase().trim()
      : 'for_you';
    if (!['for_you', 'nearby'].includes(requestedFeedType)) {
      return jsonError('This feed is not available on the staged backend.', 400);
    }

    const rawLimit = args.limit === undefined ? 40 : Number(args.limit);
    if (!Number.isFinite(rawLimit) || rawLimit < 1) return jsonError('Invalid feed limit.', 400);
    const limit = Math.min(100, Math.floor(rawLimit));
    const cursor = typeof args.cursor === 'number' && Number.isFinite(args.cursor) ? args.cursor : undefined;

    try {
      const admin = context.supabaseAdmin;
      const currentUser = context.currentUser as Record<string, any> | null;
      const currentUserId = typeof currentUser?._id === 'string' ? currentUser._id : null;
      const userLat = typeof args.latitude === 'number' ? args.latitude : currentUser?.latitude;
      const userLng = typeof args.longitude === 'number' ? args.longitude : currentUser?.longitude;
      const radiusKm = typeof args.radiusKm === 'number' ? args.radiusKm : (currentUser?.radiusKm ?? 5);
      const maxRadiusMeters = radiusKm * 1000;
      const feedType = requestedFeedType;

      let posts: Record<string, any>[] = [];

      if (feedType === 'following') {
        if (!currentUserId) return Response.json([]);

        const [followUsersResult, followPagesResult] = await Promise.all([
          admin.from('follows').select('followingId').eq('followerId', currentUserId),
          admin.from('pageFollowers').select('pageId').eq('userId', currentUserId),
        ]);
        if (followUsersResult.error || followPagesResult.error) {
          return jsonError('Could not load the following feed.', 500);
        }

        const followedUserIds = [...new Set((followUsersResult.data ?? [])
          .map((row: any) => row.followingId).filter((id: unknown): id is string => typeof id === 'string'))];
        const followedPageIds = [...new Set((followPagesResult.data ?? [])
          .map((row: any) => row.pageId).filter((id: unknown): id is string => typeof id === 'string'))];

        if (!followedUserIds.length && !followedPageIds.length) return Response.json([]);

        let candidates: Record<string, any>[] = [];
        if (followedUserIds.length + followedPageIds.length <= 30) {
          const queries = [
            ...followedUserIds.map((authorId) => admin.from('posts').select('*')
              .eq('authorId', authorId).order('createdAt', { ascending: false }).limit(25)),
            ...followedPageIds.map((pageId) => admin.from('posts').select('*')
              .eq('pageRefId', pageId).order('createdAt', { ascending: false }).limit(25)),
          ];
          const results = await Promise.all(queries);
          if (results.some((result: any) => result.error)) {
            return jsonError('Could not load the following feed.', 500);
          }
          const unique = new Map<string, Record<string, any>>();
          for (const result of results) {
            for (const post of result.data ?? []) {
              if (post.moderationStatus !== 'removed' && typeof post._id === 'string') unique.set(post._id, post);
            }
          }
          candidates = [...unique.values()].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
        } else {
          let nearbyQuery = admin.from('posts').select(feedPostSelect)
            .order('createdAt', { ascending: false }).order('_id', { ascending: false });
          if (cursor !== undefined) nearbyQuery = nearbyQuery.lt('createdAt', cursor);
          const { data, error } = await nearbyQuery.limit(300);
          if (error) return jsonError('Could not load the following feed.', 500);
          candidates = (data ?? []).filter((post: any) => {
            if (post.moderationStatus === 'removed') return false;
            if (post.pageRefId && followedPageIds.includes(post.pageRefId)) return true;
            return !post.pageRefId && followedUserIds.includes(post.authorId);
          });
        }

        if (cursor !== undefined) candidates = candidates.filter((post) => Number(post.createdAt) < cursor);
        posts = candidates.slice(0, limit);
      } else if (feedType === 'nearby') {
        if (typeof userLat !== 'number' || typeof userLng !== 'number'
          || !Number.isFinite(userLat) || !Number.isFinite(userLng)) {
          return Response.json([]);
        }

        const { data, error } = await admin.from('posts').select('*')
          .order('createdAt', { ascending: false }).limit(300);
        if (error) return jsonError('Could not load nearby posts.', 500);

        const candidates = (data ?? []).filter((post: any) => {
          if (post.moderationStatus === 'removed') return false;
          if (post.audience && post.audience !== 'everyone' && post.authorId !== currentUserId) return false;
          if (typeof post.latitude !== 'number' || typeof post.longitude !== 'number'
            || !Number.isFinite(post.latitude) || !Number.isFinite(post.longitude)) return false;
          if (post.nearbyEnabled === false) return false;
          const distance = haversineMeters(userLat, userLng, post.latitude, post.longitude);
          if (distance > maxRadiusMeters) return false;
          post._computedDistance = distance;
          return true;
        });
        candidates.sort((a: any, b: any) =>
          Number(b.createdAt) - Number(a.createdAt) || String(b._id).localeCompare(String(a._id)));
        posts = candidates.slice(0, limit);
      } else if (!['for_you', 'following', 'nearby'].includes(feedType)) {
        const topicSlug = feedType;
        const { data: topic, error: topicError } = await admin.from('topics')
          .select('displayName').eq('slug', topicSlug).maybeSingle();
        if (topicError) return jsonError('Could not load this topic feed.', 500);

        const { data, error } = await admin.from('posts').select('*')
          .order('createdAt', { ascending: false }).limit(300);
        if (error) return jsonError('Could not load this topic feed.', 500);

        const displayName = typeof topic?.displayName === 'string'
          ? topic.displayName.toLowerCase()
          : topicSlug;
        const candidates = (data ?? []).filter((post: any) =>
          post.moderationStatus !== 'removed'
          && (isPostMatchingTopic(post, topicSlug) || isPostMatchingTopic(post, displayName)),
        );
        const eligible = cursor === undefined
          ? candidates
          : candidates.filter((post: any) => Number(post.createdAt) < cursor);
        posts = eligible.slice(0, limit);
      } else {
        let recentQuery = admin.from('posts').select(feedPostSelect)
          .order('createdAt', { ascending: false }).order('_id', { ascending: false });
        if (cursor !== undefined) recentQuery = recentQuery.lt('createdAt', cursor);
        const { data: recent, error: postsError } = await recentQuery.limit(150);
        if (postsError) return jsonError('Could not load your feed.', 500);

        let candidates = recent ?? [];

        const [seedsResult, preferencesResult, sensitiveResult] = await Promise.all([
          admin.from('recommendations').select('targetId').eq('active', true),
          currentUserId
            ? admin.from('userTopicPreferences').select('topicSlug,preference').eq('userId', currentUserId)
            : Promise.resolve({ data: [], error: null }),
          admin.from('topics').select('slug,displayName,requiresExplicitOptIn')
            .eq('isSensitive', true),
        ]);
        if (seedsResult.error || preferencesResult.error || sensitiveResult.error) {
          return jsonError('Could not load feed preferences.', 500);
        }

        const seedIds = new Set((seedsResult.data ?? []).map((row: any) => row.targetId));
        const interestedTopics = new Set<string>();
        const reducedTopics = new Set<string>();
        const excludedTopics = new Set<string>();

        for (const preference of preferencesResult.data ?? []) {
          if (typeof preference.topicSlug !== 'string') continue;
          const slug = preference.topicSlug.toLowerCase();
          if (preference.preference === 'interested') interestedTopics.add(slug);
          else if (preference.preference === 'reduced') reducedTopics.add(slug);
          else if (preference.preference === 'excluded') excludedTopics.add(slug);
        }

        const sensitiveOptInSlugs = new Set<string>();
        for (const topic of sensitiveResult.data ?? []) {
          if (!topic.requiresExplicitOptIn) continue;
          if (typeof topic.slug === 'string') sensitiveOptInSlugs.add(topic.slug.toLowerCase());
          if (typeof topic.displayName === 'string') sensitiveOptInSlugs.add(topic.displayName.toLowerCase());
        }

        for (const interest of jsonArray(currentUser?.interests)) interestedTopics.add(interest);

        const eligible = candidates.filter((post: any) => {
          if (post.moderationStatus === 'removed') return false;
          if (post.audience && post.audience !== 'everyone' && post.authorId !== currentUserId) return false;

          const sensitive = [...sensitiveOptInSlugs].some((slug) => isPostMatchingTopic(post, slug));
          if (sensitive) {
            const optedIn = [...interestedTopics].some((topic) => isPostMatchingTopic(post, topic));
            if (!optedIn && post.authorId !== currentUserId) return false;
          }

          const excluded = [...excludedTopics].some((topic) => isPostMatchingTopic(post, topic));
          if (excluded && post.authorId !== currentUserId) return false;
          return true;
        });

        const scored = eligible.map((post: any) => {
          const engagement = (post.likesCount || 0) * 3
            + (post.commentsCount || 0) * 4
            + (post.repostsCount || 0) * 5;
          const ageHours = Math.max(0.1, (Date.now() - Number(post.createdAt)) / 3_600_000);
          let topicMultiplier = 1;
          if ([...interestedTopics].some((topic) => isPostMatchingTopic(post, topic))) topicMultiplier *= 3.5;
          if ([...reducedTopics].some((topic) => isPostMatchingTopic(post, topic))) topicMultiplier *= 0.25;
          const authorOrPageId = post.pageRefId || post.authorId;
          const seedBoost = seedIds.has(authorOrPageId) ? 5 : 1;
          const score = ((engagement + 1) * topicMultiplier * seedBoost) / Math.pow(ageHours + 2, 1.2);
          return { post, score };
        });
        scored.sort((a, b) =>
          b.score - a.score
          || Number(b.post.createdAt) - Number(a.post.createdAt)
          || String(b.post._id).localeCompare(String(a.post._id)));
        posts = scored.slice(0, limit).map((item) => item.post);
      }

      if (!posts.length) return Response.json([]);

      const authorIds = [...new Set(posts.filter((post) => !post.pageRefId)
        .map((post) => post.authorId).filter((id: unknown): id is string => typeof id === 'string'))];
      const pageIds = [...new Set(posts.filter((post) => typeof post.pageRefId === 'string')
        .map((post) => post.pageRefId as string))];
      const postIds = posts.map((post) => post._id);

      const [usersResult, pagesResult, likesResult, followsResult] = await Promise.all([
        authorIds.length
          ? admin.from('users').select(feedUserSelect).in('_id', authorIds)
          : Promise.resolve({ data: [], error: null }),
        pageIds.length
          ? admin.from('pages').select(feedPageSelect).in('_id', pageIds)
          : Promise.resolve({ data: [], error: null }),
        currentUserId
          ? admin.from('likes').select('targetId').eq('userId', currentUserId)
            .eq('targetType', 'post').in('targetId', postIds)
          : Promise.resolve({ data: [], error: null }),
        currentUserId && authorIds.length
          ? admin.from('follows').select('followingId').eq('followerId', currentUserId)
            .in('followingId', authorIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (usersResult.error || pagesResult.error || likesResult.error || followsResult.error) {
        return jsonError('Could not prepare feed posts.', 500);
      }

      const users = new Map<string, Record<string, any>>((usersResult.data ?? []).map((user: any) => [String(user._id), user]));
      const pages = new Map<string, Record<string, any>>((pagesResult.data ?? []).map((page: any) => [String(page._id), page]));
      const likedIds = new Set((likesResult.data ?? []).map((like: any) => String(like.targetId)));
      const followingIds = new Set((followsResult.data ?? []).map((follow: any) => String(follow.followingId)));

      const results = posts.filter((post) => post.moderationStatus !== 'removed').map((post: any) => {
        let author: Record<string, any> | null = null;
        if (post.pageRefId) {
          const page = pages.get(String(post.pageRefId));
          if (page) {
            author = {
              id: page._id,
              name: page.name,
              username: page.username,
              avatar: page.avatar || '',
              userType: page.type || 'business',
              followersCount: page.followersCount || 0,
              followingCount: 0,
              isFollowing: false,
              isVerified: true,
              location: page.location,
            };
          }
        }
        if (!author) {
          const user = users.get(String(post.authorId));
          if (user) {
            const avatar = user.avatarUrl || user.avatar || '';
            author = {
              id: user._id,
              name: user.name || 'User',
              username: user.username || 'user',
              avatar,
              avatarUrl: avatar,
              userType: user.userType || 'person',
              bio: user.bio || '',
              location: typeof user.locationName === 'string'
                ? user.locationName.replace(' (Detected)', '').replace('GPS Detected', '').trim()
                : '',
              followersCount: user.followersCount || 0,
              followingCount: user.followingCount || 0,
              isFollowing: followingIds.has(String(user._id)),
              publicIdentityType: user.publicIdentityType || 'display_name',
              ...resolveUserVerification(user),
            };
          }
        }

        const distanceMeters = typeof userLat === 'number' && typeof userLng === 'number'
          && typeof post.latitude === 'number' && typeof post.longitude === 'number'
          ? haversineMeters(userLat, userLng, post.latitude, post.longitude)
          : undefined;

        return {
          id: post._id,
          author,
          text: post.text,
          mediaUrl: post.mediaUrl || undefined,
          mediaStorageId: post.mediaStorageId,
          muxUploadId: post.muxUploadId,
          muxAssetId: post.muxAssetId,
          muxPlaybackId: post.muxPlaybackId,
          mediaType: post.mediaType,
          location: post.location,
          distanceMeters,
          createdAt: formatRelativeTime(post.createdAt),
          likesCount: post.likesCount ?? 0,
          commentsCount: post.commentsCount ?? 0,
          repostsCount: post.repostsCount ?? 0,
          isLiked: likedIds.has(String(post._id)),
          isReposted: false,
          comments: [],
          audience: post.audience ?? 'everyone',
          replyPermission: post.replyPermission ?? 'everyone',
          gifUrl: post.gifUrl,
          contentTopics: post.contentTopics || [],
          poll: post.pollQuestion
            ? {
              question: post.pollQuestion,
              options: post.pollOptions ?? [],
              votes: new Array((post.pollOptions ?? []).length).fill(0),
            }
            : undefined,
          rallyRefId: post.rallyRefId,
          pageRefId: post.pageRefId,
          soundId: post.soundId,
          soundTitle: post.soundTitle,
          soundAuthorName: post.soundAuthorName,
          soundAudioUrl: post.soundAudioUrl,
          soundStartOffset: post.soundStartOffset,
          soundVolume: post.soundVolume,
          originalAudioVolume: post.originalAudioVolume,
        };
      });

      return Response.json(results);
    } catch {
      return jsonError('Could not load your feed. Please try again.', 500);
    }
  }),
};
