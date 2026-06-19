"use client";

import { useState, useEffect, useRef } from 'react';

export default function Booking() {
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', 
    date: '', time: '', vehicleType: 'Sedan', passengers: 1, notes: ''
  });
  const [status, setStatus] = useState('');
  const [distanceKm, setDistanceKm] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [fareSettings, setFareSettings] = useState(null);
  const [locationApiConfig, setLocationApiConfig] = useState({ provider: 'nominatim', apiKey: '' });
  const [configLoaded, setConfigLoaded] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (id === 'vehicleType' && distanceKm !== null) {
      calculateFare(distanceKm, value);
    }
  };

  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const defaultDate = `${yyyy}-${mm}-${dd}`;

    now.setMinutes(now.getMinutes() + 20);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const defaultTime = `${hh}:${min}`;

    setFormData(prev => ({
      ...prev,
      date: prev.date || defaultDate,
      time: prev.time || defaultTime
    }));

    if (!configLoaded) return;

    const loadMappls = () => {
      const script = document.createElement('script');
      script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${locationApiConfig.apiKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        const pluginScript = document.createElement('script');
        pluginScript.src = `https://sdk.mappls.com/map/sdk/plugins?v=3.0&access_token=${locationApiConfig.apiKey}`;
        document.head.appendChild(pluginScript);
        pluginScript.onload = () => {
           window.isMapplsLoaded = true;
           initMaps();
        };
      };
    };

    if (locationApiConfig.provider === 'mappls' || locationApiConfig.apiKey) {
       if (window.isMapplsLoaded) initMaps();
       else loadMappls();
    }
  }, [configLoaded, locationApiConfig]);

  useEffect(() => {
    fetch('/api/settings/fare')
      .then(res => res.json())
      .then(data => {
        if(data.fareSetting) setFareSettings(data.fareSetting);
      })
      .catch(console.error);

    const fetchLocationApi = async () => {
      try {
        const res = await fetch('/api/settings/location-api');
        if (res.ok) {
          const data = await res.json();
          // Fetch backend token for Mappls API if needed
          if (data.provider === 'mappls') {
             const tRes = await fetch('/api/mappls/token');
             if (tRes.ok) {
                const tData = await tRes.json();
                data.token = tData.access_token;
             }
          }
          setLocationApiConfig(data);
        }
      } catch (e) { console.error('Error fetching location API config'); }
      finally { setConfigLoaded(true); }
    };
    fetchLocationApi();
  }, []);

  const calculateFare = (dist, vType) => {
    let baseFare = 50;
    let appCost = 50;
    let driverCost = 50;
    let distanceRate = 0;

    if (fareSettings) {
      baseFare = fareSettings.baseFare || 0;
      appCost = fareSettings.appCost || 0;
      driverCost = fareSettings.driverCost || 0;
      
      try {
        const tiers = JSON.parse(fareSettings.distanceTiers);
        const distance = parseFloat(dist);
        let remainingDistance = distance;
        
        for (const tier of tiers) {
          const tierSize = tier.max - tier.min;
          if (remainingDistance > 0 && distance > tier.min) {
            const applicableDistance = Math.min(remainingDistance, tierSize);
            if (applicableDistance > 0) {
              distanceRate += (applicableDistance * tier.rate);
              remainingDistance -= applicableDistance;
            }
          }
        }
      } catch (e) {
         distanceRate = parseFloat(dist) * 15;
      }
    } else {
      distanceRate = parseFloat(dist) * 15;
    }

    let total = Math.round(baseFare + appCost + driverCost + distanceRate);
    
    if (vType === 'Hatchback') total = Math.round(total * 0.9);
    else if (vType === 'SUV') total = Math.round(total * 1.2);
    else if (vType === 'Luxury') total = Math.round(total * 1.5);

    setEstimatedFare(total);
  };

  // Automatically recalculate fare when dependencies change (fixes stale closure bug in callback)
  useEffect(() => {
    if (distanceKm !== null) {
      calculateFare(distanceKm, formData.vehicleType);
    }
  }, [distanceKm, formData.vehicleType, fareSettings]);

  // Bulletproof fallback: Scrape the distance directly from Mappls UI if callback is unreliable
  useEffect(() => {
    const interval = setInterval(() => {
      const mapEl = document.getElementById('mainMap');
      if (mapEl && mapEl.innerText) {
        const textMatches = mapEl.innerText.match(/(\d+(?:\.\d+)?)\s*km/i);
        if (textMatches && textMatches[1]) {
          const parsed = textMatches[1];
          setDistanceKm(prev => {
            if (prev !== parsed) return parsed;
            return prev;
          });
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const initMaps = () => {
    if (typeof window === 'undefined') return;
    if (!window.mappls) return;
    if (mapInstance.current) return; 

    const initial = { lng: 75.5762, lat: 31.3260, zoom: 12 };
    
    try {
        mapInstance.current = new window.mappls.Map('mainMap', { center: [initial.lat, initial.lng], zoom: initial.zoom });
        
        // Initialize Mappls Direction Plugin to render its native UI on the map
        setTimeout(() => {
            window.directionPlugin = new window.mappls.direction({
              map: mapInstance.current,
              search: true, // Native Mappls search inputs for pick/drop
              profile: 'driving', // Force driving profile
              callback: (data) => {
                console.log("Mappls direction callback data:", data);
                let dist = null;
                
                // Mappls direction data payload format can vary.
                if (data && data.distance) dist = data.distance;
                else if (data && data.routes && data.routes.length > 0) dist = data.routes[0].distance;
                else if (data && data.data && data.data.routes && data.data.routes.length > 0) dist = data.data.routes[0].distance;
                else if (data && data.alternatives && data.alternatives.length > 0) dist = data.alternatives[0].distance;

                if (dist !== null && dist !== undefined) {
                  const km = (parseFloat(dist) / 1000).toFixed(1);
                  if (!isNaN(km)) {
                      setDistanceKm(km);
                  } else {
                      setDistanceKm(null);
                      setEstimatedFare(null);
                  }
                } else {
                  setDistanceKm(null);
                  setEstimatedFare(null);
                }
              }
            });
        }, 1000);
    } catch (err) {
        console.error("Mappls Init Error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone) {
        alert("Please enter your name and phone number.");
        return;
    }

    // Aggressive DOM scraping for Mappls direction widget text inputs
    let pickupText = '';
    let destText = '';

    const mapplsInputs = document.querySelectorAll('.mappls-direction-widget input[type="text"], .direction-search-input');
    if (mapplsInputs && mapplsInputs.length >= 2) {
      pickupText = mapplsInputs[0].value || mapplsInputs[0].placeholder;
      destText = mapplsInputs[mapplsInputs.length - 1].value || mapplsInputs[mapplsInputs.length - 1].placeholder;
    }

    if (!pickupText) {
      const pInput = document.getElementById('DrS_mainMap');
      pickupText = pInput ? (pInput.value || pInput.placeholder || '') : '';
    }
    
    if (!destText) {
      const dInput = document.getElementById('DrE_mainMap');
      destText = dInput ? (dInput.value || dInput.placeholder || '') : '';
    }

    // Ultimate fallback
    if (!pickupText && distanceKm) pickupText = 'Map Selected Pickup';
    if (!destText && distanceKm) destText = 'Map Selected Drop';

    if (!pickupText || !destText || !distanceKm) {
        alert("Please set both Pickup and Drop locations on the map and ensure a route is calculated.");
        return;
    }

    setStatus('submitting');
    
    let pLat = null, pLng = null, dLat = null, dLng = null;

    // Fetch exact coordinates
    if (pickupText.toLowerCase().includes('current location') || pickupText.toLowerCase().includes('my location')) {
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            pLat = pos.coords.latitude;
            pLng = pos.coords.longitude;
        } catch (e) {
            console.log("Geolocation failed.");
        }
    }

    // Geocode Fallback
    try {
        if (!pLat && pickupText) {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pickupText)}&format=json&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) { pLat = parseFloat(data[0].lat); pLng = parseFloat(data[0].lon); }
        }
        if (destText) {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destText)}&format=json&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) { dLat = parseFloat(data[0].lat); dLng = parseFloat(data[0].lon); }
        }
    } catch(e) { console.error("Geocoding failed", e); }

    // Append distance to destination text for Admin Panel visibility
    const finalDestText = `${destText} (${distanceKm} km)`;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          pickup: pickupText,
          destination: finalDestText,
          pickupLat: pLat,
          pickupLng: pLng,
          destLat: dLat,
          destLng: dLng,
          date: formData.date,
          time: formData.time,
          vehicleType: formData.vehicleType,
          passengers: Number(formData.passengers),
          notes: formData.notes,
          estimatedFare: estimatedFare
        })
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        alert("Failed to confirm booking. Please try again.");
      }
    } catch (err) {
      setStatus('error');
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 relative">
      <style dangerouslySetInnerHTML={{__html: `
        /* Aggressive overwrite for Mappls Profile Icons to guarantee hiding */
        .direction-profile,
        .direction-tab-profile,
        .mappls-direction-profile,
        .route-profile,
        .mapbox-directions-profile,
        .mapboxgl-ctrl-directions-profile,
        div[class*="directions-profile"],
        div[class*="direction-profile"],
        label[for*="profile"],
        input[name*="profile"],
        [title="Walking"],
        [title="Biking"],
        [title="walk"],
        [title="bike"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
        }
      `}} />

      <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-taxi-yellow/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 flex justify-center items-center">
        <div className="glass-panel w-full max-w-5xl rounded-2xl p-6 md:p-10">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Book Your <span className="text-taxi-yellow">Ride</span></h2>
            <p className="text-gray-400">Search for your pickup and drop locations on the map below.</p>
          </div>

          {status === 'success' ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
              <p className="text-green-200">We've received your request. Our driver will contact you shortly.</p>
              <button onClick={() => {
                setStatus('');
                setFormData(prev => ({...prev, customerName: '', customerPhone: ''}));
                // Refresh the page to reset the mappls UI fully
                window.location.reload();
              }} className="mt-6 btn-outline">Book Another Ride</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customerName" className="form-label">Full Name</label>
                  <input type="text" id="customerName" className="input-modern" value={formData.customerName} onChange={handleChange} required placeholder="John Doe" />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="form-label">Phone Number</label>
                  <input type="tel" id="customerPhone" className="input-modern" value={formData.customerPhone} onChange={handleChange} required placeholder="9056273306" />
                </div>
              </div>

              {/* Pure Mappls Map with Native Search UI overlay */}
              <div className="relative mt-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl h-[500px] z-50">
                <div id="mainMap" ref={mapRef} className="w-full h-full absolute inset-0"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label htmlFor="date" className="form-label">Pickup Date</label>
                  <input type="date" id="date" className="input-modern cursor-pointer" value={formData.date} onChange={handleChange} required />
                </div>
                <div>
                  <label htmlFor="time" className="form-label">Pickup Time</label>
                  <input type="time" id="time" className="input-modern cursor-pointer" value={formData.time} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vehicleType" className="form-label">Vehicle Type</label>
                  <select id="vehicleType" className="input-modern bg-black/80" value={formData.vehicleType} onChange={handleChange} required>
                    <option value="Hatchback">Hatchback (Swift, i20)</option>
                    <option value="Sedan">Sedan (Dzire, Etios)</option>
                    <option value="SUV">SUV (Innova, Ertiga)</option>
                    <option value="Luxury">Luxury (BMW, Mercedes)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="passengers" className="form-label">Passengers</label>
                  <input type="number" id="passengers" className="input-modern" min="1" max="10" value={formData.passengers} onChange={handleChange} required />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="form-label">Special Instructions (Optional)</label>
                <textarea id="notes" rows="3" className="input-modern resize-none" value={formData.notes} onChange={handleChange} placeholder="Any special requests? (e.g., Carrier bag)"></textarea>
              </div>

              {distanceKm && estimatedFare && (
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 mt-6 flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Total Distance</p>
                    <p className="text-xl font-bold text-white">{distanceKm} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Estimated Fare</p>
                    <p className="text-2xl font-bold text-taxi-yellow">₹{estimatedFare}</p>
                  </div>
                </div>
              )}

              <button type="submit" className="w-full btn-primary mt-6 text-lg py-4" disabled={status === 'submitting'}>
                {status === 'submitting' ? (
                  <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...</>
                ) : (
                  <>Confirm Booking <i className="fa-solid fa-check ml-2"></i></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
