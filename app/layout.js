import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { prisma } from '@/lib/prisma';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "PB08 TAXI SERVICE - Jalandhar Taxi | Airport Cabs | 24x7",
  description: "24/7 reliable taxi service in Jalandhar. Airport drops and outstation rides at best prices.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PB08 Taxi"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050505"
};

export default async function RootLayout({ children }) {
  let settings = null;
  try {
    settings = await prisma.siteSetting.findFirst();
  } catch (e) {
    console.error("Layout fetch settings error:", e);
  }

  // Ensure default structure if DB fails or is empty
  if (!settings) {
    settings = {
      phone1: "9056273306",
      phone2: "9888079736",
      email: "info@pb08taxi.com",
      address: "Main Street, City Center, Jalandhar, Punjab",
      showAdminLoginInHeader: true
    };
  }

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/images/Logo_PB08TAXI.png" />
        <link rel="icon" href="/images/Logo_PB08TAXI.png" type="image/png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
      </head>
      <body>
        <Header settings={settings} />
        <main className="main-content flex-1 flex flex-col">
          {children}
        </main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
