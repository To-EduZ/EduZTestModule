export type MascotState = "idle" | "speaking" | "listening" | "thinking" | "happy" | "encouraging";

export interface Mascot {
  id: string;
  name: string;
  description: string;
  avatarUrl: string; // fallback / default avatar
  images: Record<MascotState, string>; // Maps states to image paths
  dialogue: {
    speaking: string;
    listening: string;
    thinking: string;
  };
  themeColors: {
    ring: string;
    bg: string;
    text: string;
    border: string;
  };
}
