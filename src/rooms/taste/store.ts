// Taste room state shared between its 3D scene and its HTML panels. Owner: Person 5.
import { create } from 'zustand';

interface TasteState { language: string | null; setLanguage: (l: string | null) => void }
export const useTaste = create<TasteState>((set) => ({ language: null, setLanguage: (language) => set({ language }) }));
