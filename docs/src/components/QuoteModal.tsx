"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import styles from "@/app/about/technology/ProductPage.module.css";

interface QuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    productSummary: string;
}

const countryCodes = [
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+1", country: "US", flag: "🇺🇸" },
    { code: "+353", country: "IE", flag: "🇮🇪" },
    { code: "+33", country: "FR", flag: "🇫🇷" },
    { code: "+49", country: "DE", flag: "🇩🇪" },
];

export default function QuoteModal({ isOpen, onClose, productSummary }: QuoteModalProps) {
    const [submitted, setSubmitted] = useState(false);
    const [countryCode, setCountryCode] = useState("+44");
    const [unitCount, setUnitCount] = useState(50);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTimeout(() => {
            setSubmitted(true);
        }, 1000);
    };

    const selectedCountry = countryCodes.find(c => c.code === countryCode);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.modalOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modalContent}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: "560px", width: "90vw" }}
                    >
                        <button className={styles.closeButton} onClick={onClose}>
                            ✕
                        </button>

                        {!submitted ? (
                            <>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "8px" }}>Get a Quote</h3>
                                <p style={{ color: "#64748b", marginBottom: "20px", lineHeight: "1.5", fontSize: "0.9rem" }}>
                                    You&apos;re inquiring about: <strong style={{ color: "#0f172a" }}>{productSummary}</strong>
                                </p>

                                <form onSubmit={handleSubmit}>
                                    {/* Name + Email Row */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Name</label>
                                            <input type="text" className={styles.formInput} placeholder="Jane Doe" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Email</label>
                                            <input type="email" className={styles.formInput} placeholder="jane@example.com" required />
                                        </div>
                                    </div>

                                    {/* Company Name */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Company Name</label>
                                        <input type="text" className={styles.formInput} placeholder="Housing Association Ltd" required />
                                    </div>

                                    {/* Phone with Country Code */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Phone Number</label>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <div style={{
                                                position: "relative",
                                                display: "flex",
                                                alignItems: "center",
                                                background: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "12px",
                                                padding: "0 12px",
                                                minWidth: "100px"
                                            }}>
                                                <span style={{ fontSize: "1.25rem", marginRight: "4px" }}>{selectedCountry?.flag}</span>
                                                <select
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                    style={{
                                                        border: "none",
                                                        background: "transparent",
                                                        fontSize: "0.875rem",
                                                        fontWeight: "500",
                                                        color: "#0f172a",
                                                        cursor: "pointer",
                                                        outline: "none",
                                                        padding: "12px 0"
                                                    }}
                                                >
                                                    {countryCodes.map((c) => (
                                                        <option key={c.code} value={c.code}>
                                                            {c.code}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <input
                                                type="tel"
                                                className={styles.formInput}
                                                placeholder="7700 900000"
                                                style={{ flex: 1 }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Unit Count Slider */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            Number of Units Required
                                            <span style={{
                                                background: "#f97316",
                                                color: "white",
                                                padding: "2px 10px",
                                                borderRadius: "20px",
                                                fontSize: "0.875rem",
                                                fontWeight: "600"
                                            }}>
                                                {unitCount >= 500 ? "500+" : unitCount}
                                            </span>
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="500"
                                            value={unitCount}
                                            onChange={(e) => setUnitCount(Number(e.target.value))}
                                            style={{
                                                width: "100%",
                                                height: "8px",
                                                borderRadius: "4px",
                                                background: `linear-gradient(to right, #f97316 0%, #f97316 ${(unitCount / 500) * 100}%, #e2e8f0 ${(unitCount / 500) * 100}%, #e2e8f0 100%)`,
                                                appearance: "none",
                                                cursor: "pointer",
                                                marginTop: "8px"
                                            }}
                                        />
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                                            <span>1</span>
                                            <span>500+</span>
                                        </div>
                                    </div>

                                    {/* Additional Details */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Additional Details</label>
                                        <textarea
                                            className={styles.formInput}
                                            placeholder="Tell us more about your requirements..."
                                            rows={2}
                                            style={{
                                                resize: "vertical",
                                                minHeight: "60px",
                                                fontFamily: "inherit",
                                                fontSize: "0.9rem"
                                            }}
                                        />
                                    </div>

                                    <button type="submit" className={styles.submitButton}>
                                        Request Pricing
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "40px 0" }}>
                                <div style={{ width: "64px", height: "64px", background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 24px" }}>
                                    ✓
                                </div>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "12px" }}>Request Sent!</h3>
                                <p style={{ color: "#64748b" }}>We&apos;ll get back to you within 24 hours with a detailed quote.</p>
                                <button
                                    onClick={onClose}
                                    style={{ marginTop: "32px", background: "#f1f5f9", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", color: "#475569" }}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
