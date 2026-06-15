"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverLiveDashboard() {
  const router = useRouter();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const watchIdRef = useRef(null);
  
  // New Booking Popup state
  const [incomingBooking, setIncomingBooking] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/driver/dashboard');
      const data = await res.json();
      if (res.ok && data.success) {
        setDriver(data.driver);
        // Initially match DB status or default to false
        setIsOnline(data.driver.isOnline || false);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
      // Optional: send one last update to server saying offline
      if (driver) {
        updateServerLocation(null, null, false);
      }
    }
    return () => stopTracking();
  }, [isOnline, driver]);

  // Subscribe to Pusher to listen for new ride requests
  useEffect(() => {
    if (!driver || !isOnline) return;

    let pusherClient;
    import('@/lib/pusher').then((module) => {
      pusherClient = module.getPusherClient();
      if (pusherClient) {
        const channel = pusherClient.subscribe(`driver-${driver.id}`);
        
        channel.bind('new-booking-request', (data) => {
          setIncomingBooking(data.booking);
          // Optional: play a sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play prevented', e));
        });
      }
    });

    return () => {
      if (pusherClient && driver) {
        pusherClient.unsubscribe(`driver-${driver.id}`);
      }
    };
  }, [driver, isOnline]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsOnline(false);
      return;
    }

    setLocationError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        updateServerLocation(latitude, longitude, true);
      },
      (error) => {
        console.error('GPS Error:', error);
        setLocationError('Failed to get GPS location. Please enable location services.');
        setIsOnline(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const updateServerLocation = async (lat, lng, onlineStatus) => {
    if (!driver) return;
    try {
      await fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          lat,
          lng,
          isOnline: onlineStatus
        })
      });
    } catch (e) {
      console.error('Failed to sync location to server', e);
    }
  };

  const handleAcceptRide = async () => {
    if (!incomingBooking) return;
    try {
      const res = await fetch('/api/booking/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: incomingBooking.id, driverId: driver.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Ride Accepted! Please navigate to the pickup location.');
        router.push('/driver/dashboard');
      } else {
        alert(data.error || 'Failed to accept ride. Maybe another driver took it.');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setIncomingBooking(null);
    }
  };

  const handleRejectRide = () => {
    setIncomingBooking(null);
    // Optional: tell server so it assigns next driver
  };

  if (loading) return <div className="pt-24 text-center text-white min-h-[90vh]">Loading Live Dashboard...</div>;
  if (error || !driver) return <div className="pt-24 text-center text-red-500 min-h-[90vh]">{error || 'Access Denied'}</div>;

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh] bg-black">
      <div className="container mx-auto px-4 max-w-2xl relative z-10">
        
        <div className="glass-panel rounded-2xl p-6 border border-white/10 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Live Tracking Dashboard</h2>
          <p className="text-gray-400 mb-6">Welcome, {driver.name}</p>

          <div className="mb-8">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`w-full py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center justify-center gap-3 ${
                isOnline 
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-500'}`}></div>
              {isOnline ? 'You are ONLINE' : 'GO ONLINE'}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              {isOnline ? 'Waiting for ride requests. Keep this tab open.' : 'You are offline and will not receive ride requests.'}
            </p>
          </div>

          {locationError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded mb-4 text-sm">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i> {locationError}
            </div>
          )}

          {isOnline && currentLocation && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-left">
              <h3 className="text-taxi-yellow text-sm font-semibold uppercase tracking-wider mb-2"><i className="fa-solid fa-satellite-dish mr-2"></i> GPS Active</h3>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Lat: {currentLocation.lat.toFixed(6)}</span>
                <span>Lng: {currentLocation.lng.toFixed(6)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Incoming Ride Popup Overlay */}
        {incomingBooking && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#111] border-2 border-taxi-yellow shadow-[0_0_30px_rgba(253,224,71,0.2)] rounded-2xl p-6 max-w-md w-full animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_1]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-taxi-yellow text-black rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
                  <i className="fa-solid fa-bell"></i>
                </div>
                <h3 className="text-2xl font-bold text-white">New Ride Request!</h3>
                <p className="text-taxi-yellow font-bold mt-2 text-xl">Est. Fare: ₹{incomingBooking.estimatedFare}</p>
              </div>
              
              <div className="space-y-4 mb-6 bg-black/50 p-4 rounded-xl border border-white/10">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Pickup</span>
                  <p className="text-white font-semibold flex items-start gap-2 mt-1">
                    <span className="text-green-500 mt-1"><i className="fa-solid fa-circle text-[8px]"></i></span>
                    {incomingBooking.pickup}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Drop</span>
                  <p className="text-white font-semibold flex items-start gap-2 mt-1">
                    <span className="text-red-500 mt-1"><i className="fa-solid fa-square text-[8px]"></i></span>
                    {incomingBooking.destination}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleRejectRide} className="py-3 px-4 rounded-xl border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 transition-colors">
                  Reject
                </button>
                <button onClick={handleAcceptRide} className="py-3 px-4 rounded-xl bg-taxi-yellow text-black font-bold hover:bg-yellow-400 shadow-[0_0_20px_rgba(253,224,71,0.4)] transition-colors">
                  Accept Ride
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
