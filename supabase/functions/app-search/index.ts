import { withLalaoAuth } from '../_shared/withLalaoAuth.ts';

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function verification(user: Record<string, unknown>) {
  const tier = user.verificationTier;
  const status = user.verificationStatus;
  const expiresAt = user.verificationExpiresAt;
  const verified = Boolean(tier && tier !== 'none' && (!status || status === 'active')
    && (!expiresAt || typeof expiresAt === 'number' && expiresAt > Date.now()));
  return { isVerified: verified, verificationTier: verified ? tier : 'none' };
}

export default {
  fetch: withLalaoAuth(async (request, context) => {
    if (request.method !== 'POST') return jsonError('Method not allowed.', 405);
    let body: unknown;
    try { body = await request.json(); }
    catch { return jsonError('Invalid request.', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid request.', 400);

    const input = body as { operation?: unknown; payload?: unknown };
    const operation = input.operation;
    if (!['getRecentSearches', 'recordRecentSearch', 'removeRecentSearch', 'clearAllRecentSearches'].includes(String(operation))) {
      return jsonError('Unsupported search operation.', 400);
    }

    try {
      const admin = context.supabaseAdmin;
      const currentUser = context.currentUser;
      if (!currentUser || typeof currentUser._id !== 'string') return jsonError('Lalao profile not found.', 404);
      const userId = currentUser._id;

      if (operation === 'getRecentSearches') {
        const rawLimit = (input.payload as { limit?: unknown } | null)?.limit;
        const parsedLimit = rawLimit === undefined ? 30 : Number(rawLimit);
        if (!Number.isFinite(parsedLimit)) return jsonError('Invalid search limit.', 400);
        const limit = Math.max(0, Math.min(50, Math.floor(parsedLimit)));
        const { data, error } = await admin.from('recentSearches').select('*')
          .eq('userId', userId).order('timestamp', { ascending: false }).limit(limit);
        if (error) return jsonError('Could not load recent searches. Please try again.', 500);
        const searches = data ?? [];
        const personIds = [...new Set(searches.filter((item) => item.type === 'person' && typeof item.entityId === 'string').map((item) => item.entityId as string))];
        const pageIds = [...new Set(searches.filter((item) => (item.type === 'page' || item.type === 'shop') && typeof item.entityId === 'string' && item.entityId !== 'plum').map((item) => item.entityId as string))];
        const [usersResult, pagesResult] = await Promise.all([
          personIds.length ? admin.from('users').select('_id,name,username,avatarUrl,verificationTier,verificationStatus,verificationExpiresAt').in('_id', personIds) : Promise.resolve({ data: [], error: null }),
          pageIds.length ? admin.from('pages').select('_id,name,category,avatar').in('_id', pageIds) : Promise.resolve({ data: [], error: null }),
        ]);
        if (usersResult.error || pagesResult.error) return jsonError('Could not load recent searches. Please try again.', 500);
        const users = new Map<string, Record<string, unknown>>((usersResult.data ?? []).map((user) => [String(user._id), user]));
        const pages = new Map<string, Record<string, unknown>>((pagesResult.data ?? []).map((page) => [String(page._id), page]));
        const enriched = searches.map((item) => {
          const entityId = typeof item.entityId === 'string' ? item.entityId : '';
          if (item.type === 'person') {
            const user = entityId ? users.get(entityId) : undefined;
            if (user) return {
              ...item,
              title: user.name || item.title || 'User',
              subtitle: user.username ? `@${user.username}` : item.subtitle,
              avatarUrl: user.avatarUrl || item.avatarUrl,
              ...verification(user),
            };
            return { ...item, isVerified: false, verificationTier: 'none' };
          } else if ((item.type === 'page' || item.type === 'shop') && entityId) {
            const page = pages.get(entityId);
            if (page) return {
              ...item,
              title: page.name || item.title,
              subtitle: page.category || item.subtitle,
              avatarUrl: page.avatar || item.avatarUrl,
            };
          }
          return item;
        });
        return Response.json(enriched);
      }

      if (operation === 'recordRecentSearch') {
        if (!input.payload || typeof input.payload !== 'object' || Array.isArray(input.payload)) return jsonError('Invalid recent search.', 400);
        const safeSearch = { ...(input.payload as Record<string, unknown>) };
        delete safeSearch.isVerified;
        delete safeSearch.verificationTier;
        const { data, error } = await admin.rpc('upsert_lalao_recent_search', {
          p_user_id: userId,
          p_search: safeSearch,
        });
        if (error) {
          if (error.code === '22023') return jsonError('Invalid recent search.', 400);
          return jsonError('Could not save this search. Please try again.', 500);
        }
        return Response.json(data);
      }

      if (operation === 'removeRecentSearch') {
        const searchId = (input.payload as { id?: unknown } | null)?.id;
        if (typeof searchId !== 'string' || !searchId) return jsonError('Invalid recent search ID.', 400);
        const { error } = await admin.rpc('remove_lalao_recent_search', { p_user_id: userId, p_search_id: searchId });
        if (error?.code === '42501') return jsonError('Unauthorized to remove this search item.', 403);
        if (error) return jsonError('Could not remove this search. Please try again.', 500);
        return Response.json({ success: true });
      }

      const { data: count, error } = await admin.rpc('clear_lalao_recent_searches', { p_user_id: userId });
      if (error) return jsonError('Could not clear recent searches. Please try again.', 500);
      return Response.json({ count: typeof count === 'number' ? count : 0 });
    } catch {
      return jsonError('Could not complete the search request. Please try again.', 500);
    }
  }),
};
