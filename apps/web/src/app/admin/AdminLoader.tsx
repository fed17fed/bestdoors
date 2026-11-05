"use client";

import dynamic from "next/dynamic";

// React Admin is a browser-only app: load it without server rendering.
const AdminApp = dynamic(() => import("@/admin/AdminApp"), {
  ssr: false,
  loading: () => <p style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>Loading admin…</p>,
});

export function AdminLoader() {
  return <AdminApp />;
}
