import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

vi.stubEnv("NEXT_PUBLIC_AI_API_URL", "https://api.test.local");

const { contactsService } = await import("../contactsService");

beforeEach(() => {
  fetchSpy.mockReset();
});

function okJson(data: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(data), text: () => Promise.resolve("") };
}

describe("ContactsService", () => {
  it("listContacts sends GET /api/contacts/", async () => {
    fetchSpy.mockResolvedValue(okJson([]));
    await contactsService.listContacts();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/contacts/"),
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("listContacts passes search params", async () => {
    fetchSpy.mockResolvedValue(okJson([]));
    await contactsService.listContacts({ status: "active", search: "john" });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("status=active");
    expect(url).toContain("search=john");
  });

  it("getContact sends GET /api/contacts/:id", async () => {
    fetchSpy.mockResolvedValue(okJson({ id: 1 }));
    await contactsService.getContact(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/contacts/1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("createContact sends POST", async () => {
    const payload = { first_name: "Jane", email: "jane@test.com" };
    fetchSpy.mockResolvedValue(okJson({ id: 2, ...payload }));
    await contactsService.createContact(payload);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/contacts/",
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
  });

  it("deleteContact sends DELETE", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined), text: () => Promise.resolve("") });
    await contactsService.deleteContact(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/contacts/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws with detail from error response", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve(JSON.stringify({ detail: "Not found" })) });
    await expect(contactsService.getContact(999)).rejects.toThrow("Not found");
  });
});

describe("ContactsService - events", () => {
  it("listEvents sends GET /api/contacts/:id/events/", async () => {
    fetchSpy.mockResolvedValue(okJson([]));
    await contactsService.listEvents(5);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/contacts/5/events/",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("createEvent sends POST with body", async () => {
    const payload = { event_type: "call", title: "Called client" };
    fetchSpy.mockResolvedValue(okJson({ id: 1, contact_id: 5, ...payload }));
    await contactsService.createEvent(5, payload);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/contacts/5/events/",
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
  });
});
