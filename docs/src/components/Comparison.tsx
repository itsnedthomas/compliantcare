"use client";

import { motion } from "framer-motion";
import styles from "./Comparison.module.css";

const comparisonData = [
    {
        feature: "Time to Deploy (30-flat court)",
        competitor: "4-6 Weeks",
        us: "2 Days",
        highlight: true
    },
    {
        feature: "Resident Disruption",
        competitor: "High (Drilling, Dust, Noise)",
        us: "Zero (No structural work)",
        highlight: true
    },
    {
        feature: "Decor Damage",
        competitor: "Significant (Requires redecorating)",
        us: "None (Wireless overlay)",
        highlight: true
    },
    {
        feature: "Cost Per Scheme",
        competitor: "££££ (High labour + materials)",
        us: "£ (Low hardware + install)",
        highlight: true
    },
    {
        feature: "2025 Digital Ready",
        competitor: "Yes (Eventually)",
        us: "Yes (Immediately)",
        highlight: false
    },
    {
        feature: "Future Flexibility",
        competitor: "Low (Hardwired fixed points)",
        us: "High (Moveable devices)",
        highlight: true
    }
];

export default function Comparison() {
    return (
        <section id="comparison" className={styles.comparison}>
            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className={styles.eyebrow}>The Choice is Clear</span>
                    <h2 className={styles.title}>Why rip out walls when you can simply overlay?</h2>
                    <p className={styles.subtitle}>
                        Compare the traditional hardwired approach with our modern wireless solution.
                    </p>
                </motion.div>

                <motion.div
                    className={styles.tableWrapper}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th className={styles.ataHeader}>
                                    <span className={styles.headerBadge}>🏗️</span>
                                    Traditional Rewiring<br />
                                    <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>(Manual Construction)</span>
                                </th>
                                <th className={styles.wirelessHeader}>
                                    <span className={styles.headerBadge}>✨</span>
                                    CompliantCare<br />
                                    <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>(Wireless Overlay)</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonData.map((row, index) => (
                                <tr key={row.feature} className={row.highlight ? styles.highlightRow : ""}>
                                    <td className={styles.featureCell}>{row.feature}</td>
                                    <td className={styles.ataCell}>{row.competitor}</td>
                                    <td className={styles.wirelessCell}>
                                        <span className={styles.checkmark}>✓</span>
                                        {row.us}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>
        </section>
    );
}
