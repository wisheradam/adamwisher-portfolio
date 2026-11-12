import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('adam-theme')==='dark'?'dark':'light';document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.classList.toggle('light',t==='light')}catch(e){}})();` }} />
      </head>
      <body
        className={`${inter.variable} ${plexMono.variable} bg-background text-foreground`}
      >
        <a href="#main-content" className="skip-link">Skip to content</a>
        <div id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
