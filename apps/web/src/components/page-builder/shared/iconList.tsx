"use client";

import { useState } from "react";
import {
  Anchor,
  Award,
  Baby,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  Church,
  Clock,
  Coffee,
  Compass,
  Crown,
  Eye,
  Flame,
  Gift,
  Globe,
  GraduationCap,
  HandHeart,
  Headphones,
  Heart,
  HeartHandshake,
  Home,
  Info,
  Key,
  Layers3,
  LifeBuoy,
  Mail,
  MapPin,
  Megaphone,
  Mic,
  Monitor,
  Music2,
  Phone,
  Radio,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Sun,
  ThumbsUp,
  Tv,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Volume2,
  Zap,
} from "lucide-react";
import { cn } from "@/components/ui";

export type IconOption = {
  category: "Community" | "Faith" | "Ministry" | "Media" | "Events" | "General";
  icon: any;
  id: string;
  label: string;
};

export const AVAILABLE_ICONS: IconOption[] = [
  // Community & People
  { category: "Community", icon: Users, id: "users", label: "Community / Users" },
  { category: "Community", icon: UserPlus, id: "connect", label: "Connect / User Plus" },
  { category: "Community", icon: UserCheck, id: "userCheck", label: "Membership / Verified" },
  { category: "Community", icon: Smile, id: "youth", label: "Youth / Smile" },
  { category: "Community", icon: Baby, id: "kids", label: "Kids / Family" },
  { category: "Community", icon: HandHeart, id: "care", label: "Care / Compassion" },
  { category: "Community", icon: HeartHandshake, id: "prayer", label: "Prayer & Fellowship" },
  { category: "Community", icon: Heart, id: "heart", label: "Love / Heart" },
  { category: "Community", icon: Coffee, id: "hospitality", label: "Hospitality / Coffee" },
  { category: "Community", icon: Home, id: "home", label: "Home / Small Groups" },

  // Faith & Spiritual
  { category: "Faith", icon: Church, id: "church", label: "Church / Sanctuary" },
  { category: "Faith", icon: BookOpen, id: "bible", label: "Bible / Word" },
  { category: "Faith", icon: ShieldCheck, id: "security", label: "Security / Faith Shield" },
  { category: "Faith", icon: Flame, id: "holySpirit", label: "Flame / Holy Spirit" },
  { category: "Faith", icon: Sun, id: "light", label: "Light / Dawn" },
  { category: "Faith", icon: Sparkles, id: "grace", label: "Grace / Sparkles" },
  { category: "Faith", icon: Star, id: "hope", label: "Hope / Star" },
  { category: "Faith", icon: Crown, id: "kingdom", label: "Kingdom / Crown" },
  { category: "Faith", icon: Compass, id: "direction", label: "Direction / Guidance" },
  { category: "Faith", icon: Anchor, id: "anchor", label: "Anchor / Steadfast" },

  // Worship & Media
  { category: "Media", icon: Music2, id: "worship", label: "Worship / Music" },
  { category: "Media", icon: Mic, id: "speaking", label: "Preaching / Mic" },
  { category: "Media", icon: Video, id: "production", label: "Production / Camera" },
  { category: "Media", icon: Tv, id: "liveStream", label: "Livestream / Screen" },
  { category: "Media", icon: Monitor, id: "media", label: "Media / Presentation" },
  { category: "Media", icon: Radio, id: "broadcast", label: "Podcast / Broadcast" },
  { category: "Media", icon: Headphones, id: "audio", label: "Audio / Sound" },
  { category: "Media", icon: Volume2, id: "announcements", label: "Announcements" },
  { category: "Media", icon: Camera, id: "photography", label: "Photography" },

  // Ministry & Outreach
  { category: "Ministry", icon: Globe, id: "missions", label: "Global Missions" },
  { category: "Ministry", icon: Gift, id: "generosity", label: "Giving / Generosity" },
  { category: "Ministry", icon: GraduationCap, id: "education", label: "Discipleship / Academy" },
  { category: "Ministry", icon: Briefcase, id: "leadership", label: "Workplace / Leadership" },
  { category: "Ministry", icon: Layers3, id: "ministry", label: "Ministry Teams" },
  { category: "Ministry", icon: LifeBuoy, id: "support", label: "Support / Outreach" },
  { category: "Ministry", icon: ShieldAlert, id: "safety", label: "Safety / Emergency" },
  { category: "Ministry", icon: Key, id: "foundation", label: "Foundation / Truth" },
  { category: "Ministry", icon: Award, id: "serving", label: "Serving / Excellence" },

  // Events & Communication
  { category: "Events", icon: Calendar, id: "calendar", label: "Calendar / Gatherings" },
  { category: "Events", icon: Clock, id: "schedule", label: "Schedule / Time" },
  { category: "Events", icon: MapPin, id: "location", label: "Campus / Location" },
  { category: "Events", icon: Mail, id: "newsletter", label: "Newsletter / Email" },
  { category: "Events", icon: Phone, id: "contact", label: "Phone / Contact" },
  { category: "Events", icon: Megaphone, id: "updates", label: "News / Updates" },
  { category: "Events", icon: Bell, id: "notifications", label: "Alerts / Bell" },
  { category: "Events", icon: Send, id: "send", label: "Send / Submit" },
  { category: "Events", icon: Share2, id: "share", label: "Share / Invite" },

  // General & Badges
  { category: "General", icon: CheckCircle2, id: "check", label: "Completed / Check" },
  { category: "General", icon: ThumbsUp, id: "approval", label: "Encouragement" },
  { category: "General", icon: Bookmark, id: "resource", label: "Resource / Save" },
  { category: "General", icon: Zap, id: "energy", label: "Action / Power" },
  { category: "General", icon: Info, id: "info", label: "Info / Help" },
  { category: "General", icon: Eye, id: "vision", label: "Vision / Focus" },
];

