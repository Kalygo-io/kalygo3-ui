import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateToken } from "../validateToken";
import { requestLoginCode } from "../requestLoginCode";
import { verifyLoginCode } from "../verifyLoginCode";

const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

beforeEach(() => {
  fetchSpy.mockReset();
});

// ---------------------------------------------------------------------------
// validateToken
// ---------------------------------------------------------------------------
describe("validateToken", () => {
  it("sends Bearer token to the auth API", async () => {
    fetchSpy.mockResolvedValue({ ok: true });

    await validateToken("my-jwt");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/auth/validate-token",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer my-jwt" },
      }),
    );
  });

  it("throws when the API returns a non-ok response", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve("Unauthorized") });

    await expect(validateToken("bad-token")).rejects.toThrow(
      "Failed to validate token",
    );
  });

  it("does not throw on a 200 response", async () => {
    fetchSpy.mockResolvedValue({ ok: true });

    await expect(validateToken("good-token")).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// requestLoginCode
// ---------------------------------------------------------------------------
describe("requestLoginCode", () => {
  it("posts the email to the auth API", async () => {
    fetchSpy.mockResolvedValue({ ok: true });

    await requestLoginCode("user@example.com");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.local/api/auth/request-code",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com" }),
      }),
    );
  });

  it("throws with the API detail message on failure", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Rate limited" }),
    });

    await expect(requestLoginCode("user@example.com")).rejects.toThrow(
      "Rate limited",
    );
  });

  it("falls back to a generic message when body has no detail", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(requestLoginCode("user@example.com")).rejects.toThrow(
      "Failed to send code",
    );
  });
});

// ---------------------------------------------------------------------------
// verifyLoginCode
// ---------------------------------------------------------------------------
describe("verifyLoginCode", () => {
  it("posts email and code to the local API route", async () => {
    fetchSpy.mockResolvedValue({ ok: true });

    await verifyLoginCode("user@example.com", "12345678");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/verify-code",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", code: "12345678" }),
      }),
    );
  });

  it("throws with the API error message on failure", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Code expired" }),
    });

    await expect(
      verifyLoginCode("user@example.com", "00000000"),
    ).rejects.toThrow("Code expired");
  });

  it("falls back to a generic message when body has no error field", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    await expect(
      verifyLoginCode("user@example.com", "00000000"),
    ).rejects.toThrow("Invalid or expired code");
  });
});
