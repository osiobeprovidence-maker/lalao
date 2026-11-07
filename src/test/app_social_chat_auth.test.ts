import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

const chatSql = readFileSync(resolve('supabase/migrations/20261118000000_social_chat_conversations_rpc.sql'), 'utf8');
assert.equal(chatSql.includes("current_setting('request.jwt.claims.sub'"), false, 'chat RPCs do not depend on the service client JWT claim');
for (const signature of [
  'create_lalao_conversation(\n  p_caller_id text,',
  'get_lalao_conversations(\n  p_caller_id text',
  'get_lalao_conversation_messages(\n  p_caller_id text,',
  'send_lalao_message(\n  p_caller_id text,',
  'edit_lalao_message(\n  p_caller_id text,',
  'delete_lalao_message(\n  p_caller_id text,',
  'mark_lalao_conversation_read(\n  p_caller_id text,',
  'create_lalao_group_chat(\n  p_caller_id text,',
  'invite_lalao_to_group_chat(\n  p_caller_id text,',
  'start_lalao_page_conversation(\n  p_caller_id text,',
]) assert.ok(chatSql.includes(signature), `RPC signature has explicit caller ID: ${signature.split('\n')[0]}`);

const source = readFileSync(resolve('supabase/functions/app-social/index.ts'), 'utf8')
  .replace("import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';", 'const withLalaoAuth = globalThis.__socialChatTestAuth;')
  .replace("import { isPostMatchingTopic } from '../_shared/topicKeywords.ts';", 'const isPostMatchingTopic = globalThis.__socialChatTestTopicMatch;');
const compiled = await transform(source, { loader: 'ts', format: 'cjs' });
const require = createRequire(import.meta.url);
const mod = { exports: {} as Record<string, unknown> };
const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
const admin = { rpc: async (name: string, args: Record<string, unknown>) => {
  calls.push({ name, args });
  if (name === 'create_lalao_conversation' || name === 'start_lalao_page_conversation') return { data: 'conversation-id', error: null };
  if (name === 'get_lalao_conversations') return { data: [], error: null };
  if (name === 'create_lalao_group_chat') return { data: { groupChatId: 'group', conversationId: 'conversation' }, error: null };
  return { data: 'message-id', error: null };
} };
const globals = globalThis as typeof globalThis & {
  __socialChatTestAuth?: (handler: unknown) => unknown;
  __socialChatTestTopicMatch?: () => boolean;
};
globals.__socialChatTestAuth = (handler) => handler;
globals.__socialChatTestTopicMatch = () => false;
try {
  new Function('module', 'exports', 'require', compiled.code)(mod, mod.exports, require);
} finally {
  delete globals.__socialChatTestAuth;
  delete globals.__socialChatTestTopicMatch;
}
const app = (mod.exports.default ?? mod.exports) as { fetch(request: Request, context: unknown): Promise<Response> };
async function invoke(operation: string, payload: Record<string, unknown>, userId = 'verified-profile-id') {
  return app.fetch(new Request('http://local/functions/v1/app-social', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operation, payload }),
  }), { currentUser: { _id: userId }, supabaseAdmin: admin });
}

assert.equal((await invoke('getOrCreateConversation', { otherUserId: 'target', callerId: 'forged' })).status, 400);
assert.equal(calls.length, 0, 'forged identity keys are rejected before RPC execution');
assert.equal((await invoke('getOrCreateConversation', { otherUserId: 'target' })).status, 200);
assert.deepEqual(calls.at(-1), { name: 'create_lalao_conversation', args: { p_caller_id: 'verified-profile-id', p_other_user_id: 'target' } });
assert.equal((await invoke('listConversations', {})).status, 200);
assert.deepEqual(calls.at(-1)?.args, { p_caller_id: 'verified-profile-id' });
assert.equal((await invoke('sendMessage', { conversationId: 'c', text: 'hello', callerId: 'forged' })).status, 400);
assert.equal((await invoke('sendMessage', { conversationId: 'c', text: 'hello' })).status, 200);
assert.equal(calls.at(-1)?.args.p_caller_id, 'verified-profile-id');
assert.equal((await invoke('editMessage', { messageId: 'm', text: 'edited' })).status, 200);
assert.equal(calls.at(-1)?.args.p_caller_id, 'verified-profile-id');
assert.equal((await invoke('deleteMessage', { messageId: 'm' })).status, 200);
assert.equal(calls.at(-1)?.args.p_caller_id, 'verified-profile-id');
assert.equal((await invoke('markConversationRead', { conversationId: 'c' })).status, 200);
assert.equal(calls.at(-1)?.args.p_caller_id, 'verified-profile-id');
assert.equal((await invoke('createGroupChat', { name: 'Group', memberIds: 'not-array' })).status, 400);
assert.equal((await invoke('createGroupChat', { name: 'Group', memberIds: ['x', 4] })).status, 400);
assert.equal((await invoke('createGroupChat', { name: 'Group', memberIds: ['target'] })).status, 200);
assert.equal(calls.at(-1)?.args.p_caller_id, 'verified-profile-id');
assert.equal((await invoke('inviteUserToGroupChat', { groupChatId: 'g', userId: 'verified-profile-id' })).status, 400);
assert.equal((await invoke('inviteUserToGroupChat', { groupChatId: 'g', userId: 'target' })).status, 200);
assert.equal(calls.at(-1)?.args.p_caller_id, 'verified-profile-id');
assert.equal((await invoke('startPageConversation', { pageId: 'page' })).status, 200);
assert.equal(calls.at(-1)?.args.p_caller_id, 'verified-profile-id');
