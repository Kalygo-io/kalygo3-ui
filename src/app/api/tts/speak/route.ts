import { NextRequest } from "next/server";
import { fetchElevenLabsApiKey } from "@/shared/server/fetch-elevenlabs-key";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

/**
 * POST /api/tts/speak
 * Body: { text: string, voiceId?: string }
 * Returns: audio/mpeg bytes (ElevenLabs).
 * Used when TTS provider is set to ElevenLabs (e.g. Multi-Agent TTS Chat).
 */
export async function POST(request: NextRequest) {
  const cookies = request.headers.get("cookie") ?? "";
  const apiKey = await fetchElevenLabsApiKey(cookies);
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "ElevenLabs API key not found. Add an ELEVENLABS_API_KEY credential in Settings → Credentials.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { text?: string; voiceId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return new Response(
      JSON.stringify({ error: "text is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const voiceId = typeof body.voiceId === "string" && body.voiceId.trim()
    ? body.voiceId.trim()
    : DEFAULT_VOICE_ID;

  const url = `${ELEVENLABS_API_URL}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: DEFAULT_MODEL_ID,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return new Response(
      JSON.stringify({
        error: `ElevenLabs TTS failed: ${res.status}`,
        details: errText.slice(0, 500),
      }),
      { status: res.status, headers: { "Content-Type": "application/json" } }
    );
  }

  const audioBuffer = await res.arrayBuffer();
  return new Response(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
