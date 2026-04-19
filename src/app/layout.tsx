import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "CLOIE — Assumption College of Davao",
    template: "%s | CLOIE",
  },
  description:
    "Comprehensive Learning Outcomes and Instructional Evaluation platform for Assumption College of Davao.",
  applicationName: "CLOIE",
  keywords: [
    "CLOIE",
    "Assumption College of Davao",
    "learning outcomes",
    "evaluation",
    "academic platform",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0051C3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", manrope.variable, inter.variable, "font-sans")}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
