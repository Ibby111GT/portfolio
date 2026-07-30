import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Ibrahim Hussain — Security & Data Engineering",
  description:
    "Working cybersecurity and data engineering labs across security, finance, and healthcare, plus production-minded Python security tools.",
  openGraph: {
    title: "Ibrahim Hussain — Security & Data Engineering",
    description:
      "Run interactive threat hunting and governed data pipeline labs, then explore the engineering case studies behind them.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Connected cybersecurity and data engineering systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ibrahim Hussain — Security & Data Engineering",
    description:
      "Interactive labs and engineering case studies across cybersecurity, finance, and healthcare.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

const themeInit = `(function(){document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');var d=t?t==='dark':true;document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-bg font-sans text-fg antialiased">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[2000] -translate-y-24 rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg shadow-xl transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <Nav />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
