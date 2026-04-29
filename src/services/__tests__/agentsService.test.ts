import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

vi.stubEnv("NEXT_PUBLIC_AI_API_URL", "https://api.test.local");

const { agentsService } = await import("../agentsService");

beforeEach(() => {
  fetchSpy.mockReset();
});

function okJson(data: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(data), text: () => Promise.resolve(JSON.stringify(data)) };
}

function errResponse(status: number, detail: string) {
  return { ok: false, status, text: () => Promise.resolve(JSON.stringify({ detail })) };
}

describe("AgentsService", () => {
  describe("listAgents", () => {
    it("calls GET /api/agents with credentials", async () => {
      const agents = [{ id: "1", name: "Agent A" }];
      fetchSpy.mockResolvedValue(okJson(agents));

      const result = await agentsService.listAgents();

      expect(result).toEqual(agents);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.local/api/agents",
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
    });
  });

  describe("getAgent", () => {
    it("calls GET /api/agents/:id", async () => {
      const agent = { id: "abc", name: "Test" };
      fetchSpy.mockResolvedValue(okJson(agent));

      const result = await agentsService.getAgent("abc");

      expect(result).toEqual(agent);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.local/api/agents/abc",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("URL-encodes the agent id", async () => {
      fetchSpy.mockResolvedValue(okJson({}));
      await agentsService.getAgent("a/b c");
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("a%2Fb%20c"),
        expect.anything(),
      );
    });
  });

  describe("createAgent", () => {
    it("sends POST with body", async () => {
      const payload = { name: "New", config: { schema: "agent_config" as const, version: 4 as const, data: { systemPrompt: "hi" } } };
      fetchSpy.mockResolvedValue(okJson({ id: "new-id", ...payload }));

      await agentsService.createAgent(payload);

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.local/api/agents",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        }),
      );
    });
  });

  describe("updateAgent", () => {
    it("sends PUT /api/agents/:id", async () => {
      fetchSpy.mockResolvedValue(okJson({ id: "1", name: "Updated" }));
      await agentsService.updateAgent("1", { name: "Updated" });

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.local/api/agents/1",
        expect.objectContaining({ method: "PUT", body: JSON.stringify({ name: "Updated" }) }),
      );
    });
  });

  describe("deleteAgent", () => {
    it("sends DELETE /api/agents/:id", async () => {
      fetchSpy.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined), text: () => Promise.resolve("") });
      await agentsService.deleteAgent("1");

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.local/api/agents/1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("error handling", () => {
    it("throws with detail from JSON error body", async () => {
      fetchSpy.mockResolvedValue(errResponse(400, "Agent not found"));
      await expect(agentsService.listAgents()).rejects.toThrow("Agent not found");
    });

    it("throws with status when error body is not JSON", async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("") });
      await expect(agentsService.listAgents()).rejects.toThrow("Request failed: 500");
    });
  });
});
