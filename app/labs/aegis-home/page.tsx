import type { Metadata } from "next";
import AegisHomeSentinel from "@/components/labs/AegisHomeSentinel";

export const metadata: Metadata = {
  title: "Aegis/Home — Privacy-First Wireless Sensing Lab",
  description:
    "Explore consented Wi-Fi, Bluetooth, and CSI telemetry in a synthetic home-presence and room-change detection lab.",
  alternates: { canonical: "/labs/aegis-home" },
  openGraph: {
    title: "Aegis/Home — Privacy-First Wireless Sensing Lab",
    description:
      "An explainable, privacy-preserving RF sensing command center using synthetic telemetry.",
    url: "/labs/aegis-home",
    type: "website",
    images: ["/og.png"],
  },
};

export default function AegisHomePage() {
  return <AegisHomeSentinel />;
}
