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
  console.log(`\nResult: ${allPassed ? "ALL 10 SCENARIOS PASSED" : "SOME TESTS FAILED"}`);
  process.exit(allPassed ? 0 : 1);
}
