import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoStoreProvider } from "@/lib/store";
import "./globals.css";

// Inter: clean body text. Fredoka: rounded, playful headings for the Bambam brand.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Bambam Chicken — System Prototype",
  description: "Ordering, POS, kitchen, inventory and business management prototype for Bambam Chicken.",
};

export const viewport: Viewport = {
  themeColor: "#F7931E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full">
        <DemoStoreProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </DemoStoreProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
