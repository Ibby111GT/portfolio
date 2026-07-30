import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Ibrahim Hussain",
  description:
    "A security, cloud, identity, and systems engineering career built through operational work, open-source tools, and client-facing delivery.",
};

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
