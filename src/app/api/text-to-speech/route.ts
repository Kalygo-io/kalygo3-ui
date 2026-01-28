import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId = DEFAULT_VOICE_ID, modelId = DEFAULT_MODEL_ID } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("ELEVENLABS_API_KEY is not configured");
      return NextResponse.json(
        { error: "Text-to-speech service is not configured" },
        { status: 500 }
      );
    }

    const url = `${ELEVENLABS_API_URL}/${voiceId}/stream?output_format=${OUTPUT_FORMAT}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate speech", details: errorText },
        { status: response.status }
      );
    }

    // Stream the audio response back to the client
    const audioStream = response.body;
    if (!audioStream) {
      return NextResponse.json(
        { error: "No audio stream received" },
        { status: 500 }
      );
    }

    // Return the stream with appropriate headers for audio
    return new NextResponse(audioStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
