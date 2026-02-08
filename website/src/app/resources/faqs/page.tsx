"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import CTA from "@/components/CTA";
import styles from "@/components/ContentBlock.module.css";

const faqCategories = [
    {
        title: "Installation & Disruption",
        items: [
            {
                question: "How long does installation really take?",
                answer: "We average 45-60 minutes per residential unit. A team of two engineers can upgrade a block of 30 flats in less than two days. We pre-configure everything off-site so it's just a case of plug-and-play installation."
            },
            {
                question: "Is there a lot of disruption for residents?",
                answer: "Very minimal. Because our system is wireless, we don't need to chase cables through walls or lift carpets. We simply replace the old unit with the new CompliantCare Smart Hub, demonstrate how to use it, and leave. No dust, no noise, no mess."
            },
            {
                question: "Do you need access to every flat?",
                answer: "Yes, we need momentary access to swap the unit. However, our resident liaison team handles all the scheduling and communication letters for you, often achieving 98%+ access rates on the first visit."
            }
        ]
    },
    {
        title: "Technical & Reliability",
        items: [
            {
                question: "What happens if there is a power cut?",
                answer: "The CompliantCare Smart Hub has a 40+ hour backup battery that kicks in automatically. This is far superior to many digital hubs that only offer 1-4 hours of backup."
            },
            {
                question: "Does it work in areas with poor signal?",
                answer: "Yes. We use Roaming World SIMs that connect to all four major UK networks (EE, O2, Vodafone, Three). The device automatically picks the strongest signal. We also perform a signal audit before any installation to ensure coverage is sufficient."
            },
            {
                question: "Can we keep using our existing pendants?",
                answer: "In most cases, yes. The CompliantCare Smart Hub is compatible with a wide range of existing peripherals, so residents can often keep their familiar triggers. We will verify compatibility during the audit."
            }
        ]
    },
    {
        title: "Costs & Contracts",
        items: [
            {
                question: "Is this cheaper than hardwiring?",
                answer: "Significantly. A typical hardwired system replacement can cost £1,500-£2,500 per flat due to redecoration and cabling labour. Our wireless overlay solution is typically 80-90% cheaper upfront."
            },
            {
                question: "Is there an ongoing cost?",
                answer: "Yes, there is a small monthly SIM and platform fee per device. However, this is often offset by the savings on analogue telephone line rentals, which are no longer required."
            }
        ]
    }
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const toggleAccordion = (categoryIndex: number, itemIndex: number) => {
        const key = `${categoryIndex}-${itemIndex}`;
        setOpenIndex(openIndex === key ? null : key);
    };

    return (
        <>
            <PageHeader
                title="Frequently Asked Questions"
                subtitle="Answers to common questions about the switchover, installation, and our technology."
                label="Support"
            />

            <section className={styles.section} style={{ paddingBottom: "120px" }}> {/* Extra spacing at bottom */}
                <div className={styles.container} style={{ display: "block", maxWidth: "800px" }}>

                    {faqCategories.map((category, catIndex) => (
                        <div key={catIndex} style={{ marginBottom: "48px" }}>
                            <h3 style={{
                                fontSize: "24px",
                                fontWeight: "700",
                                color: "var(--color-primary)",
                                marginBottom: "24px",
                                borderBottom: "2px solid #f3f4f6",
                                paddingBottom: "12px"
                            }}>
                                {category.title}
                            </h3>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {category.items.map((faq, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "12px",
                                            overflow: "hidden",
                                            background: "#fff"
                                        }}
                                    >
                                        <button
                                            onClick={() => toggleAccordion(catIndex, index)}
                                            style={{
                                                width: "100%",
                                                textAlign: "left",
                                                padding: "24px",
                                                background: "none",
                                                border: "none",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <span style={{
                                                fontFamily: "var(--font-headline)",
                                                fontWeight: "600",
                                                fontSize: "18px",
                                                color: "var(--color-gray-900)"
                                            }}>
                                                {faq.question}
                                            </span>
                                            <span style={{
                                                transform: openIndex === `${catIndex}-${index}` ? "rotate(180deg)" : "rotate(0)",
                                                transition: "transform 0.3s ease",
                                                color: "var(--color-gray-400)"
                                            }}>
                                                ▼
                                            </span>
                                        </button>

                                        <AnimatePresence>
                                            {openIndex === `${catIndex}-${index}` && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div style={{ padding: "0 24px 24px 24px", color: "var(--color-gray-600)", lineHeight: "1.6" }}>
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                </div>
            </section>

            <CTA />
        </>
    );
}
