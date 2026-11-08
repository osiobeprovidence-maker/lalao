import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  ArrowLeft,
  Bell,
  BellRing,
  BookOpen,
  Check,
  ChevronDown,
  Grid2X2,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  UserPlus,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

type ArtworkTheme = 'reborn' | 'contract' | 'demon' | 'post';

type MangaChapter = {
  id: string;
  label: string;
  title: string;
  theme: ArtworkTheme;
  variation: number;
};

type MangaSeries = {
  id: string;
  title: string;
  readers: string;
  chapters: number;
  genre: string;
  status: string;
  theme: ArtworkTheme;
  description: string;
  chapterPreviews: MangaChapter[];
};

const mangaSeries: MangaSeries[] = [
  {
    id: 'reborn',
    title: 'Reborn to Humiliate Her',
    readers: '60.3K',
    chapters: 70,
    genre: 'Revenge · Romance',
    status: 'Ongoing',
    theme: 'reborn',
    description: 'She came back with a plan. This time, every secret has a price.',
    chapterPreviews: [
      { id: 'reborn-1', label: 'CH. 1', title: 'The Last Night', theme: 'reborn', variation: 1 },
      { id: 'reborn-2', label: 'CH. 2', title: 'A Second Life', theme: 'reborn', variation: 2 },
      { id: 'reborn-3', label: 'CH. 3', title: 'The First Move', theme: 'reborn', variation: 3 },
      { id: 'reborn-4', label: 'CH. 4', title: 'An Old Enemy', theme: 'reborn', variation: 4 },
      { id: 'reborn-5', label: 'CH. 5', title: 'A Perfect Smile', theme: 'reborn', variation: 5 },
    ],
  },
  {
    id: 'contract',
    title: 'The Secret Love Contract',
    readers: '335.9K',
    chapters: 35,
    genre: 'Romance · Drama',
    status: 'Completed',
    theme: 'contract',
    description: 'One signature. Two strangers. A very inconvenient kind of love.',
    chapterPreviews: [
      { id: 'contract-1', label: 'CH. 1', title: 'Terms & Conditions', theme: 'contract', variation: 1 },
      { id: 'contract-2', label: 'CH. 2', title: 'The Arrangement', theme: 'contract', variation: 2 },
      { id: 'contract-3', label: 'CH. 3', title: 'Close Enough', theme: 'contract', variation: 3 },
      { id: 'contract-4', label: 'CH. 4', title: 'The First Rule', theme: 'contract', variation: 4 },
      { id: 'contract-5', label: 'CH. 5', title: 'Caught Looking', theme: 'contract', variation: 5 },
    ],
  },
  {
    id: 'demon',
    title: "The Demon Queen's Return",
    readers: '142.7K',
    chapters: 28,
    genre: 'Fantasy · Action',
    status: 'Ongoing',
    theme: 'demon',
    description: 'Banished from her throne, the queen returns to reclaim her name.',
    chapterPreviews: [
      { id: 'demon-1', label: 'CH. 1', title: 'The Exile', theme: 'demon', variation: 1 },
      { id: 'demon-2', label: 'CH. 2', title: 'Ashes Awaken', theme: 'demon', variation: 2 },
      { id: 'demon-3', label: 'CH. 3', title: 'A Crown of Fire', theme: 'demon', variation: 3 },
      { id: 'demon-4', label: 'CH. 4', title: 'The Old Oath', theme: 'demon', variation: 4 },
      { id: 'demon-5', label: 'CH. 5', title: 'Thronebound', theme: 'demon', variation: 5 },
    ],
  },
];

const themeStyles: Record<ArtworkTheme, { background: string; glow: string; ink: string; title: string }> = {
  reborn: {
    background: 'from-[#36151f] via-[#8b3546] to-[#e29873]',
    glow: 'bg-rose-200/20',
    ink: 'bg-[#25151a]/80',
    title: 'SECOND\nCHANCE',
  },
  contract: {
    background: 'from-[#321b36] via-[#b85583] to-[#f1b0a4]',
    glow: 'bg-pink-100/25',
    ink: 'bg-[#2e1930]/80',
    title: 'SECRET\nPROMISE',
  },
  demon: {
    background: 'from-[#17132f] via-[#5d2c88] to-[#d04c63]',
    glow: 'bg-violet-200/25',
    ink: 'bg-[#171126]/85',
    title: 'DEMON\nQUEEN',
  },
  post: {
    background: 'from-[#25214a] via-[#6654a7] to-[#e893aa]',
    glow: 'bg-fuchsia-100/25',
    ink: 'bg-[#1a1632]/80',
    title: 'MANGA\nMOMENTS',
  },
};

