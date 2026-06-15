"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Booking', path: '/booking' },
    { name: 'Driver Attachment', path: '/driver' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Admin Login', path: '/admin' }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'header-scrolled py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-16 w-48 sm:h-20 sm:w-64 flex items-center justify-center transition-transform duration-300 -ml-2">
              <img src="/images/Logo_GIF_PB08TAXI.gif" alt="PB08 TAXI" className="w-full h-full object-contain scale-[1.3] sm:scale-[1.5] drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold text-white tracking-wider group-hover:text-taxi-yellow transition-colors duration-300" style={{ margin: 0, lineHeight: 1.2 }}>
                PB08 <span className="text-taxi-yellow">TAXI</span>
              </h1>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase m-0 p-0">Premium Service</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:block">
            <ul className="flex items-center space-x-1 lg:space-x-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <li key={link.name}>
                    <Link 
                      href={link.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 
                        ${isActive 
                          ? 'bg-taxi-yellow/10 text-taxi-yellow border border-taxi-yellow/30' 
                          : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-300 hover:text-taxi-yellow p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        <div className={`md:hidden absolute left-0 right-0 top-full glass-panel border-t border-white/10 transition-all duration-300 origin-top 
          ${mobileMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
          <ul className="flex flex-col py-4 px-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <li key={link.name}>
                  <Link 
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300
                      ${isActive 
                        ? 'bg-taxi-yellow/10 text-taxi-yellow border-l-2 border-taxi-yellow' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </header>
  );
}
