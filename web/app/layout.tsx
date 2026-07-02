import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import ScrollToTop from "@/components/ui/scroll-to-top";

export const metadata: Metadata = {
  title: "showman",
  description: "Booking infrastructure for the next wave of live culture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground antialiased">
        <ScrollToTop />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