function MangaArtwork({ theme, variation = 1, compact = false, label }: {
  theme: ArtworkTheme;
  variation?: number;
  compact?: boolean;
  label?: string;
}) {
  const colors = themeStyles[theme];
  return (
    <div
      aria-label={label || 'Original manga preview artwork'}
      role="img"
      className={`relative isolate overflow-hidden bg-gradient-to-br ${colors.background} ${compact ? 'h-full w-full' : 'h-full w-full'}`}
    >
      <div className={`absolute -right-4 -top-6 h-20 w-20 rounded-full blur-xl ${colors.glow}`} />
      <div className="absolute inset-y-0 left-[12%] w-px bg-white/15" />
      <div className="absolute inset-y-0 right-[13%] w-px bg-black/15" />
      <div className={`absolute bottom-[-13%] left-[28%] h-[68%] w-[42%] -rotate-[10deg] rounded-[48%_48%_12%_12%] ${colors.ink} shadow-2xl`} />
      <div className={`absolute bottom-[31%] left-[36%] h-[38%] w-[27%] rounded-[48%_48%_42%_42%] bg-[#f3c8b4]/90 shadow-lg ${variation % 2 ? 'rotate-[-8deg]' : 'rotate-[7deg]'}`}>
        <div className="absolute -left-[15%] top-[8%] h-[42%] w-[130%] -rotate-6 rounded-t-full bg-[#211923]" />
        <div className="absolute left-[23%] top-[45%] h-1 w-1 rounded-full bg-[#26191b]" />
        <div className="absolute right-[23%] top-[45%] h-1 w-1 rounded-full bg-[#26191b]" />
        <div className="absolute left-[39%] top-[67%] h-px w-[22%] rotate-3 bg-[#8d4853]" />
      </div>
      <div className="absolute left-2 top-2 h-8 w-8 rotate-12 rounded-full border border-white/50 bg-white/10" />
      <div className="absolute right-2 top-3 h-10 w-5 rotate-12 border-l-2 border-white/35" />
      {!compact && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent px-2 pb-2 pt-8">
          <p className="whitespace-pre-line text-[9px] font-black leading-[0.95] tracking-[0.12em] text-white drop-shadow">{colors.title}</p>
        </div>
      )}
      {compact && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-4">
          <span className="rounded bg-black/60 px-1 py-0.5 text-[8px] font-extrabold tracking-wide text-white">{label}</span>
        </div>
      )}
    </div>
  );
}

function formatCount(count: number) {
  return count >= 1_000_000
    ? `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
    : count >= 1_000
      ? `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
      : count.toLocaleString();
}

