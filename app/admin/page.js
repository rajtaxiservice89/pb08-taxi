"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [settings, setSettings] = useState({
    heroTitle: '', heroText: '', phone1: '', phone2: '', email: '', address: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const router = useRouter();

  // Load data based on tab
  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'cms') fetchSettings();
    if (activeTab === 'drivers') fetchDrivers();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (e) { console.error(e); }
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (e) { console.error(e); } finally {
      setLoadingDrivers(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Settings saved successfully! Refresh the public website to see changes.');
    } catch (e) {
      console.error(e);
      alert('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchBookings(); // reload
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateDriverStatus = async (id, status) => {
    try {
      const res = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) fetchDrivers();
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-taxi-yellow/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            <button className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-semibold" onClick={handleLogout}>
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
                    <div className="px-3 py-1 bg-taxi-yellow/10 text-taxi-yellow rounded-full text-xs font-mono border border-taxi-yellow/30">Total: {bookings.length}</div>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="text-xs uppercase bg-black/50 text-gray-400">
                        <tr>
                          <th className="px-6 py-4 font-medium">Customer</th>
                          <th className="px-6 py-4 font-medium">Route</th>
                          <th className="px-6 py-4 font-medium">Date / Time</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingBookings ? (
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 opacity-50 block"></i>
                              Loading Bookings...
                            </td>
                          </tr>
                        ) : bookings.length === 0 ? (
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-inbox text-3xl mb-3 opacity-50 block"></i>
                              No bookings found in database
                            </td>
                          </tr>
                        ) : (
                          bookings.map(b => (
                            <tr key={b.id} className="border-t border-white/5 bg-black/20 hover:bg-black/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-white">{b.name}</div>
                                <div className="text-xs text-gray-500">{b.phone}</div>
                                {b.notes && <div className="text-xs text-taxi-yellow mt-1">{b.notes}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs text-green-400">P: {b.pickup}</div>
                                <div className="text-xs text-red-400">D: {b.dropoff}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div>{b.date}</div>
                                <div className="text-xs text-gray-500">{b.time}</div>
                              </td>
                              <td className="px-6 py-4">
                                {b.status === 'pending' && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">Pending</span>}
                                {b.status === 'confirmed' && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">Confirmed</span>}
                                {b.status === 'completed' && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">Completed</span>}
                                {b.status === 'cancelled' && <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">Cancelled</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {b.status === 'pending' && (
                                  <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="text-green-400 hover:text-green-300 text-sm font-semibold border border-green-500/30 px-2 py-1 rounded bg-green-500/10 mr-2">Confirm</button>
                                )}
                                {(b.status === 'pending' || b.status === 'confirmed') && (
                                  <button onClick={() => updateBookingStatus(b.id, 'completed')} className="text-blue-400 hover:text-blue-300 text-sm font-semibold border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10 mr-2">Complete</button>
                                )}
                                {b.status !== 'cancelled' && b.status !== 'completed' && (
                                  <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="text-red-400 hover:text-red-300 text-sm font-semibold border border-red-500/30 px-2 py-1 rounded bg-red-500/10">Cancel</button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
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
                    <div className="glass-card p-6 border-white/5 bg-black/20 rounded-xl border border-white/10">
                      <h4 className="text-taxi-yellow font-semibold mb-4 border-b border-white/10 pb-2"><i className="fa-solid fa-home mr-2"></i> Hero Section</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Main Title</label>
                          <input type="text" className="input-modern bg-black/30" value={settings.heroTitle} onChange={(e) => setSettings({...settings, heroTitle: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Subtext</label>
                          <textarea rows="3" className="input-modern bg-black/30 text-sm" value={settings.heroText} onChange={(e) => setSettings({...settings, heroText: e.target.value})}></textarea>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 border-white/5 bg-black/20 rounded-xl border border-white/10">
                      <h4 className="text-taxi-yellow font-semibold mb-4 border-b border-white/10 pb-2"><i className="fa-solid fa-address-book mr-2"></i> Contact Details</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Phone 1</label>
                            <input type="text" className="input-modern bg-black/30" value={settings.phone1} onChange={(e) => setSettings({...settings, phone1: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Phone 2</label>
                            <input type="text" className="input-modern bg-black/30" value={settings.phone2} onChange={(e) => setSettings({...settings, phone2: e.target.value})} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Office Email</label>
                          <input type="text" className="input-modern bg-black/30" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Address</label>
                          <input type="text" className="input-modern bg-black/30" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button onClick={handleSaveSettings} disabled={savingSettings} className="btn-primary disabled:opacity-50">
                      {savingSettings ? 'Deploying...' : 'Deploy Changes'} <i className="fa-solid fa-cloud-arrow-up ml-2"></i>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'drivers' && (
                <div className="animate-[fadeInUp_0.3s_ease]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Driver Management</h3>
                      <p className="text-gray-400 text-sm">Review driver applications and active drivers</p>
                    </div>
                    <div className="px-3 py-1 bg-taxi-yellow/10 text-taxi-yellow rounded-full text-xs font-mono border border-taxi-yellow/30">Total: {drivers.length}</div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="text-xs uppercase bg-black/50 text-gray-400">
                        <tr>
                          <th className="px-6 py-4 font-medium">Driver Profile</th>
                          <th className="px-6 py-4 font-medium">Vehicle Info</th>
                          <th className="px-6 py-4 font-medium">Experience</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingDrivers ? (
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 opacity-50 block"></i>
                              Loading Drivers...
                            </td>
                          </tr>
                        ) : drivers.length === 0 ? (
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-users-slash text-3xl mb-3 opacity-50 block"></i>
                              No drivers found
                            </td>
                          </tr>
                        ) : (
                          drivers.map(d => (
                            <tr key={d.id} className="border-t border-white/5 bg-black/20 hover:bg-black/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-white">{d.name}</div>
                                <div className="text-xs text-gray-500">{d.phone}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">{d.vehicleModel}</div>
                                <div className="text-xs text-taxi-yellow">{d.vehicleNo}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div>{d.experience} Years</div>
                              </td>
                              <td className="px-6 py-4">
                                {d.status === 'pending' && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">Pending Review</span>}
                                {d.status === 'approved' && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">Approved / Active</span>}
                                {d.status === 'rejected' && <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">Rejected</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {d.status === 'pending' && (
                                  <>
                                    <button onClick={() => updateDriverStatus(d.id, 'approved')} className="text-green-400 hover:text-green-300 text-sm font-semibold border border-green-500/30 px-2 py-1 rounded bg-green-500/10 mr-2">Approve</button>
                                    <button onClick={() => updateDriverStatus(d.id, 'rejected')} className="text-red-400 hover:text-red-300 text-sm font-semibold border border-red-500/30 px-2 py-1 rounded bg-red-500/10">Reject</button>
                                  </>
                                )}
                                {d.status === 'approved' && (
                                  <button onClick={() => updateDriverStatus(d.id, 'rejected')} className="text-red-400 hover:text-red-300 text-sm font-semibold border border-red-500/30 px-2 py-1 rounded bg-red-500/10">Suspend</button>
                                )}
                                {d.status === 'rejected' && (
                                  <button onClick={() => updateDriverStatus(d.id, 'approved')} className="text-green-400 hover:text-green-300 text-sm font-semibold border border-green-500/30 px-2 py-1 rounded bg-green-500/10">Re-Activate</button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
