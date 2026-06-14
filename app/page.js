import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// Revalidate this page every 60 seconds (or 0 for dynamic)
export const revalidate = 60;

export default async function Home() {
  let settings = null;
  try {
    settings = await prisma.siteSetting.findFirst();
  } catch (e) {
    console.error("Failed to fetch settings:", e);
  }
  
  // Fallbacks if no settings found
  if (!settings) {
    settings = {
      heroTitle: "Ride into the Destination",
      heroText: "Experience next-generation comfort and safety. From city commutes to outstation trips, we provide a seamless journey tailored for you.",
      phone1: "9056273306"
    };
  }

  // Helper to color the last word yellow
  const titleWords = settings.heroTitle.split(' ');
  const lastWord = titleWords.pop();
  const restOfTitle = titleWords.join(' ');

  return (
    <div className="pt-24 pb-12 overflow-hidden relative">
      
      {/* Background Decorative Gradients */}
      <div className="hidden md:block absolute top-1/4 left-0 w-96 h-96 bg-taxi-yellow/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="hidden md:block absolute top-1/2 right-0 w-96 h-96 bg-taxi-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Section */}
        <section className="min-h-[70vh] flex flex-col justify-center items-center text-center py-20">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full glass-panel border border-taxi-yellow/30 text-taxi-yellow text-sm font-semibold tracking-widest uppercase">
            Jalandhar's Premium Transport
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            {restOfTitle} <span className="text-taxi-yellow text-glow">{lastWord}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {settings.heroText}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5">
            <Link href="/booking" className="btn-primary group flex items-center justify-center gap-2">
              Book a Ride Now
              <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </Link>
            <Link href="/driver" className="btn-outline">
              Attach Your Taxi
            </Link>
          </div>

          {/* Floating Features below Hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mt-24">
            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-taxi-yellow/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-clock text-taxi-yellow text-2xl"></i>
              </div>
              <h3 className="text-white font-bold mb-2">24/7 Available</h3>
              <p className="text-sm text-gray-400">Ready whenever you are</p>
            </div>
            
            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-taxi-yellow/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-car text-taxi-yellow text-2xl"></i>
              </div>
              <h3 className="text-white font-bold mb-2">Luxury Fleet</h3>
              <p className="text-sm text-gray-400">Clean & comfortable cars</p>
            </div>
            
            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-taxi-yellow/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-shield-halved text-taxi-yellow text-2xl"></i>
              </div>
              <h3 className="text-white font-bold mb-2">Safe & Secure</h3>
              <p className="text-sm text-gray-400">Verified pro drivers</p>
            </div>
            
            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-taxi-yellow/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-wallet text-taxi-yellow text-2xl"></i>
              </div>
              <h3 className="text-white font-bold mb-2">Best Prices</h3>
              <p className="text-sm text-gray-400">Transparent billing</p>
            </div>
          </div>
        </section>

      </div>

      {/* Floating WhatsApp and Call FABs */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        <a href={`https://wa.me/91${settings.phone1}`} className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-110 transition-transform">
          <i className="fa-brands fa-whatsapp"></i>
        </a>
        <a href={`tel:${settings.phone1}`} className="w-14 h-14 bg-taxi-yellow rounded-full flex items-center justify-center text-black text-xl shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-110 transition-transform">
          <i className="fa-solid fa-phone"></i>
        </a>
      </div>
    </div>
  );
}
