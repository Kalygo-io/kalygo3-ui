const STORAGE_KEY = "kalygo_app_settings";

export type TtsProvider = "browser" | "elevenlabs";

export interface AppSettings {
  elevenLabsVoiceId: string;
  /** Text-to-speech engine: browser (Web Speech API) or ElevenLabs */
  ttsProvider: TtsProvider;
}

export const ELEVENLABS_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah - Mature, Reassuring, Confident" },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George - Warm, Captivating Storyteller",
  },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  {
    id: "tJHJUEHzOkMoPmJJ5jo2",
    name: "Ryan Quinn - a gentle, calm American boy’s voice, perfect for storytelling",
  },
  {
    id: "McVZB9hVxVSk3Equu8EH",
    name: "Audrey - Middle aged female voice",
  },
  {
    id: "Z9ZHGvFZ90R0h0x1prsJ",
    name: "Camille - Camille's voice is warm, expressive, and unmistakably French",
  },
  { id: "zwqMXWHsKBMIb9RPiWI0", name: "Dom - deep warm British male voice" },
  {
    id: "dY9fWBb7TNkZB7UPeFK1",
    name: "Scoobie - American Male, enthusiastic, sharp, smart",
  },
  { id: "3gsg3cxXyFLcGIfNbM6C", name: "Raju - Relatable Indian Voice" },
  {
    id: "6aDn1KB0hjpdcocrUkmq",
    name: "Tiffany (African American Female)",
  },
  {
    id: "EkK5I93UQWFDigLMpZcX",
    name: "JM - Husky & Engaging",
  },
] as const;

const DEFAULT_SETTINGS: AppSettings = {
  elevenLabsVoiceId: ELEVENLABS_VOICES[0].id,
  ttsProvider: "browser",
};

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setAppSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const updated = { ...current, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
