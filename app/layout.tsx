import type { Metadata } from "next";
import { Geist, Geist_Mono, Oxanium } from "next/font/google";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const oxaniumHeading = Oxanium({
  subsets: ["latin"],
  variable: "--font-heading",
});

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mascen.app"),
  title: "Mascen — Interactive Mascots & Brand Engine",
  description: "Design a cursor-aware mascot from a prompt or a photo.",
  icons: {
    icon: "/mascenLogo.jpg",
    apple: "/mascenLogo.jpg",
  },
  openGraph: {
    title: "Mascen — Interactive Mascots & Brand Engine",
    description: "Design cursor-aware interactive mascots and brand identity from a prompt or photo.",
    url: "https://mascen.app",
    siteName: "Mascen",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mascen Brand Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mascen — Interactive Mascots & Brand Engine",
    description: "Design cursor-aware interactive mascots and brand identity from a prompt or photo.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        oxaniumHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
