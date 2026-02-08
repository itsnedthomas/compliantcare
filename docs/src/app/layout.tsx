import type { Metadata } from "next";
import { Bricolage_Grotesque, Onest } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
});

const onest = Onest({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-onest",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CompliantCare | Wireless Telecare Solutions for Housing Associations",
  description: "Stop the 2027 liability crisis. CompliantCare provides wireless overlay telecare solutions for UK Housing Associations, ensuring compliance with the digital switchover deadline.",
  keywords: "telecare, digital switchover, housing association, wireless overlay, PSTN switch-off, sheltered housing, connected care",
  openGraph: {
    title: "CompliantCare | Wireless Telecare Solutions",
    description: "100% life-safety compliance in 48 hours. Wireless telecare solutions for the 2027 digital switchover.",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${onest.variable}`}>
      <body>
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
