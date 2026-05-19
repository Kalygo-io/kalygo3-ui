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
  const emptyPage = (over: Record<string, unknown> = {}) =>
    okJson({ contacts: [], total: 0, limit: 500, offset: 0, has_more: false, ...over });

  it("listContacts sends GET /api/contacts/ and returns a flat array", async () => {
    fetchSpy.mockResolvedValue(emptyPage());
    const result = await contactsService.listContacts();
    expect(Array.isArray(result)).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/contacts/"),
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("listContacts passes search params", async () => {
    fetchSpy.mockResolvedValue(emptyPage());
    await contactsService.listContacts({ status: "active", search: "john" });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("status=active");
    expect(url).toContain("search=john");
  });

  it("listContacts pages through until has_more is false", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        okJson({ contacts: [{ id: 1 }], total: 2, limit: 500, offset: 0, has_more: true }),
      )
      .mockResolvedValueOnce(
        okJson({ contacts: [{ id: 2 }], total: 2, limit: 500, offset: 500, has_more: false }),
      );
    const result = await contactsService.listContacts();
    expect(result.map((c) => c.id)).toEqual([1, 2]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("listContactsPage sends limit/offset and returns the envelope", async () => {
    fetchSpy.mockResolvedValue(emptyPage({ total: 7, limit: 25, offset: 25 }));
    const res = await contactsService.listContactsPage({ limit: 25, offset: 25 });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("limit=25");
    expect(url).toContain("offset=25");
    expect(res.total).toBe(7);
  });

  it("listContactsPage clamps limit (<=500) and offset (>=0)", async () => {
    fetchSpy.mockResolvedValue(emptyPage());
    await contactsService.listContactsPage({ limit: 99999, offset: -5 });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("limit=500");
    expect(url).toContain("offset=0");
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
