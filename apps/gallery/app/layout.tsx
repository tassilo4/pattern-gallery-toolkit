import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { STORAGE_KEY } from "@/lib/theme.mjs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pattern Gallery Toolkit",
  description: "Live previews of every registry's patterns.",
};

// Runs before paint: sets the <html> class from storage/OS so the chrome never flashes.
// Interpolates STORAGE_KEY so it can't drift from lib/theme.mjs.
const NO_FLASH_SCRIPT = `try {
  var t = localStorage.getItem('${STORAGE_KEY}') || 'system';
  var d = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  var r = document.documentElement;
  r.classList.add(d ? 'dark' : 'light');
  r.classList.remove(d ? 'light' : 'dark');
  r.style.colorScheme = d ? 'dark' : 'light';
} catch (e) {}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
