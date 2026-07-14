import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Fraunces, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://trydocumind.vercel.app";

const title = "DocuMind — PDF Q&A with RAG";
const description =
  "Upload a PDF and ask grounded questions with citations. Built with LangChain, ChromaDB, Gemini, FastAPI, and Next.js.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "DocuMind",
  keywords: [
    "RAG",
    "PDF Q&A",
    "citations",
    "LangChain",
    "ChromaDB",
    "Gemini",
    "DocuMind",
  ],
  authors: [{ name: "DocuMind" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "DocuMind",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  return (
    <ClerkProvider
      publishableKey={publishableKey || undefined}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      <html
        lang="en"
        className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          {children}
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
