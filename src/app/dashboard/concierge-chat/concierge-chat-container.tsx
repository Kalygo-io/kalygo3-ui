"use client";

import { useState, useRef } from "react";
import {
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  StopIcon,
} from "@heroicons/react/24/outline";

export function ConciergeChatContainer() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Clean up previous audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate speech");
      }

      // Get the audio blob from the streamed response
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Auto-play the audio using a small delay to ensure the element is ready
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.warn("Auto-play failed:", err);
          });
        }
      }, 100);
    } catch (err) {
      console.error("Error generating speech:", err);
      setError(err instanceof Error ? err.message : "Failed to generate speech");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Concierge Chat</h1>
          </div>
          <p className="text-gray-400">
            Your personal AI concierge assistant with voice capabilities
          </p>
        </div>

        {/* Text Input Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="text-input"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Enter text to speak
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type something for the AI to say..."
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SpeakerWaveIcon className="h-5 w-5" />
                    Speak
                  </>
                )}
              </button>

              {isPlaying && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <StopIcon className="h-5 w-5" />
                  Stop
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Audio Player */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <SpeakerWaveIcon className="h-5 w-5 text-purple-400" />
            Audio Player
          </h2>
          
          {audioUrl ? (
            <audio
              ref={audioRef}
              controls
              autoPlay
              className="w-full"
              onEnded={handleAudioEnded}
              onPlay={handleAudioPlay}
              onPause={handleAudioPause}
              src={audioUrl}
            />
          ) : (
            <div className="text-center py-8">
              <SpeakerWaveIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">
                Enter text above and click &quot;Speak&quot; to generate audio
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
