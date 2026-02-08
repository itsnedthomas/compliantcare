"use client";

import { motion } from "framer-motion";
import styles from "./Stats.module.css";

const stats = [
    {
        value: "21.85%",
        label: "Telecare Failure Rate",
        description: "Average failure rate for analogue systems on digital lines",
        highlight: true,
    },
    {
        value: "48hrs",
        label: "Full Remediation",
        description: "Time to deploy wireless overlay across your entire portfolio",
        highlight: false,
    },
    {
        value: "99.9%",
        label: "Success Rate",
        description: "Call completion rate with our native IP solution",
        highlight: false,
    },
    {
        value: "£0",
        label: "Construction Costs",
        description: "No rewiring, no disruption, no contractor delays",
        highlight: false,
    },
];

export default function Stats() {
    return (
        <section className={styles.stats}>
            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className={styles.eyebrow}>The Problem</span>
                    <h2 className={styles.title}>
                        Your Telecare Is Already Failing
                    </h2>
                    <p className={styles.subtitle}>
                        The digital switchover isn&apos;t coming – it&apos;s already here. Analogue
                        telecare systems are failing on digital lines, putting residents at risk.
                    </p>
                </motion.div>

                <div className={styles.grid}>
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className={`${styles.card} ${stat.highlight ? styles.cardHighlight : ""}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <span className={styles.value}>{stat.value}</span>
                            <span className={styles.label}>{stat.label}</span>
                            <span className={styles.description}>{stat.description}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