export const featureIconMap: Record<string, any> = AVAILABLE_ICONS.reduce(
  (acc, item) => {
    acc[item.id] = item.icon;
    acc[item.id.toLowerCase()] = item.icon;
    return acc;
  },
  {
    baby: Baby,
    bible: BookOpen,
    book: BookOpen,
    bookopen: BookOpen,
    calendar: Calendar,
    camera: Video,
    care: HandHeart,
    chat: Mail,
    children: Baby,
    church: Church,
    clock: Clock,
    coffee: Coffee,
    community: Users,
    compassion: HandHeart,
    connect: UserPlus,
    connection: UserPlus,
    cross: Church,
    discipleship: ShieldCheck,
    event: Calendar,
    faith: ShieldCheck,
    family: Users,
    fellowship: HeartHandshake,
    globe: Globe,
    group: Users,
    handHeart: HandHeart,
    handheart: HandHeart,
    handshake: HeartHandshake,
    heart: Heart,
    hearthandshake: HeartHandshake,
    home: Home,
    hospitality: Coffee,
    kids: Baby,
    layers: Layers3,
    layers3: Layers3,
    mail: Mail,
    media: Monitor,
    mic: Mic,
    ministry: Users,
    monitor: Monitor,
    music: Music2,
    music2: Music2,
    people: Users,
    phone: Phone,
    prayer: HeartHandshake,
    production: Video,
    radio: Radio,
    safety: ShieldCheck,
    security: ShieldCheck,
    service: HeartHandshake,
    share: Share2,
    shield: ShieldCheck,
    shieldCheck: ShieldCheck,
    shieldcheck: ShieldCheck,
    smile: Smile,
    song: Music2,
    sparkles: Sparkles,
    star: Star,
    time: Clock,
    tv: Tv,
    usercheck: UserCheck,
    userplus: UserPlus,
    users: Users,
    video: Video,
    welcome: Home,
    worship: Music2,
    youth: Smile,
  } as Record<string, any>
);

export function resolveIcon(iconKey?: string) {
  if (!iconKey) return Users;
  const direct = featureIconMap[iconKey];
  if (direct) return direct;
  const normalized = iconKey.toLowerCase().replace(/[^a-z0-9]/g, "");
  return featureIconMap[normalized] || Users;
}

export function IconPicker({
  onChange,
  value,
}: {
  onChange: (id: string) => void;
  value?: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Community", "Faith", "Ministry", "Media", "Events", "General"];

  const filteredIcons = AVAILABLE_ICONS.filter((item) => {
    const matchesSearch =
      !search ||
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const normalizedValue = value ? value.toLowerCase().replace(/[^a-z0-9]/g, "") : "users";

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            className="h-8 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-8 pr-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 50+ icons..."
            type="text"
            value={search}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {categories.map((cat) => (
          <button
            className={cn(
              "cursor-pointer rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
              selectedCategory === cat
                ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]"
                : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--brand-soft)]"
            )}
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            type="button"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid max-h-48 grid-cols-6 gap-1.5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2 sm:grid-cols-8">
        {filteredIcons.map((item) => {
          const IconComp = item.icon;
          const isSelected =
            value === item.id ||
            normalizedValue === item.id.toLowerCase().replace(/[^a-z0-9]/g, "");

          return (
            <button
              aria-label={item.label}
              className={cn(
                "group relative flex h-10 w-full cursor-pointer flex-col items-center justify-center rounded-md border p-1 transition-all",
                isSelected
                  ? "border-[var(--accent-gold)] bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
                  : "border-transparent bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
              )}
              key={item.id}
              onClick={() => onChange(item.id)}
              title={item.label}
              type="button"
            >
              <IconComp className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
