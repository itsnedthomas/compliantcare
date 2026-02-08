"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const hotspots = [
    { id: 1, x: 50, y: 30, label: "Roaming SIM", description: "Connects to strongest 4G signal", icon: "📶" },
    { id: 2, x: 20, y: 60, label: "Bypasses Wiring", description: "No connection to existing wall plate", icon: "🔌" },
    { id: 3, x: 80, y: 60, label: "Mains Power", description: "Plugs into standard socket", icon: "⚡" },
];

export default function SystemDiagram() {
    const [activeSpot, setActiveSpot] = useState<number | null>(null);

    return (
        <section style={{ padding: "80px 0", background: "#f8fafc", textAlign: "center" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
                <h2 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "16px" }}>How The Overlay Works</h2>
                <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "48px", maxWidth: "600px", marginInline: "auto" }}>
                    See how the CompliantCare Smart Hub fits seamlessly into a resident's home without disrupting the existing infrastructure.
                </p>

                <div style={{ position: "relative", maxWidth: "800px", margin: "40px auto", aspectRatio: "16/9", background: "#fff", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", overflow: "hidden" }}>

                    {/* Placeholder for the diagram image - using a colored block for now */}
                    <div style={{ width: "100%", height: "100%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        [Diagram: Room Overlay Layout]
                    </div>

                    {/* Interactive Hotspots */}
                    {hotspots.map((spot) => (
                        <div key={spot.id} style={{ position: "absolute", top: `${spot.y}%`, left: `${spot.x}%`, transform: "translate(-50%, -50%)" }}>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                onClick={() => setActiveSpot(activeSpot === spot.id ? null : spot.id)}
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    background: "#f97316",
                                    border: "4px solid white",
                                    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.4)",
                                    fontSize: "20px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                {spot.icon}
                            </motion.button>

                            {/* Tooltip */}
                            {activeSpot === spot.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        position: "absolute",
                                        top: "60px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "white",
                                        padding: "16px",
                                        borderRadius: "12px",
                                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                        width: "200px",
                                        textAlign: "center",
                                        zIndex: 10
                                    }}
                                >
                                    <h4 style={{ fontWeight: "700", marginBottom: "4px", color: "#0f172a" }}>{spot.label}</h4>
                                    <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.4" }}>{spot.description}</p>
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
