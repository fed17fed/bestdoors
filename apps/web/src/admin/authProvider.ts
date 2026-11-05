import type { AuthProvider } from "react-admin";

type Me = { id: string; email: string; name: string; role: "ADMIN" | "CUSTOMER" };

async function me(): Promise<Me | null> {
  const res = await fetch("/api/v1/auth/me", { credentials: "same-origin", cache: "no-store" });
  return res.ok ? ((await res.json()) as Me) : null;
}

/** Uses the same session cookie as the shop. Only users with the ADMIN role can enter. */
export const authProvider: AuthProvider = {
  async login({ username, password }) {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
    });
    if (!res.ok) throw new Error("Wrong email or password");
    const user = (await res.json()) as Me;
    if (user.role !== "ADMIN") {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "same-origin" });
      throw new Error("This account is not an admin");
    }
  },
  async logout() {
    await fetch("/api/v1/auth/logout", { method: "POST", credentials: "same-origin" });
  },
  async checkAuth() {
    const user = await me();
    if (user?.role !== "ADMIN") throw new Error("Please log in as an admin");
  },
  async checkError(error) {
    if (error?.status === 401 || error?.status === 403) throw error;
  },
  async getIdentity() {
    const user = await me();
    if (!user) throw new Error("Not logged in");
    return { id: user.id, fullName: user.name || user.email };
  },
  async getPermissions() {
    return "admin";
  },
};
