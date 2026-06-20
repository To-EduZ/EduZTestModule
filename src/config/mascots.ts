import { Mascot } from "@/types/mascot";

export const MASCOTS: Mascot[] = [
  {
    id: "lily",
    name: "Cô Lily AI",
    description: "Cô giáo ảo thân thiện, luôn sẵn sàng hướng dẫn bạn học tiếng Anh.",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop", // use high-quality avatar placeholders
    images: {
      idle: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
      speaking: "https://images.unsplash.com/photo-1580894732444-8fecef2271ff?w=200&h=200&fit=crop",
      listening: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
      thinking: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      happy: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      encouraging: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop",
    },
    dialogue: {
      speaking: "Cô Lily đang nói... 🔊",
      listening: "Cô đang nghe con nè... 🎤",
      thinking: "Cô đang suy nghĩ... 🧠",
    },
    themeColors: {
      ring: "border-blue-300 dark:border-blue-700",
      bg: "bg-sky-50 dark:bg-slate-800",
      text: "text-indigo-500 dark:text-indigo-400",
      border: "border-slate-100 dark:border-slate-800"
    }
  },
  {
    id: "max",
    name: "Khỉ Max",
    description: "Chú khỉ tinh nghịch, học tiếng Anh cùng Max chưa bao giờ nhàm chán!",
    avatarUrl: "https://images.unsplash.com/photo-1540573133827-2e116f53a401?w=200&h=200&fit=crop",
    images: {
      idle: "https://images.unsplash.com/photo-1540573133827-2e116f53a401?w=200&h=200&fit=crop",
      speaking: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=200&fit=crop",
      listening: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=200&h=200&fit=crop",
      thinking: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200&h=200&fit=crop",
      happy: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=200&h=200&fit=crop",
      encouraging: "https://images.unsplash.com/photo-1472214222541-d510753a49d4?w=200&h=200&fit=crop",
    },
    dialogue: {
      speaking: "Max đang nói nè... 🔊",
      listening: "Max đang vểnh tai nghe... 🐒🎤",
      thinking: "Max đang vắt óc suy nghĩ... 🤔",
    },
    themeColors: {
      ring: "border-amber-300 dark:border-amber-700",
      bg: "bg-yellow-50 dark:bg-slate-800",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/50"
    }
  }
];
