import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BrainCircuit } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Humanify AI",
  description: "Deterministic Hybrid Humanizer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}>
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center px-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">Humanify</span>
            </div>
            <nav className="ml-auto flex items-center gap-4 text-sm font-medium">
              <a href="#" className="transition-colors hover:text-foreground/80">Documentation</a>
              <a href="#" className="transition-colors hover:text-foreground/80">Settings</a>
            </nav>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-6 md:py-0">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
            <p className="text-sm leading-loose text-muted-foreground text-center md:text-left">
              Built with mathematical determinism. Preserving intent while removing AI signatures.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
