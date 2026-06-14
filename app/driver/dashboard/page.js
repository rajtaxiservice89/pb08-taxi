"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverId = searchParams.get('driverId');

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(false), 10000);
    return () => clearInterval(interval);
  }, [driverId]);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: '', success: '' });

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const url = driverId ? `/api/driver/dashboard?driverId=${driverId}` : '/api/driver/dashboard';
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setDriver(data.driver);
      } else {
        setError(data.error || 'Failed to load dashboard data');
      }
    } catch (e) {
      console.error(e);
      setError('A network error occurred. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/driver/logout', { method: 'POST' });
      router.push('/driver/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteRide = async (bookingId) => {
    if (!confirm('Are you sure you want to mark this ride as completed?')) return;
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: 'completed' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to complete ride');
      }
    } catch (e) {
      console.error(e);
      alert('A network error occurred.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: '', success: '' });
    try {
      const res = await fetch('/api/driver/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordStatus({ loading: false, error: '', success: 'Password updated successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '' });
        setTimeout(() => setPasswordStatus({ loading: false, error: '', success: '' }), 5000);
      } else {
        setPasswordStatus({ loading: false, error: data.error || 'Failed to update password', success: '' });
      }
    } catch (e) {
      console.error(e);
      setPasswordStatus({ loading: false, error: 'Network error. Please try again.', success: '' });
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-12 min-h-[90vh] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <i className="fa-solid fa-circle-notch fa-spin text-5xl mb-4 opacity-50 block text-taxi-yellow"></i>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="pt-24 pb-12 min-h-[90vh] flex items-center justify-center">
        <div className="text-center text-red-500 max-w-md bg-red-500/10 p-6 rounded-2xl border border-red-500/30">
          <i className="fa-solid fa-triangle-exclamation text-5xl mb-4 opacity-80"></i>
          <h3 className="text-xl font-bold mb-2">Access Denied</h3>
          <p className="text-sm text-red-400">{error || 'Unable to load profile data.'}</p>
          {!driverId && (
            <button onClick={() => router.push('/driver/login')} className="mt-6 btn-outline border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-6 py-2">
              Back to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalRides = driver.bookings.length;
  const completedRides = driver.bookings.filter(b => b.status === 'completed').length;
  const upcomingRides = driver.bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
  const cancelledRides = driver.bookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-taxi-yellow/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-panel w-full max-w-6xl mx-auto rounded-2xl p-6 lg:p-10 border border-white/10 shadow-2xl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Driver Portal</h2>
              <p className="text-gray-400 text-sm">Welcome back, {driver.name}! Manage your rides and schedule here.</p>
            </div>
            {!driverId && (
              <button onClick={handleLogout} className="btn-outline px-4 py-2 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                Logout <i className="fa-solid fa-power-off ml-2"></i>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Profile & Stats */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-taxi-yellow/20 to-transparent"></div>
                
                <div className="relative w-24 h-24 rounded-full border-4 border-black bg-gray-800 shadow-xl overflow-hidden mb-4 z-10 flex items-center justify-center text-gray-500">
                  {driver.selfieUrl ? (
                    <img src={driver.selfieUrl} alt="Driver" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-user text-4xl"></i>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1 z-10">{driver.name}</h3>
                <p className="text-taxi-yellow font-mono text-sm mb-4 z-10">{driver.contact}</p>
                
                <div className="w-full bg-white/5 rounded-xl p-4 text-left z-10">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 block uppercase tracking-wider">Vehicle</span>
                    <span className="text-sm font-semibold text-white">{driver.carName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block uppercase tracking-wider">Registration</span>
                    <span className="text-sm font-semibold text-white">{driver.carRegistration}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-1"><i className="fa-solid fa-route mr-1"></i> Total Rides</div>
                  <div className="text-2xl font-bold text-white">{totalRides}</div>
                </div>
                <div className="bg-black/40 border border-green-500/20 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute -right-2 -bottom-2 text-green-500/10 text-5xl"><i className="fa-solid fa-check-circle"></i></div>
                  <div className="text-green-500/80 text-xs uppercase tracking-wider mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-400 relative z-10">{completedRides}</div>
                </div>
                <div className="bg-black/40 border border-blue-500/20 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute -right-2 -bottom-2 text-blue-500/10 text-5xl"><i className="fa-solid fa-clock"></i></div>
                  <div className="text-blue-500/80 text-xs uppercase tracking-wider mb-1">Upcoming</div>
                  <div className="text-2xl font-bold text-blue-400 relative z-10">{upcomingRides}</div>
                </div>
                <div className="bg-black/40 border border-red-500/20 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute -right-2 -bottom-2 text-red-500/10 text-5xl"><i className="fa-solid fa-xmark-circle"></i></div>
                  <div className="text-red-500/80 text-xs uppercase tracking-wider mb-1">Cancelled</div>
                  <div className="text-2xl font-bold text-red-400 relative z-10">{cancelledRides}</div>
                </div>
              </div>

              {/* Change Password Card */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4"><i className="fa-solid fa-lock text-taxi-yellow mr-2"></i> Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Current Password</label>
                    <input 
                      type="password" 
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-taxi-yellow transition-colors"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">New Password</label>
                    <input 
                      type="password" 
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-taxi-yellow transition-colors"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  {passwordStatus.error && <div className="text-red-400 text-sm">{passwordStatus.error}</div>}
                  {passwordStatus.success && <div className="text-green-400 text-sm">{passwordStatus.success}</div>}
                  
                  <button 
                    type="submit" 
                    disabled={passwordStatus.loading}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {passwordStatus.loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Update Password'}
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: Bookings */}
            <div className="lg:col-span-2">
              <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white"><i className="fa-solid fa-list-check text-taxi-yellow mr-2"></i> My Assigned Bookings</h3>
                  <span className="px-3 py-1 bg-white/10 text-xs rounded-full border border-white/20 text-gray-300">{driver.bookings.length} Total</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="text-xs uppercase bg-black/60 text-gray-400">
                      <tr>
                        <th className="px-6 py-4 font-medium whitespace-nowrap">Customer Info</th>
                        <th className="px-6 py-4 font-medium whitespace-nowrap">Route Details</th>
                        <th className="px-6 py-4 font-medium whitespace-nowrap">Schedule</th>
                        <th className="px-6 py-4 font-medium whitespace-nowrap text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {driver.bookings.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                            <i className="fa-solid fa-inbox text-3xl mb-3 opacity-50 block"></i>
                            No bookings assigned yet.
                          </td>
                        </tr>
                      ) : (
                        driver.bookings.map((booking) => {
                          const isUpcoming = booking.status === 'pending' || booking.status === 'confirmed';
                          const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(booking.pickup)}&destination=${encodeURIComponent(booking.destination)}`;

                          return (
                            <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-6 py-4 align-top">
                                <div className="font-bold text-white mb-1">{booking.customerName}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-2">
                                  <i className="fa-solid fa-phone text-[10px]"></i> {booking.customerPhone}
                                </div>
                                {booking.passengers && (
                                  <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                                    <i className="fa-solid fa-users mr-1"></i> {booking.passengers} Pax
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 align-top max-w-[200px]">
                                <div className="flex flex-col gap-2 relative">
                                  {/* Route line connecting dots */}
                                  <div className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-gray-700"></div>
                                  
                                  <div className="flex items-start gap-2 relative z-10">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0"></div>
                                    <div className="text-xs truncate" title={booking.pickup}>{booking.pickup}</div>
                                  </div>
                                  <div className="flex items-start gap-2 relative z-10">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0"></div>
                                    <div className="text-xs truncate" title={booking.destination}>{booking.destination}</div>
                                  </div>
                                </div>
                                {booking.estimatedFare && (
                                  <div className="text-xs text-taxi-yellow mt-3 font-semibold bg-taxi-yellow/10 border border-taxi-yellow/30 px-2 py-1 rounded inline-block">
                                    Fare to Collect: ₹{booking.estimatedFare}
                                  </div>
                                )}
                                {isUpcoming && (
                                  <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-blue-400 hover:text-blue-300 font-semibold bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 transition-colors">
                                    <i className="fa-solid fa-location-arrow"></i> Navigate
                                  </a>
                                )}
                              </td>
                              <td className="px-6 py-4 align-top whitespace-nowrap">
                                <div className="font-semibold text-gray-200">{booking.date}</div>
                                <div className="text-xs text-taxi-yellow mt-1">{booking.time}</div>
                              </td>
                              <td className="px-6 py-4 align-top text-right">
                                {booking.status === 'pending' && <span className="inline-block px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20 mb-2">Pending</span>}
                                {booking.status === 'confirmed' && <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20 mb-2">Confirmed</span>}
                                {booking.status === 'completed' && <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">Completed</span>}
                                {booking.status === 'cancelled' && <span className="inline-block px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">Cancelled</span>}
                                
                                {isUpcoming && !driverId && (
                                  <button onClick={() => handleCompleteRide(booking.id)} className="block w-full text-center px-3 py-1.5 mt-2 bg-taxi-yellow text-black text-xs font-bold rounded hover:bg-yellow-400 transition-colors">
                                    <i className="fa-solid fa-check mr-1"></i> Mark Complete
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  return (
    <Suspense fallback={
      <div className="pt-24 pb-12 min-h-[90vh] flex items-center justify-center bg-black">
        <div className="text-center text-gray-500">
          <i className="fa-solid fa-circle-notch fa-spin text-5xl mb-4 opacity-50 block text-taxi-yellow"></i>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
