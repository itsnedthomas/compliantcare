import PageHeader from "@/components/PageHeader";
import ContentBlock from "@/components/ContentBlock";
import CTA from "@/components/CTA";

export default function ApproachPage() {
    return (
        <>
            <PageHeader
                title="Our Approach"
                subtitle="We believe digital transformation shouldn't cost the earth or disrupt the lives of your residents."
                label="Resident First"
            />

            <ContentBlock
                title="The 48-Hour Promise"
                description="We understand that housing officers are under immense pressure. That's why we engineered a solution that can be deployed faster than any other on the market. Our promise is simple: we can taking a typical sheltered housing scheme from 0% to 100% compliant in just 48 hours."
                imageSrc="/hero-image.png"
                imageAlt="Engineers completing an installation quickly"
                imagePosition="right"
                eyebrow="Speed & Efficiency"
                features={[
                    "Pre-configured units sent to site",
                    "Dedicated rapid-response install teams",
                    "No complex cabling or containment work",
                    "Immediate handover and training"
                ]}
            />

            <ContentBlock
                title="Safety Without Compromise"
                description="Speed doesn't mean cutting corners. Our approach is built on a foundation of rigorous safety standards. We use only TSA-approved equipment and monitoring centers. Every installation is audited and tested before our engineers leave the site."
                imageSrc="/hero-image.png"
                imageAlt="Safety compliance documentation"
                imagePosition="left"
                eyebrow="Compliance"
                bgAlt={true}
                features={[
                    "Full life-safety audit trail",
                    "BS8591 compliant receiving centres",
                    "Roaming SIMs for signal redundancy",
                    "Regular automated battery health checks"
                ]}
            />

            <ContentBlock
                title="Resident-First Design"
                description="Technology should empower residents, not confuse them. We chose the CompliantCare Smart Hub because of its intuitive design. Large high-contrast buttons, clear audio prompts, and a familiar form factor mean that residents feel comfortable using the new system from day one."
                imageSrc="/hero-image.png"
                imageAlt="Senior resident smiling while using the device"
                imagePosition="right"
                eyebrow="Usability"
                features={[
                    "High contrast tactile buttons",
                    "Voice-guided operation",
                    "Personal pendant included",
                    "Works right out of the box"
                ]}
            />

            <CTA />
        </>
    );
}
