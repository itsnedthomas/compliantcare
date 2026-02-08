import PageHeader from "@/components/PageHeader";
import ContentBlock from "@/components/ContentBlock";
import CTA from "@/components/CTA";
import SystemDiagram from "@/components/SystemDiagram";
import OverlayDiagram from "@/components/OverlayDiagram";

export default function WirelessOverlayPage() {
    return (
        <>
            <PageHeader
                title="The Wireless Overlay Solution"
                subtitle="Upgrade your entire portfolio to digital in weeks, not years. No rewiring, no redecorating, no disruption."
                label="The Product"
            />

            <OverlayDiagram />

            <ContentBlock
                title="Why Choose an Overlay?"
                description="Traditional hardwired system replacements are costly, disruptive, and time-consuming. Our wireless overlay solution simply bypasses the old wiring, using robust 4G roaming connectivity to link each resident directly to the monitoring centre."
                imageSrc="/hero-image.png"
                imageAlt="Engineer installing CompliantCare Smart Hub"
                imagePosition="left"
                eyebrow="Speed & Efficiency"
                features={[
                    "Installation takes just 45 minutes per flat",
                    "No damage to decor or communal areas",
                    "Works alongside existing door entry systems",
                    "Immediate compliance with digital standards"
                ]}
            />

            <ContentBlock
                title="Technical Specifications"
                description={
                    <span>
                        The CompliantCare Smart Hub is a market-leading digital telecare hub designed for dispersed living but perfect for grouped schemes. It features dual-SIM 4G roaming for maximum reliability and a 40+ hour battery backup.{' '}
                        <a href="/about/technology" style={{ color: "var(--color-primary)", fontWeight: "600", textDecoration: "underline" }}>
                            View Full Specifications →
                        </a>
                    </span>
                }
                imageSrc="/hero-image.png"
                imageAlt="CompliantCare Smart Hub Device Close Up"
                imagePosition="right"
                eyebrow="Hardware"
                bgAlt={true}
                features={[
                    "Dual-SIM Roaming (All Networks)",
                    "40+ Hour Battery Backup",
                    "Class 1 Receiver (Long Range)",
                    "Heartbeat Monitoring every 2 minutes"
                ]}
            />

            <CTA />
        </>
    );
}
