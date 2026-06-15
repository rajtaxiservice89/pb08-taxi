import re

with open('app/booking/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the dynamic MapLibre script loading with conditional loading
new_use_effect_scripts = """    if (!configLoaded) return; // Wait for API config

    const loadMappls = () => {
      const script = document.createElement('script');
      script.src = `https://apis.mappls.com/advancedmaps/api/${locationApiConfig.token || locationApiConfig.apiKey}/map_sdk?layer=vector&v=3.0`;
      script.async = true;
      script.onload = () => {
         const pluginScript = document.createElement('script');
         pluginScript.src = `https://apis.mappls.com/advancedmaps/api/${locationApiConfig.token || locationApiConfig.apiKey}/map_sdk_plugins?v=3.0&libraries=search`;
         pluginScript.async = true;
         pluginScript.onload = () => {
            window.isMapplsLoaded = true;
            initMaps();
         };
         document.body.appendChild(pluginScript);
      };
      document.body.appendChild(script);
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
    }"""

content = re.sub(r'    if \(!configLoaded\) return; // Wait for API config.*?document\.body\.appendChild\(script\);\n    }', new_use_effect_scripts, content, flags=re.DOTALL)


# Update initMaps
old_init_maps = r"    pMapInstance\.current = new mapLibreRef\.current\.Map\({.*?dMapInstance\.current\.on\('click', async \(e\) => {.*?setDest\(lng, lat, a\);\n    }\);"
new_init_maps = """    if (locationApiConfig.provider === 'mappls') {
       if (!window.mappls) return;
       // Mappls Native Map
       pMapInstance.current = new window.mappls.Map(pickupMapRef.current, { center: [initial.lat, initial.lng], zoom: initial.zoom });
       dMapInstance.current = new window.mappls.Map(dropMapRef.current, { center: [initial.lat, initial.lng], zoom: initial.zoom });
       
       pMapInstance.current.addListener('click', async (e) => {
          const lat = e.lngLat.lat, lng = e.lngLat.lng;
          const a = await revGeocode(lat, lng);
          setPickup(lng, lat, a);
       });
       dMapInstance.current.addListener('click', async (e) => {
          const lat = e.lngLat.lat, lng = e.lngLat.lng;
          const a = await revGeocode(lat, lng);
          setDest(lng, lat, a);
       });
       
       // Attach Mappls Search Plugin to the input fields if available
       if (window.mappls.search) {
          setTimeout(() => {
            new window.mappls.search({ keyword: '', input: 'pickup' }, (data) => {
               if(data && data.length > 0) {
                  const r = data[0];
                  setPickup(r.longitude, r.latitude, r.placeName);
                  pMapInstance.current.setCenter({lat: r.latitude, lng: r.longitude});
               }
            });
            new window.mappls.search({ keyword: '', input: 'destination' }, (data) => {
               if(data && data.length > 0) {
                  const r = data[0];
                  setDest(r.longitude, r.latitude, r.placeName);
                  dMapInstance.current.setCenter({lat: r.latitude, lng: r.longitude});
               }
            });
          }, 1000);
       }
       
    } else {
       // MapLibre Maps
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
    }"""

content = re.sub(old_init_maps, new_init_maps, content, flags=re.DOTALL)


# Update Markers for Mappls
old_set_pickup = r"    pickupMarkerRef\.current = new mapLibreRef\.current\.Marker\(\{ color: '#22c55e', draggable: true \}\)\n      \.setLngLat\(\[lng, lat\]\)\n      \.addTo\(pMapInstance\.current\);"
new_set_pickup = """    if (locationApiConfig.provider === 'mappls') {
       pickupMarkerRef.current = new window.mappls.Marker({ map: pMapInstance.current, position: {lat, lng}, draggable: true, icon: 'https://apis.mapmyindia.com/map_v3/1.png' });
       pickupMarkerRef.current.addListener('dragend', async (e) => {
          const ll = pickupMarkerRef.current.getPosition();
          const a = await revGeocode(ll.lat, ll.lng);
          setFormData(prev => ({ ...prev, pickupLat: ll.lat, pickupLng: ll.lng, pickup: a || prev.pickup }));
       });
    } else {
       pickupMarkerRef.current = new mapLibreRef.current.Marker({ color: '#22c55e', draggable: true })
         .setLngLat([lng, lat])
         .addTo(pMapInstance.current);
       pickupMarkerRef.current.on('dragend', async () => {
         const ll = pickupMarkerRef.current.getLngLat();
         const a = await revGeocode(ll.lat, ll.lng);
         setFormData(prev => ({ ...prev, pickupLat: ll.lat, pickupLng: ll.lng, pickup: a || prev.pickup }));
       });
    }"""
content = re.sub(r"    pickupMarkerRef\.current = new mapLibreRef\.current\.Marker.*?setFormData\(prev => \(\{ \.\.\.prev, pickupLat: ll\.lat, pickupLng: ll\.lng, pickup: a \|\| prev\.pickup \}\)\);\n    \}\);", new_set_pickup, content, flags=re.DOTALL)

old_set_dest = r"    destMarkerRef\.current = new mapLibreRef\.current\.Marker\(\{ color: '#ef4444', draggable: true \}\)\n      \.setLngLat\(\[lng, lat\]\)\n      \.addTo\(dMapInstance\.current\);"
new_set_dest = """    if (locationApiConfig.provider === 'mappls') {
       destMarkerRef.current = new window.mappls.Marker({ map: dMapInstance.current, position: {lat, lng}, draggable: true, icon: 'https://apis.mapmyindia.com/map_v3/2.png' });
       destMarkerRef.current.addListener('dragend', async (e) => {
          const ll = destMarkerRef.current.getPosition();
          const a = await revGeocode(ll.lat, ll.lng);
          setFormData(prev => ({ ...prev, destLat: ll.lat, destLng: ll.lng, destination: a || prev.destination }));
       });
    } else {
       destMarkerRef.current = new mapLibreRef.current.Marker({ color: '#ef4444', draggable: true })
         .setLngLat([lng, lat])
         .addTo(dMapInstance.current);
       destMarkerRef.current.on('dragend', async () => {
         const ll = destMarkerRef.current.getLngLat();
         const a = await revGeocode(ll.lat, ll.lng);
         setFormData(prev => ({ ...prev, destLat: ll.lat, destLng: ll.lng, destination: a || prev.destination }));
       });
    }"""
content = re.sub(r"    destMarkerRef\.current = new mapLibreRef\.current\.Marker.*?setFormData\(prev => \(\{ \.\.\.prev, destLat: ll\.lat, destLng: ll\.lng, destination: a \|\| prev\.destination \}\)\);\n    \}\);", new_set_dest, content, flags=re.DOTALL)

with open('app/booking/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Refactored successfully")
