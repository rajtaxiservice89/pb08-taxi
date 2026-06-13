"use client";

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto relative overflow-hidden border-t border-white/10 bg-black/80 pt-16 pb-8">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[200px] bg-taxi-yellow/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-taxi-yellow rounded-lg">
                <i className="fa-solid fa-taxi text-black text-xl"></i>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wider">
                PB08 <span className="text-taxi-yellow">TAXI</span>
              </h2>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium and reliable taxi service in Jalandhar. Available 24/7 for local rides, outstation trips, and airport transfers.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-taxi-yellow hover:border-taxi-yellow transition-all">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-taxi-yellow hover:border-taxi-yellow transition-all">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-taxi-yellow hover:border-taxi-yellow transition-all">
                <i className="fa-brands fa-twitter"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-taxi-yellow"></span> Quick Links
            </h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-400 hover:text-taxi-yellow transition-colors text-sm flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> Home</Link></li>
              <li><Link href="/booking" className="text-gray-400 hover:text-taxi-yellow transition-colors text-sm flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> Book a Ride</Link></li>
              <li><Link href="/driver" className="text-gray-400 hover:text-taxi-yellow transition-colors text-sm flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> Attach Your Taxi</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-taxi-yellow transition-colors text-sm flex items-center gap-2"><i className="fa-solid fa-chevron-right text-[10px]"></i> Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-taxi-yellow"></span> Our Services
            </h3>
            <ul className="space-y-3">
              <li className="text-gray-400 text-sm flex items-center gap-2"><i className="fa-solid fa-check text-taxi-yellow"></i> Airport Transfers</li>
              <li className="text-gray-400 text-sm flex items-center gap-2"><i className="fa-solid fa-check text-taxi-yellow"></i> Local Sightseeing</li>
              <li className="text-gray-400 text-sm flex items-center gap-2"><i className="fa-solid fa-check text-taxi-yellow"></i> Outstation Trips</li>
              <li className="text-gray-400 text-sm flex items-center gap-2"><i className="fa-solid fa-check text-taxi-yellow"></i> Corporate Rentals</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-taxi-yellow"></span> Contact Info
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-location-dot text-taxi-yellow text-sm"></i>
                </div>
                <span className="text-gray-400 text-sm">Main Street, City Center, Jalandhar, Punjab</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-phone text-taxi-yellow text-sm"></i>
                </div>
                <div className="flex flex-col">
                  <a href="tel:9056273306" className="text-gray-400 hover:text-taxi-yellow transition-colors text-sm">9056273306</a>
                  <a href="tel:9888079736" className="text-gray-400 hover:text-taxi-yellow transition-colors text-sm">9888079736</a>
                </div>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-envelope text-taxi-yellow text-sm"></i>
                </div>
                <a href="mailto:info@pb08taxi.com" className="text-gray-400 hover:text-taxi-yellow transition-colors text-sm">info@pb08taxi.com</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} PB08 TAXI SERVICE'S. All rights reserved.
          </p>
          <div className="text-gray-500 text-sm flex gap-4">
            <a href="#" className="hover:text-taxi-yellow transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-taxi-yellow transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
