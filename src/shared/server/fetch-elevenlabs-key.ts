/**
 * Server-side helper to fetch the ElevenLabs API key from the
 * credentials API on behalf of the authenticated user.
 *
 * This is used by all TTS-related API routes so the key is stored
 * centrally in the credentials system rather than hard-coded in env vars.
 */

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL;

export async function fetchElevenLabsApiKey(
  cookies: string
): Promise<string | null> {
  if (!AI_API_URL) {
    console.error("[fetchElevenLabsApiKey] NEXT_PUBLIC_AI_API_URL is not set");
    return null;
  }

  try {
    const response = await fetch(
      `${AI_API_URL}/api/credentials/service/ELEVENLABS_API_KEY`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `[fetchElevenLabsApiKey] Credentials API returned ${response.status}`
      );
      return null;
    }

    const credential = await response.json();

    // The credential_data object contains the api_key field
    const apiKey =
      credential?.credential_data?.api_key ||
      credential?.api_key ||
      credential?.decrypted_data ||
      null;

    if (!apiKey) {
      console.error(
        "[fetchElevenLabsApiKey] No api_key found in credential response"
      );
    }

    return apiKey;
  } catch (error) {
    console.error("[fetchElevenLabsApiKey] Failed to fetch credential:", error);
    return null;
  }
}
