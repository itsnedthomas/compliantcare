"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import CountdownTimer from "./CountdownTimer";
import styles from "./Hero.module.css";

// Animation variants for staggered entrance
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut" as any,
        },
    },
};

const imageVariants = {
    hidden: { opacity: 0, x: 40 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.7,
            ease: "easeOut" as any,
            delay: 0.3,
        },
    },
};

// Trust logos for the marquee
const trustLogos = [
    { name: "G15", label: "G15 Housing" },
    { name: "G320", label: "G320 Members" },
    { name: "TSA", label: "TSA Certified" },
    { name: "TEC Quality", label: "TEC Quality" },
    { name: "NHS", label: "NHS Approved" },
    { name: "CQC", label: "CQC Compliant" },
];

export default function Hero() {
    return (
        <section className={styles.hero}>
            {/* Background Elements */}
            <div className={styles.bgGrid}></div>
            <div className={styles.bgGlowLeft}></div>
            <div className={styles.bgGlowRight}></div>

            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Left Column - Text */}
                    <motion.div
                        className={styles.textColumn}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Badge */}
                        <motion.div className={styles.topBadge} variants={itemVariants}>
                            <span className={styles.badgeIcon}>⚡</span>
                            <span>2027 Digital Switchover Compliance</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1 className={styles.headline} variants={itemVariants}>
                            Stop the 2027
                            <br />
                            <span className={styles.headlineAccent}>Liability Crisis</span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p className={styles.subheadline} variants={itemVariants}>
                            Ensure your telecare services are fully compliant ahead of the
                            UK&apos;s digital switchover deadline. Our wireless overlay solution
                            remediates your entire portfolio in 48 hours.
                        </motion.p>

                        {/* Countdown Timer */}
                        <motion.div className={styles.countdown} variants={itemVariants}>
                            <CountdownTimer variant="light" showLabel={true} />
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div className={styles.ctas} variants={itemVariants}>
                            <Link href="/contact" className={styles.primaryCta}>
                                Free Signal Audit
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M3 8H13M13 8L9 4M13 8L9 12"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Link>
                            <Link href="/resources/2027-guide" className={styles.secondaryCta}>
                                Learn About The Switchover
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right Column - Image/Video */}
                    <motion.div
                        className={styles.imageColumn}
                        variants={imageVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className={styles.imageContainer}>
                            <Image
                                src="/hero-image.png"
                                alt="Care worker providing support to elderly woman wearing telecare pendant"
                                width={600}
                                height={500}
                                className={styles.heroImage}
                                priority
                            />
                            {/* Floating Badge */}
                            <div className={styles.badge}>
                                <span className={styles.floatingBadgeIcon}>✓</span>
                                <span className={styles.badgeText}>
                                    <strong>100%</strong> Compliance Guaranteed
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Logo Marquee */}
                <motion.div
                    className={styles.logoMarquee}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <span className={styles.marqueeLabel}>Trusted by UK Housing Associations</span>
                    <div className={styles.marqueeTrack}>
                        <div className={styles.marqueeInner}>
                            {/* Double the logos for seamless loop */}
                            {[...trustLogos, ...trustLogos].map((logo, index) => (
                                <div key={index} className={styles.logoItem}>
                                    <span className={styles.logoName}>{logo.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
