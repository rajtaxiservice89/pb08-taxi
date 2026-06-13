"use client";

import { useState, useEffect, useRef } from 'react';

export default function Booking() {
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', pickup: '', destination: '',
    date: '', time: '', vehicleType: 'Sedan', passengers: 1, notes: '',
    pickupLat: '', pickupLng: '', destLat: '', destLng: ''
  });
  const [status, setStatus] = useState('');
  
  const pickupMapRef = useRef(null);
  const dropMapRef = useRef(null);
  
  const mapLibreRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const pMapInstance = useRef(null);
  const dMapInstance = useRef(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  useEffect(() => {
    // Load maplibregl dynamically if not available
    if (typeof window !== 'undefined' && window.maplibregl) {
      mapLibreRef.current = window.maplibregl;
      initMaps();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
      script.async = true;
      script.onload = () => {
        mapLibreRef.current = window.maplibregl;
        initMaps();
      };
      document.body.appendChild(script);
    }
  }, []);

  const revGeocode = async (lat, lng) => {
    try{
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      return data?.display_name || '';
    } catch { return ''; }
  };

  const geocode = async (q) => {
    const query = `${q} India`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
    const data = await res.json();
    return data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name } : null;
  };

  const setPickup = async (lng, lat, addr) => {
    if(pickupMarkerRef.current) pickupMarkerRef.current.remove();
    pickupMarkerRef.current = new mapLibreRef.current.Marker({ color: '#2ecc71', draggable: true })
      .setLngLat([lng, lat])
      .addTo(pMapInstance.current);
    
    setFormData(prev => ({ ...prev, pickupLat: lat, pickupLng: lng, pickup: addr || prev.pickup }));
    
    pickupMarkerRef.current.on('dragend', async () => {
      const ll = pickupMarkerRef.current.getLngLat();
      const a = await revGeocode(ll.lat, ll.lng);
      setFormData(prev => ({ ...prev, pickupLat: ll.lat, pickupLng: ll.lng, pickup: a || prev.pickup }));
    });
  };

  const setDest = async (lng, lat, addr) => {
    if(destMarkerRef.current) destMarkerRef.current.remove();
    destMarkerRef.current = new mapLibreRef.current.Marker({ color: '#e74c3c', draggable: true })
      .setLngLat([lng, lat])
      .addTo(dMapInstance.current);
    
    setFormData(prev => ({ ...prev, destLat: lat, destLng: lng, destination: addr || prev.destination }));
    
    destMarkerRef.current.on('dragend', async () => {
      const ll = destMarkerRef.current.getLngLat();
      const a = await revGeocode(ll.lat, ll.lng);
      setFormData(prev => ({ ...prev, destLat: ll.lat, destLng: ll.lng, destination: a || prev.destination }));
    });
  };

  const initMaps = () => {
    if (!pickupMapRef.current || !dropMapRef.current || !mapLibreRef.current) return;
    if (pMapInstance.current) return; // already init

    const initial = { lng: 75.5762, lat: 31.3260, zoom: 12 };
    const rasterStyle = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [ { id: 'osm', type: 'raster', source: 'osm' } ]
    };

    pMapInstance.current = new mapLibreRef.current.Map({
      container: pickupMapRef.current, style: rasterStyle, center: [initial.lng, initial.lat], zoom: initial.zoom,
    });
    dMapInstance.current = new mapLibreRef.current.Map({
      container: dropMapRef.current, style: rasterStyle, center: [initial.lng, initial.lat], zoom: initial.zoom,
    });

    pMapInstance.current.addControl(new mapLibreRef.current.NavigationControl(), 'top-right');
    dMapInstance.current.addControl(new mapLibreRef.current.NavigationControl(), 'top-right');

    pMapInstance.current.on('click', async (e) => {
      const {lng, lat} = e.lngLat; 
      const a = await revGeocode(lat, lng); 
      setPickup(lng, lat, a);
    });
    
    dMapInstance.current.on('click', async (e) => {
      const {lng, lat} = e.lngLat; 
      const a = await revGeocode(lat, lng); 
      setDest(lng, lat, a);
    });
  };

  const handlePickupSearch = async () => {
    if(!formData.pickup.trim()) return;
    const r = await geocode(formData.pickup);
    if(r) { 
      setPickup(r.lng, r.lat, r.display); 
      if(pMapInstance.current) pMapInstance.current.flyTo({ center: [r.lng, r.lat], zoom: 14 }); 
    }
  };

  const handleDestSearch = async () => {
    if(!formData.destination.trim()) return;
    const r = await geocode(formData.destination);
    if(r) { 
      setDest(r.lng, r.lat, r.display); 
      if(dMapInstance.current) dMapInstance.current.flyTo({ center: [r.lng, r.lat], zoom: 14 }); 
    }
  };

  const handleCurrentLocation = () => {
    if(!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      if(pMapInstance.current) pMapInstance.current.flyTo({ center: [lng, lat], zoom: 15 });
      const a = await revGeocode(lat, lng);
      setPickup(lng, lat, a);
    }, () => { alert('Unable to get current location. Check permissions.'); });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setTimeout(() => { setStatus('success'); }, 1000);
  };

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-taxi-yellow/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 flex justify-center items-center">
        <div className="glass-panel w-full max-w-5xl rounded-2xl p-6 md:p-10">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Book Your <span className="text-taxi-yellow">Ride</span></h2>
            <p className="text-gray-400">Set your locations on the map or search addresses.</p>
          </div>

          {status === 'success' ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
              <p className="text-green-200">We've received your request. Our driver will contact you shortly.</p>
              <button onClick={() => setStatus('')} className="mt-6 btn-outline">Book Another Ride</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
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

              {/* Map Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {/* Pickup Map */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                  <label className="form-label mb-3 flex justify-between items-center">
                    <span><i className="fa-solid fa-location-crosshairs text-taxi-yellow mr-2"></i> Pickup Location</span>
                  </label>
                  <div className="flex mb-3 gap-2">
                    <input type="text" id="pickup" className="input-modern" value={formData.pickup} onChange={handleChange} required placeholder="Search or click map..." />
                    <button type="button" onClick={handlePickupSearch} className="btn-primary px-4"><i className="fa-solid fa-magnifying-glass"></i></button>
                  </div>
                  <div ref={pickupMapRef} className="w-full h-64 rounded-lg border border-white/20 mb-3" style={{ background: '#222' }}></div>
                  <button type="button" onClick={handleCurrentLocation} className="btn-outline w-full text-sm py-2">
                    <i className="fa-solid fa-location-arrow mr-2"></i> Use Current Location
                  </button>
                </div>

                {/* Drop Map */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                  <label className="form-label mb-3 flex justify-between items-center">
                    <span><i className="fa-solid fa-location-dot text-red-500 mr-2"></i> Drop-off Location</span>
                  </label>
                  <div className="flex mb-3 gap-2">
                    <input type="text" id="destination" className="input-modern" value={formData.destination} onChange={handleChange} required placeholder="Search or click map..." />
                    <button type="button" onClick={handleDestSearch} className="btn-primary px-4"><i className="fa-solid fa-magnifying-glass"></i></button>
                  </div>
                  <div ref={dropMapRef} className="w-full h-64 rounded-lg border border-white/20 mb-3" style={{ background: '#222' }}></div>
                  <p className="text-xs text-gray-400 text-center mt-2 italic">Click on map to drop destination pin</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label htmlFor="date" className="form-label">Pickup Date</label>
                  <input type="date" id="date" className="input-modern" value={formData.date} onChange={handleChange} required />
                </div>
                <div>
                  <label htmlFor="time" className="form-label">Pickup Time</label>
                  <input type="time" id="time" className="input-modern" value={formData.time} onChange={handleChange} required />
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
