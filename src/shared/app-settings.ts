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
  {
    id: "IKne3meq5aSn9XLyUdCD",
    name: "Charlie - Deep, Confident, Energetic Australian Voice",
  },
  {
    id: "nPczCjzI2devNBz1zQrb",
    name: "Brian - Deep, Resonant and Comforting",
  },
  {
    id: "fQ9aRKjmL75dgjNakj2u",
    name: "Clayton - 30-40 Year Old African American Male",
  },
  {
    id: "Xb7hH8MSUJpSbSDYk0k2",
    name: "Alice - Clear, Engaging British Educator",
  },
  {
    id: "Os2frcqCuUz8b9F93RuI",
    name: "Mahmoud - Deep, Warm, and Clear Arabic Voice",
  },
  {
    id: "n0vzWypeCK1NlWPVwhOc",
    name: "Theos - Narrational, Assertive and Warm Greek Voice",
  },
  {
    id: "rm143ZlE6RfHtN634wZ8",
    name: "Jay - British, Well-spoken & Husky",
  },
  {
    id: "aCChyB4P5WEomwRsOKRh",
    name: "Salma - Mature, Inviting, & Polished Arabic Voice",
  },
  {
    id: "LQMC3j3fn1LA9ZhI4o8g",
    name: "Kumar - Clear & Confident North Indian Voice",
  },
  {
    id: "SIpDYvpsUzCaJ0WmnSA8",
    name: "Joseph Corona - A young, male, Venezuelan voice",
  },
  {
    id: "3faLw6tqzw5w1UZMFTgL",
    name: "Nick Ivanov - Middle aged Russian Voice",
  },
  {
    id: "gAMZphRyrWJnLMDnom6H",
    name: "Keith - Everyday Chinese American Voice",
  },
  {
    id: "uOTaQ3KfK7rOT2MpeNyr",
    name: "Jerry - Middle aged Haitian American with a calm tone",
  },
  {
    id: "DS5zQQzzakuVi8Mip84y",
    name: "Tom - English Croatian Accent",
  },
  {
    id: "W2BFXIBAz50X1hk8EohV",
    name: "Martin - Calm and professional native French speaker recorded in English",
  },
  {
    id: "D11AWvkESE7DJwqIVi7L",
    name: "Brian K. - Seasoned, older American male voice with a signature slight hoarseness",
  },
  {
    id: "KlyEVp7Cr4uWil0rM5Lq",
    name: "Luke Cala v1.3 - An Italian man speaking English with an Italian accent. Perfect for conversations and social media.",
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
