import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "PDF Tools - Premium Free PDF Solutions Online",
  description: "Professional-grade free PDF tools for viewing, editing, annotating, merging, splitting and converting PDFs. No installation needed, works directly in your browser.",
  keywords: "PDF tools, PDF editor, PDF viewer, PDF merger, PDF splitter, PDF converter, online PDF tools, free PDF editor, PDF annotation, JavaScript PDF tools",
  openGraph: {
    title: "PDF Tools - Premium Free PDF Solutions Online",
    description: "Professional-grade free PDF tools powered by JavaScript. Edit, annotate, merge, split, and convert PDFs online without installation.",
    url: "https://sopkit.github.io/pdf-tools/",
    siteName: "SopKit PDF Tools",
    images: [
      {
        url: "https://sopkit.github.io/pdf-tools/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SopKit PDF Tools",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Tools - Premium Free PDF Solutions Online",
    description: "Professional-grade free PDF tools powered by JavaScript. Edit, annotate, merge, split, and convert PDFs online.",
    images: ["https://sopkit.github.io/pdf-tools/twitter-image.jpg"],
  },
  alternates: {
    canonical: "https://sopkit.github.io/pdf-tools/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#0052cc" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-grow pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
