"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [settings, setSettings] = useState({ heroTitle: '', heroText: '', phone1: '', phone2: '', email: '', address: '', whatsapp1: '', whatsapp2: '', secretPin: '', showAdminLoginInHeader: true });
  const [savingSettings, setSavingSettings] = useState(false);

  // Fare Settings State
  const [fareSettings, setFareSettings] = useState({
    appCost: 50, driverCost: 50, baseFare: 50, distanceTiers: '[{"min": 0, "max": 5, "rate": 20}, {"min": 5, "max": 9999, "rate": 15}]'
  });
  const [savingFare, setSavingFare] = useState(false);

  // Location APIs State
  const [locationApis, setLocationApis] = useState([]);
  const [newApi, setNewApi] = useState({ provider: 'locationiq', apiKey: '' });
  const [mapplsKeys, setMapplsKeys] = useState({ clientId: '', clientSecret: '' });
  const [testingApi, setTestingApi] = useState(null);
  const [isLocationApisUnlocked, setIsLocationApisUnlocked] = useState(false);
  const [locationApiPinInput, setLocationApiPinInput] = useState('');

  // WhatsApp State
  const [waStatus, setWaStatus] = useState({ isConnected: false, hasQR: false, qr: null, loading: false });
  const [waAutoMode, setWaAutoMode] = useState(false);
  const [waMsgStatus, setWaMsgStatus] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('waAutoMode');
      if (savedMode === 'true') setWaAutoMode(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('waAutoMode', waAutoMode);
    }
  }, [waAutoMode]);

  // Drivers State
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('all');
  const [driverSourceFilter, setDriverSourceFilter] = useState('all');

  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingDateFilter, setBookingDateFilter] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedBookings, setSelectedBookings] = useState([]);

  const router = useRouter();

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinMessage, setPinMessage] = useState({ type: '', text: '' });
  const [isChangingPin, setIsChangingPin] = useState(false);

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [modalDriverSearchQuery, setModalDriverSearchQuery] = useState('');

  // Driver CRUD Modal State
  const [showDriverCrudModal, setShowDriverCrudModal] = useState(false);
  const [showDriverPassword, setShowDriverPassword] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({
    name: '', contact: '', password: 'PB08TAXI', address: '',
    aadharNumber: '', licenseNumber: '', carRegistration: '',
    chassisNumber: '', carName: '', status: 'approved'
  });
  const [savingDriver, setSavingDriver] = useState(false);
  const [driverFormError, setDriverFormError] = useState('');

  // Documents Modal
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedDriverForDocs, setSelectedDriverForDocs] = useState(null);
  
  // Password Visibility Toggle for Grid
  const [showPasswords, setShowPasswords] = useState({});
  const togglePassword = (id) => setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));

  // Load data based on tab
  useEffect(() => {
    fetchBookings(false);
    fetchDrivers(false);
    
    const interval = setInterval(() => {
      fetchBookings(false);
      fetchDrivers(false);
      fetchWaStatus(false);
    }, 5000);

    if (activeTab === 'cms') fetchSettings();
    if (activeTab === 'fare') fetchFareSettings();
    if (activeTab === 'location-api') fetchLocationApis();
    if (activeTab === 'whatsapp') fetchWaStatus();

    return () => {
      clearInterval(interval);
    };
  }, [activeTab]);

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const pendingDriversCount = drivers.filter(d => d.status === 'pending').length;

  // Load drivers initially to use in driver assignment modal
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchBookings = async (showLoading = true) => {
    if (showLoading) setLoadingBookings(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoadingBookings(false);
    }
  };

  const fetchWaStatus = async (showLoading = true) => {
    if (showLoading) setWaStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/admin/whatsapp');
      if (res.ok) {
        const data = await res.json();
        setWaStatus({ isConnected: data.isConnected, hasQR: data.hasQR, qr: data.qr, loading: false });
      } else {
        if (showLoading) setWaStatus(prev => ({ ...prev, loading: false }));
      }
    } catch {
      if (showLoading) setWaStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleWaLogout = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp?')) return;
    setWaStatus(prev => ({ ...prev, loading: true }));
    try {
      await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      fetchWaStatus();
    } catch {
      fetchWaStatus();
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

  const fetchFareSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/fare');
      if (res.ok) {
        const data = await res.json();
        if (data.fareSetting) setFareSettings(data.fareSetting);
      }
    } catch (e) { console.error(e); }
  };

  const fetchLocationApis = async () => {
    try {
      const res = await fetch('/api/admin/settings/location-apis');
      if (res.ok) {
        const data = await res.json();
        setLocationApis(Array.isArray(data) ? data : (data.apis || []));
      }
    } catch (e) { console.error(e); }
  };

  const fetchDrivers = async (showLoading = true) => {
    if (showLoading) setLoadingDrivers(true);
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (e) { console.error(e); } finally {
      if (showLoading) setLoadingDrivers(false);
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

  const handleSaveFareSettings = async () => {
    setSavingFare(true);
    try {
      const res = await fetch('/api/admin/settings/fare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fareSettings)
      });
      if (res.ok) alert('Fare Settings saved successfully!');
    } catch (error) {
      alert('Error saving fare settings');
    } finally {
      setSavingFare(false);
    }
  };

  const handleAddLocationApi = async () => {
    let payload = { ...newApi };
    if(!payload.apiKey && payload.provider !== 'nominatim') return alert("API Key is required");

    try {
      const res = await fetch('/api/admin/settings/location-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        setNewApi({ provider: 'locationiq', apiKey: '' });
        setMapplsKeys({ clientId: '', clientSecret: '' });
        fetchLocationApis();
      } else alert("Failed to add API");
    } catch(e) { alert("Error adding API"); }
  };

  const handleSetActiveLocationApi = async (id) => {
    try {
      const res = await fetch('/api/admin/settings/location-apis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if(res.ok) fetchLocationApis();
    } catch(e) { alert("Error setting active API"); }
  };

  const handleDeleteLocationApi = async (id) => {
    if(!confirm("Are you sure you want to delete this API Key?")) return;
    try {
      const res = await fetch(`/api/admin/settings/location-apis?id=${id}`, { method: 'DELETE' });
      if(res.ok) fetchLocationApis();
    } catch(e) { alert("Error deleting API"); }
  };

  const handleTestApi = async (api) => {
    setTestingApi(api.id);
    try {
      let url = '';
      let res;
      if (api.provider === 'locationiq') {
        url = `https://us1.locationiq.com/v1/search?key=${api.apiKey}&q=delhi&format=json&limit=1`;
        res = await fetch(url);
      } else if (api.provider === 'geoapify') {
        url = `https://api.geoapify.com/v1/geocode/search?text=delhi&apiKey=${api.apiKey}&format=json&limit=1`;
        res = await fetch(url);
      } else if (api.provider === 'mappls') {
        url = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${api.apiKey}`;
        res = await fetch(url);
      } else if (api.provider === 'nominatim') {
        url = `https://nominatim.openstreetmap.org/search?q=delhi&format=json&limit=1`;
        res = await fetch(url);
      } else {
        alert("API Not Working");
        setTestingApi(null);
        return;
      }

      if (res.ok || res.status === 200) {
        alert("API Working Perfect");
      } else if (res.status === 401 || res.status === 403) {
        alert("API Expire");
      } else if (res.status >= 500) {
        alert("API Error Service Provider");
      } else {
        alert("API Not Working");
      }
    } catch (e) {
      alert("API Error Own Site");
    } finally {
      setTestingApi(null);
    }
  };

  const handleUpdateTier = (index, field, value) => {
    try {
      let tiers = JSON.parse(fareSettings.distanceTiers);
      tiers[index][field] = parseFloat(value) || 0;
      setFareSettings({ ...fareSettings, distanceTiers: JSON.stringify(tiers) });
    } catch(e) {}
  };
  const handleAddTier = () => {
    try {
      let tiers = JSON.parse(fareSettings.distanceTiers);
      tiers.push({ min: 0, max: 0, rate: 0 });
      setFareSettings({ ...fareSettings, distanceTiers: JSON.stringify(tiers) });
    } catch(e) {}
  };
  const handleRemoveTier = (index) => {
    try {
      let tiers = JSON.parse(fareSettings.distanceTiers);
      tiers.splice(index, 1);
      setFareSettings({ ...fareSettings, distanceTiers: JSON.stringify(tiers) });
    } catch(e) {}
  };

  const handleAutoSend = async (bookingId, type, phone, message) => {
    const key = `${bookingId}_${type}`;
    setWaMsgStatus(prev => ({ ...prev, [key]: 'loading' }));
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone, message, bookingId, targetType: type })
      });
      if (res.ok) {
        setWaMsgStatus(prev => ({ ...prev, [key]: null }));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, [type === 'driver' ? 'waDriverStatus' : 'waCustomerStatus']: 'success' } : b));
      } else {
        setWaMsgStatus(prev => ({ ...prev, [key]: null }));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, [type === 'driver' ? 'waDriverStatus' : 'waCustomerStatus']: 'error' } : b));
      }
    } catch (e) {
      setWaMsgStatus(prev => ({ ...prev, [key]: null }));
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, [type === 'driver' ? 'waDriverStatus' : 'waCustomerStatus']: 'error' } : b));
    }
  };

  const updateBookingStatus = async (id, status, driverId = null) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, assignedDriverId: driverId })
      });
      if (res.ok) {
        if (status === 'confirmed' && driverId) {
          const assignedDriver = drivers.find(d => d.id === driverId);
          const booking = bookings.find(b => b.id === id);
            if (assignedDriver && booking) {
              const customerMsg = `Hello ${booking.customerName},\nYour ride from ${booking.pickup} to ${booking.destination} is Confirmed!\n\nDriver Details:\nName: ${assignedDriver.name}\nPhone: ${assignedDriver.contact}\nVehicle: ${assignedDriver.carName} - ${assignedDriver.carRegistration}\nEstimated Fare: ₹${booking.estimatedFare || 'N/A'}\n\nThe driver will reach you before the scheduled time.\nThank you for choosing Raj Taxi!`;
              let mapsLink = '';
              if (booking.pickupLat && booking.pickupLng && booking.destLat && booking.destLng) {
                 mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${booking.pickupLat},${booking.pickupLng}&destination=${booking.destLat},${booking.destLng}`;
              } else if (booking.pickupLat && booking.pickupLng) {
                 mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${booking.pickupLat},${booking.pickupLng}&destination=${encodeURIComponent(booking.destination)}`;
              } else {
                 const o = booking.pickup.toLowerCase().includes('current') ? '' : `&origin=${encodeURIComponent(booking.pickup)}`;
                 mapsLink = `https://www.google.com/maps/dir/?api=1${o}&destination=${encodeURIComponent(booking.destination)}`;
              }
              const driverMsg = `🚕 *New Trip Assigned!*\n\n*Pickup:* ${booking.pickup}\n*Drop:* ${booking.destination}\n*Date & Time:* ${booking.date} at ${booking.time}\n*Customer:* ${booking.customerName} (${booking.customerPhone})\n\n📍 *Map Navigation:*\n${mapsLink}`;
              
              if (waAutoMode) {
                handleAutoSend(id, 'driver', assignedDriver.contact, driverMsg);
                handleAutoSend(id, 'customer', booking.customerPhone, customerMsg);
              } else {
                window.open(`https://wa.me/${booking.customerPhone.replace(/\D/g,'')}?text=${encodeURIComponent(customerMsg)}`, '_blank');
              }
            }
            setShowDriverModal(false);
            setSelectedBookingId(null);
            setSelectedDriverId('');
        }
        fetchBookings(); // reload after to get updated status
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateDriverStatus = async (id, status) => {
    try {
      const driver = drivers.find(d => d.id === id);
      
      const res = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        if (status === 'approved' && waAutoMode && driver) {
          const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pb08taxi.vercel.app';
          const msg = `🚗 *Welcome to PB08 Taxi!* 🚗\n\nHi ${driver.name}, your driver profile has been *APPROVED*.\n\nYou can now log in to your Driver Dashboard to receive bookings.\n\n*Login URL:* ${appUrl}/driver/login\n*Login ID:* ${driver.contact}\n*Password:* ${driver.password || 'Please contact Admin'}\n\nDrive safe!`;
          
          await fetch('/api/admin/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send',
              phone: driver.contact,
              message: msg,
              bookingId: id,
              targetType: 'driver_approval'
            })
          });
        }
        fetchDrivers(false);
      }
    } catch (e) { console.error(e); }
  };

  const resendCredentials = async (driver) => {
    if (!driver || !driver.contact) return;
    try {
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pb08taxi.vercel.app';
      const msg = `🚗 *Welcome to PB08 Taxi!* 🚗\n\nHi ${driver.name}, your driver profile has been *APPROVED*.\n\nYou can now log in to your Driver Dashboard to receive bookings.\n\n*Login URL:* ${appUrl}/driver/login\n*Login ID:* ${driver.contact}\n*Password:* ${driver.password || 'Please contact Admin'}\n\nDrive safe!`;
      
      await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: driver.contact,
          message: msg,
          bookingId: driver.id,
          targetType: 'driver_approval'
        })
      });
      alert('Credentials resent successfully.');
      fetchDrivers(false);
    } catch (e) {
      console.error(e);
      alert('Failed to resend credentials.');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!confirm("Are you sure you want to completely delete this driver? This action cannot be undone.")) return;
    try {
      const res = await fetch('/api/drivers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchDrivers();
      else {
        const data = await res.json();
        alert(data.error || "Failed to delete driver.");
      }
    } catch (e) { console.error(e); }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDocUpdate = async (e, driverId, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressedString = await compressImage(file);
      const res = await fetch('/api/drivers/docs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, fieldName, fileData: compressedString })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedDriverForDocs(data.driver); // update modal state
        fetchDrivers(); // update background list
        alert('Document updated successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update document');
      }
    } catch (error) {
      console.error("Doc update error:", error);
      alert("Failed to process image.");
    }
  };

  const handleDownloadZip = async () => {
    if (!selectedDriverForDocs) return;
    
    const zip = new JSZip();
    const folderName = `Driver_${selectedDriverForDocs.name.replace(/\s+/g, '_')}_Docs`;
    const folder = zip.folder(folderName);
    
    // Add text file with details
    const detailsText = `Name: ${selectedDriverForDocs.name}\nContact: ${selectedDriverForDocs.contact}\nPassword: ${selectedDriverForDocs.password || 'Not Set'}\nAddress: ${selectedDriverForDocs.address}\nAadhar No: ${selectedDriverForDocs.aadharNumber}\nLicense No: ${selectedDriverForDocs.licenseNumber}\nCar Registration: ${selectedDriverForDocs.carRegistration}\nChassis No: ${selectedDriverForDocs.chassisNumber}\nCar Name: ${selectedDriverForDocs.carName}\nStatus: ${selectedDriverForDocs.status}`;
    folder.file("Driver_Details.txt", detailsText);
    
    // Helper to add base64 images
    const addImageToZip = (base64String, filename) => {
      if (!base64String) return;
      const base64Data = base64String.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
      folder.file(filename, base64Data, {base64: true});
    };
    
    addImageToZip(selectedDriverForDocs.selfieUrl, "Selfie.jpg");
    addImageToZip(selectedDriverForDocs.aadharFrontUrl, "Aadhar_Front.jpg");
    addImageToZip(selectedDriverForDocs.aadharBackUrl, "Aadhar_Back.jpg");
    addImageToZip(selectedDriverForDocs.drivingLicenseUrl, "Driving_License.jpg");
    addImageToZip(selectedDriverForDocs.carRegistrationDocUrl, "Car_Registration.jpg");
    addImageToZip(selectedDriverForDocs.policeVerificationUrl, "Police_Verification.jpg");
    
    zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, `${folderName}.zip`);
    });
  };

  const handleOpenDriverCrud = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setDriverForm({
        name: driver.name || '',
        contact: driver.contact || '',
        password: driver.password || '', // populated so admin can edit
        address: driver.address || '',
        aadharNumber: driver.aadharNumber || '',
        licenseNumber: driver.licenseNumber || '',
        carRegistration: driver.carRegistration || '',
        chassisNumber: driver.chassisNumber || '',
        carName: driver.carName || '',
        status: driver.status || 'approved'
      });
    } else {
      setEditingDriver(null);
      setDriverForm({
        name: '', contact: '', password: 'PB08TAXI', address: '',
        aadharNumber: '', licenseNumber: '', carRegistration: '',
        chassisNumber: '', carName: '', status: 'approved', createdBy: 'admin'
      });
    }
    setDriverFormError('');
    setShowDriverCrudModal(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    setSavingDriver(true);
    setDriverFormError('');

    try {
      const isEditing = !!editingDriver;
      const method = isEditing ? 'PATCH' : 'POST';
      
      const payload = { ...driverForm };
      if (isEditing) {
        payload.id = editingDriver.id;
        if (!payload.password) delete payload.password; // don't send empty password on edit
      }

      const res = await fetch('/api/drivers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        fetchDrivers();
        setShowDriverCrudModal(false);
      } else {
        setDriverFormError(data.error || `Failed to ${isEditing ? 'update' : 'create'} driver`);
      }
    } catch (err) {
      setDriverFormError('Network error occurred');
    } finally {
      setSavingDriver(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setIsChangingPin(true);
    setPinMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin })
      });
      const data = await res.json();
      if (res.ok) {
        setPinMessage({ type: 'success', text: 'PIN updated successfully!' });
        setTimeout(() => {
          setShowSecurityModal(false);
          setCurrentPin('');
          setNewPin('');
          setPinMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setPinMessage({ type: 'error', text: data.error || 'Failed to update PIN' });
      }
    } catch (err) {
      setPinMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleOpenAssignModal = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowDriverModal(true);
  };

  // Filter & Search Drivers
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name?.toLowerCase().includes(driverSearchQuery.toLowerCase()) || 
                          d.contact?.includes(driverSearchQuery);
    const matchesStatus = driverStatusFilter === 'all' || d.status === driverStatusFilter;
    const matchesSource = driverSourceFilter === 'all' || d.createdBy === driverSourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.customerName?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) || 
                          b.customerPhone?.includes(bookingSearchQuery) ||
                          b.pickup?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                          b.destination?.toLowerCase().includes(bookingSearchQuery.toLowerCase());
    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    const matchesDate = bookingDateFilter === '' || b.date === bookingDateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDeleteSelected = async () => {
    if (selectedBookings.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedBookings.length} selected bookings?`)) return;
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBookings, deleteAll: false })
      });
      if (res.ok) {
        setBookings(prev => prev.filter(b => !selectedBookings.includes(b.id)));
        setSelectedBookings([]);
      } else {
        alert('Failed to delete selected bookings');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting bookings');
    }
  };

  const handleDeleteAll = async () => {
    if (filteredBookings.length === 0) return;
    if (!confirm(`CAUTION: Are you sure you want to delete ALL ${filteredBookings.length} bookings currently shown?`)) return;
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: filteredBookings.map(b => b.id), deleteAll: true })
      });
      if (res.ok) {
        setBookings(prev => prev.filter(b => !filteredBookings.find(fb => fb.id === b.id)));
        setSelectedBookings([]);
      } else {
        alert('Failed to delete all bookings');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting bookings');
    }
  };

  const approvedDrivers = drivers.filter(d => d.status === 'approved');

  return (
    <div className="pt-24 pb-12 relative min-h-[90vh]">
      <div className="hidden md:block absolute top-0 right-1/4 w-[500px] h-[500px] bg-taxi-yellow/5 rounded-full blur-[150px] pointer-events-none"></div>

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
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500 hover:text-white transition-all text-sm font-semibold" onClick={() => setShowSecurityModal(true)}>
                <i className="fa-solid fa-lock mr-2"></i> Security
              </button>
              <button className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-semibold" onClick={handleLogout}>
                Terminate Session <i className="fa-solid fa-power-off ml-1"></i>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row min-h-[600px]">
            
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 bg-black/30 border-r border-white/5 p-4 flex flex-col gap-2">
              <button 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'bookings' ? 'bg-taxi-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                onClick={() => setActiveTab('bookings')}
              >
                <i className="fa-solid fa-calendar-check w-5 text-center"></i> Booking Management
                {pendingBookingsCount > 0 && <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'bookings' ? 'bg-red-500 text-white' : 'bg-red-500/80 text-white'}`}>{pendingBookingsCount}</span>}
              </button>
              <button 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'drivers' ? 'bg-taxi-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                onClick={() => setActiveTab('drivers')}
              >
                <i className="fa-solid fa-id-card w-5 text-center"></i> Driver Directory
                {pendingDriversCount > 0 && <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'drivers' ? 'bg-red-500 text-white' : 'bg-red-500/80 text-white'}`}>{pendingDriversCount}</span>}
              </button>
              <button 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'cms' ? 'bg-taxi-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                onClick={() => setActiveTab('cms')}
              >
                <i className="fa-solid fa-pen-to-square w-5 text-center"></i> Website Content (CMS)
              </button>
              <button 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'fare' ? 'bg-taxi-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                onClick={() => setActiveTab('fare')}
              >
                <i className="fa-solid fa-indian-rupee-sign w-5 text-center"></i> Fare Formula Settings
              </button>
              <button 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'location-api' ? 'bg-taxi-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                onClick={() => setActiveTab('location-api')}
              >
                <i className="fa-solid fa-map-location-dot w-5 text-center"></i> Location APIs
              </button>
              <button 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'whatsapp' ? 'bg-[#25D366] text-black shadow-[0_0_15px_rgba(37,211,102,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-[#25D366]'}`}
                onClick={() => setActiveTab('whatsapp')}
              >
                <i className="fa-brands fa-whatsapp w-5 text-center text-lg"></i> WhatsApp Settings
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 lg:p-10">
              {activeTab === 'bookings' && (
                <div className="animate-[fadeInUp_0.3s_ease]">
                  <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-bold text-white">Live Bookings</h3>
                      
                      {/* Server Status Indicator */}
                      <div className="flex gap-2 items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        <h4 className="text-sm font-bold text-[#25D366] hidden sm:flex items-center gap-2 mr-1">
                          <i className="fa-brands fa-whatsapp text-lg"></i>
                        </h4>
                        <button onClick={() => fetchWaStatus(true)} className="text-gray-400 hover:text-white transition-colors" title="Refresh Status">
                          <i className={`fa-solid fa-rotate-right ${waStatus.loading ? 'animate-spin text-taxi-yellow' : ''}`}></i>
                        </button>
                        {waStatus.isConnected ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold border border-green-500/30 flex items-center gap-1.5 ml-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> ONLINE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30 flex items-center gap-1.5 ml-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> OFFLINE
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                        <span className={`text-xs font-bold ${!waAutoMode ? 'text-white' : 'text-gray-500'}`}>Manual</span>
                        <button 
                          onClick={() => setWaAutoMode(!waAutoMode)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${waAutoMode ? 'bg-[#25D366]' : 'bg-gray-600'}`}
                        >
                          <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${waAutoMode ? 'translate-x-5' : 'translate-x-1'}`}></div>
                        </button>
                        <span className={`text-xs font-bold flex items-center gap-1 ${waAutoMode ? 'text-[#25D366]' : 'text-gray-500'}`}>
                          Auto <i className="fa-brands fa-whatsapp"></i>
                        </span>
                      </div>
                      <div className="px-3 py-1.5 bg-taxi-yellow/10 text-taxi-yellow rounded-full text-xs font-mono border border-taxi-yellow/30">Total: {filteredBookings.length}</div>
                    </div>
                  </div>
                  
                  {/* Bulk Actions & Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedBookings.length > 0 && (
                        <button onClick={handleDeleteSelected} className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                          <i className="fa-solid fa-trash"></i> Delete Selected ({selectedBookings.length})
                        </button>
                      )}
                      <button onClick={handleDeleteAll} className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <i className="fa-solid fa-trash-can"></i> Delete All
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <input 
                          type="date" 
                          className="input-modern px-4 py-2 text-sm text-gray-300"
                          style={{ colorScheme: 'dark' }}
                          onClick={(e) => e.target.showPicker && e.target.showPicker()}
                          value={bookingDateFilter}
                          onChange={e => setBookingDateFilter(e.target.value)}
                        />
                        {bookingDateFilter && (
                          <button 
                            onClick={() => setBookingDateFilter('')} 
                            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            title="Clear Date"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          className="input-modern !pl-10 !py-2 w-48 lg:w-64"
                          value={bookingSearchQuery}
                          onChange={e => setBookingSearchQuery(e.target.value)}
                        />
                      </div>
                      <select 
                        className="input-modern appearance-none !py-2 w-40"
                        value={bookingStatusFilter}
                        onChange={e => setBookingStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="text-xs uppercase bg-black/50 text-gray-400">
                        <tr>
                          <th className="px-6 py-4 font-medium w-10">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-600 bg-black/30 text-taxi-yellow focus:ring-taxi-yellow/50 w-4 h-4 cursor-pointer"
                              checked={filteredBookings.length > 0 && selectedBookings.length === filteredBookings.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedBookings(filteredBookings.map(b => b.id));
                                else setSelectedBookings([]);
                              }}
                            />
                          </th>
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
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 opacity-50 block"></i>
                              Loading Bookings...
                            </td>
                          </tr>
                        ) : filteredBookings.length === 0 ? (
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-inbox text-3xl mb-3 opacity-50 block"></i>
                              No bookings found
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map(b => {
                            let mapsLink = '';
                            if (b.pickupLat && b.pickupLng && b.destLat && b.destLng) {
                               mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${b.pickupLat},${b.pickupLng}&destination=${b.destLat},${b.destLng}`;
                            } else if (b.pickupLat && b.pickupLng) {
                               mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${b.pickupLat},${b.pickupLng}&destination=${encodeURIComponent(b.destination)}`;
                            } else {
                               const o = b.pickup.toLowerCase().includes('current') ? '' : `&origin=${encodeURIComponent(b.pickup)}`;
                               mapsLink = `https://www.google.com/maps/dir/?api=1${o}&destination=${encodeURIComponent(b.destination)}`;
                            }
                            const driverMsg = `🚕 *New Trip Assigned!*\n\n*Pickup:* ${b.pickup}\n*Drop:* ${b.destination}\n*Date & Time:* ${b.date} at ${b.time}\n*Customer:* ${b.customerName} (${b.customerPhone})\n\n📍 *Map Navigation:*\n${mapsLink}`;
                            const customerMsg = `Hello ${b.customerName},\nYour ride from ${b.pickup} to ${b.destination} is Confirmed!\n\nDriver Details:\nName: ${b.assignedDriver?.name}\nPhone: ${b.assignedDriver?.contact}\nVehicle: ${b.assignedDriver?.carName} - ${b.assignedDriver?.carRegistration}\nEstimated Fare: ₹${b.estimatedFare || 'N/A'}\n\nThe driver will reach you before the scheduled time.\nThank you for choosing Raj Taxi!`;
                            
                            return (
                            <tr key={b.id} className={`border-t border-white/5 transition-colors ${selectedBookings.includes(b.id) ? 'bg-taxi-yellow/5' : 'bg-black/20 hover:bg-black/40'}`}>
                              <td className="px-6 py-4">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-600 bg-black/30 text-taxi-yellow focus:ring-taxi-yellow/50 w-4 h-4 cursor-pointer"
                                  checked={selectedBookings.includes(b.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedBookings(prev => [...prev, b.id]);
                                    else setSelectedBookings(prev => prev.filter(id => id !== b.id));
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-white">{b.customerName}</div>
                                <div className="text-xs text-gray-500">{b.customerPhone}</div>
                                {b.notes && <div className="text-xs text-taxi-yellow mt-1">{b.notes}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs text-green-400">P: {b.pickup}</div>
                                <div className="text-xs text-red-400">D: {b.destination}</div>
                                {b.estimatedFare && <div className="text-xs text-taxi-yellow mt-1 font-semibold">Fare: ₹{b.estimatedFare}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <div>{b.date}</div>
                                <div className="text-xs text-gray-500">{b.time}</div>
                              </td>
                              <td className="px-6 py-4">
                                {b.status === 'pending' && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">Unconfirmed</span>}
                                {b.status === 'confirmed' && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">Confirmed</span>}
                                {b.status === 'completed' && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">Completed</span>}
                                {b.status === 'cancelled' && <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">Cancelled</span>}
                                {b.assignedDriver && <div className="text-xs text-gray-400 mt-2">Driver: {b.assignedDriver.name}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap justify-end gap-2">
                                  {waAutoMode ? (
                                    <button 
                                      onClick={() => handleAutoSend(b.id, 'driver', b.assignedDriver?.contact || '', driverMsg)}
                                      className="relative text-green-400 hover:text-green-300 text-sm font-semibold border border-green-500/30 px-2 py-1 rounded bg-green-500/10 flex items-center gap-1"
                                      title={!b.assignedDriver ? "Please assign a driver first" : "Auto-Send to Driver"}
                                    >
                                      <i className="fa-brands fa-whatsapp"></i> Driver
                                      {waMsgStatus[`${b.id}_driver`] === 'loading' ? (
                                        <i className="fa-solid fa-spinner fa-spin text-xs ml-1"></i>
                                      ) : (
                                        b.waDriverStatus === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500 ml-1"></div> :
                                        b.waDriverStatus === 'error' ? <div className="w-2 h-2 rounded-full bg-red-500 ml-1"></div> : 
                                        <div className="w-2 h-2 rounded-full bg-orange-500 ml-1"></div>
                                      )}
                                    </button>
                                  ) : (
                                    <a href={`https://wa.me/?text=${encodeURIComponent(driverMsg)}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 text-sm font-semibold border border-green-500/30 px-2 py-1 rounded bg-green-500/10 flex items-center gap-1" title="Share with Driver">
                                      <i className="fa-brands fa-whatsapp"></i> Driver
                                    </a>
                                  )}
                                  
                                  {b.status === 'confirmed' && (
                                    waAutoMode ? (
                                      <button 
                                        onClick={() => handleAutoSend(b.id, 'customer', b.customerPhone, customerMsg)}
                                        className="relative text-blue-400 hover:text-blue-300 text-sm font-semibold border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10 flex items-center gap-1"
                                        title="Auto-Send to Customer"
                                      >
                                        <i className="fa-brands fa-whatsapp"></i> Customer
                                        {waMsgStatus[`${b.id}_customer`] === 'loading' ? (
                                          <i className="fa-solid fa-spinner fa-spin text-xs ml-1"></i>
                                        ) : (
                                          b.waCustomerStatus === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500 ml-1"></div> :
                                          b.waCustomerStatus === 'error' ? <div className="w-2 h-2 rounded-full bg-red-500 ml-1"></div> : 
                                          <div className="w-2 h-2 rounded-full bg-orange-500 ml-1"></div>
                                        )}
                                      </button>
                                    ) : (
                                      <a href={`https://wa.me/${b.customerPhone.replace(/\D/g,'')}?text=${encodeURIComponent(customerMsg)}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-semibold border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10 flex items-center gap-1" title="Confirm Customer">
                                        <i className="fa-brands fa-whatsapp"></i> Customer
                                      </a>
                                    )
                                  )}

                                  {b.status === 'confirmed' && (
                                    <button onClick={() => { setSelectedBookingId(b.id); setShowDriverModal(true); }} className="text-taxi-yellow hover:text-white text-sm font-semibold border border-taxi-yellow/30 px-2 py-1 rounded bg-taxi-yellow/10 ml-2">
                                      <i className="fa-solid fa-pen"></i> Edit
                                    </button>
                                  )}
                                  
                                  {b.status === 'pending' && (
                                    <button onClick={() => handleOpenAssignModal(b.id)} className="text-taxi-yellow hover:text-white text-sm font-semibold border border-yellow-500/30 px-2 py-1 rounded bg-yellow-500/10">Confirm Booking</button>
                                  )}
                                  {(b.status === 'pending' || b.status === 'confirmed') && (
                                    <button onClick={() => updateBookingStatus(b.id, 'completed')} className="text-gray-400 hover:text-white text-sm font-semibold border border-white/30 px-2 py-1 rounded bg-white/10">Complete</button>
                                  )}
                                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                                    <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="text-red-400 hover:text-red-300 text-sm font-semibold border border-red-500/30 px-2 py-1 rounded bg-red-500/10">Cancel</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )})
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'fare' && (
                <div className="animate-[fadeInUp_0.3s_ease]">
                  <h3 className="text-2xl font-bold text-white mb-2">Fare Formula Settings</h3>
                  <p className="text-gray-400 text-sm mb-8">Set the base pricing and kilometer-wise slab rates.</p>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="glass-card p-6 border-white/5 bg-black/20 rounded-xl border border-white/10">
                      <h4 className="text-taxi-yellow font-semibold mb-4 border-b border-white/10 pb-2"><i className="fa-solid fa-money-bill-wave mr-2"></i> Fixed Costs</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">App Cost (₹)</label>
                          <input type="number" className="input-modern bg-black/30" value={fareSettings.appCost} onChange={(e) => setFareSettings({...fareSettings, appCost: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Driver Cost (₹)</label>
                          <input type="number" className="input-modern bg-black/30" value={fareSettings.driverCost} onChange={(e) => setFareSettings({...fareSettings, driverCost: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Base Fare (₹)</label>
                          <input type="number" className="input-modern bg-black/30" value={fareSettings.baseFare} onChange={(e) => setFareSettings({...fareSettings, baseFare: parseFloat(e.target.value) || 0})} />
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 border-white/5 bg-black/20 rounded-xl border border-white/10">
                      <h4 className="text-taxi-yellow font-semibold mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                        <span><i className="fa-solid fa-road mr-2"></i> Kilometer Tiers (Slab Rate)</span>
                        <button onClick={handleAddTier} className="text-xs bg-taxi-yellow/20 text-taxi-yellow px-2 py-1 rounded hover:bg-taxi-yellow/40">+ Add Tier</button>
                      </h4>
                      <div className="space-y-4">
                        {(() => {
                          let tiers = [];
                          try { tiers = JSON.parse(fareSettings.distanceTiers); } catch(e){}
                          return tiers.map((tier, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-black/30 p-2 rounded border border-white/5">
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">Min KM</label>
                                <input type="number" className="w-full bg-black/50 text-white text-sm p-1 rounded border border-white/10" value={tier.min} onChange={e => handleUpdateTier(idx, 'min', e.target.value)} />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">Max KM</label>
                                <input type="number" className="w-full bg-black/50 text-white text-sm p-1 rounded border border-white/10" value={tier.max} onChange={e => handleUpdateTier(idx, 'max', e.target.value)} />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">Rate/KM (₹)</label>
                                <input type="number" className="w-full bg-black/50 text-white text-sm p-1 rounded border border-white/10" value={tier.rate} onChange={e => handleUpdateTier(idx, 'rate', e.target.value)} />
                              </div>
                              <button onClick={() => handleRemoveTier(idx)} className="text-red-400 hover:text-red-300 mt-4"><i className="fa-solid fa-trash"></i></button>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleSaveFareSettings}
                      disabled={savingFare}
                      className="btn-primary"
                    >
                      {savingFare ? <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Saving...</> : <><i className="fa-solid fa-save mr-2"></i> Save Fare Formula</>}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'location-api' && !isLocationApisUnlocked && (
                <div className="flex flex-col items-center justify-center py-20 animate-[fadeIn_0.3s_ease]">
                  <div className="bg-black/40 border border-white/10 p-8 rounded-2xl w-full max-w-md text-center">
                    <i className="fa-solid fa-lock text-4xl text-taxi-yellow mb-4"></i>
                    <h3 className="text-xl font-bold text-white mb-2">Protected Area</h3>
                    <p className="text-gray-400 text-sm mb-6">Enter Admin Secret PIN to manage APIs.</p>
                    <input 
                      type="password" 
                      placeholder="Enter 6-digit PIN"
                      maxLength={6}
                      className="input-modern mb-4 text-center tracking-[0.5em] text-lg font-bold"
                      value={locationApiPinInput}
                      onChange={(e) => setLocationApiPinInput(e.target.value)}
                      onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                          const expectedPin = settings?.secretPin || '333725';
                          if(locationApiPinInput === expectedPin) setIsLocationApisUnlocked(true);
                          else { alert('Incorrect PIN!'); setLocationApiPinInput(''); }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const expectedPin = settings?.secretPin || '333725';
                        if(locationApiPinInput === expectedPin) setIsLocationApisUnlocked(true);
                        else { alert('Incorrect PIN!'); setLocationApiPinInput(''); }
                      }} 
                      className="btn-primary w-full"
                    >
                      Unlock <i className="fa-solid fa-unlock ml-2"></i>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'location-api' && isLocationApisUnlocked && (
                <div className="animate-[fadeInUp_0.3s_ease] space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Location APIs</h3>
                    <p className="text-gray-400 text-sm">Manage Geocoding & Routing API keys (Mappls, LocationIQ, Mapbox, Nominatim)</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <h4 className="text-lg font-bold text-taxi-yellow mb-4">Add New Location API</h4>
                    <div className="flex flex-col gap-4 mb-4">
                      <select 
                        className="input-modern bg-black/30 w-full md:w-1/3"
                        value={newApi.provider}
                        onChange={(e) => setNewApi({...newApi, provider: e.target.value})}
                      >
                        <option value="mappls">Mappls (MapmyIndia)</option>
                        <option value="locationiq">LocationIQ</option>
                        <option value="mapbox">Mapbox</option>
                      </select>
                      
                      <input 
                        type="text" 
                        placeholder="Enter API Key (Static Key)" 
                        className="input-modern bg-black/30 w-full md:flex-1"
                        value={newApi.apiKey}
                        onChange={(e) => setNewApi({...newApi, apiKey: e.target.value})}
                      />
                      
                      <button onClick={handleAddLocationApi} className="btn-primary w-full md:w-auto mt-2 md:mt-0">
                        <i className="fa-solid fa-plus mr-2"></i> Add API
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Saved APIs</h4>
                    {locationApis.length === 0 ? (
                      <p className="text-gray-400 text-sm">No Location APIs added yet. Map features are disabled.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                          <thead className="text-xs uppercase bg-white/5 text-gray-400">
                            <tr>
                              <th className="px-4 py-3 rounded-tl-lg">Provider</th>
                              <th className="px-4 py-3">API Key</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {locationApis.map((api) => (
                              <tr key={api.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-4 py-4 font-medium capitalize">{api.provider}</td>
                                <td className="px-4 py-4 font-mono text-xs">{api.apiKey ? api.apiKey.substring(0, 8) + '...' + api.apiKey.substring(api.apiKey.length - 4) : 'N/A'}</td>
                                <td className="px-4 py-4">
                                  {api.isActive ? (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-bold border border-green-500/30">ACTIVE</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-md text-xs font-bold border border-gray-500/30">INACTIVE</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-right flex justify-end gap-2">
                                  {!api.isActive && (
                                    <button 
                                      onClick={() => handleSetActiveLocationApi(api.id)}
                                      className="px-3 py-1 bg-taxi-yellow/20 text-taxi-yellow hover:bg-taxi-yellow/30 rounded-lg text-xs font-bold transition-colors"
                                    >
                                      Set Active
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleTestApi(api)}
                                    disabled={testingApi === api.id}
                                    className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                  >
                                    {testingApi === api.id ? <i className="fa-solid fa-spinner fa-spin"></i> : "Test API"}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLocationApi(api.id)}
                                    className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'whatsapp' && (
                <div className="animate-[fadeInUp_0.3s_ease] space-y-6 max-w-3xl">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">WhatsApp Automation</h3>
                    <p className="text-gray-400 text-sm">Manage your Baileys WhatsApp server connection</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="text-lg font-bold text-[#25D366] flex items-center gap-2">
                        <i className="fa-brands fa-whatsapp text-2xl"></i> Server Status
                      </h4>
                      <div className="flex gap-3 items-center">
                        <button onClick={fetchWaStatus} className="p-2 text-gray-400 hover:text-white transition-colors" title="Refresh Status">
                          <i className={`fa-solid fa-rotate-right ${waStatus.loading ? 'animate-spin text-taxi-yellow' : ''}`}></i>
                        </button>
                        {waStatus.isConnected ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-bold border border-green-500/30 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ONLINE
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold border border-red-500/30 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> OFFLINE
                          </span>
                        )}
                      </div>
                    </div>

                    {waStatus.isConnected ? (
                      <div className="text-center p-8 bg-black/30 rounded-xl border border-green-500/20">
                        <i className="fa-solid fa-check-circle text-5xl text-green-500 mb-4"></i>
                        <h5 className="text-xl font-semibold text-white mb-2">WhatsApp is Connected!</h5>
                        <p className="text-gray-400 text-sm mb-6">Your server is running and ready to send automated notifications.</p>
                        <button onClick={handleWaLogout} disabled={waStatus.loading} className="btn-primary !bg-red-500 hover:!bg-red-600 px-6 py-2">
                          <i className="fa-solid fa-power-off mr-2"></i> Disconnect / Logout
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-black/30 rounded-xl border border-white/5">
                        {waStatus.loading ? (
                          <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-sm animate-pulse">Waking up WhatsApp server... (May take 30s)</p>
                          </div>
                        ) : waStatus.hasQR && waStatus.qr ? (
                          <div className="flex flex-col items-center">
                            <h5 className="text-lg font-semibold text-white mb-2">Scan QR Code</h5>
                            <p className="text-gray-400 text-sm mb-6">Open WhatsApp on your phone {"->"} Linked Devices {"->"} Scan</p>
                            <div className="bg-white p-4 rounded-xl mb-6 shadow-[0_0_30px_rgba(37,211,102,0.2)]">
                              <img src={waStatus.qr} alt="WhatsApp QR Code" className="w-64 h-64" />
                            </div>
                            <p className="text-xs text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/20">
                              <i className="fa-solid fa-circle-info mr-1"></i> QR Code changes every few seconds. If it fails, refresh the status.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-6">
                            <i className="fa-brands fa-whatsapp text-6xl text-gray-600 mb-4"></i>
                            <h5 className="text-lg font-semibold text-white mb-2">No QR Code Available</h5>
                            <p className="text-gray-400 text-sm mb-6">Ensure the Render server is running and API keys match.</p>
                            <button onClick={fetchWaStatus} className="btn-primary !bg-[#25D366] hover:!bg-[#128C7E] px-6 py-2">
                              <i className="fa-solid fa-rotate-right mr-2"></i> Try Again
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
                            <input type="text" className="input-modern bg-black/30" value={settings.phone1 || ''} onChange={(e) => setSettings({...settings, phone1: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Phone 2</label>
                            <input type="text" className="input-modern bg-black/30" value={settings.phone2 || ''} onChange={(e) => setSettings({...settings, phone2: e.target.value})} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Office Email</label>
                          <input type="text" className="input-modern bg-black/30" value={settings.email || ''} onChange={(e) => setSettings({...settings, email: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Address</label>
                          <input type="text" className="input-modern bg-black/30" value={settings.address || ''} onChange={(e) => setSettings({...settings, address: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 border-white/5 bg-black/20 rounded-xl border border-white/10">
                      <h4 className="text-[#25D366] font-semibold mb-4 border-b border-white/10 pb-2"><i className="fa-brands fa-whatsapp mr-2"></i> WhatsApp Integration</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">WhatsApp API No 1</label>
                            <input type="text" className="input-modern bg-black/30" value={settings.whatsapp1 || ''} onChange={(e) => setSettings({...settings, whatsapp1: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">WhatsApp API No 2</label>
                            <input type="text" className="input-modern bg-black/30" value={settings.whatsapp2 || ''} onChange={(e) => setSettings({...settings, whatsapp2: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 border-white/5 bg-black/20 rounded-xl border border-white/10">
                      <h4 className="text-red-400 font-semibold mb-4 border-b border-white/10 pb-2"><i className="fa-solid fa-lock mr-2"></i> System Security & Layout</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Admin Secret PIN (6 digits)</label>
                          <input type="text" maxLength={6} className="input-modern bg-black/30" value={settings.secretPin || ''} onChange={(e) => setSettings({...settings, secretPin: e.target.value})} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5 mt-4">
                          <div>
                            <h5 className="text-sm font-semibold text-white">Show Admin Login in Navbar</h5>
                            <p className="text-xs text-gray-400">If disabled, it will still be accessible via Footer Quick Links.</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, showAdminLoginInHeader: !settings.showAdminLoginInHeader})}
                            className={`w-12 h-6 rounded-full relative transition-colors ${settings.showAdminLoginInHeader !== false ? 'bg-taxi-yellow' : 'bg-gray-600'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.showAdminLoginInHeader !== false ? 'translate-x-7' : 'translate-x-1'}`}></div>
                          </button>
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
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Driver Directory</h3>
                        <p className="text-gray-400 text-sm hidden md:block">Manage drivers, approvals, and vehicle data</p>
                      </div>
                      
                      {/* Server Status Indicator */}
                      <div className="flex gap-2 items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 h-fit mt-1">
                        <h4 className="text-sm font-bold text-[#25D366] hidden sm:flex items-center gap-2 mr-1">
                          <i className="fa-brands fa-whatsapp text-lg"></i>
                        </h4>
                        <button onClick={() => fetchWaStatus(true)} className="text-gray-400 hover:text-white transition-colors" title="Refresh Status">
                          <i className={`fa-solid fa-rotate-right ${waStatus.loading ? 'animate-spin text-taxi-yellow' : ''}`}></i>
                        </button>
                        {waStatus.isConnected ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold border border-green-500/30 flex items-center gap-1.5 ml-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> ONLINE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30 flex items-center gap-1.5 ml-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> OFFLINE
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      {/* WhatsApp Auto Toggle */}
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                        <span className={`text-xs font-bold ${!waAutoMode ? 'text-white' : 'text-gray-500'}`}>Manual</span>
                        <button 
                          onClick={() => setWaAutoMode(!waAutoMode)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${waAutoMode ? 'bg-[#25D366]' : 'bg-gray-600'}`}
                        >
                          <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${waAutoMode ? 'translate-x-5' : 'translate-x-1'}`}></div>
                        </button>
                        <span className={`text-xs font-bold flex items-center gap-1 ${waAutoMode ? 'text-[#25D366]' : 'text-gray-500'}`}>
                          Auto <i className="fa-brands fa-whatsapp"></i>
                        </span>
                      </div>
                      <button onClick={() => handleOpenDriverCrud()} className="btn-primary py-2 px-4 text-sm whitespace-nowrap">
                        <i className="fa-solid fa-plus mr-2"></i> Add New Driver
                      </button>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <i className="fa-solid fa-search absolute left-4 top-3.5 text-gray-500"></i>
                      <input 
                        type="text" 
                        placeholder="Search by name or phone..." 
                        className="input-modern !pl-10"
                        value={driverSearchQuery}
                        onChange={e => setDriverSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <select 
                        className="input-modern appearance-none"
                        value={driverSourceFilter}
                        onChange={e => setDriverSourceFilter(e.target.value)}
                      >
                        <option value="all">All Sources</option>
                        <option value="admin">Admin Add</option>
                        <option value="driver">Web App</option>
                      </select>
                    </div>
                    <div className="w-full md:w-48">
                      <select 
                        className="input-modern appearance-none"
                        value={driverStatusFilter}
                        onChange={e => setDriverStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending Review</option>
                        <option value="rejected">Cancelled (Rejected)</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="text-xs uppercase bg-black/50 text-gray-400">
                        <tr>
                          <th className="px-6 py-4 font-medium">Driver Profile</th>
                          <th className="px-6 py-4 font-medium">Vehicle Info</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingDrivers ? (
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 opacity-50 block"></i>
                              Loading Drivers...
                            </td>
                          </tr>
                        ) : filteredDrivers.length === 0 ? (
                          <tr className="border-t border-white/5 bg-black/20">
                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                              <i className="fa-solid fa-users-slash text-3xl mb-3 opacity-50 block"></i>
                              No drivers found matching criteria
                            </td>
                          </tr>
                        ) : (
                          filteredDrivers.map(d => (
                            <tr key={d.id} className="border-t border-white/5 bg-black/20 hover:bg-black/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {d.selfieUrl ? (
                                    <img src={d.selfieUrl} alt="Selfie" className="w-10 h-10 rounded-full object-cover border border-taxi-yellow/30" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-500">
                                      <i className="fa-solid fa-user"></i>
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-2">
                                      {d.name}
                                      <div className="relative inline-flex items-center" title={`WhatsApp Status: ${d.waApprovalStatus || 'pending'}`}>
                                        <i className="fa-brands fa-whatsapp text-gray-400"></i>
                                        <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${d.waApprovalStatus === 'success' ? 'bg-[#25D366]' : d.waApprovalStatus === 'error' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                                      </div>
                                      {d.createdBy === 'admin' ? (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">Admin Add</span>
                                      ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">Web App</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">{d.contact}</div>
                                    <div className="text-xs font-mono text-taxi-yellow mt-1 flex items-center gap-2">
                                      Pwd: {showPasswords[d.id] ? (d.password || 'N/A') : '••••••••'}
                                      <button onClick={() => togglePassword(d.id)} className="text-gray-400 hover:text-white">
                                        <i className={`fa-solid ${showPasswords[d.id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">{d.carName}</div>
                                <div className="text-xs text-taxi-yellow">{d.carRegistration}</div>
                              </td>
                              <td className="px-6 py-4">
                                {d.status === 'pending' && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">Pending</span>}
                                {d.status === 'approved' && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">Approved</span>}
                                {d.status === 'rejected' && <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">Cancelled</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {/* Approve / Cancel Actions */}
                                {d.status === 'pending' && (
                                  <>
                                    <button onClick={() => updateDriverStatus(d.id, 'approved')} className="text-green-400 hover:text-green-300 text-xs font-semibold border border-green-500/30 px-2 py-1 rounded bg-green-500/10 mr-2">Approve</button>
                                    <button onClick={() => updateDriverStatus(d.id, 'rejected')} className="text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/30 px-2 py-1 rounded bg-red-500/10 mr-2">Cancel</button>
                                  </>
                                )}
                                {d.status === 'approved' && (
                                  <button onClick={() => updateDriverStatus(d.id, 'rejected')} className="text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/30 px-2 py-1 rounded bg-red-500/10 mb-2 mr-2">Cancel</button>
                                )}
                                {d.status === 'rejected' && (
                                  <button onClick={() => updateDriverStatus(d.id, 'approved')} className="text-green-400 hover:text-green-300 text-xs font-semibold border border-green-500/30 px-2 py-1 rounded bg-green-500/10 mb-2 mr-2">Approve</button>
                                )}

                                {/* View Docs Action */}
                                <button onClick={() => { setSelectedDriverForDocs(d); setShowDocsModal(true); }} className="text-taxi-yellow hover:text-white text-xs font-semibold border border-yellow-500/30 px-2 py-1 rounded bg-yellow-500/10 mb-2 mr-2">
                                  <i className="fa-solid fa-file-invoice"></i> Docs
                                </button>

                                {/* Dashboard Action */}
                                <a href={`/driver/dashboard?driverId=${d.id}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-xs font-semibold border border-purple-500/30 px-2 py-1 rounded bg-purple-500/10 mb-2 mr-2 inline-block">
                                  <i className="fa-solid fa-chart-line"></i> Dashboard
                                </a>

                                {/* Live Map Action */}
                                {d.currentLat && d.currentLng ? (
                                  <a href={`https://www.google.com/maps?q=${d.currentLat},${d.currentLng}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:text-green-300 text-xs font-semibold border border-green-500/30 px-2 py-1 rounded bg-green-500/10 mb-2 mr-2 inline-block">
                                    <i className="fa-solid fa-map-marker-alt animate-bounce"></i> Live Map
                                  </a>
                                ) : (
                                  <button disabled className="text-gray-500 text-xs font-semibold border border-gray-600/30 px-2 py-1 rounded bg-gray-800/50 mb-2 mr-2 inline-block cursor-not-allowed" title="Location unknown">
                                    <i className="fa-solid fa-map-marker-alt"></i> Offline
                                  </button>
                                )}

                                {/* Resend Credentials */}
                                <button onClick={() => resendCredentials(d)} className="text-orange-400 hover:text-orange-300 text-xs font-semibold border border-orange-500/30 px-2 py-1 rounded bg-orange-500/10 mr-2 mb-2">
                                  <i className="fa-brands fa-whatsapp"></i> Resend
                                </button>
                                {/* Edit / Delete Actions */}
                                <button onClick={() => handleOpenDriverCrud(d)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10 mr-2 mb-2">
                                  <i className="fa-solid fa-pen"></i> Edit
                                </button>
                                <button onClick={() => handleDeleteDriver(d.id)} className="text-gray-400 hover:text-white text-xs font-semibold border border-white/30 px-2 py-1 rounded bg-white/10">
                                  <i className="fa-solid fa-trash"></i>
                                </button>
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

      {/* Driver Add/Edit Modal */}
      {showDriverCrudModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-white/10 my-8">
            <h3 className="text-xl font-bold text-white mb-2">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
            <p className="text-sm text-gray-400 mb-6">Fill in all required driver and vehicle information.</p>
            
            {driverFormError && <div className="text-sm mb-4 p-3 rounded bg-red-500/10 text-red-400 border border-red-500/30">{driverFormError}</div>}
            
            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="input-modern" required value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Contact / Login ID *</label>
                  <input type="text" className="input-modern" required value={driverForm.contact} onChange={e => setDriverForm({...driverForm, contact: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Address *</label>
                  <input type="text" className="input-modern" required value={driverForm.address} onChange={e => setDriverForm({...driverForm, address: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input type="text" className="input-modern" value={driverForm.password} onChange={e => setDriverForm({...driverForm, password: e.target.value})} required={!editingDriver} />
                </div>
                <div>
                  <label className="form-label">Aadhar Number *</label>
                  <input type="text" className="input-modern" required value={driverForm.aadharNumber} onChange={e => setDriverForm({...driverForm, aadharNumber: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">License Number *</label>
                  <input type="text" className="input-modern" required value={driverForm.licenseNumber} onChange={e => setDriverForm({...driverForm, licenseNumber: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Vehicle Name *</label>
                  <input type="text" className="input-modern" required value={driverForm.carName} onChange={e => setDriverForm({...driverForm, carName: e.target.value})} placeholder="e.g. Maruti Swift Dzire" />
                </div>
                <div>
                  <label className="form-label">Vehicle Registration No. *</label>
                  <input type="text" className="input-modern" required value={driverForm.carRegistration} onChange={e => setDriverForm({...driverForm, carRegistration: e.target.value})} placeholder="e.g. PB08AB1234" />
                </div>
                <div>
                  <label className="form-label">Chassis Number *</label>
                  <input type="text" className="input-modern" required value={driverForm.chassisNumber} onChange={e => setDriverForm({...driverForm, chassisNumber: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="input-modern appearance-none" value={driverForm.status} onChange={e => setDriverForm({...driverForm, status: e.target.value})}>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Cancelled (Rejected)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowDriverCrudModal(false)} className="w-1/2 btn-outline py-2">Cancel</button>
                <button type="submit" disabled={savingDriver} className="w-1/2 btn-primary py-2">{savingDriver ? 'Saving...' : 'Save Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4"><i className="fa-solid fa-lock text-taxi-yellow mr-2"></i> Security Settings</h3>
            <p className="text-sm text-gray-400 mb-6">Change your 6-digit Secret PIN</p>
            
            {pinMessage.text && <div className={`text-sm mb-4 p-3 rounded ${pinMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/30'}`}>{pinMessage.text}</div>}
            
            <form onSubmit={handleChangePin} className="space-y-4">
              <div>
                <label className="form-label">Current PIN</label>
                <div className="relative">
                  <input type={showCurrentPin ? "text" : "password"} maxLength={6} className="input-modern pr-10" value={currentPin} onChange={e => setCurrentPin(e.target.value)} required placeholder="Enter current PIN" />
                  <button type="button" onClick={() => setShowCurrentPin(!showCurrentPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-taxi-yellow focus:outline-none">
                    <i className={`fa-solid ${showCurrentPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">New PIN</label>
                <div className="relative">
                  <input type={showNewPin ? "text" : "password"} maxLength={6} className="input-modern pr-10" value={newPin} onChange={e => setNewPin(e.target.value)} required placeholder="Enter new 6-digit PIN" />
                  <button type="button" onClick={() => setShowNewPin(!showNewPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-taxi-yellow focus:outline-none">
                    <i className={`fa-solid ${showNewPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowSecurityModal(false)} className="w-1/2 btn-outline py-2">Cancel</button>
                <button type="submit" disabled={isChangingPin} className="w-1/2 btn-primary py-2">{isChangingPin ? 'Updating...' : 'Update PIN'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Assignment Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Assign Driver</h3>
            <p className="text-sm text-gray-400 mb-4">Select an approved driver for this booking.</p>
            
            <div className="relative mb-4">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="text" 
                placeholder="Search driver by name or vehicle..." 
                value={modalDriverSearchQuery}
                onChange={(e) => setModalDriverSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-taxi-yellow focus:ring-1 focus:ring-taxi-yellow text-sm"
              />
            </div>

            {(() => {
              const filteredDrivers = approvedDrivers.filter(d => 
                d.name.toLowerCase().includes(modalDriverSearchQuery.toLowerCase()) || 
                (d.carName && d.carName.toLowerCase().includes(modalDriverSearchQuery.toLowerCase())) ||
                (d.carRegistration && d.carRegistration.toLowerCase().includes(modalDriverSearchQuery.toLowerCase()))
              );
              
              if (approvedDrivers.length === 0) {
                return (
                  <div className="text-yellow-400 bg-yellow-500/10 p-4 border border-yellow-500/30 rounded-lg text-sm mb-6">
                    No approved drivers available. Please approve drivers from the Driver Directory first.
                  </div>
                );
              }
              
              if (filteredDrivers.length === 0) {
                return (
                  <div className="text-gray-400 text-center py-4 border border-white/10 rounded-lg mb-6 bg-black/30 text-sm">
                    No drivers found matching "{modalDriverSearchQuery}"
                  </div>
                );
              }

              return (
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredDrivers.map(d => (
                    <label key={d.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedDriverId === d.id ? 'border-taxi-yellow bg-taxi-yellow/10' : 'border-white/10 bg-black/30 hover:bg-white/5'}`}>
                      <input type="radio" name="driverSelect" value={d.id} checked={selectedDriverId === d.id} onChange={() => setSelectedDriverId(d.id)} className="text-taxi-yellow focus:ring-taxi-yellow" />
                      <div>
                        <div className="font-semibold text-white text-sm">{d.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{d.carName || 'Unknown Vehicle'} - {d.carRegistration || 'Unknown Reg'}</div>
                      </div>
                    </label>
                  ))}
                </div>
              );
            })()}
            
            <div className="flex gap-4">
              <button type="button" onClick={() => { setShowDriverModal(false); setSelectedBookingId(null); setSelectedDriverId(''); setModalDriverSearchQuery(''); }} className="w-1/2 btn-outline py-2">Cancel</button>
              <button 
                type="button" 
                disabled={!selectedDriverId} 
                onClick={() => updateBookingStatus(selectedBookingId, 'confirmed', selectedDriverId)} 
                className="w-1/2 btn-primary py-2 disabled:opacity-50"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Documents Modal */}
      {showDocsModal && selectedDriverForDocs && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl rounded-2xl p-6 border border-white/10 my-8">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Documents: {selectedDriverForDocs.name}</h3>
                <p className="text-sm text-taxi-yellow mt-1">Contact: {selectedDriverForDocs.contact} | Vehicle: {selectedDriverForDocs.carRegistration}</p>
              </div>
              <button onClick={() => { setShowDocsModal(false); setSelectedDriverForDocs(null); }} className="text-gray-400 hover:text-white text-2xl">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Selfie / Photo', key: 'selfieUrl' },
                { label: 'Aadhar (Front)', key: 'aadharFrontUrl' },
                { label: 'Aadhar (Back)', key: 'aadharBackUrl' },
                { label: 'Driving License', key: 'drivingLicenseUrl' },
                { label: 'Car Registration (RC)', key: 'carRegistrationDocUrl' },
                { label: 'Police Verification', key: 'policeVerificationUrl' }
              ].map(doc => (
                <div key={doc.key} className="bg-black/40 rounded-xl p-3 border border-white/5 relative flex flex-col">
                  <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">{doc.label}</h4>
                  {selectedDriverForDocs[doc.key] ? (
                    <a href={selectedDriverForDocs[doc.key]} target="_blank" rel="noopener noreferrer" className="block relative group">
                      <img src={selectedDriverForDocs[doc.key]} alt={doc.label} className="w-full h-48 object-contain bg-black/50 rounded-lg transition-all group-hover:brightness-75" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <i className="fa-solid fa-expand text-white text-3xl drop-shadow-md"></i>
                      </div>
                    </a>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-sm text-gray-600 bg-black/20 rounded-lg">No Document</div>
                  )}
                  <div className="mt-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleDocUpdate(e, selectedDriverForDocs.id, doc.key)} 
                      className="text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-taxi-yellow/10 file:text-taxi-yellow hover:file:bg-taxi-yellow/20 w-full" 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={handleDownloadZip} className="btn-primary px-8 py-2 bg-green-600 hover:bg-green-500 text-white border-none flex items-center gap-2">
                <i className="fa-solid fa-file-zipper"></i> Download Zip
              </button>
              <button onClick={() => { setShowDocsModal(false); setSelectedDriverForDocs(null); }} className="btn-primary px-8 py-2">Close Viewer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
