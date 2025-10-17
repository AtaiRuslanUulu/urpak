import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "URPAK.KG",
  description: "URPAK.KG — платформа для поиска новостроек и проверенных застройщиков по всему Кыргызстану.",
  icons: { icon: "/favicon.ico", shortcut: "/icon.png", apple: "/apple_touch_icon.png" },
  themeColor: "#ffffff",
};

const ThemeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var start = stored || (systemDark ? 'dark' : 'light');
    document.documentElement.classList.remove('light','dark');
    document.documentElement.classList.add(start);
    document.documentElement.style.colorScheme = start;
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: ThemeScript }} /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-fg`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
