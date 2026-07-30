import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creative Playground — Ibrahim Hussain",
  description:
    "Ten interactive prototypes spanning spatial design, fabrication, automotive systems, geospatial simulation, security visualization, and generative art.",
};

export default function CreativeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
