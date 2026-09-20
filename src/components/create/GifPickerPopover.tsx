import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, TrendingUp } from 'lucide-react';

interface GifPickerPopoverProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

interface CuratedGif {
  id: string;
  title: string;
  url: string;
  category: string;
}

const CURATED_GIFS: CuratedGif[] = [
  // Trending / Reactions
  {
    id: 't1',
    title: 'Happy Dance',
    category: 'trending',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
  },
  {
    id: 't2',
    title: 'Shocked Cat',
    category: 'trending',
    url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  },
  {
    id: 't3',
    title: 'Popcorn Excitement',
    category: 'trending',
    url: 'https://media.giphy.com/media/GLbiGvv9RiNpK/giphy.gif',
  },
  {
    id: 't4',
    title: 'Thumbs Up Cool',
    category: 'trending',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
  },
  {
    id: 't5',
    title: 'Mind Blown',
    category: 'trending',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  },
  {
    id: 't6',
    title: 'Applause / Clapping',
    category: 'trending',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  },
  // Reactions
  {
    id: 'r1',
    title: 'Nodding Agree',
    category: 'reactions',
    url: 'https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif',
  },
  {
    id: 'r2',
    title: 'Facepalm',
    category: 'reactions',
    url: 'https://media.giphy.com/media/3oEjI67Egb8G9jN3Q4/giphy.gif',
  },
  {
    id: 'r3',
    title: 'Laughing Hard',
    category: 'reactions',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
  },
  {
    id: 'r4',
    title: 'Side Eye Suspicious',
    category: 'reactions',
    url: 'https://media.giphy.com/media/H5C8CevNMbpBqNqFjl/giphy.gif',
  },
  {
    id: 'r5',
    title: 'Confused Travolta',
    category: 'reactions',
    url: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif',
  },
  {
    id: 'r6',
    title: 'Sipping Tea Mind Business',
    category: 'reactions',
    url: 'https://media.giphy.com/media/3o85xGocUH8RY0Wo2k/giphy.gif',
  },
  // Memes
  {
    id: 'm1',
    title: 'This is Fine Dog',
    category: 'memes',
    url: 'https://media.giphy.com/media/9M5jK4GXmD5o1irGrF/giphy.gif',
  },
  {
    id: 'm2',
    title: 'Roll Safe Smart Brain',
    category: 'memes',
    url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif',
  },
  {
    id: 'm3',
    title: 'Leonardo DiCaprio Cheers',
    category: 'memes',
    url: 'https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif',
  },
  {
    id: 'm4',
    title: 'Disaster Girl Smirk',
    category: 'memes',
    url: 'https://media.giphy.com/media/8fen5LSZcHQ5O/giphy.gif',
  },
  // Anime
  {
    id: 'a1',
    title: 'Anime Wow Eyes',
    category: 'anime',
    url: 'https://media.giphy.com/media/c5skRQb3BXp8RwYKGb/giphy.gif',
  },
  {
    id: 'a2',
    title: 'Anime Running Fast',
    category: 'anime',
    url: 'https://media.giphy.com/media/2y98KScHKeaQM/giphy.gif',
  },
  {
    id: 'a3',
    title: 'Anime Eating Ramen',
    category: 'anime',
    url: 'https://media.giphy.com/media/12uXi1GXBibALC/giphy.gif',
  },
  {
    id: 'a4',
    title: 'Anime Power Up Aura',
    category: 'anime',
    url: 'https://media.giphy.com/media/B6SyssSlTgPXq/giphy.gif',
  },
  // Celebration
  {
    id: 'c1',
    title: 'Confetti Party Celebration',
    category: 'celebration',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  },
  {
    id: 'c2',
    title: 'Victory Dance High Five',
    category: 'celebration',
    url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif',
  },
  {
    id: 'c3',
    title: 'Fireworks Sparkler',
    category: 'celebration',
    url: 'https://media.giphy.com/media/peAFQfg7Ol6IE/giphy.gif',
  },
];

const GIF_CATEGORIES = [
  { id: 'trending', label: 'Trending' },
  { id: 'reactions', label: 'Reactions' },
  { id: 'memes', label: 'Memes' },
  { id: 'anime', label: 'Anime' },
  { id: 'celebration', label: 'Party' },
];

export const GifPickerPopover: React.FC<GifPickerPopoverProps> = ({
  onSelectGif,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiGifs, setApiGifs] = useState<{ id: string; title: string; url: string }[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Search GIPHY API if key is present, otherwise filter curated
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setApiGifs(null);
      return;
    }

    const apiKey = (import.meta as any).env?.VITE_GIPHY_API_KEY;
    if (!apiKey) {
      // Filter curated GIFs by title or category
      const filtered = CURATED_GIFS.filter(
        (g) =>
          g.title.toLowerCase().includes(query.toLowerCase()) ||
          g.category.toLowerCase().includes(query.toLowerCase())
      );
      setApiGifs(filtered);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
            query
          )}&limit=16&rating=g`
        );
        if (res.ok) {
          const data = await res.json();
          const items = (data.data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            url: item.images?.fixed_height?.url || item.images?.original?.url,
          }));
          setApiGifs(items);
        }
      } catch (err) {
        console.error('Error querying GIPHY:', err);
        const filtered = CURATED_GIFS.filter(
          (g) =>
            g.title.toLowerCase().includes(query.toLowerCase()) ||
            g.category.toLowerCase().includes(query.toLowerCase())
        );
        setApiGifs(filtered);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayedGifs = apiGifs ?? CURATED_GIFS.filter((g) => g.category === activeCategory);

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 mb-2 z-50 w-[330px] sm:w-[380px] max-w-[90vw] rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="GIF Picker"
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full rounded-xl bg-neutral-100 py-1.5 pl-8 pr-7 text-xs text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5E43F3]"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Close GIF picker"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Category selector tabs (shown when not searching) */}
      {!searchQuery && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-neutral-100 py-2 scrollbar-none">
          {GIF_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  isActive
                    ? 'bg-[#5E43F3] text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* GIF Grid */}
      <div className="mt-2.5 max-h-[260px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin text-[#5E43F3]" />
          </div>
        ) : displayedGifs.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {displayedGifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelectGif(gif.url)}
                className="group relative aspect-video overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100 transition hover:opacity-90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
              >
                <img
                  src={gif.url}
                  alt={gif.title || 'GIF'}
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 text-[10px] font-medium text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {gif.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-neutral-400">
            No GIFs found. Try searching for another term!
          </div>
        )}
      </div>
    </div>
  );
};
