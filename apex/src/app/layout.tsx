import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://apex.local"),
  title: {
    default: "APEX — Formula 1 Telemetry OS",
    template: "%s · APEX",
  },
  description:
    "A race engineer's telemetry OS. Pick a lap, watch it replay across velocity, throttle, brake and G-force, and render a generative fingerprint of any lap.",
  applicationName: "APEX",
  authors: [{ name: "APEX" }],
  keywords: [
    "Formula 1",
    "F1",
    "telemetry",
    "FastF1",
    "data visualization",
    "generative art",
    "lap fingerprint",
  ],
  openGraph: {
    type: "website",
    siteName: "APEX",
    title: "APEX — Formula 1 Telemetry OS",
    description:
      "Pick a lap. Watch the data replay. Render a generative fingerprint of every metre driven.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "APEX" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "APEX — Formula 1 Telemetry OS",
    description:
      "Pick a lap. Watch the data replay. Render a generative fingerprint of every metre driven.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} ${sourceSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
