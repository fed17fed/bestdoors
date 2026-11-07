import type { Metadata } from "next";

// The admin panel has its own root layout (no shop header/footer, English only).
export const metadata: Metadata = {
  title: "Mr.Door admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
