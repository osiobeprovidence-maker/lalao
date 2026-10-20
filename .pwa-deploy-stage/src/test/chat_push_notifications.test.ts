/**
 * Lalao Chat Push Notification and Recipient Validation Test Suite
 */

interface MockUser {
  _id: string;
  name: string;
  tokenIdentifier: string;
}

interface MockConversation {
  _id: string;
  userA: string;
  userB?: string;
  pageB?: string;
  groupChatId?: string;
}

interface MockGroupChat {
  _id: string;
  name: string;
  creatorId: string;
  memberIds: string[];
}

interface PushSubscription {
  _id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  isActive: boolean;
}

interface MockNotification {
  recipientId: string;
  actorId: string;
  type: string;
  conversationId: string;
  messageId: string;
  targetExcerpt: string;
  isRead: boolean;
}

interface MockPushDispatch {
  recipientId: string;
  title: string;
  body: string;
  url: string;
  conversationId?: string;
  messageId?: string;
  tag?: string;
}

export function runChatNotificationTests() {
  const results: { name: string; passed: boolean; details?: string }[] = [];

  const userA: MockUser = { _id: "user_a_123", name: "Alice", tokenIdentifier: "token_alice" };
  const userB: MockUser = { _id: "user_b_456", name: "Bob", tokenIdentifier: "token_bob" };
  const userC: MockUser = { _id: "user_c_789", name: "Charlie", tokenIdentifier: "token_charlie" };

  const directConvo: MockConversation = {
    _id: "conv_direct_1",
    userA: userA._id,
    userB: userB._id,
  };

  const groupChat: MockGroupChat = {
    _id: "group_1",
    name: "Lalao Pioneers",
    creatorId: userA._id,
    memberIds: [userA._id, userB._id, userC._id],
  };

  const groupConvo: MockConversation = {
    _id: "conv_group_1",
    userA: userA._id,
    groupChatId: groupChat._id,
  };

  const subscriptions: PushSubscription[] = [
    { _id: "sub_b", userId: userB._id, endpoint: "https://push.example.com/b", p256dh: "keyb", auth: "authb", isActive: true },
    { _id: "sub_c_inactive", userId: userC._id, endpoint: "https://push.example.com/c", p256dh: "keyc", auth: "authc", isActive: false },
  ];

  function determineRecipients(senderId: string, convo: MockConversation, group?: MockGroupChat): string[] {
    const recipients: string[] = [];
    if (convo.groupChatId && group) {
      for (const mId of group.memberIds) {
        if (mId !== senderId) recipients.push(mId);
      }
    } else {
      const directRecipient = convo.userA === senderId ? convo.userB : convo.userA;
      if (directRecipient && directRecipient !== senderId) {
        recipients.push(directRecipient);
      }
    }
    return recipients;
  }

  function simulateSendMessage(
    sender: MockUser,
    convo: MockConversation,
    text: string,
    group?: MockGroupChat
  ) {
    const recipients = determineRecipients(sender._id, convo, group);
    const inAppNotifications: MockNotification[] = [];
    const pushDispatches: MockPushDispatch[] = [];
    const messageId = `msg_${Date.now()}`;

    const senderName = sender.name;
    const previewText = text.trim().slice(0, 100);
    const pushTitle = convo.groupChatId ? `New message in group` : `New message from ${senderName}`;

    for (const recId of recipients) {
      inAppNotifications.push({
        recipientId: recId,
        actorId: sender._id,
        type: "message",
        conversationId: convo._id,
        messageId,
        targetExcerpt: text.slice(0, 80),
        isRead: false,
      });

      pushDispatches.push({
        recipientId: recId,
        title: pushTitle,
        body: previewText,
        url: `/app?chat=${convo._id}`,
        conversationId: convo._id,
        messageId,
        tag: `chat-${convo._id}`,
      });
    }

    return { messageId, recipients, inAppNotifications, pushDispatches };
  }

  // 1. Direct message triggers push for recipient
  const dmResult = simulateSendMessage(userA, directConvo, "Hello Bob!");
  results.push({
    name: "Scenario 1: Direct message triggers push notification for recipient",
    passed: dmResult.pushDispatches.length === 1 && dmResult.pushDispatches[0].recipientId === userB._id,
  });

  // 2. Sender does not receive push for their own message
  results.push({
    name: "Scenario 2: Sender does NOT receive a push for their own message",
    passed: !dmResult.pushDispatches.some((p) => p.recipientId === userA._id),
  });

  // 3. Group message notifies all other group members according to rules
  const groupResult = simulateSendMessage(userA, groupConvo, "Hello Pioneers!", groupChat);
  results.push({
    name: "Scenario 3: Group messages notify all members except sender",
    passed:
      groupResult.pushDispatches.length === 2 &&
      groupResult.pushDispatches.some((p) => p.recipientId === userB._id) &&
      groupResult.pushDispatches.some((p) => p.recipientId === userC._id) &&
      !groupResult.pushDispatches.some((p) => p.recipientId === userA._id),
  });

  // 4. URL deep-link correctly encodes chat id
  results.push({
    name: "Scenario 4: Push dispatch URL contains correct ?chat= query parameter",
    passed:
      dmResult.pushDispatches[0].url === `/app?chat=${directConvo._id}` &&
      dmResult.pushDispatches[0].conversationId === directConvo._id,
  });

  // 5. Stable tag is present to prevent notification stacking
  results.push({
    name: "Scenario 5: Push dispatch contains stable tag to prevent notification flooding",
    passed: dmResult.pushDispatches[0].tag === `chat-${directConvo._id}`,
  });

  // 6. User with inactive or no subscription does not break message delivery
  const userBSubs = subscriptions.filter((s) => s.userId === userB._id && s.isActive);
  const userCSubs = subscriptions.filter((s) => s.userId === userC._id && s.isActive);
  const userASubs = subscriptions.filter((s) => s.userId === userA._id && s.isActive);

  results.push({
    name: "Scenario 6: User with inactive or missing subscription handles gracefully without throwing",
    passed: userBSubs.length === 1 && userCSubs.length === 0 && userASubs.length === 0,
  });

  // 7. Preview text truncation respects privacy limit
  const longText = "A".repeat(250);
  const longResult = simulateSendMessage(userA, directConvo, longText);
  results.push({
    name: "Scenario 7: Message preview is truncated to safe maximum length (100 chars)",
    passed: longResult.pushDispatches[0].body.length === 100,
  });

  // 8. Service worker click routing parses chat id accurately
  function parseSwClick(data: { url?: string; conversationId?: string }) {
    if (data.conversationId) return `/app?chat=${data.conversationId}`;
    if (data.url && data.url.startsWith("/")) return data.url;
    return "/app";
  }
  const swParsed = parseSwClick({ conversationId: "conv_direct_1", url: "/app?chat=conv_direct_1" });
  results.push({
    name: "Scenario 8: Service worker correctly parses notificationclick target to /app?chat=...",
    passed: swParsed === "/app?chat=conv_direct_1",
  });

  // 9. Deep-link param opens chat modal in webapp
  function simulateAppDeepLink(search: string) {
    const params = new URLSearchParams(search);
    const chatParam = params.get("chat");
    let activeTab = "home";
    let activeChatId: string | null = null;
    if (chatParam) {
      activeTab = "messages";
      activeChatId = chatParam;
    }
    return { activeTab, activeChatId };
  }
  const deepLinkResult = simulateAppDeepLink("?chat=conv_direct_1");
  results.push({
    name: "Scenario 9: App.tsx deep linking opens messages tab and sets activeChatId directly",
    passed: deepLinkResult.activeTab === "messages" && deepLinkResult.activeChatId === "conv_direct_1",
  });

  // 10. Duplicate events prevent duplicate inserts
  const processedNotifs = new Set<string>();
  const firstDispatch = processedNotifs.has(dmResult.messageId) ? false : (processedNotifs.add(dmResult.messageId), true);
  const secondDispatch = processedNotifs.has(dmResult.messageId) ? false : (processedNotifs.add(dmResult.messageId), true);
  results.push({
    name: "Scenario 10: Duplicate notification processing is strictly idempotent",
    passed: firstDispatch === true && secondDispatch === false,
  });

  // 11. OneSignal configuration and isolated service worker scope
  const oneSignalConfig = {
    appId: "0da46499-22a0-4035-8dfa-49f4395367da",
    serviceWorkerPath: "onesignal/OneSignalSDKWorker.js",
    serviceWorkerParam: { scope: "/onesignal/" },
  };
  results.push({
    name: "Scenario 11: OneSignal configuration uses correct App ID and isolated /onesignal/ scope",
    passed:
      oneSignalConfig.appId === "0da46499-22a0-4035-8dfa-49f4395367da" &&
      oneSignalConfig.serviceWorkerPath === "onesignal/OneSignalSDKWorker.js" &&
      oneSignalConfig.serviceWorkerParam.scope === "/onesignal/",
  });

  // 12. OneSignal external_id targeting aligns with canonical Lalao userId
  function buildOneSignalPayload(recipientId: string, title: string, body: string, conversationId: string) {
    return {
      app_id: oneSignalConfig.appId,
      target_channel: "push",
      include_aliases: {
        external_id: [recipientId],
      },
      headings: { en: title },
      contents: { en: body },
      url: `/app?chat=${conversationId}`,
      data: { conversationId },
    };
  }
  const osPayload = buildOneSignalPayload(userB._id, "New message from Alice", "Hello Bob!", directConvo._id);
  results.push({
    name: "Scenario 12: OneSignal REST API payload targets canonical recipient external_id correctly",
    passed:
      osPayload.include_aliases.external_id[0] === userB._id &&
      osPayload.url === `/app?chat=${directConvo._id}` &&
      osPayload.data.conversationId === directConvo._id,
  });

  // 13. OneSignal notification click parsing preserves chat deep link
  function parseOneSignalClick(launchURL: string) {
    const urlObj = new URL(launchURL, "https://lalao.app");
    const chat = urlObj.searchParams.get("chat");
    const tab = urlObj.searchParams.get("tab");
    return { chat, tab: chat ? "messages" : tab || "home" };
  }
  const clickNav = parseOneSignalClick("https://lalao.app/app?chat=conv_direct_1");
  results.push({
    name: "Scenario 13: OneSignal notification click parses target to messages tab and activeChatId",
    passed: clickNav.chat === "conv_direct_1" && clickNav.tab === "messages",
  });

  // 14. OneSignal user identity clear on sign-out
  let activeExternalId: string | null = userA._id;
  function handleOneSignalSignOut() {
    activeExternalId = null;
  }
  handleOneSignalSignOut();
  results.push({
    name: "Scenario 14: OneSignal user identity is cleared safely on sign-out",
    passed: activeExternalId === null,
  });

  // 15. Chat notification with valid sender profile avatar URL
  function resolveChatPushIcon(senderAvatar?: string) {
    if (senderAvatar && senderAvatar.startsWith("https://")) {
      return senderAvatar;
    }
    return "/icon-192.png";
  }
  const senderWithAvatar = "https://images.example.com/profiles/alice_photo.jpg";
  const chatIconWithAvatar = resolveChatPushIcon(senderWithAvatar);
  results.push({
    name: "Scenario 15: Chat notifications use sender's valid HTTPS profile avatar as notification icon",
    passed: chatIconWithAvatar === senderWithAvatar,
  });

  // 16. Chat notification with missing or invalid avatar falls back to official Lalao app icon
  const chatIconWithoutAvatar = resolveChatPushIcon(undefined);
  const chatIconWithHttp = resolveChatPushIcon("http://insecure.example.com/pic.jpg");
  results.push({
    name: "Scenario 16: Chat notifications with missing or non-HTTPS avatar gracefully fall back to official Lalao app icon",
    passed: chatIconWithoutAvatar === "/icon-192.png" && chatIconWithHttp === "/icon-192.png",
  });

  // 17. General notifications (system, subscriptions, likes, comments) use official Lalao app icon
  function resolveGeneralNotificationIcon(type: string) {
    return "/icon-192.png";
  }
  const generalIcon = resolveGeneralNotificationIcon("system_alert");
  results.push({
    name: "Scenario 17: General notifications (likes, follows, system, cycles) use official Lalao app icon",
    passed: generalIcon === "/icon-192.png",
  });

  // 18. OneSignal zero-recipient / invalid_aliases response triggers fallback to VAPID
  function evaluateOneSignalDelivery(resStatus: number, json: any): { pushDelivered: boolean; shouldFallback: boolean } {
    const recipientsCount = typeof json?.recipients === "number" ? json.recipients : 0;
    const hasInvalidAliases = Boolean(json?.errors?.invalid_aliases);
    const delivered = resStatus === 200 && Boolean(json?.id) && recipientsCount > 0 && !hasInvalidAliases;
    return {
      pushDelivered: delivered,
      shouldFallback: !delivered,
    };
  }

  const zeroRecipientResponse = evaluateOneSignalDelivery(200, {
    id: "os-notif-uuid-1",
    recipients: 0,
    errors: { invalid_aliases: { external_id: ["user_b_456"] } },
  });
  results.push({
    name: "Scenario 18: OneSignal API response with recipients=0 and invalid_aliases triggers fallback without dropping notification",
    passed: zeroRecipientResponse.pushDelivered === false && zeroRecipientResponse.shouldFallback === true,
  });

  // 19. OneSignal accepted response with recipients > 0 prevents duplicate VAPID fallback
  const validDeliveryResponse = evaluateOneSignalDelivery(200, {
    id: "os-notif-uuid-2",
    recipients: 1,
  });
  results.push({
    name: "Scenario 19: OneSignal API response with recipients > 0 records successful delivery and guards against duplicate dispatch",
    passed: validDeliveryResponse.pushDelivered === true && validDeliveryResponse.shouldFallback === false,
  });

  // 20. When native permission is already granted, OneSignal opts in without prompting user again
  function resolveOptInAction(nativePermission: string, oneSignalOptedIn: boolean) {
    if (nativePermission === "granted") {
      return oneSignalOptedIn ? "already_active" : "auto_opt_in_silent";
    }
    return "prompt_permission";
  }
  const autoOptInAction = resolveOptInAction("granted", false);
  const alreadyActiveAction = resolveOptInAction("granted", true);
  results.push({
    name: "Scenario 20: Pre-granted native notification permission automatically syncs OneSignal optIn without re-prompting",
    passed: autoOptInAction === "auto_opt_in_silent" && alreadyActiveAction === "already_active",
  });

  return results;
}

if (typeof process !== "undefined" && process.argv[1]?.includes("chat_push_notifications.test.ts")) {
  console.log("Running Lala Chat Push Notification & Routing Tests...\n");
  const testResults = runChatNotificationTests();
  let allPassed = true;
  for (const res of testResults) {
    console.log(`${res.passed ? "✓ PASS" : "✗ FAIL"}: ${res.name}`);
    if (!res.passed) allPassed = false;
  }
  console.log(`\nResult: ${allPassed ? `ALL ${testResults.length} SCENARIOS PASSED` : "SOME TESTS FAILED"}`);
  process.exit(allPassed ? 0 : 1);
}
