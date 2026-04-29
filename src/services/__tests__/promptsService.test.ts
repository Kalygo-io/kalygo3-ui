import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

vi.stubEnv("NEXT_PUBLIC_AI_API_URL", "https://api.test.local");

const { promptsService } = await import("../promptsService");

beforeEach(() => {
  fetchSpy.mockReset();
});

function okJson(data: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(data), text: () => Promise.resolve("") };
}

describe("PromptsService", () => {
  it("listPrompts sends GET /api/prompts/", async () => {
    fetchSpy.mockResolvedValue(okJson([{ id: 1, name: "p1", content: "hi" }]));
    const result = await promptsService.listPrompts();
    expect(result).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/prompts/",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("getPrompt sends GET /api/prompts/:id", async () => {
    fetchSpy.mockResolvedValue(okJson({ id: 5, name: "p5", content: "body" }));
    await promptsService.getPrompt(5);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/prompts/5",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("createPrompt sends POST with payload", async () => {
    const payload = { name: "new", content: "c" };
    fetchSpy.mockResolvedValue(okJson({ id: 10, ...payload }));
    await promptsService.createPrompt(payload);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/prompts/",
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
  });

  it("updatePrompt sends PUT", async () => {
    fetchSpy.mockResolvedValue(okJson({ id: 1, name: "updated", content: "c" }));
    await promptsService.updatePrompt(1, { name: "updated" });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/prompts/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("deletePrompt sends DELETE", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined), text: () => Promise.resolve("") });
    await promptsService.deletePrompt(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/prompts/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws with detail from error response", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve(JSON.stringify({ detail: "Prompt not found" })) });
    await expect(promptsService.getPrompt(999)).rejects.toThrow("Prompt not found");
  });
});
