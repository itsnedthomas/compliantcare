"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import styles from "./ProductPage.module.css";
import QuoteModal from "@/components/QuoteModal";
import Image from "next/image";

// Gallery images configuration
const galleryImages = [
    { id: "hub-front", src: "/seven-hub-detailed.png", label: "Smart Hub", category: "hub" },
    { id: "hub-angle", src: "/seven-hub-front.png", label: "Hub (Angle)", category: "hub" },
    { id: "pendant", src: "/pendant.png", label: "Standard Pendant", category: "pendant" },
    { id: "fall-detector", src: "/fall-detector.png", label: "Fall Detector", category: "pendant" },
    { id: "wall-button", src: "/wall-button.png", label: "Wall Pull Cord", category: "addon" },
    { id: "bed-mat", src: "/bed-occupancy.png", label: "Bed Mat", category: "addon" },
    { id: "smoke", src: "/smoke-detector.png", label: "Smoke Detector", category: "addon" },
];

export default function TechnologyPage() {
    // Gallery state
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isGalleryHovered, setIsGalleryHovered] = useState(false);

    // Configuration state
    const [pendantType, setPendantType] = useState<"standard" | "advanced">("standard");
    const [addPullCord, setAddPullCord] = useState(false);
    const [pullCordQty, setPullCordQty] = useState(1);
    const [addBedMat, setAddBedMat] = useState(false);
    const [addSmokeDetector, setAddSmokeDetector] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    // Scroll tracking refs
    const containerRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const pendantRef = useRef<HTMLDivElement>(null);
    const addonsRef = useRef<HTMLDivElement>(null);

    // Scroll-synced image changes
    useEffect(() => {
        const handleScroll = () => {
            if (isGalleryHovered) return; // Don't auto-switch if user is interacting

            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            // Get section positions
            const pendantTop = pendantRef.current?.offsetTop || 0;
            const addonsTop = addonsRef.current?.offsetTop || 0;

            // Determine which image to show based on scroll position
            if (scrollY > addonsTop - viewportHeight * 0.5) {
                setActiveImageIndex(4); // Wall button
            } else if (scrollY > pendantTop - viewportHeight * 0.5) {
                setActiveImageIndex(pendantType === "advanced" ? 3 : 2); // Pendant
            } else {
                setActiveImageIndex(0); // Hub
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isGalleryHovered, pendantType]);

    // Feature data (removed secure by design and 300m range)
    const features = [
        { id: "battery", icon: "🔋", label: "60hr Battery", description: "Uninterrupted protection during power outages." },
        { id: "sim", icon: "📶", label: "Dual-SIM 4G", description: "Roams across all major UK networks for 99.9% uptime." },
        { id: "check", icon: "✅", label: "Daily Check-In", description: "Simple 'I'm OK' button confirms resident wellbeing." },
        { id: "audio", icon: "🔊", label: "High-Fi Audio", description: "Crystal clear communication with monitoring staff." },
    ];

    // FAQ data
    const faqs = [
        {
            id: "resilient",
            question: "Is cellular connectivity resilient?",
            answer: "Yes. The hub uses dual roaming SIM cards with automatic failover across EE, Vodafone, Three, and O2."
        },
        {
            id: "range",
            question: "What is the pendant range?",
            answer: "300m+ in open air. The pendant confirms each alert was received with a visual flash."
        },
        {
            id: "housing",
            question: "Can it be used in housing associations?",
            answer: "Absolutely. Designed specifically for dispersed housing with daily check-ins."
        },
        {
            id: "install",
            question: "How long does installation take?",
            answer: "Our engineers complete installation in under 30 minutes per unit."
        },
    ];

    // Calculate Summary
    const getSummary = () => {
        let parts = ["Smart Hub"];
        if (pendantType === "standard") parts.push("Standard Pendant");
        if (pendantType === "advanced") parts.push("Smart Fall Detector");
        if (addPullCord) parts.push(`Wall Pull Cord ×${pullCordQty}`);
        if (addBedMat) parts.push("Bed Mat");
        if (addSmokeDetector) parts.push("Smoke Detector");
        return parts.join(" + ");
    };

    return (
        <main className={styles.main}>
            <div className={styles.container} ref={containerRef}>

                {/* Left Column: Full-Height Gallery */}
                <div
                    className={styles.galleryWrapper}
                    onMouseEnter={() => setIsGalleryHovered(true)}
                    onMouseLeave={() => setIsGalleryHovered(false)}
                >
                    {/* Main Image Display */}
                    <div className={styles.mainImageContainer}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeImageIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className={styles.mainImageWrapper}
                            >
                                <Image
                                    src={galleryImages[activeImageIndex].src}
                                    alt={galleryImages[activeImageIndex].label}
                                    fill
                                    className={styles.mainImage}
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Image Label */}
                        <motion.div
                            className={styles.imageLabel}
                            key={`label-${activeImageIndex}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {galleryImages[activeImageIndex].label}
                        </motion.div>
                    </div>

                    {/* Thumbnail Gallery */}
                    <div className={styles.thumbnailGallery}>
                        {galleryImages.map((img, index) => (
                            <motion.button
                                key={img.id}
                                className={`${styles.thumbnail} ${index === activeImageIndex ? styles.thumbnailActive : ""}`}
                                onClick={() => setActiveImageIndex(index)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Image
                                    src={img.src}
                                    alt={img.label}
                                    width={60}
                                    height={60}
                                    className={styles.thumbnailImage}
                                />
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Configurator */}
                <div className={styles.configuratorWrapper}>
                    <header className={styles.header}>
                        <span className={styles.newLabel}>New Generation</span>
                        <h1 className={styles.title}>The Smart Hub</h1>
                        <p className={styles.subtitle}>
                            Digital telecare for dispersed living. Seamlessly connected,
                            incredibly simple, and designed for 2027 compliance.
                        </p>
                    </header>

                    {/* Feature Row Cards */}
                    <div className={styles.featureRows} ref={featuresRef}>
                        {features.map((feature) => (
                            <motion.div
                                key={feature.id}
                                className={`${styles.featureRow} ${expandedFeature === feature.id ? styles.featureRowExpanded : ""}`}
                                onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                                layout
                            >
                                <div className={styles.featureRowHeader}>
                                    <span className={styles.chipIcon}>{feature.icon}</span>
                                    <span className={styles.chipLabel}>{feature.label}</span>
                                    <motion.span
                                        className={styles.expandIcon}
                                        animate={{ rotate: expandedFeature === feature.id ? 180 : 0 }}
                                    >
                                        ▼
                                    </motion.span>
                                </div>
                                <motion.div
                                    className={styles.featureRowContent}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{
                                        height: expandedFeature === feature.id ? "auto" : 0,
                                        opacity: expandedFeature === feature.id ? 1 : 0
                                    }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <p>{feature.description}</p>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>

                    {/* What's Included Section */}
                    <h3 className={styles.sectionTitle}>
                        What&apos;s Included
                        <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: "normal" }}>Base Package</span>
                    </h3>

                    <div className={`${styles.optionCard} ${styles.selected}`}>
                        <div className={styles.optionContent}>
                            <h4>CompliantCare Smart Hub</h4>
                            <p>Digital unit with dual-SIM connectivity and power adapter.</p>
                        </div>
                        <div className={styles.optionPrice}>
                            Included
                        </div>
                    </div>

                    {/* Pendant Selection */}
                    <h3 className={styles.sectionTitle} ref={pendantRef}>
                        Choose Your Pendant
                        <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: "normal" }}>Select One</span>
                    </h3>

                    <div
                        className={`${styles.optionCard} ${pendantType === "standard" ? styles.selected : ""}`}
                        onClick={() => setPendantType("standard")}
                    >
                        <div className={styles.optionContent}>
                            <h4>Standard Pendant</h4>
                            <p>Waterproof alarm button with 300m range.</p>
                        </div>
                        <div className={styles.optionPrice}>
                            {pendantType === "standard" ? "✓ Selected" : "Select"}
                            <span className={styles.priceSub}>Included</span>
                        </div>
                    </div>

                    <div
                        className={`${styles.optionCard} ${pendantType === "advanced" ? styles.selected : ""}`}
                        onClick={() => setPendantType("advanced")}
                    >
                        <div className={styles.optionContent}>
                            <h4>Smart Fall Detector</h4>
                            <p>Auto-triggers on impact. Waterproof with inactivity monitoring.</p>
                        </div>
                        <div className={styles.optionPrice}>
                            {pendantType === "advanced" ? "✓ Selected" : "Upgrade"}
                            <span className={styles.priceSub}>+£ per unit</span>
                        </div>
                    </div>

                    {/* Enhanced Protection Add-ons */}
                    <h3 className={styles.sectionTitle} ref={addonsRef}>Add Enhanced Protection</h3>

                    <div
                        className={`${styles.optionCard} ${addPullCord ? styles.selected : ""}`}
                        onClick={() => setAddPullCord(!addPullCord)}
                    >
                        <div className={styles.optionContent}>
                            <h4>Wall Pull Cord</h4>
                            <p>Wireless replacement for ceiling pull cords.</p>
                        </div>
                        <div className={styles.optionPrice}>
                            {addPullCord ? (
                                <div className={styles.qtySelector} onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => setPullCordQty(Math.max(1, pullCordQty - 1))}>−</button>
                                    <span>{pullCordQty}</span>
                                    <button onClick={() => setPullCordQty(pullCordQty + 1)}>+</button>
                                </div>
                            ) : "+ Add"}
                            <span className={styles.priceSub}>Optional</span>
                        </div>
                    </div>

                    <div
                        className={`${styles.optionCard} ${addBedMat ? styles.selected : ""}`}
                        onClick={() => setAddBedMat(!addBedMat)}
                    >
                        <div className={styles.optionContent}>
                            <h4>Occupancy Bed Mat</h4>
                            <p>Monitors bed presence and extended inactivity.</p>
                        </div>
                        <div className={styles.optionPrice}>
                            {addBedMat ? "Added" : "+ Add"}
                            <span className={styles.priceSub}>Optional</span>
                        </div>
                    </div>

                    <div
                        className={`${styles.optionCard} ${addSmokeDetector ? styles.selected : ""}`}
                        onClick={() => setAddSmokeDetector(!addSmokeDetector)}
                    >
                        <div className={styles.optionContent}>
                            <h4>Smoke Detector</h4>
                            <p>10-year battery. Interlinks with the Smart Hub.</p>
                        </div>
                        <div className={styles.optionPrice}>
                            {addSmokeDetector ? "Added" : "+ Add"}
                            <span className={styles.priceSub}>Optional</span>
                        </div>
                    </div>

                    {/* Technical Specs */}
                    <h3 className={styles.sectionTitle}>Technical Specifications</h3>
                    <div className={styles.specsList}>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>Connectivity</span>
                            <span className={styles.specValue}>Dual-SIM 4G with VoLTE</span>
                        </div>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>Battery Backup</span>
                            <span className={styles.specValue}>60+ Hours</span>
                        </div>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>Pendant Range</span>
                            <span className={styles.specValue}>300m+ (Open Air)</span>
                        </div>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>Waterproof Rating</span>
                            <span className={styles.specValue}>IP68 (Pendant)</span>
                        </div>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>Networks</span>
                            <span className={styles.specValue}>EE, Vodafone, Three, O2</span>
                        </div>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>Compliance</span>
                            <span className={styles.specValue}>GDPR, BS 8521, Secure by Design</span>
                        </div>
                    </div>

                    {/* Sticky Bottom Action Bar */}
                    <div className={styles.actionBar}>
                        <div className={styles.totalPrice}>
                            <span className={styles.totalLabel}>Your Configuration</span>
                            <span className={styles.totalAmount}>{getSummary()}</span>
                        </div>
                        <button className={styles.buyButton} onClick={() => setIsQuoteOpen(true)}>
                            Get a Quote
                        </button>
                    </div>

                </div>
            </div>

            {/* FAQ Section - Full Width Below */}
            <section className={styles.faqSection}>
                <div className={styles.faqContainer}>
                    <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
                    <div className={styles.faqList}>
                        {faqs.map((faq) => (
                            <motion.div
                                key={faq.id}
                                className={`${styles.faqItem} ${expandedFaq === faq.id ? styles.faqItemExpanded : ""}`}
                                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                layout
                            >
                                <div className={styles.faqQuestion}>
                                    <span>{faq.question}</span>
                                    <motion.span
                                        className={styles.expandIcon}
                                        animate={{ rotate: expandedFaq === faq.id ? 180 : 0 }}
                                    >
                                        ▼
                                    </motion.span>
                                </div>
                                <AnimatePresence>
                                    {expandedFaq === faq.id && (
                                        <motion.div
                                            className={styles.faqAnswer}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <p>{faq.answer}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quote Modal */}
            <QuoteModal
                isOpen={isQuoteOpen}
                onClose={() => setIsQuoteOpen(false)}
                productSummary={getSummary()}
            />
        </main>
    );
}
