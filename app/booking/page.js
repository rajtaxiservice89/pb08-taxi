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
  
  
  const mapRef = useRef(null);
  
  const mapLibreRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeSourceId = 'osrm-route';
  const routeLayerId = 'osrm-route-line';
  const mapInstance = useRef(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };



  const handleKeyDown = async (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (locationApiConfig.provider === 'mappls') {
          // Let the Mappls plugin handle the Enter key natively.
          return;
      }

      const el = document.getElementById(type);
      const query = el ? el.value : '';
      if (!query.trim()) return;
      
      // Update form data so we have the latest text even if geocode fails
      if (type === 'pickup') {
          setFormData(prev => ({ ...prev, pickup: query }));
      } else {
          setFormData(prev => ({ ...prev, destination: query }));
      }

      const r = await geocode(query);
      if (r) {
        if (type === 'pickup') {
          setPickup(r.lng, r.lat, r.display);
          if (mapInstance.current) mapInstance.current.flyTo({ center: [r.lng, r.lat], zoom: 14 });
        } else {
          setDest(r.lng, r.lat, r.display);
          if (mapInstance.current) mapInstance.current.flyTo({ center: [r.lng, r.lat], zoom: 14 });
        }
      } else {
        alert("Location not found. Please try zooming in and clicking on the map manually.");
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

    const loadMappls = () => {
      if (locationApiConfig.provider === 'mappls') {
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
        return;
      }
    };

    const loadMapLibre = () => {
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
    };

    if (locationApiConfig.provider === 'mappls') {
       if (window.isMapplsLoaded) initMaps();
       else loadMappls();
    } else {
       loadMapLibre();
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
      
      if (locationApiConfig.provider === 'mappls') {
         // Direct Mappls routing requires OAuth; if needed, implement REST proxy, otherwise use OSRM backend via API
         // Here we just keep standard OSRM for now as it doesn't use Nominatim (routing only)
         url = `https://router.project-osrm.org/route/v1/driving/${formData.pickupLng},${formData.pickupLat};${formData.destLng},${formData.destLat}?overview=full&geometries=geojson`;
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

        drawRouteOnMap(mapInstance.current, geojson);
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
      if (locationApiConfig.provider === 'mappls') {
           return "Location found";
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

      let url = '';
      if (locationApiConfig.provider === 'locationiq' && locationApiConfig.apiKey) {
        url = `https://us1.locationiq.com/v1/reverse?key=${locationApiConfig.apiKey}&lat=${lat}&lon=${lng}&format=json`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        return data?.display_name || '';
      }
      return '';
    } catch { return ''; }
  };

  const autocompleteSearch = async (q) => {
    try {
      if (locationApiConfig.provider === 'mappls') {
           // Mappls auto complete proxy
           if (locationApiConfig.token) {
               try {
                   const res = await fetch(`/api/mappls/geocode?query=${encodeURIComponent(q)}&token=${locationApiConfig.token}`);
                   const data = await res.json();
                   if (data.suggestedLocations && data.suggestedLocations.length > 0) {
                       return data.suggestedLocations.map(r => ({
                           lat: parseFloat(r.latitude || r.lat || r.y || 0),
                           lng: parseFloat(r.longitude || r.lng || r.x || 0),
                           display: r.placeName + (r.placeAddress ? `, ${r.placeAddress}` : '')
                       }));
                   }
               } catch (e) { console.error('Mappls proxy auto fail', e); }
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
           const url = `/api/mappls/geocode?query=${encodeURIComponent(q)}&token=${locationApiConfig.token}`;
           const res = await fetch(url);
           const data = await res.json();
           if (data.suggestedLocations && data.suggestedLocations.length > 0) {
              const r = data.suggestedLocations[0];
              return { lat: parseFloat(r.latitude || r.lat || r.y || 0), lng: parseFloat(r.longitude || r.lng || r.x || 0), display: r.placeName + (r.placeAddress ? `, ${r.placeAddress}` : '') };
           }
         } catch(e) { console.error("Mappls Geocode Error:", e); }
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
    const finalAddr = addr || formData.pickup;
    setFormData(prev => ({ ...prev, pickupLat: lat, pickupLng: lng, pickup: finalAddr }));
    const pEl = document.getElementById('pickup');
    if (pEl && finalAddr && finalAddr !== 'Fetching current location...') pEl.value = finalAddr;

    if(pickupMarkerRef.current) {
        try { pickupMarkerRef.current.remove(); } catch(e) {}
        try { pickupMarkerRef.current.setMap(null); } catch(e) {}
    }
    if (locationApiConfig.provider === 'mappls') {
       pickupMarkerRef.current = new window.mappls.Marker({ map: mapInstance.current, position: {lat, lng}, draggable: true, icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' });
       const attachDrag = (m) => m.addListener ? m.addListener('dragend', async () => {
          const ll = pickupMarkerRef.current.getPosition();
          const a = await revGeocode(ll.lat, ll.lng);
          const newAddr = a || formData.pickup;
          setFormData(prev => ({ ...prev, pickupLat: ll.lat, pickupLng: ll.lng, pickup: newAddr }));
          const pEl = document.getElementById('pickup');
          if (pEl && a) pEl.value = a;
       }) : m.on('dragend', async () => {
          const ll = pickupMarkerRef.current.getPosition ? pickupMarkerRef.current.getPosition() : pickupMarkerRef.current.getLngLat();
          const a = await revGeocode(ll.lat || ll.lat, ll.lng || ll.lng);
          const newAddr = a || formData.pickup;
          setFormData(prev => ({ ...prev, pickupLat: ll.lat, pickupLng: ll.lng, pickup: newAddr }));
          const pEl = document.getElementById('pickup');
          if (pEl && a) pEl.value = a;
       });
       attachDrag(pickupMarkerRef.current);
    } else {
       pickupMarkerRef.current = new mapLibreRef.current.Marker({ color: '#22c55e', draggable: true })
         .setLngLat([lng, lat])
         .addTo(mapInstance.current);
       pickupMarkerRef.current.on('dragend', async () => {
         const ll = pickupMarkerRef.current.getLngLat();
         const a = await revGeocode(ll.lat, ll.lng);
         const newAddr = a || formData.pickup;
         setFormData(prev => ({ ...prev, pickupLat: ll.lat, pickupLng: ll.lng, pickup: newAddr }));
         const pEl = document.getElementById('pickup');
         if (pEl && a) pEl.value = a;
       });
    }
  };

  const setDest = async (lng, lat, addr) => {
    const finalAddr = addr || formData.destination;
    setFormData(prev => ({ ...prev, destLat: lat, destLng: lng, destination: finalAddr }));
    const dEl = document.getElementById('destination');
    if (dEl && finalAddr) dEl.value = finalAddr;

    if(destMarkerRef.current) {
        try { destMarkerRef.current.remove(); } catch(e) {}
        try { destMarkerRef.current.setMap(null); } catch(e) {}
    }
    if (locationApiConfig.provider === 'mappls') {
       destMarkerRef.current = new window.mappls.Marker({ map: mapInstance.current, position: {lat, lng}, draggable: true, icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' });
       const attachDrag = (m) => m.addListener ? m.addListener('dragend', async () => {
          const ll = destMarkerRef.current.getPosition();
          const a = await revGeocode(ll.lat, ll.lng);
          const newAddr = a || formData.destination;
          setFormData(prev => ({ ...prev, destLat: ll.lat, destLng: ll.lng, destination: newAddr }));
          const dEl = document.getElementById('destination');
          if (dEl && a) dEl.value = a;
       }) : m.on('dragend', async () => {
          const ll = destMarkerRef.current.getPosition ? destMarkerRef.current.getPosition() : destMarkerRef.current.getLngLat();
          const a = await revGeocode(ll.lat || ll.lat, ll.lng || ll.lng);
          const newAddr = a || formData.destination;
          setFormData(prev => ({ ...prev, destLat: ll.lat, destLng: ll.lng, destination: newAddr }));
          const dEl = document.getElementById('destination');
          if (dEl && a) dEl.value = a;
       });
       attachDrag(destMarkerRef.current);
    } else {
       destMarkerRef.current = new mapLibreRef.current.Marker({ color: '#ef4444', draggable: true })
         .setLngLat([lng, lat])
         .addTo(mapInstance.current);
       destMarkerRef.current.on('dragend', async () => {
         const ll = destMarkerRef.current.getLngLat();
         const a = await revGeocode(ll.lat, ll.lng);
         const newAddr = a || formData.destination;
         setFormData(prev => ({ ...prev, destLat: ll.lat, destLng: ll.lng, destination: newAddr }));
         const dEl = document.getElementById('destination');
         if (dEl && a) dEl.value = a;
       });
    }
  };

  const initMaps = () => {
    if (!mapRef.current) return;
    if (locationApiConfig.provider !== 'mappls' && !mapLibreRef.current) return;
    if (mapInstance.current) return; // already init

    const initial = { lng: 75.5762, lat: 31.3260, zoom: 12 };
    
    let finalStyle = {
      version: 8,
      sources: {
        baseMap: {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}'
          ],
          tileSize: 256,
          attribution: 'Map data © Google'
        }
      },
      layers: [ { id: 'baseMap', type: 'raster', source: 'baseMap' } ]
    };

    if (locationApiConfig.provider === 'locationiq' && locationApiConfig.apiKey) {
      finalStyle = `https://tiles.locationiq.com/v3/streets/raster.json?key=${locationApiConfig.apiKey}`;
    }

    if (locationApiConfig.provider === 'geoapify' && locationApiConfig.apiKey) {
      let keys = [locationApiConfig.apiKey];
      if (locationApiConfig.apiKey.includes(',')) {
         keys = locationApiConfig.apiKey.split(',').map(k => k.trim());
      }
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      finalStyle = `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${randomKey}`;
    }

    if (locationApiConfig.provider === 'mappls') {
       if (!window.mappls) return;
       try {
           mapInstance.current = new window.mappls.Map('mainMap', { center: [initial.lat, initial.lng], zoom: initial.zoom });
           
           mapInstance.current.addListener('click', async (e) => {
             const lat = e.lngLat.lat; const lng = e.lngLat.lng;
             const a = await revGeocode(lat, lng);
             // By default set pickup if it's empty, else drop
             if (!formData.pickup || formData.pickup === 'Fetching current location...') {
                 setPickup(lng, lat, a);
             } else {
                 setDest(lng, lat, a);
             }
           });
       } catch (err) {
           console.error("Mappls Init Error:", err);
       }
       
       // Attach Mappls Search Plugin to the input fields if available
       if (window.mappls.search) {
          setTimeout(() => {
            const processLocationData = async (type, r) => {
                if (!r) return;
                let lat = parseFloat(r.latitude || r.lat || r.y || r.latPos || 0);
                let lng = parseFloat(r.longitude || r.lng || r.lon || r.x || r.lonPos || 0);
                const name = r.placeName || r.placeAddress || r.eLoc || r.name || '';
                const eLoc = r.eLoc || r.mapplsPin || r.poiId;

                // If coordinates are missing, it will fall back to geocode API

                if (lat && lng) {
                    if (type === 'pickup') {
                        setPickup(lng, lat, name);
                    } else {
                        setDest(lng, lat, name);
                    }
                    if(mapInstance.current) {
                        mapInstance.current.setCenter({lat, lng});
                        mapInstance.current.setZoom(14);
                    }
                } else {
                    // Final fallback
                    const fallbackData = await geocode(name);
                    if (fallbackData) {
                        if (type === 'pickup') setPickup(fallbackData.lng, fallbackData.lat, name);
                        else setDest(fallbackData.lng, fallbackData.lat, name);
                        if(mapInstance.current) mapInstance.current.setCenter({lat: fallbackData.lat, lng: fallbackData.lng});
                    }
                }
            };

            const handlePluginData = (type, data) => {
               if(data) {
                  let r = null;
                  if (Array.isArray(data)) r = data[0];
                  else if (data.data && Array.isArray(data.data)) r = data.data[0];
                  else if (data.suggestedLocations && Array.isArray(data.suggestedLocations)) r = data.suggestedLocations[0];
                  else r = data;

                  processLocationData(type, r);
               }
            };

            const pInput = document.getElementById('pickup');
            if (pInput) {
               new window.mappls.search(pInput, { region: "IND" }, (data) => {
                  handlePluginData('pickup', data);
               });
            }

            const dInput = document.getElementById('destination');
            if (dInput) {
               new window.mappls.search(dInput, { region: "IND" }, (data) => {
                  handlePluginData('destination', data);
               });
            }
          }, 1000);
       }
       
    } else {
       // MapLibre Maps
       mapInstance.current = new mapLibreRef.current.Map({
         container: mapRef.current, style: finalStyle, center: [initial.lng, initial.lat], zoom: initial.zoom,
       });

       mapInstance.current.addControl(new mapLibreRef.current.NavigationControl(), 'top-right');

       mapInstance.current.on('click', async (e) => {
         const {lng, lat} = e.lngLat; 
         const a = await revGeocode(lat, lng); 
         if (!formData.pickup || formData.pickup === 'Fetching current location...') {
             setPickup(lng, lat, a);
         } else {
             setDest(lng, lat, a);
         }
       });
    }
  };



  const handleCurrentLocation = () => {
    if(!navigator.geolocation) { alert('Geolocation not supported'); return; }
    
    setFormData(prev => ({ ...prev, pickup: 'Fetching current location...' }));
    
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      if(mapInstance.current) mapInstance.current.flyTo({ center: [lng, lat], zoom: 15 });
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

              {/* Ola-style Map & Booking Section */}
              <div className="relative mt-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row h-[500px] z-50">
                
                {/* Side Panel for Inputs */}
                <div className="w-full md:w-1/3 bg-[#111] p-6 flex flex-col z-10 border-b md:border-b-0 md:border-r border-white/10 shadow-2xl relative">
                  <h3 className="text-xl font-bold text-white mb-6">Where to?</h3>
                  
                  <div className="relative flex flex-col gap-5">
                    {/* Connecting Line */}
                    <div className="absolute left-[11px] top-[24px] bottom-[24px] w-[2px] bg-gray-800 z-0"></div>
                    
                    {/* Pickup Input Group */}
                    <div className="relative z-10 flex items-center bg-black border border-white/10 rounded-lg p-3 focus-within:border-taxi-yellow transition-colors shadow-inner">
                      <div className="w-6 flex justify-center mr-2">
                         <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      </div>
                      <input type="text" id="pickup" className="bg-transparent border-none outline-none text-white w-full text-sm placeholder-gray-500" defaultValue={formData.pickup} onBlur={(e) => setFormData(prev => ({...prev, pickup: e.target.value}))} onKeyDown={(e) => handleKeyDown(e, 'pickup')} required placeholder="Search Pickup Location" />
                      <button type="button" onClick={handleCurrentLocation} className="text-gray-400 hover:text-taxi-yellow px-2 transition-colors" title="Use Current Location">
                        <i className="fa-solid fa-location-crosshairs"></i>
                      </button>
                    </div>

                    {/* Drop Input Group */}
                    <div className="relative z-10 flex items-center bg-black border border-white/10 rounded-lg p-3 focus-within:border-red-500 transition-colors shadow-inner">
                      <div className="w-6 flex justify-center mr-2">
                         <div className="w-3 h-3 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                      </div>
                      <input type="text" id="destination" className="bg-transparent border-none outline-none text-white w-full text-sm placeholder-gray-500" defaultValue={formData.destination} onBlur={(e) => setFormData(prev => ({...prev, destination: e.target.value}))} onKeyDown={(e) => handleKeyDown(e, 'destination')} required placeholder="Search Drop Location" />
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6">
                    <p className="text-[11px] text-gray-500 leading-tight text-center bg-white/5 p-3 rounded-lg border border-white/5">
                      <i className="fa-solid fa-circle-info mr-1"></i> Select from suggestions or press Enter. You can also click the map to set a pin.
                    </p>
                  </div>
                </div>

                {/* Main Map */}
                <div className="w-full md:w-2/3 h-full relative bg-[#222]">
                  <div id="mainMap" ref={mapRef} className="w-full h-full absolute inset-0"></div>
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
