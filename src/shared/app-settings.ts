const STORAGE_KEY = "kalygo_app_settings";

export interface AppSettings {
  elevenLabsVoiceId: string;
}

export const ELEVENLABS_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "tJHJUEHzOkMoPmJJ5jo2", name: "Ryan Quinn" },
  { id: "McVZB9hVxVSk3Equu8EH", name: "Audrey" },
] as const;

const DEFAULT_SETTINGS: AppSettings = {
  elevenLabsVoiceId: ELEVENLABS_VOICES[0].id,
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
