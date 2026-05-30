import { create } from 'zustand';

export type Mood = "idle" | "thinking" | "happy" | "celebrate" | "sad";

interface AvatarState {
  mood: Mood;
  level: number;
  xp: number;
  achievements: string[];
  
  setMood: (mood: Mood) => void;
  addXp: (amount: number) => void;
  addAchievement: (achievement: string) => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  mood: "idle",
  level: 3,
  xp: 65,
  achievements: ["First Login"],
  
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
