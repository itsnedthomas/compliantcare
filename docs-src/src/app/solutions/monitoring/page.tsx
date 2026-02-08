"use client";

import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import CTA from "@/components/CTA";
import styles from "./Monitoring.module.css";
import Image from "next/image";

export default function MonitoringPage() {
    return (
        <>
            <PageHeader
                title="Monitoring Services"
                subtitle="TSA-accredited 24/7 monitoring and alarm response services."
                label="24/7 Protection"
            />

            {/* Software Visualization Section */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.softwareGrid}>
                        <div className={styles.softwareContent}>
                            <h2>Intelligent Cloud Platform</h2>
                            <p>
                                Our ARC software isn't just a call handling system; it's a proactive analytics engine.
                                It actively monitors device health (heartbeats), tracks battery levels, and ensures instant
                                connection during an emergency.
                            </p>
                            <ul className={styles.featureList}>
                                {[
                                    "Real-time device heartbeat monitoring",
                                    "Instant access to resident medical profiles",
                                    "Integration with Jontek & UMO platforms",
                                    "Automated daily 'I'm OK' checks"
                                ].map((item, i) => (
                                    <li key={i}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Mock Software UI */}
                        <motion.div
                            className={styles.softwareVisual}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div style={{ padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                                    <span style={{ fontWeight: "700", color: "#1e293b" }}>Resident Alert: High Priority</span>
                                    <span style={{ background: "#fecaca", color: "#b91c1c", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>EMERGENCY</span>
                                </div>
                                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", marginBottom: "12px", width: "100%" }}></div>
                                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", marginBottom: "12px", width: "70%" }}></div>
                                <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                                    <div style={{ flex: 1, height: "40px", background: "#0f172a", borderRadius: "6px" }}></div>
                                    <div style={{ flex: 1, height: "40px", background: "#e2e8f0", borderRadius: "6px" }}></div>
                                </div>
                            </div>

                            <div style={{ padding: "20px", background: "rgba(255,255,255,0.6)", borderRadius: "12px", marginTop: "auto" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>System Status</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }}></div>
                                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>All Systems Operational</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Premium Fall Detector Upsell */}
            <section className={styles.altSection}>
                <div className={styles.container}>
                    <div className={styles.upsellHeader}>
                        <h2>Enhanced Safety (Optional)</h2>
                        <p>For high-risk residents, upgrade to our intelligent Fall Detectors.</p>
                    </div>

                    <motion.div
                        className={styles.upsellCard}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ width: "80px", height: "80px", background: "#334155", borderRadius: "50%", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {/* Placeholder for Pendant Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="3"></circle>
                                <line x1="12" y1="2" x2="12" y2="4"></line>
                            </svg>
                        </div>
                        <h3 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px", color: "white" }}>Smart Fall Detector</h3>
                        <p style={{ color: "#cbd5e1", marginBottom: "24px" }}>
                            Automatically triggers an alarm if a heavy fall is detected, even if the resident cannot press the button themselves.
                        </p>

                        <div style={{ padding: "12px 20px", background: "rgba(255,255,255,0.1)", borderRadius: "8px", display: "inline-block" }}>
                            <span style={{ color: "#fbbf24", fontWeight: "700" }}>+ £2.50 / week</span>
                            <span style={{ color: "#94a3b8", fontSize: "0.9em", marginLeft: "8px" }}>(Add-on)</span>
                        </div>

                        <div className={styles.upsellFeatures}>
                            <span className={styles.upsellFeature}>Auto-Trigger</span>
                            <span className={styles.upsellFeature}>Vibration Feedback</span>
                            <span className={styles.upsellFeature}>Waterproof (IP67)</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            <CTA />
        </>
    );
}
