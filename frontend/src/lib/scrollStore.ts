import { create } from 'zustand'

export type AccentName = 'indigo' | 'sky' | 'orange' | 'emerald'

export const ACCENT_HEX: Record<AccentName, string> = {
  indigo: '#6366f1',
  sky: '#0ea5e9',
  orange: '#f97316',
  emerald: '#10b981',
}

type ScrollState = {
  activeAccent: AccentName
  activeStageIndex: number
  setActiveAccent: (accent: AccentName, stageIndex: number) => void
}

/**
 * Single source of truth for scroll-driven visual state (current accent color,
 * active pipeline stage). Only ever written from ScrollTrigger onEnter/onEnterBack
 * callbacks — never from a scroll event listener or a RAF loop directly.
 */
export const useScrollStore = create<ScrollState>((set) => ({
  activeAccent: 'indigo',
  activeStageIndex: 0,
  setActiveAccent: (accent, stageIndex) => set({ activeAccent: accent, activeStageIndex: stageIndex }),
}))
