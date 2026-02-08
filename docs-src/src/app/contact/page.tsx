"use client";

import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import styles from "@/components/ContentBlock.module.css"; // Reuse general layout styles

export default function ContactPage() {
    return (
        <>
            <PageHeader
                title="Get in touch"
                subtitle="Ready to discuss your digital switchover strategy? Our team is here to help."
                label="Contact Us"
            />

            <section className={styles.section}>
                <div className={styles.container} style={{ alignItems: "flex-start" }}>

                    {/* Contact Info Column */}
                    <div className={styles.content}>
                        <span className={styles.eyebrow}>Contact Info</span>
                        <h2 className={styles.title} style={{ fontSize: "2rem" }}>We'd love to hear from you</h2>
                        <p className={styles.description}>
                            Whether you need a full portfolio audit or just have a question about compliance, our team of housing technology experts is ready to assist.
                        </p>

                        <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                                    📧
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: "600", color: "#111827", margin: 0 }}>Email</h3>
                                    <p style={{ margin: 0, color: "#6b7280" }}>hello@compliantcare.co.uk</p>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                                    📱
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: "600", color: "#111827", margin: 0 }}>Phone</h3>
                                    <p style={{ margin: 0, color: "#6b7280" }}>0800 123 4567</p>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                                    📍
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: "600", color: "#111827", margin: 0 }}>Office</h3>
                                    <p style={{ margin: 0, color: "#6b7280" }}>123 Tech Hub, London, EC1A 1BB</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form Column */}
                    <motion.div
                        className={styles.imageWrapper}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{ padding: "40px", background: "#fff", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", aspectRatio: "auto" }}
                    >
                        <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label htmlFor="name" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>Name</label>
                                <input type="text" id="name" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }} placeholder="John Doe" />
                            </div>

                            <div>
                                <label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>Work Email</label>
                                <input type="email" id="email" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }} placeholder="john@housing.org.uk" />
                            </div>

                            <div>
                                <label htmlFor="org" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>Housing Association</label>
                                <input type="text" id="org" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px" }} placeholder="Organization Name" />
                            </div>

                            <div>
                                <label htmlFor="message" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>Message</label>
                                <textarea id="message" rows={4} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px", fontFamily: "inherit" }} placeholder="How can we help?"></textarea>
                            </div>

                            <button type="submit" style={{
                                marginTop: "8px",
                                width: "100%",
                                padding: "14px",
                                background: "#EA580C",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "background 0.2s"
                            }}>
                                Send Message
                            </button>
                        </form>
                    </motion.div>

                </div>
            </section>
        </>
    );
}
