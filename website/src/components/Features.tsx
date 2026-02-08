"use client";

import { motion } from "framer-motion";
import styles from "./Features.module.css";

const features = [
    {
        icon: "⚡",
        title: "48-Hour Remediation",
        description:
            "Deploy wireless overlay systems across your entire portfolio in just 48 hours. No rewiring, no construction, no delays.",
    },
    {
        icon: "📡",
        title: "Native IP Technology",
        description:
            "CompliantCare Smart Hub units connect directly to 4G networks, bypassing unreliable analogue-to-digital conversion entirely.",
    },
    {
        icon: "🔒",
        title: "Compliance Guaranteed",
        description:
            "Meet Building Safety Act 2022 and Awaab's Law requirements with full life-safety compliance documentation.",
    },
    {
        icon: "👵",
        title: "Automated Check-Ins",
        description:
            "Daily automated 'I'm OK' presses give families peace of mind and reduce unnecessary wellbeing calls.",
    },
    {
        icon: "📊",
        title: "Real-Time Monitoring",
        description:
            "Track signal status, battery levels, and call completion rates across your entire portfolio in one dashboard.",
    },
    {
        icon: "💷",
        title: "Cost-Effective",
        description:
            "90% cheaper than hardwired rewiring. No contractor fees, no tenant displacement, no extended project timelines.",
    },
];

export default function Features() {
    return (
        <section className={styles.features}>
            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className={styles.eyebrow}>The Solution</span>
                    <h2 className={styles.title}>
                        Wireless Overlay That Actually Works
                    </h2>
                    <p className={styles.subtitle}>
                        CompliantCare&apos;s wireless solution addresses every pain point of the
                        digital switchover – from speed to cost to compliance.
                    </p>
                </motion.div>

                <div className={styles.grid}>
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            className={styles.card}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <span className={styles.icon}>{feature.icon}</span>
                            <h3 className={styles.cardTitle}>{feature.title}</h3>
                            <p className={styles.cardDescription}>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
