import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { RootLayoutContent } from "./root-layout-content";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Virtual Try-On | See How Clothes Look On You",
  description:
    "Try on clothes virtually with our AI-powered technology. Upload your photo and see how garments look on you before buying.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootLayoutContent>{children}</RootLayoutContent>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
