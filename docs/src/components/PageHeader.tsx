"use client";

import { motion } from "framer-motion";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
    title: string;
    subtitle: string;
    label?: string;
}

export default function PageHeader({ title, subtitle, label }: PageHeaderProps) {
    return (
        <section className={styles.header}>
            <div className={styles.bgGrid}></div>
            <div className={styles.bgGlow}></div>

            <div className={styles.container}>
                {label && (
                    <motion.div
                        className={styles.badge}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {label}
                    </motion.div>
                )}

                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {title}
                </motion.h1>

                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {subtitle}
                </motion.p>
            </div>
        </section>
    );
}
