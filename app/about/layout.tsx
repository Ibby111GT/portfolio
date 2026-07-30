import type { Metadata } from "next";

const DESCRIPTION =
  "A security, cloud, identity, and systems engineering career built through operational work, open-source tools, and client-facing delivery.";

export const metadata: Metadata = {
  title: "About — Ibrahim Hussain",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Ibrahim Hussain",
    description: DESCRIPTION,
    url: "/about",
    images: ["/og.png"],
  },
};

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
