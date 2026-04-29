import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

const { getCurrentUser } = await import("../getCurrentUser");
const { logoutRequest } = await import("../logoutRequest");
const { resetPassword } = await import("../resetPassword");
const { requestPasswordReset } = await import("../requestPasswordReset");

beforeEach(() => {
  fetchSpy.mockReset();
});

describe("getCurrentUser", () => {
  it("calls GET /api/auth/me with credentials", async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: () => Promise.resolve({ email: "a@b.com", id: 1 }) });
    const user = await getCurrentUser();
    expect(user).toEqual({ email: "a@b.com", id: 1 });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/auth/me",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("throws with API error message on failure", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({ error: "Token expired" }) });
    await expect(getCurrentUser()).rejects.toThrow("Token expired");
  });
});

describe("logoutRequest", () => {
  it("calls DELETE /api/auth/logout", async () => {
    fetchSpy.mockResolvedValue({ ok: true });
    await logoutRequest();
    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "DELETE" }));
  });

  it("throws on non-ok response", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });
    await expect(logoutRequest()).rejects.toThrow("An error occurred");
  });
});

describe("requestPasswordReset", () => {
  it("posts email to /api/auth/request-password-reset", async () => {
    fetchSpy.mockResolvedValue({ ok: true });
    await requestPasswordReset("a@b.com");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/auth/request-password-reset",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    );
  });

  it("throws on failure", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });
    await expect(requestPasswordReset("a@b.com")).rejects.toThrow("An error occurred");
  });
});

describe("resetPassword", () => {
  it("posts credentials to /api/auth/reset-password", async () => {
    fetchSpy.mockResolvedValue({ ok: true });
    await resetPassword(1, "tok123", "newpass");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ accountId: 1, resetToken: "tok123", newPassword: "newpass" }),
      }),
    );
  });

  it("throws on failure", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 400 });
    await expect(resetPassword(1, "bad", "pw")).rejects.toThrow("An error occurred");
  });
});
