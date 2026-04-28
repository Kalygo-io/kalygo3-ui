export async function logoutRequest() {
  const resp = await fetch("/api/auth/logout", {
    method: "DELETE",
  });

  if (!resp.ok) {
    throw new Error("An error occurred");
  }
}
