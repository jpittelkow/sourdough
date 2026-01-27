import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { APP_CONFIG } from "@/config/app";

const inter = Inter({ subsets: ["latin"] });

// Metadata uses static default for SSR - actual app name from settings
// will be used client-side via useAppConfig hook in components
export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || APP_CONFIG.name,
  description: "Starter Application Framework for AI Development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
