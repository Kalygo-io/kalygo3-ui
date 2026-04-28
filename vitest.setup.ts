import { vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_AUTH_API_URL", "https://api.test.local");
vi.stubEnv("NEXT_PUBLIC_AI_API_URL", "https://api.test.local");
vi.stubEnv("NEXT_PUBLIC_COMPLETION_API_URL", "https://completion.test.local");
