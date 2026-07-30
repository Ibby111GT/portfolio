import type { Metadata } from "next";
import { CREATIVE_PROJECTS } from "@/lib/creativeProjects";

const DESCRIPTION = `${CREATIVE_PROJECTS.length} interactive prototypes organized into design and fabrication, interactive simulations, and generative systems—with plain-English guides and technical deep dives.`;

export const metadata: Metadata = {
  title: "Creative Systems — Ibrahim Hussain",
  description: DESCRIPTION,
  alternates: { canonical: "/creative" },
  openGraph: {
    title: "Creative Systems — Ibrahim Hussain",
    description: DESCRIPTION,
    url: "/creative",
    images: ["/og.png"],
  },
};

export default function CreativeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
