"use client";

import { useState, useEffect } from "react";
import {
  AdjustmentsHorizontalIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import {
  getAppSettings,
  setAppSettings,
  ELEVENLABS_VOICES,
} from "@/shared/app-settings";
import { successToast } from "@/shared/toasts";

export function AppSettingsContainer() {
  const [voiceId, setVoiceId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const settings = getAppSettings();
    setVoiceId(settings.elevenLabsVoiceId);
    setLoaded(true);
  }, []);

  const handleVoiceChange = (newVoiceId: string) => {
    setVoiceId(newVoiceId);
    setAppSettings({ elevenLabsVoiceId: newVoiceId });
    const voice = ELEVENLABS_VOICES.find((v) => v.id === newVoiceId);
    successToast(`Voice changed to ${voice?.name ?? newVoiceId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <AdjustmentsHorizontalIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">App Settings</h1>
          </div>
          <p className="text-gray-400">
            Configure application-level settings and preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* ElevenLabs Settings */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <SpeakerWaveIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                ElevenLabs Settings
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="voice-select"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Configure Voice
                </label>
                {!loaded ? (
                  <div className="h-10 w-64 bg-gray-700 rounded-lg animate-pulse" />
                ) : (
                  <select
                    id="voice-select"
                    value={voiceId}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="block w-64 rounded-lg border border-gray-600 bg-gray-900 text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {ELEVENLABS_VOICES.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  The voice used for text-to-speech in TTS Chat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
