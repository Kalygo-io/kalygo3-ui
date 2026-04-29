import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

const { getAccount, updateAccount } = await import("../accountService");

beforeEach(() => {
  fetchSpy.mockReset();
});

describe("getAccount", () => {
  it("calls GET /api/accounts/me with credentials", async () => {
    const account = { id: 1, email: "a@b.com", newsletter_subscribed: false, stripe_customer_id: null };
    fetchSpy.mockResolvedValue({ ok: true, json: () => Promise.resolve(account) });

    const result = await getAccount();

    expect(result).toEqual(account);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/accounts/me",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("throws on error with API message", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    await expect(getAccount()).rejects.toThrow("Failed to get account: Unauthorized");
  });

  it("falls back to HTTP status when error body parse fails", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(getAccount()).rejects.toThrow("Failed to get account: Unknown error");
  });
});

describe("updateAccount", () => {
  it("sends PUT with body", async () => {
    const updated = { id: 1, email: "new@b.com", newsletter_subscribed: true, stripe_customer_id: null };
    fetchSpy.mockResolvedValue({ ok: true, json: () => Promise.resolve(updated) });

    const result = await updateAccount({ email: "new@b.com", newsletter_subscribed: true });

    expect(result).toEqual(updated);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/accounts/me",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ email: "new@b.com", newsletter_subscribed: true }),
      }),
    );
  });
});
