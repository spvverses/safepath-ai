import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SafePath AI",
  description: "AI-powered safety-first navigation using open mapping, live web data and RAG."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}