function MangaReaderPreview({ series, chapterIndex, onBack, onChapterChange }: {
  series: MangaSeries;
  chapterIndex: number;
  onBack: () => void;
  onChapterChange: (index: number) => void;
}) {
  const chapter = series.chapterPreviews[chapterIndex] ?? series.chapterPreviews[0];
  const dialogBySeries: Record<string, [string, string, string, string]> = {
    reborn: ['If I could start again, I would never trust them.', 'Then start again.', 'This time, I know exactly where to begin.', 'The first name on her list was his.'],
    contract: ['It is only a contract. Nothing more.', 'Then why are you looking at me like that?', 'Because this was not part of the agreement.', 'They both pretended not to hear the silence.'],
    demon: ['The throne remembers its queen.', 'Then let the kingdom remember too.', 'The ash beneath her feet began to glow.', 'At last, the gates opened.'],
  };
  const dialog = dialogBySeries[series.id] ?? dialogBySeries.reborn;
  const chapterNumber = chapterIndex + 1;

  return (
    <div className="min-h-full bg-[#0c0c0e] pb-24 text-white">
      <div className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#101012]/95 px-3 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[600px] items-center justify-between">
          <button onClick={onBack} aria-label="Back to publisher profile" className="rounded-full p-2 text-white/85 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 px-2 text-center">
            <p className="truncate text-[11px] font-bold">{series.title}</p>
            <p className="text-[9px] text-white/45">Lalao Manga · reader preview</p>
          </div>
          <button onClick={onBack} aria-label="Close reader" className="rounded-full p-2 text-white/65 hover:bg-white/10">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[600px]">
        <div className="px-4 pb-3 pt-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-300">Chapter {chapterNumber}</p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight">{chapter.title}</h1>
          <p className="mt-1 text-[10px] text-white/40">{series.title} <span className="px-1 text-white/20">·</span> Sample reader page</p>
        </div>

        <div className="space-y-1 bg-black px-2 py-2 sm:px-8">
          <div className="relative aspect-[0.9] overflow-hidden rounded-sm">
            <MangaArtwork theme={series.theme} variation={chapter.variation} label={`${series.title} chapter ${chapterNumber}, opening panel`} />
            <div className="absolute left-[5%] top-[7%] max-w-[62%] rounded-[14px_14px_14px_3px] border border-black/5 bg-white/95 px-3 py-2 text-[11px] font-semibold leading-snug text-[#241e25] shadow-lg">
              {dialog[0]}
            </div>
            <div className="absolute bottom-[11%] right-[5%] max-w-[58%] rounded-[14px_14px_3px_14px] border border-black/5 bg-white/95 px-3 py-2 text-[11px] font-semibold leading-snug text-[#241e25] shadow-lg">
              {dialog[1]}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[2, 3].map((line, index) => (
              <div key={line} className="relative aspect-[0.83] overflow-hidden rounded-sm">
                <MangaArtwork theme={series.theme} variation={chapter.variation + index + 1} compact label={`${series.title} chapter ${chapterNumber}, panel ${index + 2}`} />
                <div className={`absolute ${index === 0 ? 'left-2 top-2' : 'bottom-2 right-2'} max-w-[80%] rounded-xl ${index === 0 ? 'rounded-bl-sm' : 'rounded-br-sm'} bg-white/95 px-2.5 py-2 text-[10px] font-semibold leading-snug text-[#241e25] shadow-lg`}>
                  {dialog[line]}
                </div>
              </div>
            ))}
          </div>
          <div className="relative aspect-[1.2] overflow-hidden rounded-sm">
            <MangaArtwork theme={series.theme} variation={chapter.variation + 4} label={`${series.title} chapter ${chapterNumber}, closing panel`} />
            <div className="absolute bottom-[8%] left-1/2 max-w-[75%] -translate-x-1/2 rounded-full border border-black/5 bg-white/95 px-4 py-2 text-center text-[10px] font-bold text-[#241e25] shadow-lg">
              To be continued...
            </div>
          </div>
        </div>

        <div className="px-4 py-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">End of sample chapter</p>
          <p className="mt-1 text-[10px] text-white/25">Artwork and dialogue are a local prototype preview.</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.08] bg-[#111113]/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <button disabled={chapterIndex === 0} onClick={() => onChapterChange(Math.max(0, chapterIndex - 1))} className="h-10 flex-1 rounded-xl border border-white/10 text-xs font-bold text-white/75 disabled:opacity-30">Previous</button>
          <span className="shrink-0 text-[10px] font-semibold text-white/45">{chapterNumber} / {series.chapters}</span>
          <button onClick={() => onChapterChange((chapterIndex + 1) % series.chapterPreviews.length)} className="h-10 flex-1 rounded-xl bg-gradient-to-r from-[#e946a2] to-[#d946a5] text-xs font-extrabold text-white">Next chapter</button>
        </div>
      </div>
    </div>
  );
}

