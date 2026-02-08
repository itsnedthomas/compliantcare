"use client";

import { motion } from "framer-motion";

export default function ProcessVisualizer() {
    return (
        <section style={{ padding: "100px 0", background: "#f8fafc" }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px" }}>
                <h2 style={{ textAlign: "center", fontSize: "36px", fontWeight: "700", marginBottom: "60px" }}>
                    The Migration Process
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

                    {/* Step 1 */}
                    <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
                        <div style={{ flex: "0 0 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#f97316", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700" }}>1</div>
                            <div style={{ width: "2px", height: "100px", background: "#cbd5e1", marginTop: "10px" }}></div>
                        </div>
                        <div style={{ paddingTop: "10px" }}>
                            <h3 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>Audit & Strategy (Week 1)</h3>
                            <p style={{ color: "#64748b" }}>We conduct a full signal survey and asset audit of your entire portfolio to determine the best connectivity options for each site.</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
                        <div style={{ flex: "0 0 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700" }}>2</div>
                            <div style={{ width: "2px", height: "100px", background: "#cbd5e1", marginTop: "10px" }}></div>
                        </div>
                        <div style={{ paddingTop: "10px" }}>
                            <h3 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>Resident Engagement (Week 2)</h3>
                            <p style={{ color: "#64748b" }}>Our liaison team sends out letters and holds drop-in sessions to explain the change to residents, answering their fears and questions.</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
                        <div style={{ flex: "0 0 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#10b981", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700" }}>3</div>
                        </div>
                        <div style={{ paddingTop: "10px" }}>
                            <h3 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>Deployment & Training (Week 3)</h3>
                            <p style={{ color: "#64748b" }}>Engineers install the new units. We don't leave until the resident has performed a test call and is comfortable with the new button.</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
