import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Smile, ThumbsUp, Heart, Leaf, Utensils, Trophy } from 'lucide-react';

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  emojis: { emoji: string; keywords: string }[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      { emoji: '😀', keywords: 'grinning face happy smile' },
      { emoji: '😃', keywords: 'smiling big eyes happy joy' },
      { emoji: '😄', keywords: 'grinning squinting smile happy' },
      { emoji: '😁', keywords: 'beaming smiling grin teeth' },
      { emoji: '😆', keywords: 'laughing excited grin closed eyes' },
      { emoji: '😅', keywords: 'sweat smile relief nervous' },
      { emoji: '😂', keywords: 'joy tears laugh haha crying lol' },
      { emoji: '🤣', keywords: 'rofl rolling on the floor laughing lmao' },
      { emoji: '🥹', keywords: 'holding back tears proud emotional cry' },
      { emoji: '😊', keywords: 'blushing smile warm happy' },
      { emoji: '😇', keywords: 'angel halo innocent blessed' },
      { emoji: '🙂', keywords: 'slightly smiling fine calm' },
      { emoji: '🙃', keywords: 'upside down silly sarcasm' },
      { emoji: '😉', keywords: 'wink playful secret' },
      { emoji: '😌', keywords: 'relieved relaxed peaceful' },
      { emoji: '😍', keywords: 'heart eyes love crush adored' },
      { emoji: '🥰', keywords: 'hearts face love sweet affection' },
      { emoji: '😘', keywords: 'kiss blow love romantic' },
      { emoji: '😋', keywords: 'delicious yum food playful' },
      { emoji: '😛', keywords: 'tongue silly cheeky' },
      { emoji: '😜', keywords: 'wink tongue crazy party' },
      { emoji: '🤪', keywords: 'zany wacky silly goofy' },
      { emoji: '😝', keywords: 'squint tongue silly playful' },
      { emoji: '🤑', keywords: 'money face dollar rich cash' },
      { emoji: '🤗', keywords: 'hugging hands warm embrace' },
      { emoji: '🤫', keywords: 'shushing quiet secret silence' },
      { emoji: '🤔', keywords: 'thinking wonder consider ponder' },
      { emoji: '🤐', keywords: 'zipper mouth shut secret' },
      { emoji: '🤨', keywords: 'raised eyebrow suspicious skeptical' },
      { emoji: '😐', keywords: 'neutral blank meh' },
      { emoji: '😑', keywords: 'expressionless deadpan speechless' },
      { emoji: '😏', keywords: 'smirk flirt sassy sly' },
      { emoji: '😒', keywords: 'unamused bored annoyed skeptical' },
      { emoji: '🙄', keywords: 'rolling eyes whatever annoyed' },
      { emoji: '😬', keywords: 'grimacing awkward yikes oof' },
      { emoji: '🤥', keywords: 'lying pinocchio fake' },
      { emoji: '😴', keywords: 'sleeping tired zzz nap' },
      { emoji: '😷', keywords: 'mask sick virus protection' },
      { emoji: '🤒', keywords: 'thermometer fever sick unwell' },
      { emoji: '🤕', keywords: 'bandage hurt injury head' },
      { emoji: '🤢', keywords: 'nauseated sick gross disgust' },
      { emoji: '🤮', keywords: 'vomiting puke sick disgusted' },
      { emoji: '🤧', keywords: 'sneezing cold tissue allergy' },
      { emoji: '🥵', keywords: 'hot sweat red face summer' },
      { emoji: '🥶', keywords: 'cold freezing blue ice winter' },
      { emoji: '🥴', keywords: 'woozy dizzy drunk tipsy' },
      { emoji: '😵', keywords: 'dizzy dead shocked knocked out' },
      { emoji: '🤯', keywords: 'exploding head mind blown wow' },
      { emoji: '🤠', keywords: 'cowboy hat rodeo wild west' },
      { emoji: '🥳', keywords: 'partying celebration horn hat woo' },
      { emoji: '😎', keywords: 'sunglasses cool stylish chill' },
      { emoji: '🤓', keywords: 'nerd glasses smart geek' },
      { emoji: '🧐', keywords: 'monocle curious inspect examine' },
      { emoji: '😕', keywords: 'confused puzzled unsure' },
      { emoji: '😟', keywords: 'worried anxious concern' },
      { emoji: '🙁', keywords: 'frown slight sad unhappy' },
      { emoji: '😮', keywords: 'open mouth surprise shocked wow' },
      { emoji: '😯', keywords: 'hushed quiet surprised' },
      { emoji: '😲', keywords: 'astonished gasped shocked' },
      { emoji: '😳', keywords: 'flushed embarrassed wide eyes' },
      { emoji: '🥺', keywords: 'pleading puppy eyes please beggar' },
      { emoji: '😨', keywords: 'fearful scared nervous' },
      { emoji: '😰', keywords: 'anxious sweat cold panic' },
      { emoji: '😥', keywords: 'sad relieved sweat whew' },
      { emoji: '😢', keywords: 'crying tear sad weeping' },
      { emoji: '😭', keywords: 'sob loud tears crying bawling' },
      { emoji: '😱', keywords: 'screaming terror horrified scream' },
      { emoji: '😤', keywords: 'triumph huffing proud determined' },
      { emoji: '😡', keywords: 'pouting rage angry mad red' },
      { emoji: '😠', keywords: 'angry furious mad cross' },
      { emoji: '🤬', keywords: 'swearing cussing furious censored' },
      { emoji: '😈', keywords: 'smiling imp devil naughty mischief' },
      { emoji: '💀', keywords: 'skull dead skeleton ded dying' },
      { emoji: '🔥', keywords: 'fire lit hot flame burn' },
      { emoji: '✨', keywords: 'sparkles stars magic shiny clean' },
      { emoji: '💯', keywords: 'hundred percent perfect score real' },
      { emoji: '🎉', keywords: 'tada celebration party confetti woo' },
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      { emoji: '👍', keywords: 'thumbs up like approve good yes' },
      { emoji: '👎', keywords: 'thumbs down dislike bad no' },
      { emoji: '👏', keywords: 'clapping hands applause bravo praise' },
      { emoji: '🙌', keywords: 'raising hands celebration praise hooray' },
      { emoji: '🫶', keywords: 'heart hands love care support' },
      { emoji: '👐', keywords: 'open hands warmth hug' },
      { emoji: '🤲', keywords: 'palms together prayer request offer' },
      { emoji: '🤝', keywords: 'handshake deal agree partner hello' },
      { emoji: '🙏', keywords: 'folded hands pray thank please gratitude' },
      { emoji: '✌️', keywords: 'peace sign victory v two' },
      { emoji: '🤞', keywords: 'crossed fingers good luck hope' },
      { emoji: '🫰', keywords: 'hand with index and thumb crossed finger heart korean' },
      { emoji: '🤟', keywords: 'love you gesture rock sign language' },
      { emoji: '🤘', keywords: 'sign of the horns rock metal cool' },
      { emoji: '🤙', keywords: 'call me shaka hang loose' },
      { emoji: '👈', keywords: 'backhand index pointing left' },
      { emoji: '👉', keywords: 'backhand index pointing right' },
      { emoji: '👆', keywords: 'backhand index pointing up' },
      { emoji: '👇', keywords: 'backhand index pointing down' },
      { emoji: '☝️', keywords: 'index pointing up one look attention' },
      { emoji: '🫵', keywords: 'index pointing at the viewer you' },
      { emoji: '👋', keywords: 'waving hand hello goodbye hi wave' },
      { emoji: '✋', keywords: 'raised hand stop high five palm' },
      { emoji: '🖐️', keywords: 'hand with fingers splayed five' },
      { emoji: '👊', keywords: 'oncoming fist bump punch attack' },
      { emoji: '✊', keywords: 'raised fist solidarity power strength' },
      { emoji: '🤛', keywords: 'left facing fist bump' },
      { emoji: '🤜', keywords: 'right facing fist bump' },
      { emoji: '💪', keywords: 'flexed biceps muscle strong power workout' },
      { emoji: '🧠', keywords: 'brain smart intellect think memory' },
      { emoji: '👀', keywords: 'eyes look watching curious side eye' },
      { emoji: '🫡', keywords: 'saluting face respect honor yes sir' },
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: [
      { emoji: '❤️', keywords: 'red heart love passion classic' },
      { emoji: '🧡', keywords: 'orange heart love friendship warmth' },
      { emoji: '💛', keywords: 'yellow heart love sunshine happiness' },
      { emoji: '💚', keywords: 'green heart love nature organic' },
      { emoji: '💙', keywords: 'blue heart love peace loyalty' },
      { emoji: '💜', keywords: 'purple heart love luxury royalty' },
      { emoji: '🖤', keywords: 'black heart dark love goth style' },
      { emoji: '🤍', keywords: 'white heart pure love clean peace' },
      { emoji: '🤎', keywords: 'brown heart love earth warm' },
      { emoji: '💔', keywords: 'broken heart heartbreak sad dump' },
      { emoji: '❤️‍🔥', keywords: 'heart on fire burning passionate desire' },
      { emoji: '❤️‍🩹', keywords: 'mending heart healing recovering better' },
      { emoji: '❣️', keywords: 'heart exclamation love point emphasis' },
      { emoji: '💕', keywords: 'two hearts pink love fluttering' },
      { emoji: '💞', keywords: 'revolving hearts pink love orbit' },
      { emoji: '💓', keywords: 'beating heart pink vibration love' },
      { emoji: '💗', keywords: 'growing heart pink pulse love' },
      { emoji: '💖', keywords: 'sparkling heart shiny love special' },
      { emoji: '💘', keywords: 'heart with arrow cupid love romance' },
      { emoji: '💝', keywords: 'heart with ribbon gift present love' },
      { emoji: '💟', keywords: 'heart decoration purple pretty cute' },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: Leaf,
    emojis: [
      { emoji: '🐶', keywords: 'dog face pet puppy canine' },
      { emoji: '🐱', keywords: 'cat face pet kitten feline' },
      { emoji: '🦊', keywords: 'fox face clever animal wild' },
      { emoji: '🐻', keywords: 'bear face cute wild animal' },
      { emoji: '🐼', keywords: 'panda face bamboo animal cute' },
      { emoji: '🦁', keywords: 'lion face king animal roar wild' },
      { emoji: '🐯', keywords: 'tiger face wild feline stripes' },
      { emoji: '🐵', keywords: 'monkey face cute ape primate' },
      { emoji: '🐧', keywords: 'penguin bird cold antarctica cute' },
      { emoji: '🦅', keywords: 'eagle bird majestic predator fly' },
      { emoji: '🦉', keywords: 'owl bird night wise nocturnal' },
      { emoji: '🦋', keywords: 'butterfly insect pretty wings delicate' },
      { emoji: '🌸', keywords: 'cherry blossom flower sakura spring pink' },
      { emoji: '🌹', keywords: 'rose red flower romantic love bloom' },
      { emoji: '🌻', keywords: 'sunflower yellow summer sunshine bloom' },
      { emoji: '🌺', keywords: 'hibiscus flower tropical bloom hawaii' },
      { emoji: '🌴', keywords: 'palm tree tropical island beach vacation' },
      { emoji: '🍀', keywords: 'four leaf clover luck irish st patrick' },
      { emoji: '🌿', keywords: 'herb leaf plant green nature natural' },
      { emoji: '⭐', keywords: 'star night space sky rating' },
      { emoji: '🌟', keywords: 'glowing star bright shiny sparkle' },
      { emoji: '⚡', keywords: 'high voltage lightning bolt electric shock' },
      { emoji: '🌈', keywords: 'rainbow colorful sky pride weather' },
      { emoji: '☀️', keywords: 'sun sunny day bright warm summer' },
      { emoji: '🌙', keywords: 'crescent moon night evening dark sky' },
    ],
  },
  {
    id: 'food',
    name: 'Food',
    icon: Utensils,
    emojis: [
      { emoji: '🍕', keywords: 'pizza slice food cheese fast food' },
      { emoji: '🍔', keywords: 'hamburger burger fast food meal' },
      { emoji: '🍟', keywords: 'french fries potato fast food snack' },
      { emoji: '🌮', keywords: 'taco mexican food snack delicious' },
      { emoji: '🌯', keywords: 'burrito wrap mexican food roll' },
      { emoji: '🍜', keywords: 'steaming bowl ramen noodles soup asian' },
      { emoji: '🍣', keywords: 'sushi japanese fish rice food' },
      { emoji: '🍛', keywords: 'curry rice indian spicy food' },
      { emoji: '🍗', keywords: 'poultry leg chicken drumstick meat food' },
      { emoji: '🥩', keywords: 'cut of meat steak bbq beef' },
      { emoji: '🥞', keywords: 'pancakes breakfast syrup butter food' },
      { emoji: '🍰', keywords: 'shortcake cake dessert sweet slice' },
      { emoji: '🍦', keywords: 'soft ice cream dessert sweet cold cone' },
      { emoji: '🍩', keywords: 'doughnut donut sweet dessert pastry' },
      { emoji: '🍪', keywords: 'cookie biscuit chocolate chip sweet' },
      { emoji: '🍫', keywords: 'chocolate bar sweet dessert candy' },
      { emoji: '🍿', keywords: 'popcorn movie cinema snack corn' },
      { emoji: '☕', keywords: 'hot beverage coffee tea morning cup' },
      { emoji: '🧋', keywords: 'bubble tea boba milk drink sweet' },
      { emoji: '🥤', keywords: 'cup with straw drink soda soft beverage' },
      { emoji: '🍺', keywords: 'beer mug alcohol drink cheers pub' },
      { emoji: '🥂', keywords: 'clinking glasses champagne toast cheers celebrate' },
      { emoji: '🍷', keywords: 'wine glass alcohol drink dinner red' },
    ],
  },
  {
    id: 'sports',
    name: 'Activities',
    icon: Trophy,
    emojis: [
      { emoji: '⚽', keywords: 'soccer ball football match sport' },
      { emoji: '🏀', keywords: 'basketball sport hoop nba court' },
      { emoji: '🏈', keywords: 'american football nfl sport ball' },
      { emoji: '⚾', keywords: 'baseball sport mlb ball strike' },
      { emoji: '🎾', keywords: 'tennis ball sport court match' },
      { emoji: '🏐', keywords: 'volleyball ball sport court beach' },
      { emoji: '🎮', keywords: 'video game gamepad gaming controller play' },
      { emoji: '🕹️', keywords: 'joystick arcade retro game play' },
      { emoji: '🎲', keywords: 'game die dice roll board random chance' },
      { emoji: '🎯', keywords: 'bullseye direct hit dart target goal focus' },
      { emoji: '🏆', keywords: 'trophy champion win victory first prize' },
      { emoji: '🥇', keywords: '1st place medal gold winner champion' },
      { emoji: '🥈', keywords: '2nd place medal silver second runner up' },
      { emoji: '🥉', keywords: '3rd place medal bronze third place' },
      { emoji: '🎬', keywords: 'clapper board movie film cinema director' },
      { emoji: '🎧', keywords: 'headphone music sound listen audio' },
      { emoji: '🎤', keywords: 'microphone sing music audio voice karaoke' },
      { emoji: '🎸', keywords: 'guitar music rock instrument acoustic electric' },
      { emoji: '🎹', keywords: 'musical keyboard piano keys synthesizer melody' },
    ],
  },
];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  onSelectEmoji,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
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

  const query = searchQuery.trim().toLowerCase();

  const filteredEmojis = query
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter(
        (e) => e.keywords.includes(query) || e.emoji.includes(query)
      )
    : null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 mb-2 z-50 w-[320px] sm:w-[350px] max-w-[90vw] rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="Emoji Picker"
    >
      {/* Header with Search and Close */}
      <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-100">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis..."
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
          aria-label="Close emoji picker"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Category selector tabs (shown when not searching) */}
      {!query && (
        <div className="flex items-center justify-between border-b border-neutral-100 py-1.5">
          {EMOJI_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                  isActive
                    ? 'bg-[#5E43F3]/10 text-[#5E43F3]'
                    : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'
                }`}
                title={category.name}
                aria-label={category.name}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="mt-2 max-h-[200px] overflow-y-auto pr-1">
        {filteredEmojis ? (
          filteredEmojis.length > 0 ? (
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
              {filteredEmojis.map((item, idx) => (
                <button
                  key={`${item.emoji}-${idx}`}
                  type="button"
                  onClick={() => onSelectEmoji(item.emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-neutral-100 transition active:scale-95"
                  title={item.keywords}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-neutral-400">
              No emojis found for "{searchQuery}"
            </div>
          )
        ) : (
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.name}
            </p>
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
              {EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => onSelectEmoji(item.emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-neutral-100 transition active:scale-95"
                  title={item.keywords}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
