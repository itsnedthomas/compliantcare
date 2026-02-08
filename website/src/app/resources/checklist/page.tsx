"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import CTA from "@/components/CTA";
import styles from "@/components/ContentBlock.module.css"; // Reuse general layout styles

export default function ChecklistPage() {
    // Simple state for the interactive checklist
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    const checklistItems = [
        "Have you audited your entire portfolio for analogue devices?",
        "Do you know exactly how many grouped living schemes you manage?",
        "Have you tested your current alarms on digital lines?",
        "Do you have a budget allocated for digital upgrades?",
        "Have you communicated the changes to your residents?",
        "Have you identified vulnerable residents who need priority upgrades?",
        "Is your connectivity provider ready for roaming SIMs?",
        "Have you updated your fire risk assessments for digital?"
    ];

    const toggleItem = (index: number) => {
        setCheckedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const progress = Math.round((Object.values(checkedItems).filter(Boolean).length / checklistItems.length) * 100);

    return (
        <>
            <PageHeader
                title="Compliance Checklist"
                subtitle="Are you ready for the switchover? Use this interactive tool to assess your readiness."
                label="Self Assessment"
            />

            <section className={styles.section}>
                <div className={styles.container} style={{ display: "block", maxWidth: "800px" }}>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: "40px", padding: "24px", background: "#f8f9fa", borderRadius: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "600" }}>
                            <span>Your Readiness</span>
                            <span>{progress}%</span>
                        </div>
                        <div style={{ width: "100%", height: "12px", background: "#e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                                style={{ height: "100%", background: "var(--color-primary)" }}
                            />
                        </div>
                        <p style={{ marginTop: "12px", fontSize: "14px", color: "#666" }}>
                            {progress === 100 ? "Great job! You seem well prepared." : "Keep going! You still have critical steps to complete."}
                        </p>
                    </div>

                    {/* Checklist */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {checklistItems.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => toggleItem(index)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    padding: "20px",
                                    background: checkedItems[index] ? "#fff7ed" : "#fff",
                                    border: checkedItems[index] ? "1px solid var(--color-primary)" : "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <div style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "6px",
                                    border: checkedItems[index] ? "none" : "2px solid #d1d5db",
                                    background: checkedItems[index] ? "var(--color-primary)" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    flexShrink: 0
                                }}>
                                    {checkedItems[index] && <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M1 7L5 11L13 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                <span style={{
                                    fontSize: "18px",
                                    fontWeight: "500",
                                    color: checkedItems[index] ? "var(--color-gray-900)" : "var(--color-gray-600)",
                                    textDecoration: checkedItems[index] ? "line-through" : "none"
                                }}>
                                    {item}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                </div>

                {/* Score-based CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        marginTop: "60px",
                        padding: "32px",
                        background: progress === 100 ? "#ecfdf5" : "#fff7ed",
                        border: progress === 100 ? "1px solid #10b981" : "1px solid #f97316",
                        borderRadius: "16px",
                        textAlign: "center"
                    }}
                >
                    <h3 style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: progress === 100 ? "#047857" : "#c2410c",
                        marginBottom: "12px"
                    }}>
                        {progress === 100 ? "You are 100% Ready!" : `You are missing ${100 - progress}% of the key steps`}
                    </h3>

                    <p style={{
                        fontSize: "18px",
                        color: "#4b5563",
                        maxWidth: "600px",
                        margin: "0 auto 24px auto"
                    }}>
                        {progress === 100
                            ? "Your portfolio appears to be fully compliant. However, it's always good to double-check with a professional audit."
                            : "Don't leave compliance to chance. Our team can help you close these gaps in just 48 hours."
                        }
                    </p>

                    <a
                        href="/contact"
                        style={{
                            display: "inline-block",
                            padding: "16px 32px",
                            background: progress === 100 ? "#10b981" : "#f97316",
                            color: "white",
                            fontWeight: "600",
                            borderRadius: "99px",
                            textDecoration: "none",
                            transition: "transform 0.2s allow-discrete"
                        }}
                    >
                        {progress === 100 ? "Book a Verification Audit" : "Book Your Free Gap Analysis"}
                    </a>
                </motion.div>
            </section>

            <CTA />
        </>
    );
}
