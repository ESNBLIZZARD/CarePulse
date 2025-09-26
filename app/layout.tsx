// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Plus_Jakarta_Sans as FontSans } from "next/font/google";
import * as Sentry from "@sentry/nextjs";
import { cn } from "@/lib/utils";
import ClientProviders from "./Clientproviders";

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CarePulse",
    description:
      "A healthcare patient management System designed to streamline patient registration, appointment scheduling, and medical records management for healthcare providers.",
    icons: {
      icon: "/assets/icons/logo-icon.svg",
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-dark-300 font-sans antialiased",
          fontSans.variable
        )}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
