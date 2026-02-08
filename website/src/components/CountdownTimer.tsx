"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./CountdownTimer.module.css";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

// Target date: January 31, 2027 (PSTN switch-off deadline)
const TARGET_DATE = new Date("2027-01-31T00:00:00Z");

function calculateTimeLeft(): TimeLeft {
    const now = new Date();
    const difference = TARGET_DATE.getTime() - now.getTime();

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}

interface CountdownProps {
    variant?: "light" | "dark";
    showLabel?: boolean;
}

export default function CountdownTimer({
    variant = "light",
    showLabel = true
}: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!mounted) {
        return null;
    }

    const timeUnits = [
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hours" },
        { value: timeLeft.minutes, label: "Minutes" },
        { value: timeLeft.seconds, label: "Seconds" },
    ];

    return (
        <div className={`${styles.countdown} ${styles[variant]}`}>
            {showLabel && (
                <span className={styles.label}>Until PSTN Switch-Off</span>
            )}
            <div className={styles.timer}>
                {timeUnits.map((unit, index) => (
                    <div key={unit.label} className={styles.unit}>
                        <motion.div
                            key={unit.value}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={styles.value}
                        >
                            {String(unit.value).padStart(2, "0")}
                        </motion.div>
                        <span className={styles.unitLabel}>{unit.label}</span>
                        {index < timeUnits.length - 1 && (
                            <span className={styles.separator}>:</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
