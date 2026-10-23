import { create } from "zustand";

export interface Transcript {
  id: string;
  text: string;
  timestamp: Date;
}

interface TranscriptionState {
  transcripts: Transcript[];
  addTranscript: (text: string) => void;
  clearTranscripts: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
  transcripts: [],
  addTranscript: (text) =>
    set((state) => ({
      transcripts: [
        ...state.transcripts,
        { id: Math.random().toString(36).substring(7), text, timestamp: new Date() },
      ],
    })),
  clearTranscripts: () => set({ transcripts: [] }),
}));
