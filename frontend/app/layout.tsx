import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600"],
  variable: "--font-newsreader" 
});

// Metadata uses minimal title for SSR - actual app name from settings
// will be used client-side via usePageTitle hook in components
// Using empty string to avoid flash of default name before client-side update
export const metadata: Metadata = {
  title: "",
  description: "Starter Application Framework for AI Development",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/api/manifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${newsreader.variable} ${inter.className}`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
