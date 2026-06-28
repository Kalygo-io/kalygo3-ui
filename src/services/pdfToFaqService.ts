import { ModelProvider } from "./agentsService";
import { handleResponse } from "./lib/api";

export interface FaqPair {
  question: string;
  answer: string;
}

export interface GenerateFaqsResponse {
  model: { provider: string; model: string };
  pairs: FaqPair[];
}

interface GenerateFaqsArgs {
  pdfBase64: string;
  pdfFilename?: string;
  provider: ModelProvider;
  model: string;
  pdfUseVision?: boolean;
}

/** Read a File as a base64 string (without the data: prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
  });
}

/**
 * Generate FAQ Q&A pairs from a PDF via the agent-api one-shot endpoint.
 *
 * This hits the agent-api directly (NEXT_PUBLIC_AGENT_API_URL), not the ai-api
 * that the shared `apiPost` helper defaults to — mirroring callAgent.ts.
 */
export async function generateFaqs(
  args: GenerateFaqsArgs,
): Promise<GenerateFaqsResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/pdf-to-faq/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        pdf: args.pdfBase64,
        pdfFilename: args.pdfFilename,
        model: { provider: args.provider, model: args.model },
        pdfUseVision: args.pdfUseVision ?? false,
      }),
    },
  );
  return handleResponse<GenerateFaqsResponse>(response);
}
