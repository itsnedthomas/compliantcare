"use client";

import { motion } from "framer-motion";

const steps = [
    {
        title: "Programming",
        description: "Devices are pre-configured to your scheme and synced with the ARC before arrival.",
        icon: "⚙️"
    },
    {
        title: "Install & Demo",
        description: "Engineers install the hub and demonstrate it to the resident (approx 45 mins).",
        icon: "🔧"
    },
    {
        title: "Asset Register",
        description: "We capture serial numbers and locations, creating a perfect digital asset register.",
        icon: "📋"
    },
    {
        title: "Decommission",
        description: "Old analogue units are removed, data-wiped, and recycled via WEEE standards.",
        icon: "♻️"
    },
    {
        title: "Maintenance",
        description: "Ongoing remote monitoring of device health, battery status, and signal strength.",
        icon: "🛡️"
    }
];

export default function MigrationProcess() {
    return (
        <section style={{ padding: "80px 24px", background: "#f8fafc" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "60px" }}>
                    <span style={{ color: "#ef4444", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>End-to-End Service</span>
                    <h2 style={{ fontSize: "36px", fontWeight: "800", marginTop: "16px" }}>We Handle Everything</h2>
                    <p style={{ fontSize: "18px", color: "#64748b", marginTop: "16px", maxWidth: "700px", margin: "16px auto 0" }}>
                        From the moment we arrive on site, our team manages the entire technical and logistical process.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px", position: "relative" }}>
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            style={{
                                background: "white",
                                padding: "24px",
                                borderRadius: "16px",
                                border: "1px solid #e2e8f0",
                                textAlign: "center",
                                position: "relative",
                                zIndex: 2
                            }}
                        >
                            <div style={{
                                width: "64px",
                                height: "64px",
                                background: "#fff7ed",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "32px",
                                margin: "0 auto 24px"
                            }}>
                                {step.icon}
                            </div>
                            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>{step.title}</h3>
                            <p style={{ fontSize: "15px", color: "#64748b", lineHeight: "1.5" }}>{step.description}</p>

                            {/* Connector Line (Desktop Only) */}
                            {index !== steps.length - 1 && (
                                <div style={{
                                    position: "absolute",
                                    top: "56px",
                                    right: "-26px",
                                    width: "20px",
                                    height: "2px",
                                    background: "#e2e8f0",
                                    zIndex: 1,
                                    display: "none" // Hidden by default, could enable with media query in CSS module if moved there
                                }}></div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
