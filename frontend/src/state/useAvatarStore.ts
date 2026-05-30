import { create } from 'zustand';

export type Mood = "idle" | "thinking" | "happy" | "celebrate" | "sad";

interface AvatarState {
  avatarUrl: string;
  mood: Mood;
  level: number;
  xp: number;
  achievements: string[];
  
  setAvatarUrl: (url: string) => void;
  setMood: (mood: Mood) => void;
  addXp: (amount: number) => void;
  addAchievement: (achievement: string) => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  // The avatar already exists. We default to a pre-created URL.
  avatarUrl: "/avatar/avatar.glb", 
  mood: "idle",
  level: 3,
  xp: 65,
  achievements: ["First Login"],
  
  setAvatarUrl: (url) => set({ avatarUrl: url }),
  setMood: (mood) => set({ mood }),
  addXp: (amount) => set((state) => {
    const newXp = state.xp + amount;
    return { 
      xp: newXp % 100, 
      level: state.level + Math.floor(newXp / 100) 
    };
  }),
  addAchievement: (achievement) => set((state) => ({
    achievements: [...new Set([...state.achievements, achievement])]
  })),
}));
