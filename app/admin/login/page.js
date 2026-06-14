"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset State
  const [showReset, setShowReset] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [showResetPin, setShowResetPin] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

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

  const handleReset = async (e) => {
    e.preventDefault();
    setIsResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretPin: resetPin, newUsername, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setResetSuccess('Credentials updated! You can now login.');
        setTimeout(() => {
          setShowReset(false);
          setResetSuccess('');
          setResetPin('');
          setNewUsername('');
          setNewPassword('');
        }, 2000);
      } else {
        setResetError(data.error || 'Failed to reset credentials');
      }
    } catch (err) {
      setResetError('Something went wrong. Try again.');
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      <div className="hidden md:block absolute top-0 right-1/4 w-[500px] h-[500px] bg-taxi-yellow/5 rounded-full blur-[150px] pointer-events-none"></div>

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
                  <input type="text" className="input-modern" style={{ paddingLeft: '3rem' }} value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter ID" />
                </div>
              </div>
              
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                  <input type={showPassword ? "text" : "password"} className="input-modern pr-10" style={{ paddingLeft: '3rem' }} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-taxi-yellow focus:outline-none">
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={isLoading} className="w-full btn-primary mt-4 disabled:opacity-50">
                {isLoading ? 'Authenticating...' : (
                  <>Initialize Session <i className="fa-solid fa-arrow-right-to-bracket ml-2"></i></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setShowReset(true)} className="text-gray-500 hover:text-taxi-yellow text-sm transition-colors">
                Forgot / Reset Credentials?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Reset Credentials</h3>
            
            {resetError && <div className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded">{resetError}</div>}
            {resetSuccess && <div className="text-green-400 text-sm mb-4 bg-green-500/10 p-2 rounded">{resetSuccess}</div>}
            
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="form-label">Secret 6-Digit PIN</label>
                <div className="relative">
                  <input type={showResetPin ? "text" : "password"} maxLength={6} className="input-modern pr-10" value={resetPin} onChange={e => setResetPin(e.target.value)} required placeholder="Enter PIN" />
                  <button type="button" onClick={() => setShowResetPin(!showResetPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-taxi-yellow focus:outline-none">
                    <i className={`fa-solid ${showResetPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">New Username</label>
                <input type="text" className="input-modern" value={newUsername} onChange={e => setNewUsername(e.target.value)} required placeholder="New Admin ID" />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} className="input-modern pr-10" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="New Password" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-taxi-yellow focus:outline-none">
                    <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowReset(false)} className="w-1/2 btn-outline py-2">Cancel</button>
                <button type="submit" disabled={isResetLoading} className="w-1/2 btn-primary py-2">{isResetLoading ? 'Resetting...' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
