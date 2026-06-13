"use client";

import { useState } from 'react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials. For preview purposes, use admin/admin.");
    }
  };

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-taxi-yellow/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!isLoggedIn ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-taxi-yellow/30 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
              <div className="text-center mb-8">
                <i className="fa-solid fa-user-shield text-4xl text-taxi-yellow mb-4"></i>
                <h2 className="text-2xl font-bold text-white tracking-wide">SYSTEM <span className="text-taxi-yellow">ADMIN</span></h2>
                <p className="text-gray-400 text-sm mt-1">Restricted Access Portal</p>
              </div>

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
                
                <button type="submit" className="w-full btn-primary mt-4">Initialize Session <i className="fa-solid fa-arrow-right-to-bracket ml-2"></i></button>
              </form>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
            
            {/* Dashboard Header */}
            <div className="bg-black/50 p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-taxi-yellow/20 text-taxi-yellow rounded-xl flex items-center justify-center text-xl border border-taxi-yellow/30">
                  <i className="fa-solid fa-user-shield"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Admin Console</h2>
                  <p className="text-xs text-green-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> System Online</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-semibold" onClick={() => setIsLoggedIn(false)}>
                Terminate Session <i className="fa-solid fa-power-off ml-1"></i>
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row min-h-[600px]">
              
              {/* Sidebar Tabs */}
              <div className="w-full md:w-64 bg-black/30 border-r border-white/5 p-4 flex flex-col gap-2">
                <button 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'bookings' ? 'bg-taxi-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  onClick={() => setActiveTab('bookings')}
                >
                  <i className="fa-solid fa-calendar-check w-5 text-center"></i> Booking Management
                </button>
                <button 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'cms' ? 'bg-taxi-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  onClick={() => setActiveTab('cms')}
                >
                  <i className="fa-solid fa-pen-to-square w-5 text-center"></i> Website Content (CMS)
                </button>
                <button 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'drivers' ? 'bg-taxi-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  onClick={() => setActiveTab('drivers')}
                >
                  <i className="fa-solid fa-id-card w-5 text-center"></i> Driver Directory
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 lg:p-10">
                {activeTab === 'bookings' && (
                  <div className="animate-[fadeInUp_0.3s_ease]">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Live Bookings</h3>
                        <p className="text-gray-400 text-sm">Monitor and manage ride requests</p>
                      </div>
                      <div className="px-3 py-1 bg-taxi-yellow/10 text-taxi-yellow rounded-full text-xs font-mono border border-taxi-yellow/30">Total: 0</div>
                    </div>
                    
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm text-gray-300">
                        <thead className="text-xs uppercase bg-black/50 text-gray-400">
                          <tr>
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium">Customer</th>
                            <th className="px-6 py-4 font-medium">Route</th>
                            <th className="px-6 py-4 font-medium">Time</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-database text-3xl mb-3 opacity-50 block"></i>
                              Waiting for Neon Database Connection
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'cms' && (
                  <div className="animate-[fadeInUp_0.3s_ease]">
                    <h3 className="text-2xl font-bold text-white mb-2">Content Management</h3>
                    <p className="text-gray-400 text-sm mb-8">Update live website data instantly</p>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <div className="glass-card p-6 border-white/5">
                        <h4 className="text-taxi-yellow font-semibold mb-4 border-b border-white/10 pb-2"><i className="fa-solid fa-home mr-2"></i> Hero Section</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Main Title</label>
                            <input type="text" className="input-modern bg-black/30" defaultValue="Reliable & Safe Taxi Service" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Subtext</label>
                            <textarea rows="3" className="input-modern bg-black/30 text-sm" defaultValue="Experience next-generation comfort..."></textarea>
                          </div>
                        </div>
                      </div>

                      <div className="glass-card p-6 border-white/5">
                        <h4 className="text-taxi-yellow font-semibold mb-4 border-b border-white/10 pb-2"><i className="fa-solid fa-address-book mr-2"></i> Contact Details</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Phone 1</label>
                              <input type="text" className="input-modern bg-black/30" defaultValue="9056273306" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Phone 2</label>
                              <input type="text" className="input-modern bg-black/30" defaultValue="9888079736" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Office Email</label>
                            <input type="text" className="input-modern bg-black/30" defaultValue="info@rajtaxi.com" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button className="btn-primary">Deploy Changes <i className="fa-solid fa-cloud-arrow-up ml-2"></i></button>
                    </div>
                  </div>
                )}

                {activeTab === 'drivers' && (
                  <div className="animate-[fadeInUp_0.3s_ease]">
                    <h3 className="text-2xl font-bold text-white mb-2">Driver Authentication System</h3>
                    <p className="text-gray-400 text-sm mb-8">Manage driver profiles, passwords, and approvals</p>
                    
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm text-gray-300">
                        <thead className="text-xs uppercase bg-black/50 text-gray-400">
                          <tr>
                            <th className="px-6 py-4 font-medium">Driver Profile</th>
                            <th className="px-6 py-4 font-medium">Contact</th>
                            <th className="px-6 py-4 font-medium">Vehicle</th>
                            <th className="px-6 py-4 font-medium">Auth Status</th>
                            <th className="px-6 py-4 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-database text-3xl mb-3 opacity-50 block"></i>
                              Waiting for Neon Database Connection
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
