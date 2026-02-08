import Link from "next/link";
import styles from "./Footer.module.css";

const footerLinks = {
    solutions: [
        { label: "Wireless Overlay", href: "/solutions/wireless-overlay" },
        { label: "Monitoring Services", href: "/solutions/monitoring" },
        { label: "ARC Software", href: "/solutions/arc-software" },
        { label: "Digital Switchover Guide", href: "/resources/2027-guide" },
    ],
    company: [
        { label: "About Us", href: "/about" },
        { label: "Success Stories", href: "/success-stories" },
        { label: "Contact", href: "/contact" },
    ],
    resources: [
        { label: "Product Info", href: "/resources/products" },
        { label: "Blog", href: "/resources/blog" },
        { label: "Glossary", href: "/resources/glossary" },
    ],
};

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoText}>CompliantCare</span>
                            <svg className={styles.logoWifi} width="16" height="12" viewBox="0 0 18 14" fill="none">
                                <path d="M9 11.5C9.5523 11.5 10 12.0477 10 12.75C10 13.4523 9.5523 14 9 14C8.4477 14 8 13.4523 8 12.75C8 12.0477 8.4477 11.5 9 11.5Z" fill="#f97316" />
                                <path d="M5.5 9C6.5 7.5 7.5 7 9 7C10.5 7 11.5 7.5 12.5 9" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                                <path d="M2.5 6C4.5 3.5 6.5 2.5 9 2.5C11.5 2.5 13.5 3.5 15.5 6" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                                <path d="M0 3C2.5 0.5 5 0 9 0C13 0 15.5 0.5 18 3" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </Link>
                        <p className={styles.tagline}>
                            Wireless telecare solutions for UK Housing Associations.
                            Ensuring compliance with the 2027 digital switchover.
                        </p>
                    </div>

                    {/* Link Columns */}
                    <div className={styles.links}>
                        <div className={styles.column}>
                            <h4 className={styles.columnTitle}>Solutions</h4>
                            <ul className={styles.columnList}>
                                {footerLinks.solutions.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href}>{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.column}>
                            <h4 className={styles.columnTitle}>Company</h4>
                            <ul className={styles.columnList}>
                                {footerLinks.company.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href}>{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.column}>
                            <h4 className={styles.columnTitle}>Resources</h4>
                            <ul className={styles.columnList}>
                                {footerLinks.resources.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href}>{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {new Date().getFullYear()} CompliantCare. All rights reserved.
                    </p>
                    <div className={styles.legal}>
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