export const MangaPublisherProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { triggerShareToast } = useLalao();
  const publisher = useQuery(api.users.getUserByUsername, username ? { username } : 'skip');
  const publisherLikes = useQuery(api.users.getUserTotalLikes, publisher?._id ? { userId: publisher._id } : 'skip');
  const [activeTab, setProfileTab] = useState<'posts' | 'manga'>('manga');
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [followMenuOpen, setFollowMenuOpen] = useState(false);
  const [reader, setReader] = useState<{ seriesId: string; chapterIndex: number } | null>(null);
  const isDemoProfile = username === 'lalao_manga' && publisher === null;
  const isApprovedMangaCreator = publisher?.creatorType === 'manga';
  const canShowPublisherProfile = isDemoProfile || isApprovedMangaCreator;
  const publisherName = isDemoProfile
    ? 'Lalao Manga'
    : publisher?.mangaPublisherName || publisher?.name || 'Manga Creator';
  const publisherUsername = isDemoProfile ? 'lalao_manga' : publisher?.username || username || 'manga_creator';
  const publisherBio = isDemoProfile
    ? 'Your daily dose of manga stories.'
    : publisher?.mangaCreatorAbout || 'Manga and webtoon stories from this approved Lalao publisher.';
  const displayedSeries = isDemoProfile ? mangaSeries : [];

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/manga/${publisherUsername}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: publisherName, text: publisherBio, url: profileUrl });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        triggerShareToast('Manga profile link copied');
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') triggerShareToast('Could not share profile link');
    }
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/app');
  };

  const handleMessage = () => {
    triggerShareToast('Publisher messages are not available in this preview yet');
  };

  if (publisher === undefined) {
    return <div className="min-h-screen animate-pulse bg-[#111111]" />;
  }

  if (!canShowPublisherProfile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#111111] px-6 text-center text-white">
        <BookOpen className="h-9 w-9 text-violet-300" />
        <h1 className="mt-4 text-lg font-bold">Manga Creator profile unavailable</h1>
        <p className="mt-2 max-w-sm text-sm text-white/50">This publisher profile is created after a Manga Creator application is approved.</p>
        <button onClick={goBack} className="mt-5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white">Go back</button>
      </div>
    );
  }

  if (reader) {
    const series = mangaSeries.find((item) => item.id === reader.seriesId);
    if (series) {
      return (
        <MangaReaderPreview
          series={series}
          chapterIndex={reader.chapterIndex}
          onBack={() => setReader(null)}
          onChapterChange={(chapterIndex) => setReader({ ...reader, chapterIndex })}
        />
      );
    }
  }

  return (
    <div className="min-h-full bg-[#111111] pb-8 text-white">
      <div className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.06] bg-[#111111]/95 px-4 backdrop-blur">
        <button onClick={goBack} aria-label="Go back" className="rounded-full p-2 text-white/85 transition hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold leading-tight">{publisherName}</p>
          <p className="text-[10px] text-white/45">@{publisherUsername}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setNotificationsOn((value) => !value)} aria-label={notificationsOn ? 'Turn notifications off' : 'Turn notifications on'} className="rounded-full p-2 text-white/80 transition hover:bg-white/10">
            {notificationsOn ? <BellRing className="h-[18px] w-[18px] text-[#a78bfa]" /> : <Bell className="h-[18px] w-[18px]" />}
          </button>
          <button onClick={handleShare} aria-label="Share profile" className="rounded-full p-2 text-white/80 transition hover:bg-white/10">
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <section className="px-4 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[23px] border border-white/10 bg-gradient-to-br from-violet-500 via-fuchsia-600 to-rose-500 p-[2px] shadow-[0_0_32px_rgba(124,58,237,0.22)]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[21px] bg-[#17131d]">
              <div className="relative flex h-full w-full items-center justify-center">
                <div className="absolute h-11 w-11 rounded-full bg-fuchsia-500/30 blur-md" />
                <BookOpen className="relative h-9 w-9 text-[#d8c8ff]" strokeWidth={1.8} />
                <span className="absolute bottom-2 text-[7px] font-black uppercase tracking-[0.22em] text-white">Lalao</span>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[19px] font-extrabold tracking-tight">{publisherName}</h1>
              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300">Publisher</span>
            </div>
            <p className="mt-0.5 text-xs text-white/45">@{publisherUsername} <span className="px-1 text-white/20">·</span> Manga</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/80">{publisherBio}</p>
          </div>
          <button aria-label="More profile actions" onClick={() => triggerShareToast('More publisher options coming soon')} className="mt-1 rounded-full p-2 text-white/65 hover:bg-white/10">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-5 text-[11px] text-white/45">
          <span><strong className="mr-1 text-sm font-bold text-white">{isDemoProfile ? '18' : formatCount(publisher?.followingCount || 0)}</strong>Following</span>
          <span><strong className="mr-1 text-sm font-bold text-white">{isDemoProfile ? '84.2K' : formatCount(publisher?.followersCount || 0)}</strong>Followers</span>
          <span><strong className="mr-1 text-sm font-bold text-white">{isDemoProfile ? '2.6M' : formatCount(publisherLikes?.totalLikes || 0)}</strong>Likes</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={handleMessage} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#181818] text-xs font-bold text-white transition hover:bg-[#222]">
            <MessageCircle className="h-4 w-4" /> Message
          </button>
          <div className="relative flex-[1.35]">
            <div className="flex h-10 overflow-hidden rounded-xl bg-gradient-to-r from-[#6844e8] to-[#8b5cf6] text-xs font-bold text-white shadow-[0_5px_18px_rgba(124,58,237,0.18)]">
              <button onClick={() => { setIsFollowing((value) => !value); setFollowMenuOpen(false); triggerShareToast(isFollowing ? 'Unfollowed @lalao_manga' : 'Following @lalao_manga'); }} className="flex flex-1 items-center justify-center gap-1.5 px-3 transition hover:brightness-110">
                {isFollowing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <span className="my-2 w-px bg-white/20" />
              <button onClick={() => setFollowMenuOpen((value) => !value)} aria-label="Following options" className="px-3 transition hover:bg-white/10">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            {followMenuOpen && (
              <div className="absolute right-0 top-12 z-30 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] p-1 shadow-2xl">
                <button onClick={() => { setNotificationsOn((value) => !value); setFollowMenuOpen(false); triggerShareToast(notificationsOn ? 'Post notifications turned off' : 'Post notifications turned on'); }} className="w-full rounded-lg px-3 py-2.5 text-left text-xs text-white/85 hover:bg-white/[0.06]">
                  {notificationsOn ? 'Turn off post alerts' : 'Turn on post alerts'}
                </button>
                <button onClick={() => { setIsFollowing(false); setFollowMenuOpen(false); triggerShareToast('Unfollowed @lalao_manga'); }} className="w-full rounded-lg px-3 py-2.5 text-left text-xs text-rose-300 hover:bg-white/[0.06]">
                  Unfollow publisher
                </button>
              </div>
            )}
          </div>
          <button onClick={handleShare} aria-label="Share Lalao Manga profile" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#181818] text-white/85 hover:bg-[#222]">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="sticky top-12 z-10 flex border-y border-white/[0.06] bg-[#111111]/95 px-5 backdrop-blur">
        <button onClick={() => setProfileTab('posts')} className={`relative flex flex-1 items-center justify-center gap-2 py-3.5 text-xs font-bold transition ${activeTab === 'posts' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
          <Grid2X2 className="h-4 w-4" /> Posts
          {activeTab === 'posts' && <span className="absolute bottom-0 h-[2px] w-16 rounded-full bg-[#8b5cf6]" />}
        </button>
        <button onClick={() => setProfileTab('manga')} className={`relative flex flex-1 items-center justify-center gap-2 py-3.5 text-xs font-bold transition ${activeTab === 'manga' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
          <BookOpen className="h-4 w-4" /> Manga
          {activeTab === 'manga' && <span className="absolute bottom-0 h-[2px] w-16 rounded-full bg-[#8b5cf6]" />}
        </button>
      </div>

      {activeTab === 'manga' ? (
        <div>
          <div className="flex items-center justify-between px-4 pb-1 pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">The library</p>
              <h2 className="mt-1 text-base font-extrabold">Stories worth staying up for</h2>
            </div>
            <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-white/50">{mangaSeries.length} series</span>
          </div>
          {displayedSeries.length === 0 && (
            <div className="mx-4 my-4 rounded-2xl border border-white/[0.08] bg-[#181818] p-5 text-center">
              <BookOpen className="mx-auto h-7 w-7 text-violet-300" />
              <h3 className="mt-3 text-sm font-bold">Your publisher profile is ready</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/45">Manga publishing tools and your library will appear here when they are connected to the Lalao catalog.</p>
            </div>
          )}
          {displayedSeries.map((series, seriesIndex) => (
            <section key={series.id} className="border-b border-white/[0.07] px-4 pb-5 pt-4 last:border-b-0">
              <div className="flex gap-3">
                <div className="h-[91px] w-[68px] shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                  <MangaArtwork theme={series.theme} label={`${series.title} cover art`} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-extrabold leading-snug">{series.title}</h3>
                      <button onClick={() => triggerShareToast(`${series.title} saved to your reading list`)} aria-label={`Save ${series.title}`} className="shrink-0 rounded-full p-1.5 text-white/45 hover:bg-white/10 hover:text-pink-300">
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[10px] text-white/45">{series.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-white/55">
                        <span>{series.readers} readers</span><span className="text-white/20">·</span><span>{series.chapters} chapters</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[9px] text-white/35">
                        <span className="rounded bg-white/[0.07] px-1.5 py-0.5">{series.genre}</span>
                        <span className={series.status === 'Ongoing' ? 'text-emerald-300/80' : 'text-violet-300/80'}>{series.status}</span>
                      </div>
                    </div>
                    <button onClick={() => setReader({ seriesId: series.id, chapterIndex: 0 })} className="h-8 shrink-0 rounded-lg bg-gradient-to-r from-[#ec4899] to-[#d946a5] px-4 text-[11px] font-extrabold text-white shadow-[0_4px_14px_rgba(236,72,153,0.2)] transition hover:brightness-110 active:scale-[0.98]">
                      Read
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Chapter previews</p>
                <span className="text-[9px] text-white/30">Swipe to explore</span>
              </div>
              <div className="no-scrollbar -mx-4 mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1">
                {series.chapterPreviews.map((chapter) => (
                  <button key={chapter.id} onClick={() => setReader({ seriesId: series.id, chapterIndex: series.chapterPreviews.findIndex((item) => item.id === chapter.id) })} className="group w-[calc((100%-20px)/3)] min-w-[calc((100%-20px)/3)] snap-start text-left">
                    <div className="relative aspect-[0.78] overflow-hidden rounded-lg border border-white/[0.08] bg-[#1a1a1a] transition group-hover:border-violet-300/40">
                      <MangaArtwork theme={chapter.theme} variation={chapter.variation + seriesIndex} compact label={`${series.title}, ${chapter.label}: ${chapter.title}`} />
                      <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white">{chapter.label}</span>
                    </div>
                    <p className="mt-1.5 truncate text-[10px] font-semibold text-white/75">{chapter.title}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {isDemoProfile && <p className="px-4 py-4 text-center text-[10px] text-white/30">Sample library preview · manga catalog will connect to publisher data</p>}
        </div>
      ) : (
        <div className="px-4 pb-8 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Publisher posts</h2>
            <span className="text-[10px] text-white/40">Recent updates</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { theme: 'reborn' as const, title: 'Meet your next obsession', meta: 'Reborn to Humiliate Her · New episodes weekly' },
              { theme: 'contract' as const, title: 'A deal with a twist', meta: 'Behind the scenes · The Secret Love Contract' },
              { theme: 'demon' as const, title: 'The queen is back', meta: 'First look · The Demon Queen’s Return' },
              { theme: 'post' as const, title: 'What are you reading?', meta: 'Tell us your favorite genre' },
            ].map((post, index) => (
              <button key={post.title} onClick={() => triggerShareToast('Post details coming soon')} className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#181818] text-left">
                <div className="aspect-[1.16] overflow-hidden"><MangaArtwork theme={post.theme} variation={index + 1} label={post.title} /></div>
                <div className="p-2.5">
                  <p className="line-clamp-1 text-[11px] font-bold">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-white/45">{post.meta}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

