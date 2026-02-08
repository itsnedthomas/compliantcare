import PageHeader from "@/components/PageHeader";
import CTA from "@/components/CTA";
import CaseStudyCarousel from "@/components/CaseStudyCarousel";

export default function CaseStudiesPage() {
    return (
        <>
            <PageHeader
                title="Success Stories"
                subtitle="See how we've helped leading housing associations navigate the digital switchover with speed and confidence."
                label="Case Studies"
            />

            <CaseStudyCarousel />

            <CTA />
        </>
    );
}
