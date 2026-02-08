"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const timelineEvents = [
    {
        year: "2023",
        title: "Stop Sell (National)",
        desc: "BT stops selling new analogue lines across the UK. You can only buy digital.",
        details: "The 'Stop Sell' came into full force in September 2023. This means no new analogue PSTN lines can be ordered. Housing associations building new schemes must install digital-first telecare.",
        impact: "New builds affected immediately."
    },
    {
        year: "2024",
        title: "Testing Phase",
        desc: "Housing associations urged to start testing telecare kit on digital lines.",
        details: "With the network transition underway, existing analogue alarms are starting to fail more frequently due to voltage drops and packet loss on digital lines. Testing your current estate is critical.",
        impact: "Failure rates on analogue calls rising."
    },
    {
        year: "2025",
        title: "Forced Migration",
        desc: "Mass migration of residential lines begins. Vulnerable users at risk if not upgraded.",
        details: "Communication Providers (CPs) like Virgin Media O2 and BT Consumer are aggressively migrating customers to digital voice services. This is happening region by region. Residents may be switched over without realized their alarm will stop working.",
        impact: "High risk of service failure for dispersed units."
    },
    {
        year: "2027",
        title: "The Switch Off",
        desc: "The PSTN network is permanently powered down. Analogue alarms will cease to function.",
        details: "The absolute deadline. The copper network will be deactivated. Any device relying on analogue tones (DTMF) will become functionally obsolete.",
        impact: "Critical Life Safety Risk."
    }
];

export default function InteractiveTimeline() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    return (
        <section style={{ padding: "100px 0", maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontSize: "48px", fontWeight: "800", marginBottom: "80px", color: "#0f172a" }}>The Countdown</h2>

            <div style={{ position: "relative", paddingLeft: "50px" }}>
                {/* Central Line */}
                <div style={{ position: "absolute", left: "19px", top: "0", bottom: "0", width: "2px", background: "#e2e8f0" }}></div>

                {timelineEvents.map((event, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        style={{ marginBottom: "60px", position: "relative" }}
                    >
                        {/* Dot */}
                        <button
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            style={{
                                position: "absolute",
                                left: "-41px",
                                top: "0",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: index === timelineEvents.length - 1 ? "#ef4444" : "#f97316",
                                border: "4px solid white",
                                boxShadow: `0 0 0 2px ${expandedIndex === index ? (index === timelineEvents.length - 1 ? "#ef4444" : "#f97316") : "#e2e8f0"}`,
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                zIndex: 10
                            }}
                            aria-label={`Expand details for ${event.year}`}
                        />

                        <div
                            style={{ cursor: "pointer" }}
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <span style={{
                                fontSize: "14px",
                                fontWeight: "700",
                                color: index === timelineEvents.length - 1 ? "#ef4444" : "#f97316",
                                marginBottom: "8px",
                                display: "block",
                                letterSpacing: "0.1em"
                            }}>
                                {event.year}
                            </span>

                            <h3 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "12px", color: "#1e293b" }}>{event.title}</h3>
                            <p style={{ fontSize: "18px", color: "#64748b", lineHeight: "1.6" }}>{event.desc}</p>
                        </div>

                        <AnimatePresence>
                            {expandedIndex === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <div style={{
                                        marginTop: "24px",
                                        padding: "24px",
                                        background: "#f8fafc",
                                        borderRadius: "16px",
                                        border: "1px solid #e2e8f0"
                                    }}>
                                        <p style={{ fontSize: "16px", color: "#334155", lineHeight: "1.6", marginBottom: "16px" }}>
                                            {event.details}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#dc2626" }}>IMPACT:</span>
                                            <span style={{ fontSize: "14px", color: "#475569" }}>{event.impact}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
