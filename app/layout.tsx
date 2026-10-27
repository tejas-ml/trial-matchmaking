import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "HelixMatch — AI Clinical Trial Matching",
  description:
    "RAG engine that reads unstructured clinical notes, extracts ICD-10 codes, and matches patients to recruiting trials on ClinicalTrials.gov.",
  metadataBase: new URL("https://helixmatch.vercel.app"),
  openGraph: {
    title: "HelixMatch — AI Clinical Trial Matching",
    description:
      "BioBERT-compatible RAG for inclusion/exclusion matching against ClinicalTrials.gov.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-paper text-ink">
        <div className="grain pointer-events-none fixed inset-0 opacity-40 mix-blend-multiply" />
        <Nav />
        <main className="relative flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
