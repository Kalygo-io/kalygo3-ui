import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

vi.stubEnv("NEXT_PUBLIC_AI_API_URL", "https://api.test.local");

const { apiKeysService } = await import("../apiKeysService");

beforeEach(() => {
  fetchSpy.mockReset();
});

describe("ApiKeysService", () => {
  it("listApiKeys sends GET /api/api-keys", async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await apiKeysService.listApiKeys();
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/api-keys",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("createApiKey sends POST with name", async () => {
    const payload = { name: "my-key" };
    fetchSpy.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1, name: "my-key", key: "ak-xxx" }) });
    const result = await apiKeysService.createApiKey(payload);
    expect(result.key).toBe("ak-xxx");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/api-keys",
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
  });

  it("deleteApiKey sends DELETE /api/api-keys/:id", async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    await apiKeysService.deleteApiKey(42);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/api-keys/42",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws with message from error body on list", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve(JSON.stringify({ message: "Forbidden" })) });
    await expect(apiKeysService.listApiKeys()).rejects.toThrow("Forbidden");
  });
});
