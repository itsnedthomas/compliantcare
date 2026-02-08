"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import CountdownTimer from "./CountdownTimer";
import styles from "./CTA.module.css";

export default function CTA() {
    return (
        <section className={styles.cta}>
            <div className={styles.container}>
                <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={styles.countdownWrapper}>
                        <CountdownTimer variant="dark" showLabel={true} />
                    </div>

                    <h2 className={styles.title}>
                        Don&apos;t Wait Until January 2027
                    </h2>
                    <p className={styles.subtitle}>
                        Book your free Volumetric Signal Audit today. We&apos;ll assess your entire
                        portfolio and show you exactly how to achieve 100% compliance.
                    </p>

                    <div className={styles.form}>
                        <Link href="/contact" className={styles.button}>
                            Get Your Free Signal Audit
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M4 10H16M16 10L11 5M16 10L11 15"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </Link>
                    </div>

                    <p className={styles.disclaimer}>
                        No obligation. No sales pressure. Just actionable insights for your portfolio.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
