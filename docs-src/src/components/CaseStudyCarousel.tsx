"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const caseStudies = [
    {
        id: 1,
        client: "G15 Housing Association",
        title: "Winter Crisis Averted",
        role: "Asset Director",
        image: "/hero-image.png", // specific profile image
        description: "Faced with failing analogue lines in 45 schemes just before winter, this G15 member partnered with CompliantCare for a rapid rollout.",
        details: "We deployed 12 engineers across London, completing the entire project in 6 weeks. The net result was zero effective downtime for residents and a 40% cost saving compared to their original hardwired quote.",
        metrics: {
            roomsReplaced: "1,250",
            timeTaken: "6 Weeks",
            satisfaction: "98%",
            rating: 5
        },
        color: "#f97316"
    },
    {
        id: 2,
        client: "Northern Trust",
        title: "Rural Connectivity Solved",
        role: "Head of Housing",
        image: "/hero-image.png",
        description: "Dispersed rural properties were suffering from 'blackspot' connectivity issues with their simplified digital units.",
        details: "By upgrading to the CompliantCare Smart Hub with Roaming World SIMs, we achieved 99.9% uptime. The devices automatically switch between networks to find the best signal, solving a major headache for the asset management team.",
        metrics: {
            roomsReplaced: "450",
            timeTaken: "3 Months",
            satisfaction: "100%",
            rating: 5
        },
        color: "#10b981"
    },
    {
        id: 3,
        client: "Coastal Living",
        title: "Proactive Wellbeing",
        role: "Supported Housing Manager",
        image: "/hero-image.png",
        description: "Moving from reactive alarm handling to proactive wellbeing monitoring was a key strategic goal for Coastal Living.",
        details: "We implemented the 'I'm OK' feature. Residents press a button each morning to confirm they are well. This simple change saved wardens 2 hours per day of door-knocking, allowing them to focus on residents who actually needed help.",
        metrics: {
            roomsReplaced: "300",
            timeTaken: "4 Weeks",
            satisfaction: "95%",
            rating: 5
        },
        color: "#3b82f6"
    }
];

export default function CaseStudyCarousel() {
    const [activeId, setActiveId] = useState(1);
    const [metricsOpen, setMetricsOpen] = useState(false);
    const activeStudy = caseStudies.find(c => c.id === activeId) || caseStudies[0];

    return (
        <section style={{ padding: "100px 0", background: "#f8fafc" }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px" }}>

                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h2 style={{ fontSize: "36px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Success Stories</h2>
                    <p style={{ fontSize: "18px", color: "#64748b" }}>See how we help housing providers achieve compliance.</p>
                </div>

                {/* Profile Selection */}
                <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "60px", flexWrap: "wrap" }}>
                    {caseStudies.map((study) => (
                        <button
                            key={study.id}
                            onClick={() => { setActiveId(study.id); setMetricsOpen(false); }}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "12px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                opacity: activeId === study.id ? 1 : 0.6,
                                transform: activeId === study.id ? "scale(1.05)" : "scale(1)",
                                transition: "all 0.3s ease"
                            }}
                        >
                            <div style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: `3px solid ${activeId === study.id ? study.color : "transparent"}`,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}>
                                <div style={{ width: "100%", height: "100%", background: "#ddd" }}>
                                    {/* Placeholder Image */}
                                    <div style={{ width: "100%", height: "100%", background: study.color, opacity: 0.3 }} />
                                </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#334155" }}>{study.client}</span>
                                <span style={{ display: "block", fontSize: "12px", color: "#64748b" }}>{study.role}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Active Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            background: "#fff",
                            borderRadius: "24px",
                            padding: "40px",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                            position: "relative",
                            overflow: "hidden"
                        }}
                    >
                        {/* Decorative Top Border */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: activeStudy.color }} />

                        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
                            <span style={{
                                display: "inline-block",
                                padding: "6px 16px",
                                borderRadius: "99px",
                                background: `${activeStudy.color}20`,
                                color: activeStudy.color,
                                fontSize: "14px",
                                fontWeight: "700",
                                marginBottom: "24px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}>
                                {activeStudy.title}
                            </span>

                            <h3 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginBottom: "24px", lineHeight: "1.3" }}>
                                "{activeStudy.description}"
                            </h3>

                            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.7", marginBottom: "40px" }}>
                                {activeStudy.details}
                            </p>

                            {/* Dropdown for Metrics */}
                            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
                                <button
                                    onClick={() => setMetricsOpen(!metricsOpen)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        width: "100%",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#64748b"
                                    }}
                                >
                                    {metricsOpen ? "Hide Metrics" : "View Project Metrics"}
                                    <motion.span
                                        animate={{ rotate: metricsOpen ? 180 : 0 }}
                                        style={{ display: "inline-block" }}
                                    >
                                        ▼
                                    </motion.span>
                                </button>

                                <AnimatePresence>
                                    {metricsOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(4, 1fr)",
                                                gap: "20px",
                                                paddingTop: "24px",
                                                textAlign: "center"
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: "24px", fontWeight: "700", color: activeStudy.color }}>{activeStudy.metrics.roomsReplaced}</div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginTop: "4px" }}>PROPERTIES</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "24px", fontWeight: "700", color: activeStudy.color }}>{activeStudy.metrics.timeTaken}</div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginTop: "4px" }}>DURATION</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "24px", fontWeight: "700", color: activeStudy.color }}>{activeStudy.metrics.satisfaction}</div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginTop: "4px" }}>SATISFACTION</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "24px", color: "#fbbf24" }}>
                                                        {"★".repeat(activeStudy.metrics.rating)}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginTop: "4px" }}>RATING</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
