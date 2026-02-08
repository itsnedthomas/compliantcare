import PageHeader from "@/components/PageHeader";
import ContentBlock from "@/components/ContentBlock";
import CTA from "@/components/CTA";
import InteractiveTimeline from "@/components/InteractiveTimeline";

export default function Guide2027Page() {
    return (
        <>
            <PageHeader
                title="The digital switchover is happening."
                subtitle="By 2027, the analogue public switched telephone network (PSTN) will be switched off permanently. Here is what you need to know."
                label="2027 Deadline Guide"
            />

            <InteractiveTimeline />

            <ContentBlock
                title="Why is this happening?"
                description="The UK's telephone network has been powered by copper for over a century. It's old, unreliable, and expensive to maintain. Openreach is retiring this ageing infrastructure and replacing it with a full digital (IP) network. This modernization is necessary, but it breaks traditional analogue telecare devices."
                imageSrc="/hero-image.png"
                imageAlt="Copper wiring vs Fibre optic cables"
                imagePosition="right"
                eyebrow="The Background"
                features={[
                    "Analogue lines suffer from signal degradation",
                    "Replacement parts are becoming obsolete",
                    "Digital offers better speed and reliability",
                    "Global shift towards IP communications"
                ]}
            />

            {/* ... rest of content blocks ... */}
            <ContentBlock
                title="The Risk to Telecare"
                description="Millions of vulnerable people rely on telecare devices that were designed to work on analogue lines. When connected to digital lines, these devices may fail to connect to the monitoring centre, or the audio quality may be too poor to hear. This is a critical life-safety risk that Housing Associations must address."
                imageSrc="/hero-image.png"
                imageAlt="Warning sign about telecare failure"
                imagePosition="left"
                eyebrow="Critical Risk"
                bgAlt={true}
                features={[
                    "Signalling failures (DTMF tones distorted)",
                    "Power cut vulnerability (digital lines need mains power)",
                    "Liability rests with the housing provider",
                    "Testing is required for every device"
                ]}
            />

            <CTA />
        </>
    );
}
