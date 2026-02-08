import PageHeader from "@/components/PageHeader";
import ContentBlock from "@/components/ContentBlock";
import CTA from "@/components/CTA";
import MigrationProcess from "@/components/MigrationProcess";

export default function DigitalMigrationPage() {
    return (
        <>
            <PageHeader
                title="Managed Digital Migration"
                subtitle="We don't just sell you the hardware; we manage the entire transition from analogue to digital, ensuring no resident is left behind."
                label="The Process"
            />

            <MigrationProcess />

            <ContentBlock
                title="A Fully Managed Service"
                description="We take the heavy lifting off your team. From the initial asset audit and signal survey to resident communication letters and final handover, our dedicated project managers handle every step."
                imageSrc="/hero-image.png"
                imageAlt="Project Manager with Clipboard"
                imagePosition="left"
                eyebrow="End-to-End Support"
                features={[
                    "Dedicated Project Manager for every scheme",
                    "Resident Liaison Officers to handle access",
                    "Full asset register creation",
                    "WEEE recycling of old equipment"
                ]}
            />

            <ContentBlock
                title="Resident Communication"
                description="Change can be scary for vulnerable residents. Our Resident Liaison Officers (RLOs) are trained to explain the new technology simply and reassuringly. we achieve over 95% first-time access rates."
                imageSrc="/hero-image.png"
                imageAlt="RLO talking to resident"
                imagePosition="right"
                eyebrow="Resident First"
                bgAlt={true}
                features={[
                    "Plain English introduction letters",
                    "On-site drop-in sessions / coffee mornings",
                    "1-to-1 demonstration during installation",
                    "Follow up welfare calls"
                ]}
            />

            <CTA />
        </>
    );
}
