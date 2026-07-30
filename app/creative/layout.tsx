import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creative Systems — Ibrahim Hussain",
  description:
    "Ten interactive prototypes organized into design and fabrication, interactive simulations, and generative systems—with plain-English guides and technical deep dives.",
};

export default function CreativeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
