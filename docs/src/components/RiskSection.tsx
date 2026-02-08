"use client";

import { motion } from "framer-motion";
import styles from "./RiskSection.module.css";
import Link from "next/link";

const risks = [
    {
        title: "Connection Failures",
        description: "Analogue protocols (DTMF) distort on digital lines. Alarm calls will simply fail to connect to the ARC.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.5 10.5L7.5 7.5m6 6l3 3m-3-3l-3-3m3 3l3 3" />
            </svg>
        ) // Disconnected/Strike-through phone or signal
    },
    {
        title: "No Power, No Service",
        description: "Digital lines require mains power. In a blackout, your residents have zero way to call for help.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457L3 3m5.457 5.457l7.086 7.086m0 0L21 21" />
            </svg>
        ) // Struck-through bolt
    },
    {
        title: "Legal Liability",
        description: "Housing providers are legally responsible for ensuring life-safety equipment is functional appropriately.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        ) // Warning triangle
    },
    {
        title: "Unlimited Fines",
        description: "Corporate manslaughter charges and unlimited fines apply if negligence leads to a resident death.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ) // Currency/Pound sign
    }
];

export default function RiskSection() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.eyebrow}>The Reality of Inaction</span>
                    <h2 className={styles.title}>The Copper Network is Being Cut. <br /><span style={{ color: "#ef4444" }}>Your Alarms Will Fail.</span></h2>
                    <p className={styles.subtitle}>
                        This isn't a future problem. It's happening now. Without a digital upgrade, your residents are left vulnerable and your organisation exposed.
                    </p>
                </div>

                <div className={styles.grid}>
                    {risks.map((risk, index) => (
                        <motion.div
                            key={index}
                            className={styles.card}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className={styles.iconWrapper}>
                                {risk.icon}
                            </div>
                            <h3 className={styles.cardTitle}>{risk.title}</h3>
                            <p className={styles.cardDescription}>{risk.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Solution Callout */}
                <motion.div
                    className={styles.solutionCallout}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <div className={styles.calloutInner}>
                        <div className={styles.calloutText}>
                            <h3>There are only two ways to fix this.</h3>
                            <p>You can rewire your entire building (Manual Construction) OR install a Wireless Overlay.</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <Link href="#comparison" style={{
                                background: "var(--color-primary)",
                                color: "white",
                                padding: "12px 24px",
                                borderRadius: "8px",
                                fontWeight: "600",
                                textDecoration: "none"
                            }}>
                                Compare Options
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
