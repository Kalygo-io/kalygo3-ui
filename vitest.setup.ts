import { vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_AUTH_API_URL", "https://api.test.local");
vi.stubEnv("NEXT_PUBLIC_AI_API_URL", "https://api.test.local");
vi.stubEnv("NEXT_PUBLIC_AGENT_API_URL", "https://agent-api.test.local");
