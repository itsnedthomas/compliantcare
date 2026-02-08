"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./ContentBlock.module.css";

interface ContentBlockProps {
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    imagePosition?: "left" | "right";
    eyebrow?: string;
    features?: string[];
    bgAlt?: boolean;
}

export default function ContentBlock({
    title,
    description,
    imageSrc,
    imageAlt,
    imagePosition = "right",
    eyebrow,
    features,
    bgAlt = false,
}: ContentBlockProps) {
    return (
        <section className={`${styles.section} ${bgAlt ? styles.sectionAlt : ""}`}>
            <div className={`${styles.container} ${imagePosition === "left" ? styles.imageLeft : ""}`}>
                <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
                    <h2 className={styles.title}>{title}</h2>
                    <div className={styles.description}>{description}</div>

                    {features && (
                        <ul className={styles.list}>
                            {features.map((feature, index) => (
                                <li key={index} className={styles.listItem}>
                                    <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>

                <motion.div
                    className={styles.imageWrapper}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className={styles.image}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                </motion.div>
            </div>
        </section>
    );
}
