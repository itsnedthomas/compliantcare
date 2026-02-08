"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import styles from "./Navigation.module.css";
import PromoBanner from "./PromoBanner";

interface DropdownItem {
    title: string;
    description: string;
    href: string;
}

interface NavItem {
    label: string;
    href?: string;
    dropdown?: DropdownItem[];
}

const navItems: NavItem[] = [
    {
        label: "Telecare Solutions",
        dropdown: [
            {
                title: "Wireless Overlay System",
                description: "Retrofit your existing telecare without disruption",
                href: "/solutions/wireless-overlay",
            },
            {
                title: "Full Digital Migration",
                description: "Complete transition to digital infrastructure",
                href: "/solutions/digital-migration",
            },
            {
                title: "Monitoring Services",
                description: "24/7 alarm response and monitoring",
                href: "/solutions/monitoring",
            },
        ],
    },
    {
        label: "Why CompliantCare?",
        dropdown: [
            {
                title: "Our Approach",
                description: "How we deliver 48-hour compliance",
                href: "/about/approach",
            },
            {
                title: "Case Studies",
                description: "Success stories from housing associations",
                href: "/about/case-studies",
            },
            {
                title: "Technology",
                description: "The tech behind our solutions",
                href: "/about/technology",
            },
        ],
    },
    {
        label: "Resources",
        dropdown: [
            {
                title: "2027 Deadline Guide",
                description: "Everything you need to know about PSTN switch-off",
                href: "/resources/2027-guide",
            },
            {
                title: "Compliance Checklist",
                description: "Ensure your portfolio is ready",
                href: "/resources/checklist",
            },
            {
                title: "FAQs",
                description: "Common questions answered",
                href: "/resources/faqs",
            },
        ],
    },
    {
        label: "Contact",
        href: "/contact"
    }
];

export default function Navigation() {
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { scrollY } = useScroll();

    // Promo Banner Parallax: Moves up slower than scroll (or naturally)
    // We want it to "scroll away" but visually stick a bit? 
    // User said: "parallax effect, that promo bar moves up and off out of the page"
    // Let's make it move up at 0.5 speed to feel like parallax
    const promoY = useTransform(scrollY, [0, 100], [0, -44]);
    const promoOpacity = useTransform(scrollY, [0, 50], [1, 0]);

    // Header Top Position: Starts at 44 (below promo), moves to 0
    const headerTop = useTransform(scrollY, [0, 44], [44, 12]); // Final 12px top margin for floating look

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 20); // Trigger generic scrolled state earlier
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDropdownToggle = (index: number) => {
        setActiveDropdown(activeDropdown === index ? null : index);
    };

    return (
        <>
            {/* Promo Banner */}
            <motion.div
                style={{ y: promoY, opacity: promoOpacity, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001 }}
            >
                <PromoBanner />
            </motion.div>

            {/* Main Navigation */}
            <motion.header
                ref={dropdownRef}
                className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}
                style={{ top: headerTop }} // Controlled by scroll
            >
                <nav className={`${styles.nav} ${isScrolled ? styles.navScrolled : ""}`}>
                    <div className={styles.container}>
                        {/* Logo */}
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoText}>CompliantCare</span>
                            <svg className={styles.logoWifi} width="18" height="14" viewBox="0 0 18 14" fill="none">
                                <path d="M9 11.5C9.5523 11.5 10 12.0477 10 12.75C10 13.4523 9.5523 14 9 14C8.4477 14 8 13.4523 8 12.75C8 12.0477 8.4477 11.5 9 11.5Z" fill="#f97316" />
                                <path d="M5.5 9C6.5 7.5 7.5 7 9 7C10.5 7 11.5 7.5 12.5 9" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                                <path d="M2.5 6C4.5 3.5 6.5 2.5 9 2.5C11.5 2.5 13.5 3.5 15.5 6" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                                <path d="M0 3C2.5 0.5 5 0 9 0C13 0 15.5 0.5 18 3" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </Link>

                        {/* Desktop Navigation */}
                        <ul className={styles.navList}>
                            {navItems.map((item, index) => (
                                <li key={index} className={styles.navItem}>
                                    {item.dropdown ? (
                                        <>
                                            <button
                                                className={styles.navLink}
                                                onClick={() => handleDropdownToggle(index)}
                                                onMouseEnter={() => setActiveDropdown(index)}
                                                aria-expanded={activeDropdown === index}
                                            >
                                                <span className={styles.navLinkText}>{item.label}</span>
                                                <svg
                                                    className={`${styles.chevron} ${activeDropdown === index ? styles.chevronOpen : ""
                                                        }`}
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M3 4.5L6 7.5L9 4.5"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>

                                            <AnimatePresence>
                                                {activeDropdown === index && (
                                                    <motion.div
                                                        className={styles.dropdown}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 8 }}
                                                        transition={{ duration: 0.15 }}
                                                        onMouseLeave={() => setActiveDropdown(null)}
                                                    >
                                                        <div className={styles.dropdownContent}>
                                                            {item.dropdown.map((dropdownItem, dropdownIndex) => (
                                                                <Link
                                                                    key={dropdownIndex}
                                                                    href={dropdownItem.href}
                                                                    className={styles.dropdownItem}
                                                                >
                                                                    <span className={styles.dropdownTitle}>
                                                                        {dropdownItem.title}
                                                                    </span>
                                                                    <span className={styles.dropdownDescription}>
                                                                        {dropdownItem.description}
                                                                    </span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    ) : (
                                        <Link href={item.href || "#"} className={styles.navLink}>
                                            <span className={styles.navLinkText}>{item.label}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* CTA Button */}
                        <div className={styles.actions}>
                            <Link href="/contact" className={styles.ctaButton}>
                                <span className={styles.ctaText}>Free Consultation</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M3.33334 8H12.6667M12.6667 8L8.66668 4M12.6667 8L8.66668 12"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className={styles.mobileMenuBtn}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <span
                                className={`${styles.hamburger} ${mobileMenuOpen ? styles.hamburgerOpen : ""
                                    }`}
                            ></span>
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            className={styles.mobileMenu}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {navItems.map((item, index) => (
                                <div key={index} className={styles.mobileNavItem}>
                                    <span className={styles.mobileNavLabel}>{item.label}</span>
                                    {item.dropdown && (
                                        <div className={styles.mobileDropdown}>
                                            {item.dropdown.map((dropdownItem, dropdownIndex) => (
                                                <Link
                                                    key={dropdownIndex}
                                                    href={dropdownItem.href}
                                                    className={styles.mobileDropdownLink}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    {dropdownItem.title}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    {!item.dropdown && item.href && (
                                        <Link
                                            href={item.href}
                                            className={styles.mobileNavLabel}
                                            style={{ marginBottom: 0 }}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </div>
                            ))}
                            <Link
                                href="/contact"
                                className={styles.mobileCta}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Free Consultation
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>
        </>
    );
}
