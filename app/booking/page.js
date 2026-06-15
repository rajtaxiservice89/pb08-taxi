"use client";

import { useState, useEffect, useRef } from 'react';

export default function Booking() {
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', pickup: '', destination: '',
    date: '', time: '', vehicleType: 'Sedan', passengers: 1, notes: '',
    pickupLat: '', pickupLng: '', destLat: '', destLng: ''
  });
  const [status, setStatus] = useState('');
  const [distanceKm, setDistanceKm] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [fareSettings, setFareSettings] = useState(null);
  const [locationApiConfig, setLocationApiConfig] = useState({ provider: 'nominatim', apiKey: '' });
  const [configLoaded, setConfigLoaded] = useState(false);
  
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const pickupTimeoutRef = useRef(null);
  const dropTimeoutRef = useRef(null);
  
  const pickupMapRef = useRef(null);
  const dropMapRef = useRef(null);
  
  const mapLibreRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeSourceId = 'osrm-route';
  const routeLayerId = 'osrm-route-line';
  const pMapInstance = useRef(null);
  const dMapInstance = useRef(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    if (id === 'pickup') {
      if (pickupTimeoutRef.current) clearTimeout(pickupTimeoutRef.current);
      if (value.trim().length > 2) {
        pickupTimeoutRef.current = setTimeout(async () => {
          const results = await autocompleteSearch(value);
          setPickupSuggestions(results);
        }, 500);
      } else {
        setPickupSuggestions([]);
      }
    } else if (id === 'destination') {
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
      if (value.trim().length > 2) {
        dropTimeoutRef.current = setTimeout(async () => {
          const results = await autocompleteSearch(value);
          setDropSuggestions(results);
        }, 500);
      } else {
        setDropSuggestions([]);
      }
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

    // Re-calculate fare if vehicle type changes or fare settings load
    if (distanceKm !== null) {
      calculateFare(distanceKm, formData.vehicleType);
    }

    if (!configLoaded) return; // Wait for API config

    // Load maplibregl dynamically if not available
    if (typeof window !== 'undefined' && window.maplibregl) {
      mapLibreRef.current = window.maplibregl;
      initMaps();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
      
      const link = document.createElement('link');
      link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
      link.rel = 'stylesheet';

      script.async = true;
      script.onload = () => {
        mapLibreRef.current = window.maplibregl;
        initMaps();
      };
      document.head.appendChild(link);
      document.body.appendChild(script);
    }
  }, [formData.vehicleType, distanceKm, fareSettings, configLoaded, locationApiConfig]); // Re-run effect if config changes

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

  useEffect(() => {
    if (formData.pickupLat && formData.pickupLng && formData.destLat && formData.destLng) {
      fetchAndDrawRoute();
    }
  }, [formData.pickupLat, formData.pickupLng, formData.destLat, formData.destLng]);

  const fetchAndDrawRoute = async () => {
    try {
      let url = `https://router.project-osrm.org/route/v1/driving/${formData.pickupLng},${formData.pickupLat};${formData.destLng},${formData.destLat}?overview=full&geometries=geojson`;
      let headers = {};
      
      if (locationApiConfig.provider === 'mappls' && locationApiConfig.token) {
         url = `https://apis.mappls.com/advancedmaps/v1/${locationApiConfig.token}/route_adv/driving/${formData.pickupLng},${formData.pickupLat};${formData.destLng},${formData.destLat}?geometries=geojson`;
      }
      
      const res = await fetch(url, { headers });
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = (route.distance / 1000).toFixed(1);
        setDistanceKm(distKm);
        calculateFare(distKm, formData.vehicleType);

        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        };

        drawRouteOnMap(pMapInstance.current, geojson);
        drawRouteOnMap(dMapInstance.current, geojson);
      }
    } catch (err) {
      console.error("Failed to fetch route", err);
    }
  };

  const drawRouteOnMap = (mapInst, geojson) => {
    if (!mapInst) return;
    
    if (mapInst.getSource(routeSourceId)) {
      mapInst.getSource(routeSourceId).setData(geojson);
    } else {
      mapInst.addSource(routeSourceId, {
        type: 'geojson',
        data: geojson
      });
      mapInst.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6', // blue
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }

    // Fit map bounds to the route
    const coordinates = geojson.geometry.coordinates;
    const bounds = coordinates.reduce((b, coord) => {
      return b.extend(coord);
    }, new mapLibreRef.current.LngLatBounds(coordinates[0], coordinates[0]));
    
    mapInst.fitBounds(bounds, { padding: 40 });
  };

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
    
    // Add vehicle type multiplier if needed (optional)
    if (vType === 'Hatchback') total = Math.round(total * 0.9);
    else if (vType === 'SUV') total = Math.round(total * 1.2);
    else if (vType === 'Luxury') total = Math.round(total * 1.5);

    setEstimatedFare(total);
  };

  const revGeocode = async (lat, lng) => {
    try{
      if (locationApiConfig.provider === 'mappls' && locationApiConfig.token) {
         try {
           const url = `https://apis.mappls.com/advancedmaps/v1/${locationApiConfig.token}/rev_geocode?lat=${lat}&lng=${lng}`;
           const res = await fetch(url);
           const data = await res.json();
           if (data.results && data.results.length > 0) {
              return data.results[0].formatted_address;
           }
         } catch(e) { console.error("Mappls RevGeocode Error:", e); }
         // Fallback to Nominatim
         const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
         const res = await fetch(url);
         const data = await res.json();
         return data.display_name || `${lat}, ${lng}`;
      }

      let keys = [locationApiConfig.apiKey];
      if (locationApiConfig.apiKey && locationApiConfig.apiKey.includes(',')) {
         keys = locationApiConfig.apiKey.split(',').map(k => k.trim());
         keys.sort(() => 0.5 - Math.random()); // shuffle for load balancing
      }

      if (locationApiConfig.provider === 'geoapify' && keys.length > 0) {
        for (const key of keys) {
          const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${key}&format=json`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (res.status === 401 || res.status === 429 || res.status === 403) continue;
          const data = await res.json();
          if (data.results && data.results.length > 0) return data.results[0].formatted || '';
          return '';
        }
        return '';
      }

      let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      if (locationApiConfig.provider === 'locationiq' && locationApiConfig.apiKey) {
        url = `https://us1.locationiq.com/v1/reverse?key=${locationApiConfig.apiKey}&lat=${lat}&lon=${lng}&format=json`;
      }
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      return data?.display_name || '';
    } catch { return ''; }
  };

  const autocompleteSearch = async (q) => {
    try {
      if (locationApiConfig.provider === 'mappls' && locationApiConfig.token) {
         try {
           const url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(q)}&region=IND`;
           const res = await fetch(url, { headers: { 'Authorization': `bearer ${locationApiConfig.token}` }});
           const data = await res.json();
           if (data.suggestedLocations) {
              return data.suggestedLocations.map(r => ({
                 lat: parseFloat(r.latitude),
                 lng: parseFloat(r.longitude),
                 display: r.placeName + (r.placeAddress ? `, ${r.placeAddress}` : '')
              }));
           }
         } catch(e) { console.error("Mappls Autocomplete Error:", e); }
         // If Mappls fails or returns empty, fallback to Nominatim
         const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
         const res = await fetch(url);
         const data = await res.json();
         if (data && data.length > 0) {
            return data.map(r => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display: r.display_name }));
         }
         return [];
      }

      let keys = [locationApiConfig.apiKey];
      if (locationApiConfig.apiKey && locationApiConfig.apiKey.includes(',')) {
         keys = locationApiConfig.apiKey.split(',').map(k => k.trim());
         keys.sort(() => 0.5 - Math.random());
      }

      if (locationApiConfig.provider === 'geoapify' && keys.length > 0) {
        for (const key of keys) {
           const query = encodeURIComponent(q);
           const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${key}&format=json`;
           const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
           if (res.status === 401 || res.status === 429 || res.status === 403) continue;
           const data = await res.json();
           if (data.results && data.results.length > 0) {
             return data.results.map(r => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display: r.formatted || '' }));
           }
           return [];
        }
        return [];
      }

      let data = [];
      if (locationApiConfig.provider === 'locationiq' && locationApiConfig.apiKey) {
        const url = `https://us1.locationiq.com/v1/autocomplete?key=${locationApiConfig.apiKey}&q=${encodeURIComponent(q)}&format=json&countrycodes=in`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
        data = await res.json();
        if (data.error) return [];
      } else {
        const query = `${q} India`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
        data = await res.json();
      }
      
      if (data && data.length > 0) {
        return data.slice(0, 5).map(r => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display: r.display_name || r.display_place || r.name || '' }));
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const geocode = async (q) => {
    try {
      if (locationApiConfig.provider === 'mappls' && locationApiConfig.token) {
         try {
           const url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(q)}&region=IND`;
           const res = await fetch(url, { headers: { 'Authorization': `bearer ${locationApiConfig.token}` }});
           const data = await res.json();
           if (data.suggestedLocations && data.suggestedLocations.length > 0) {
              const r = data.suggestedLocations[0];
              return { lat: parseFloat(r.latitude), lng: parseFloat(r.longitude), display: r.placeName + (r.placeAddress ? `, ${r.placeAddress}` : '') };
           }
         } catch(e) { console.error("Mappls Geocode Error:", e); }
         // Fallback to Nominatim
         const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
         const res = await fetch(url);
         const data = await res.json();
         if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
         }
         return null;
      }

      let keys = [locationApiConfig.apiKey];
      if (locationApiConfig.apiKey && locationApiConfig.apiKey.includes(',')) {
         keys = locationApiConfig.apiKey.split(',').map(k => k.trim());
         keys.sort(() => 0.5 - Math.random());
      }

      if (locationApiConfig.provider === 'geoapify' && keys.length > 0) {
        for (const key of keys) {
           const query = encodeURIComponent(q);
           // Using search with India filter, or just autocomplete.
           const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${key}&format=json`;
           const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
           if (res.status === 401 || res.status === 429 || res.status === 403) continue;
           const data = await res.json();
           if (data.results && data.results.length > 0) {
             return { lat: parseFloat(data.results[0].lat), lng: parseFloat(data.results[0].lon), display: data.results[0].formatted || '' };
           }
           return null;
        }
        return null;
      }

      let data = [];
      if (locationApiConfig.provider === 'locationiq' && locationApiConfig.apiKey) {
        // Use search endpoint which is stricter than autocomplete
        const query = `${q}`;
        const url = `https://us1.locationiq.com/v1/search?key=${locationApiConfig.apiKey}&q=${encodeURIComponent(query)}&format=json&countrycodes=in`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
        data = await res.json();
        if (data.error) return null;
      } else {
        const query = `${q} India`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
        data = await res.json();
      }
      
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name || data[0].display_place || data[0].name || '' };
      }
      return null;
    } catch (e) {
      console.error("Geocode error", e);
      return null;
    }
  };

  const setPickup = async (lng, lat, addr) => {
    if(pickupMarkerRef.current) pickupMarkerRef.current.remove();
    pickupMarkerRef.current = new mapLibreRef.current.Marker({ color: '#22c55e', draggable: true })
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
    destMarkerRef.current = new mapLibreRef.current.Marker({ color: '#ef4444', draggable: true })
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
    
    let finalStyle = {
      version: 8,
      sources: {
        baseMap: {
          type: 'raster',
          tiles: locationApiConfig.provider === 'locationiq' && locationApiConfig.apiKey
            ? [`https://tiles-eu.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${locationApiConfig.apiKey}`]
            : [
              'https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
              'https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
              'https://mt2.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
              'https://mt3.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}'
            ],
          tileSize: 256,
          attribution: locationApiConfig.provider === 'locationiq' ? 'Map data © LocationIQ & OpenStreetMap' : 'Map data © Google'
        }
      },
      layers: [ { id: 'baseMap', type: 'raster', source: 'baseMap' } ]
    };

    if (locationApiConfig.provider === 'geoapify' && locationApiConfig.apiKey) {
      let keys = [locationApiConfig.apiKey];
      if (locationApiConfig.apiKey.includes(',')) {
         keys = locationApiConfig.apiKey.split(',').map(k => k.trim());
      }
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      finalStyle = `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${randomKey}`;
    }

    pMapInstance.current = new mapLibreRef.current.Map({
      container: pickupMapRef.current, style: finalStyle, center: [initial.lng, initial.lat], zoom: initial.zoom,
    });
    dMapInstance.current = new mapLibreRef.current.Map({
      container: dropMapRef.current, style: finalStyle, center: [initial.lng, initial.lat], zoom: initial.zoom,
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
    } else {
      alert("Location not found. Please try zooming in and clicking on the map manually.");
    }
  };

  const handleDestSearch = async () => {
    if(!formData.destination.trim()) return;
    const r = await geocode(formData.destination);
    if(r) { 
      setDest(r.lng, r.lat, r.display); 
      if(dMapInstance.current) dMapInstance.current.flyTo({ center: [r.lng, r.lat], zoom: 14 }); 
    } else {
      alert("Location not found. Please try zooming in and clicking on the map manually.");
    }
  };

  const handleCurrentLocation = () => {
    if(!navigator.geolocation) { alert('Geolocation not supported'); return; }
    
    setFormData(prev => ({ ...prev, pickup: 'Fetching current location...' }));
    
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      if(pMapInstance.current) pMapInstance.current.flyTo({ center: [lng, lat], zoom: 15 });
      const a = await revGeocode(lat, lng);
      setPickup(lng, lat, a || `${lat}, ${lng}`);
    }, () => { 
      setFormData(prev => ({ ...prev, pickup: '' }));
      alert('Unable to get current location. Check browser permissions.'); 
    }, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          pickup: formData.pickup,
          destination: formData.destination,
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
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      {/* Background Decor */}
      <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-taxi-yellow/10 rounded-full blur-[100px] pointer-events-none"></div>

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
              <button onClick={() => {
                setStatus('');
                setFormData(prev => ({...prev, customerName: '', customerPhone: '', pickup: '', destination: ''}));
              }} className="mt-6 btn-outline">Book Another Ride</button>
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
                <div className="bg-black/30 p-4 rounded-xl border border-white/10 relative">
                  <label className="form-label mb-3 flex justify-between items-center">
                    <span><i className="fa-solid fa-location-crosshairs text-taxi-yellow mr-2"></i> Pickup Location</span>
                  </label>
                  <div className="mb-3 relative">
                    <div className="flex gap-2">
                      <input type="text" id="pickup" className="input-modern flex-grow" value={formData.pickup} onChange={handleChange} onFocus={() => {if (pickupSuggestions.length > 0) setPickupSuggestions([...pickupSuggestions]);}} required placeholder="Search pickup..." />
                      <button type="button" onClick={handleCurrentLocation} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-lg transition-colors border border-white/10" title="Use Current Location">
                        <i className="fa-solid fa-location-crosshairs text-taxi-yellow"></i>
                      </button>
                      <button type="button" onClick={handlePickupSearch} className="bg-taxi-yellow text-black px-4 rounded-lg hover:bg-yellow-400 transition-colors" title="Search on Map">
                        <i className="fa-solid fa-search"></i>
                      </button>
                    </div>
                    {pickupSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-black/95 border border-white/20 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl top-full">
                        {pickupSuggestions.map((s, i) => (
                          <div key={i} onClick={() => {
                            setPickup(s.lng, s.lat, s.display);
                            if(pMapInstance.current) pMapInstance.current.flyTo({ center: [s.lng, s.lat], zoom: 15 });
                            setPickupSuggestions([]);
                          }} className="p-3 border-b border-white/10 hover:bg-white/10 cursor-pointer text-sm text-gray-200 flex items-start gap-3 transition-colors">
                            <i className="fa-solid fa-location-dot mt-1 text-taxi-yellow"></i> 
                            <span>{s.display}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div ref={pickupMapRef} className="w-full h-64 rounded-lg border border-white/20 mb-3" style={{ background: '#222' }}></div>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2 italic">Click or drag pin on map to set pickup location</p>
                </div>

                {/* Drop Map */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/10 relative">
                  <label className="form-label mb-3 flex justify-between items-center">
                    <span><i className="fa-solid fa-location-dot text-red-500 mr-2"></i> Drop-off Location</span>
                  </label>
                  <div className="mb-3 relative">
                    <div className="flex gap-2">
                      <input type="text" id="destination" className="input-modern flex-grow" value={formData.destination} onChange={handleChange} onFocus={() => {if (dropSuggestions.length > 0) setDropSuggestions([...dropSuggestions]);}} required placeholder="Search destination..." />
                      <button type="button" onClick={handleDestSearch} className="bg-taxi-yellow text-black px-4 rounded-lg hover:bg-yellow-400 transition-colors" title="Search on Map">
                        <i className="fa-solid fa-search"></i>
                      </button>
                    </div>
                    {dropSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-black/95 border border-white/20 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl top-full">
                        {dropSuggestions.map((s, i) => (
                          <div key={i} onClick={() => {
                            setDest(s.lng, s.lat, s.display);
                            if(dMapInstance.current) dMapInstance.current.flyTo({ center: [s.lng, s.lat], zoom: 15 });
                            setDropSuggestions([]);
                          }} className="p-3 border-b border-white/10 hover:bg-white/10 cursor-pointer text-sm text-gray-200 flex items-start gap-3 transition-colors">
                            <i className="fa-solid fa-location-dot mt-1 text-red-500"></i> 
                            <span>{s.display}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div ref={dropMapRef} className="w-full h-64 rounded-lg border border-white/20 mb-3" style={{ background: '#222' }}></div>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2 italic">Click or drag pin on map to set destination</p>
                </div>
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
