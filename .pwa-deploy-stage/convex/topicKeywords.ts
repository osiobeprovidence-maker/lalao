/**
 * Maintainable Topic-to-Keywords Dictionary
 * Used for text and metadata matching in For You personalization.
 */

export const TOPIC_KEYWORD_DICTIONARY: Record<string, string[]> = {
  // LGBTQ+ and Queer Community
  lgbtq_queer: [
    "lgbtq+",
    "lgbtq",
    "lgbt",
    "queer",
    "gay",
    "lesbian",
    "bisexual",
    "transgender",
    "nonbinary",
    "pride",
    "pansexual",
    "asexual",
    "homosexual",
    "rainbow",
    "drag",
  ],
  lgbtq: [
    "lgbtq+",
    "lgbtq",
    "lgbt",
    "queer",
    "gay",
    "lesbian",
    "bisexual",
    "transgender",
    "nonbinary",
    "pride",
    "pansexual",
  ],

  // Anime and Manga
  anime_manga: [
    "anime",
    "manga",
    "otaku",
    "weeb",
    "crunchyroll",
    "shonen",
    "seinen",
    "naruto",
    "one piece",
    "jujutsu kaisen",
    "demon slayer",
    "bleach",
    "attack on titan",
    "dragon ball",
    "cosplay",
  ],
  anime: [
    "anime",
    "manga",
    "otaku",
    "shonen",
    "crunchyroll",
    "cosplay",
  ],

  // Gaming
  gaming: [
    "gaming",
    "gamer",
    "videogame",
    "videogames",
    "playstation",
    "xbox",
    "nintendo",
    "esports",
    "gameplay",
    "pc master race",
    "steam",
    "fifa",
    "fc 24",
    "call of duty",
    "fortnite",
    "valorant",
    "apex legends",
    "gta",
    "roblox",
    "minecraft",
  ],

  // Technology and Artificial Intelligence
  technology_ai: [
    "technology",
    "tech",
    "ai",
    "artificial intelligence",
    "machine learning",
    "coding",
    "software engineer",
    "programmer",
    "developer",
    "chatgpt",
    "robotics",
    "startups",
    "web3",
    "cybersecurity",
    "gadgets",
    "python",
    "javascript",
  ],
  stem: [
    "stem",
    "science",
    "technology",
    "engineering",
    "mathematics",
    "physics",
    "chemistry",
    "biology",
    "biotech",
    "research",
    "scientific",
  ],

  // Drama & Nollywood / Entertainment
  drama: [
    "drama",
    "nollywood",
    "soap opera",
    "movie",
    "series",
    "cinema",
    "tv series",
    "telenovela",
    "blockbuster",
    "theatre",
  ],

  // Music
  music: [
    "music",
    "song",
    "songs",
    "afrobeats",
    "amapiano",
    "hip hop",
    "rap",
    "artist",
    "album",
    "track",
    "singer",
    "concert",
    "spotify",
    "audiomack",
  ],

  // Fashion & Lifestyle
  fashion_lifestyle: [
    "fashion",
    "lifestyle",
    "outfit",
    "ootd",
    "streetwear",
    "runway",
    "beauty",
    "skincare",
    "cosmetics",
    "hair",
    "style",
  ],

  // Education
  education: [
    "education",
    "university",
    "campus",
    "student",
    "scholarship",
    "learning",
    "study",
    "exams",
    "degree",
    "academic",
  ],

  // Business & Entrepreneurship
  business_entrepreneurship: [
    "business",
    "entrepreneur",
    "startup",
    "investing",
    "commerce",
    "marketing",
    "sales",
    "e-commerce",
    "freelance",
  ],

  // Sports
  sports: [
    "sports",
    "football",
    "soccer",
    "premier league",
    "champions league",
    "basketball",
    "nba",
    "athletics",
    "gym",
    "fitness",
    "workout",
  ],

  // Religion & Spirituality
  religion_spirituality: [
    "religion",
    "spirituality",
    "faith",
    "prayer",
    "church",
    "mosque",
    "worship",
    "devotional",
    "bible",
    "quran",
    "gospel",
  ],

  // Politics & Civic
  politics_civic: [
    "politics",
    "governance",
    "election",
    "policy",
    "democracy",
    "advocacy",
    "civil rights",
  ],
};

