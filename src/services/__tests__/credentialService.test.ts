import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

vi.stubEnv("NEXT_PUBLIC_AI_API_URL", "https://api.test.local");

const { credentialService, formatServiceName, formatCredentialType, getCredentialDataKey, ServiceName, AuthType } =
  await import("../credentialService");

beforeEach(() => {
  fetchSpy.mockReset();
});

function okJson(data: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(data), text: () => Promise.resolve("") };
}

describe("CredentialService", () => {
  it("listCredentials hits GET /api/credentials/", async () => {
    fetchSpy.mockResolvedValue(okJson([]));
    await credentialService.listCredentials();
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/credentials/",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("getCredential hits GET /api/credentials/:id/full", async () => {
    fetchSpy.mockResolvedValue(okJson({ id: 1 }));
    await credentialService.getCredential(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/credentials/1/full",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("createCredential sends POST /api/credentials/flexible", async () => {
    const payload = {
      credential_type: ServiceName.OPENAI_API_KEY,
      auth_type: AuthType.API_KEY,
      credential_data: { api_key: "sk-test" },
    };
    fetchSpy.mockResolvedValue(okJson({ id: 2, ...payload }));
    await credentialService.createCredential(payload);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/credentials/flexible",
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
  });

  it("deleteCredential sends DELETE /api/credentials/:id", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined), text: () => Promise.resolve("") });
    await credentialService.deleteCredential(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/credentials/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("display helpers", () => {
  it("formatServiceName maps known services", () => {
    expect(formatServiceName(ServiceName.AWS_SES)).toBe("AWS SES");
    expect(formatServiceName(ServiceName.OPENAI_API_KEY)).toBe("OpenAI");
  });

  it("formatServiceName returns raw string for unknown service", () => {
    expect(formatServiceName("CUSTOM")).toBe("CUSTOM");
  });

  it("formatCredentialType maps known auth types", () => {
    expect(formatCredentialType(AuthType.API_KEY)).toBe("API Key");
    expect(formatCredentialType(AuthType.DB_CONNECTION)).toBe("Database Connection");
  });

  it("getCredentialDataKey returns correct key for each auth type", () => {
    expect(getCredentialDataKey(AuthType.API_KEY)).toBe("api_key");
    expect(getCredentialDataKey(AuthType.AWS_ACCESS_KEY_PAIR)).toBe("key_id");
    expect(getCredentialDataKey(AuthType.CONNECTION_STRING)).toBe("connection_string");
    expect(getCredentialDataKey("unknown")).toBe("value");
  });
});
