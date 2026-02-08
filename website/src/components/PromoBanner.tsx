"use client";

import Link from "next/link";
import styles from "./PromoBanner.module.css";

export default function PromoBanner() {
    return (
        <div className={styles.banner}>
            <div className={styles.content}>
                <span className={styles.text}>
                    <span className={styles.icon}>⚡</span>
                    <strong>Limited Offer:</strong> Claim your free Volumetric Signal Audit — worth £2,500
                </span>
                <Link href="/contact" className={styles.link}>
                    Get Started →
                </Link>
            </div>
        </div>
    );
}
