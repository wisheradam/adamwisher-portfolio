import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// TODO: replace with real copy, social image, and canonical domain before launch.
export const metadata: Metadata = {
  title: "Adam Wisher — Product Manager",
  description:
    "Adam Wisher is a Product Manager working across product strategy, AI, and connected systems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('adam-theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.classList.toggle('light',t==='light')}catch(e){}})();` }} />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable} bg-background text-foreground`}
      >
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