/**
 * Escapes regex special characters in a keyword string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks whether a piece of text matches a keyword using word boundary rules.
 * Handles keywords with symbols like 'lgbtq+' or 'e-commerce' cleanly.
 */
export function matchesKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  const kw = keyword.toLowerCase().trim();
  if (!kw) return false;

  // Build a boundary regex: ensures keyword is not embedded inside longer words
  // e.g. "gay" does not match "agayev", "stem" does not match "system"
  const escaped = escapeRegExp(kw);
  const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}([^a-zA-Z0-9_]|$)`, "i");
  return regex.test(text);
}

/**
 * Gets all keywords associated with a topic slug or custom topic name.
 */
export function getKeywordsForTopic(topicSlugOrName: string): string[] {
  const norm = topicSlugOrName.toLowerCase().trim().replace(/[-\s]+/g, "_");
  const rawClean = topicSlugOrName.toLowerCase().trim();

  const set = new Set<string>();

  // 1. Add direct keyword representations
  set.add(rawClean);
  if (norm !== rawClean) set.add(norm);

  // 2. Add dictionary keywords if defined
  const dictMatches = TOPIC_KEYWORD_DICTIONARY[norm] || TOPIC_KEYWORD_DICTIONARY[rawClean];
  if (dictMatches) {
    for (const kw of dictMatches) set.add(kw.toLowerCase().trim());
  }

  // 3. Fallback: if topic is e.g. "lgbtq+" or "lgbt", check keys that contain it
  if (norm.includes("lgbt") || rawClean.includes("lgbt")) {
    for (const kw of TOPIC_KEYWORD_DICTIONARY["lgbtq_queer"] || []) set.add(kw);
  } else if (norm.includes("anime") || rawClean.includes("anime")) {
    for (const kw of TOPIC_KEYWORD_DICTIONARY["anime_manga"] || []) set.add(kw);
  } else if (norm.includes("gaming") || rawClean.includes("game")) {
    for (const kw of TOPIC_KEYWORD_DICTIONARY["gaming"] || []) set.add(kw);
  }

  return Array.from(set);
}

/**
 * Checks whether a post matches a specific topic by inspecting text, captions, hashtags, and tags.
 */
export function isPostMatchingTopic(
  post: {
    text?: string;
    caption?: string;
    title?: string;
    contentTopics?: string[];
    tags?: string[];
  },
  topicSlugOrName: string
): boolean {
  if (!post || !topicSlugOrName) return false;
  const keywords = getKeywordsForTopic(topicSlugOrName);
  const slugLower = topicSlugOrName.toLowerCase().trim();

  // 1. Check contentTopics / tags exact or normalized match
  if (post.contentTopics && Array.isArray(post.contentTopics)) {
    for (const ct of post.contentTopics) {
      const ctl = ct.toLowerCase().trim();
      if (ctl === slugLower || keywords.includes(ctl)) return true;
    }
  }

  if (post.tags && Array.isArray(post.tags)) {
    for (const tag of post.tags) {
      const tl = tag.toLowerCase().trim();
      if (tl === slugLower || keywords.includes(tl)) return true;
    }
  }

  // 2. Check hashtags extracted from text
  const fullText = [post.text, post.caption, post.title].filter(Boolean).join(" ");
  if (!fullText) return false;

  const hashMatches = fullText.match(/#([a-zA-Z0-9_+]+)/g);
  if (hashMatches) {
    for (const hm of hashMatches) {
      const tagContent = hm.substring(1).toLowerCase().trim();
      if (tagContent === slugLower || keywords.includes(tagContent)) return true;
    }
  }

  // 3. Check keywords with boundary-safe matching
  for (const kw of keywords) {
    if (matchesKeyword(fullText, kw)) {
      return true;
    }
  }

  return false;
}
