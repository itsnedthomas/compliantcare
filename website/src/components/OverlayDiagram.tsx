"use client";

import { motion } from "framer-motion";

export default function OverlayDiagram() {
    return (
        <div style={{ padding: "40px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0", margin: "40px 0" }}>
            <h3 style={{ textAlign: "center", marginBottom: "40px", fontSize: "24px", fontWeight: "700" }}>How The Overlay Works</h3>

            <div style={{ position: "relative", maxWidth: "800px", margin: "0 auto", height: "400px", backgroundColor: "white", borderRadius: "12px", border: "2px dashed #cbd5e1", overflow: "hidden" }}>

                {/* Background: Old Wiring (Faded) */}
                <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.2 }}>
                    <path d="M50,350 L150,350 L150,100" stroke="#94a3b8" strokeWidth="4" fill="none" />
                    <path d="M150,350 L250,350 L250,100" stroke="#94a3b8" strokeWidth="4" fill="none" />
                    <path d="M250,350 L350,350 L350,100" stroke="#94a3b8" strokeWidth="4" fill="none" />
                    <path d="M0,380 L800,380" stroke="#94a3b8" strokeWidth="8" fill="none" /> {/* Old Backbone */}
                    <text x="400" y="390" textAnchor="middle" fill="#64748b" fontSize="12">OLD ANALOGUE WIRING (BYPASSED)</text>
                </svg>

                {/* New Wireless Layer (Animated) */}
                <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
                    {/* Cloud / ARC */}
                    <g transform="translate(600, 50)">
                        <path d="M20,20 Q30,5 50,20 T80,20 T100,50 T80,80 T50,80 T20,50" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="2" />
                        <text x="60" y="55" textAnchor="middle" fill="#0369a1" fontSize="14" fontWeight="bold">The Cloud (ARC)</text>
                    </g>

                    {/* Smart Hubs in Flats */}
                    {[100, 200, 300].map((x, i) => (
                        <g key={i} transform={`translate(${x}, 150)`}>
                            {/* Signal Waves */}
                            <motion.path
                                d="M30,0 Q60,-20 90,0"
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                initial={{ strokeDashoffset: 20, opacity: 0 }}
                                animate={{ strokeDashoffset: 0, opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                            />
                            {/* Device */}
                            <rect x="0" y="20" width="60" height="40" rx="4" fill="white" stroke="#f97316" strokeWidth="2" />
                            <circle cx="30" cy="40" r="12" fill="#ffedd5" />
                            <text x="30" y="75" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="bold">Smart Hub</text>
                        </g>
                    ))}

                    {/* Connection Lines from Hubs to Cloud */}
                    <motion.path
                        d="M130,170 C130,100 550,150 620,90"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        strokeDasharray="8 8"
                        animate={{ strokeDashoffset: [0, -16] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path
                        d="M230,170 C230,100 580,150 630,90"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        strokeDasharray="8 8"
                        animate={{ strokeDashoffset: [0, -16] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path
                        d="M330,170 C330,100 610,150 640,90"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        strokeDasharray="8 8"
                        animate={{ strokeDashoffset: [0, -16] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />

                </svg>

                <div style={{ position: "absolute", bottom: "20px", width: "100%", textAlign: "center" }}>
                    <span style={{
                        background: "#fff7ed",
                        color: "#c2410c",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        border: "1px solid #fdba74",
                        fontSize: "14px",
                        fontWeight: "600"
                    }}>
                        Existing Wiring is completely ignored
                    </span>
                </div>
            </div>
        </div>
    );
}
