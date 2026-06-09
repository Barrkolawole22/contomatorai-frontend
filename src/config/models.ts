export const MODEL_CONFIG = {
  gemini: {
    displayName: 'Fast Generation',
    description: 'Gemini 2.5 Flash — quick, efficient generation',
    creditMultiplier: 1,
    icon: '⚡',
    speed: 'fastest',
    quality: 'good',
  },
  'gemini-pro': {
    displayName: 'Balanced',
    description: 'Gemini 2.5 Pro + Google Search Grounding — well-researched content',
    creditMultiplier: 2,
    icon: '🌐',
    speed: 'fast',
    quality: 'better',
  },
} as const;

export type AIModel = keyof typeof MODEL_CONFIG;