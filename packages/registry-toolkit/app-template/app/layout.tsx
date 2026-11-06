import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Component pattern site",
  description: "Live pattern examples for a shadcn registry.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
