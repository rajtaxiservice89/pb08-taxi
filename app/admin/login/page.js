"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-taxi-yellow/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-taxi-yellow/30 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <div className="text-center mb-8">
              <i className="fa-solid fa-user-shield text-4xl text-taxi-yellow mb-4"></i>
              <h2 className="text-2xl font-bold text-white tracking-wide">SYSTEM <span className="text-taxi-yellow">ADMIN</span></h2>
              <p className="text-gray-400 text-sm mt-1">Restricted Access Portal</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="form-label">Admin ID</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                  <input type="text" className="input-modern pl-12" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter ID" />
                </div>
              </div>
              
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                  <input type="password" className="input-modern pl-12" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password" />
                </div>
              </div>
              
              <button type="submit" disabled={isLoading} className="w-full btn-primary mt-4 disabled:opacity-50">
                {isLoading ? 'Authenticating...' : (
                  <>Initialize Session <i className="fa-solid fa-arrow-right-to-bracket ml-2"></i></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
