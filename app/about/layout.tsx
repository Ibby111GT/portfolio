import type { Metadata } from "next";

const DESCRIPTION =
  "From IT support on a Houston millwork shop floor to cloud engineering, a university SOC, a Top 15 capstone on private AI infrastructure, and the AI systems I build for construction today — plus my resume.";

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
