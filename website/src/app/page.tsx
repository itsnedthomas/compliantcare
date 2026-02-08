import Hero from "@/components/Hero";
import RiskSection from "@/components/RiskSection";
import Features from "@/components/Features";
import Stats from "@/components/Stats";
import Comparison from "@/components/Comparison";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <RiskSection />
      <Comparison />
      <Features />
      <Stats />
      <CTA />
    </>
  );
}
