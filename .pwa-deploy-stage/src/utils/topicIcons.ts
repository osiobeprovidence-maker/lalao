import {
  Users,
  Gamepad2,
  TestTube,
  Clapperboard,
  Heart,
  Music,
  Code,
  Flame,
  Globe,
  Star,
  MapPin,
  HelpCircle,
  LucideIcon
} from 'lucide-react';

export const getTopicIcon = (slug: string): LucideIcon => {
  switch (slug?.toLowerCase()) {
    case 'anime':
      return Users;
    case 'gaming':
      return Gamepad2;
    case 'stem':
      return TestTube;
    case 'drama':
      return Clapperboard;
    case 'romance':
      return Heart;
    case 'music':
      return Music;
    case 'tech':
      return Code;
    case 'trending':
      return Flame;
    case 'world':
      return Globe;
    case 'nearby':
      return MapPin;
    default:
      return Star; // Default fallback icon
  }
};
