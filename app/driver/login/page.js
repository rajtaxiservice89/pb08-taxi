"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function DriverLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    alert("Database connection required to authenticate.");
  };

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh] flex items-center justify-center">
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-taxi-yellow/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-panel w-full max-w-md mx-auto rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-taxi-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-id-card text-taxi-yellow text-2xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Driver Portal</h2>
            <p className="text-gray-400 text-sm">Login to manage your rides & profile</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <div className="relative">
                <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="tel" id="phone" className="input-modern pl-12" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Enter your registered number" />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="password" id="password" className="input-modern pl-12" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" />
              </div>
            </div>
            
            <button type="submit" className="w-full btn-primary mt-4">Login Securely <i className="fa-solid fa-shield-halved ml-2"></i></button>

            <div className="text-center mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-gray-400">
                Not registered yet? <Link href="/driver" className="text-taxi-yellow hover:text-white transition-colors font-medium">Apply here</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
