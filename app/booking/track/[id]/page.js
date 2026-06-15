"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function RideTrackingPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);

  useEffect(() => {
    fetchBookingData();
  }, [id]);

  const fetchBookingData = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (res.ok) {
        setBooking(data);
        if (data.assignedDriver) {
          setDriver(data.assignedDriver);
        }
      } else {
        setError(data.error || 'Booking not found');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (loading || error || !booking) return;

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [booking.pickupLng || 75.5762, booking.pickupLat || 31.3260],
        zoom: 13,
        attributionControl: false
      });

      // Add pickup marker
      if (booking.pickupLng && booking.pickupLat) {
        new maplibregl.Marker({ color: '#22c55e' })
          .setLngLat([booking.pickupLng, booking.pickupLat])
          .addTo(mapRef.current);
      }
      
      // Add drop marker
      if (booking.destLng && booking.destLat) {
        new maplibregl.Marker({ color: '#ef4444' })
          .setLngLat([booking.destLng, booking.destLat])
          .addTo(mapRef.current);
      }
    }
  }, [loading, error, booking]);

  // Handle Driver Live Location via Pusher
  useEffect(() => {
    if (!driver || !mapRef.current) return;

    // Initial driver marker position from DB
    if (driver.currentLng && driver.currentLat) {
      if (!driverMarkerRef.current) {
        // Create custom car element
        const el = document.createElement('div');
        el.className = 'w-10 h-10 bg-taxi-yellow rounded-full border-4 border-black flex items-center justify-center text-black shadow-[0_0_15px_rgba(253,224,71,0.5)]';
        el.innerHTML = '<i class="fa-solid fa-car"></i>';

        driverMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([driver.currentLng, driver.currentLat])
          .addTo(mapRef.current);
          
        // Fit bounds to show both driver and pickup
        if (booking.pickupLng && booking.pickupLat) {
          const bounds = new maplibregl.LngLatBounds()
            .extend([driver.currentLng, driver.currentLat])
            .extend([booking.pickupLng, booking.pickupLat]);
          mapRef.current.fitBounds(bounds, { padding: 50 });
        }
      }
    }

    // Subscribe to Pusher
    let pusherClient;
    import('@/lib/pusher').then((module) => {
      pusherClient = module.getPusherClient();
      if (pusherClient) {
        const channel = pusherClient.subscribe(`driver-${driver.id}`);
        
        channel.bind('location-update', (data) => {
          const { lat, lng } = data;
          
          if (driverMarkerRef.current) {
            // Animate marker to new location
            driverMarkerRef.current.setLngLat([lng, lat]);
            // Optional: Pan map slightly if marker gets close to edge
          } else {
             const el = document.createElement('div');
             el.className = 'w-10 h-10 bg-taxi-yellow rounded-full border-4 border-black flex items-center justify-center text-black shadow-[0_0_15px_rgba(253,224,71,0.5)]';
             el.innerHTML = '<i class="fa-solid fa-car"></i>';

             driverMarkerRef.current = new maplibregl.Marker({ element: el })
               .setLngLat([lng, lat])
               .addTo(mapRef.current);
          }
        });
      }
    });

    return () => {
      if (pusherClient && driver) {
        pusherClient.unsubscribe(`driver-${driver.id}`);
      }
    };
  }, [driver]);

  // Wait for driver assignment if pending
  useEffect(() => {
    if (!booking || booking.status !== 'PENDING') return;

    let pusherClient;
    import('@/lib/pusher').then((module) => {
      pusherClient = module.getPusherClient();
      if (pusherClient) {
        const channel = pusherClient.subscribe(`booking-${booking.id}`);
        
        channel.bind('ride-accepted', (data) => {
          alert(`Your ride was accepted by ${data.driverName}! Refreshing...`);
          fetchBookingData(); // Re-fetch to get driver details
        });
      }
    });

    return () => {
      if (pusherClient && booking) {
        pusherClient.unsubscribe(`booking-${booking.id}`);
      }
    };
  }, [booking]);


  if (loading) return <div className="pt-24 text-center text-white min-h-[90vh]">Loading Tracker...</div>;
  if (error || !booking) return <div className="pt-24 text-center text-red-500 min-h-[90vh]">{error || 'Booking Not Found'}</div>;

  return (
    <div className="pt-24 relative min-h-screen bg-black flex flex-col md:flex-row">
      
      {/* Left Panel - Details */}
      <div className="w-full md:w-1/3 p-6 glass-panel border-r border-white/10 flex flex-col gap-6 z-10 relative">
        <h2 className="text-2xl font-bold text-white"><i className="fa-solid fa-route text-taxi-yellow mr-2"></i> Ride Tracking</h2>
        
        {booking.status === 'PENDING' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-xl flex items-center gap-3">
            <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
            <div>
              <h3 className="font-bold">Finding your driver...</h3>
              <p className="text-sm">Please wait while we match you.</p>
            </div>
          </div>
        )}

        {driver && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-16 bg-taxi-yellow/20 rounded-bl-full"></div>
             <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Driver Details</h3>
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-taxi-yellow overflow-hidden border-2 border-taxi-yellow">
                  {driver.selfieUrl ? <img src={driver.selfieUrl} alt="Driver" /> : <i className="fa-solid fa-user"></i>}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{driver.name}</div>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                     <i className="fa-solid fa-star text-taxi-yellow text-xs"></i> 4.9
                  </div>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-2 text-sm border-t border-white/10 pt-3">
               <div>
                  <span className="block text-gray-500 text-[10px] uppercase">Vehicle</span>
                  <span className="text-white font-semibold">{driver.carName}</span>
               </div>
               <div>
                  <span className="block text-gray-500 text-[10px] uppercase">Plate No.</span>
                  <span className="bg-taxi-yellow text-black px-2 py-0.5 rounded font-mono font-bold text-xs inline-block mt-0.5">{driver.carRegistration}</span>
               </div>
             </div>
             
             <a href={`tel:${driver.contact}`} className="w-full mt-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors">
               <i className="fa-solid fa-phone"></i> Call Driver
             </a>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
           <div className="flex flex-col gap-4 relative">
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-700"></div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0 flex items-center justify-center text-black text-[10px]">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Pickup</div>
                  <div className="text-sm text-white font-medium">{booking.pickup}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0 flex items-center justify-center text-white text-[10px]">
                  <i className="fa-solid fa-flag-checkered"></i>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Drop</div>
                  <div className="text-sm text-white font-medium">{booking.destination}</div>
                </div>
              </div>
           </div>
        </div>

        {booking.estimatedFare && (
          <div className="mt-auto bg-taxi-yellow/10 border border-taxi-yellow/20 rounded-xl p-4 flex justify-between items-center">
            <span className="text-gray-300 font-medium">Estimated Fare</span>
            <span className="text-2xl font-bold text-taxi-yellow">₹{booking.estimatedFare}</span>
          </div>
        )}
      </div>

      {/* Right Panel - Map */}
      <div className="w-full md:w-2/3 h-[50vh] md:h-auto relative">
        <div ref={mapContainerRef} className="absolute inset-0"></div>
        {/* Map Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none md:hidden"></div>
      </div>

    </div>
  );
}
