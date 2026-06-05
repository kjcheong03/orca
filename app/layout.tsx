import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

// All expose the same CSS variable (--font-inter, consumed by globals.css),
// so swapping the active font is a one-line change below.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Active UI font. To revert to Inter, change `.dmSans` to `.inter`.
const fonts = { inter, dmSans };
const appFont = fonts.dmSans;

export const metadata: Metadata = {
  applicationName: "CARA",
  title: "CARA — Community Health Companion",
  description:
    "A caregiver-first companion that turns public health advisories into clear, personalised actions. Frontend prototype.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // iOS standalone ("Add to Home Screen") behaviour.
  appleWebApp: {
    capable: true,
    title: "CARA",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#e3f2fd",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={appFont.variable}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before hydration, which is harmless here. */}
      <body suppressHydrationWarning>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
