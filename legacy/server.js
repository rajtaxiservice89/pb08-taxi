// Simple Express backend to store booking and driver data locally
// Stores drivers under ./DriverData/<NameDDMMYYYY>/ with all uploaded files
// Stores bookings under ./DriverData/bookings.json and per-day JSON

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { customAlphabet } = require('nanoid');
const archiver = require('archiver');
const serveIndex = require('serve-index');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure base DriverData folder exists
const DRIVER_DATA_DIR = path.join(__dirname, 'DriverData');
fs.mkdirSync(DRIVER_DATA_DIR, { recursive: true });
const CONFIG_DIR = path.join(DRIVER_DATA_DIR, 'config');
fs.mkdirSync(CONFIG_DIR, { recursive: true });

// Storage engine that will create driver folder dynamically after we know the name/date
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

function formatDDMMYYYY(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

function sanitizeName(name) {
  return (name || 'Unknown').toString().trim().replace(/[^a-zA-Z0-9_\-]/g, '');
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function readJSON(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return fallback; }
}

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- Admin Management (server-based) ---
const ADMINS_FILE = path.join(CONFIG_DIR, 'admins.json');
function defaultAdmins() {
  return [{ username: 'smash89kumar', password: 'Deepak_143' }];
}
function getAdmins() {
  const list = readJSON(ADMINS_FILE, null);
  if (!list || !Array.isArray(list) || list.length === 0) {
    writeJSON(ADMINS_FILE, defaultAdmins());
    return defaultAdmins();
  }
  return list;
}

// Login check
app.post('/api/admins/login', (req, res) => {
  const { username, password } = req.body || {};
  const ok = getAdmins().some(a => a.username === username && a.password === password);
  res.json({ ok });
});

// List admins (usernames only)
app.get('/api/admins', (req, res) => {
  res.json({ usernames: getAdmins().map(a => a.username) });
});

// Add admin
app.post('/api/admins', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ ok: false, error: 'username and password required' });
  const admins = getAdmins();
  if (admins.some(a => a.username === username)) return res.status(409).json({ ok: false, error: 'Username exists' });
  admins.push({ username, password });
  writeJSON(ADMINS_FILE, admins);
  res.json({ ok: true });
});

// Change credentials
app.post('/api/admins/change', (req, res) => {
  const { currentUsername, currentPassword, newUsername, newPassword } = req.body || {};
  const admins = getAdmins();
  const idx = admins.findIndex(a => a.username === currentUsername && a.password === currentPassword);
  if (idx === -1) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  if (newUsername) admins[idx].username = newUsername;
  if (newPassword) admins[idx].password = newPassword;
  writeJSON(ADMINS_FILE, admins);
  res.json({ ok: true });
});

// Delete admin
app.delete('/api/admins/:username', (req, res) => {
  const username = req.params.username;
  const admins = getAdmins();
  if (admins.length <= 1) return res.status(400).json({ ok: false, error: 'Cannot delete last admin' });
  const filtered = admins.filter(a => a.username !== username);
  if (filtered.length === admins.length) return res.status(404).json({ ok: false, error: 'Admin not found' });
  writeJSON(ADMINS_FILE, filtered);
  res.json({ ok: true });
});

// --- WhatsApp Links (server-based) ---
const WHATSAPP_FILE = path.join(CONFIG_DIR, 'whatsapp-links.json');
function getWhatsappLinks() {
  let links = readJSON(WHATSAPP_FILE, null);
  if (!Array.isArray(links)) { links = Array(10).fill(''); writeJSON(WHATSAPP_FILE, links); }
  if (links.length < 10) { links = [...links, ...Array(10 - links.length).fill('')]; writeJSON(WHATSAPP_FILE, links); }
  return links;
}

app.get('/api/whatsapp-links', (req, res) => {
  res.json({ links: getWhatsappLinks() });
});

app.put('/api/whatsapp-links', (req, res) => {
  const body = req.body || {};
  let links = getWhatsappLinks();
  if (Array.isArray(body.links)) {
    links = body.links.slice(0, 10);
    while (links.length < 10) links.push('');
  } else if (body.position) {
    const pos = Number(body.position);
    if (pos >= 1 && pos <= 10) {
      links[pos - 1] = body.url || '';
    }
  }
  writeJSON(WHATSAPP_FILE, links);
  res.json({ ok: true, links });
});

// Create booking (centralized)
async function isInIndiaFromCoords(lat, lng){
  return await new Promise((resolve)=>{
    try{
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
      https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'RajTaxi/1.0' } }, (r)=>{
        let body='';
        r.on('data', chunk=> body+=chunk);
        r.on('end', ()=>{
          try{ const j = JSON.parse(body); const cc = (j.address && j.address.country_code)||''; resolve(String(cc).toLowerCase()==='in'); }
          catch{ resolve(true); }
        });
      }).on('error', ()=> resolve(true));
    } catch { resolve(true); }
  });
}

app.post('/api/bookings', async (req, res) => {
  const body = req.body || {};
  // Server-side India-only enforcement when lat/lng present
  try{
    const checks = [];
    if (body.pickupLocation && body.pickupLocation.lat && body.pickupLocation.lng) {
      checks.push(isInIndiaFromCoords(body.pickupLocation.lat, body.pickupLocation.lng));
    }
    if (body.destinationLocation && body.destinationLocation.lat && body.destinationLocation.lng) {
      checks.push(isInIndiaFromCoords(body.destinationLocation.lat, body.destinationLocation.lng));
    }
    if (checks.length){
      const results = await Promise.all(checks);
      if (results.some(r=>!r)) return res.status(400).json({ ok:false, error:'Bookings are limited to India only.' });
    }
  } catch {}
  const b = {
    id: Date.now(),
    customerName: body.customerName || '',
    customerPhone: body.customerPhone || '',
  pickup: body.pickup || '',
  destination: body.destination || '',
  pickupLocation: body.pickupLocation || null, // { lat, lng, address }
  destinationLocation: body.destinationLocation || null, // { lat, lng, address }
    date: body.date || '',
    time: body.time || '',
    vehicleType: body.vehicleType || '',
    passengers: body.passengers || '',
    notes: body.notes || '',
    status: 'pending',
    timestamp: new Date().toISOString(),
  };

  // Append to bookings.json
  const bookingsFile = path.join(DRIVER_DATA_DIR, 'bookings.json');
  const all = readJSON(bookingsFile, []);
  all.push(b);
  writeJSON(bookingsFile, all);

  // Write per-date file YYYY-MM-DD
  if (b.date) {
    const byDateDir = path.join(DRIVER_DATA_DIR, 'bookings-by-date');
    const dateFile = path.join(byDateDir, `${b.date}.json`);
    const list = readJSON(dateFile, []);
    list.push(b);
    writeJSON(dateFile, list);
  }

  res.json({ ok: true, booking: b });
});

// List bookings
app.get('/api/bookings', (req, res) => {
  const bookingsFile = path.join(DRIVER_DATA_DIR, 'bookings.json');
  res.json(readJSON(bookingsFile, []));
});

// Update booking
app.put('/api/bookings/:id', (req, res) => {
  const id = Number(req.params.id);
  const bookingsFile = path.join(DRIVER_DATA_DIR, 'bookings.json');
  const all = readJSON(bookingsFile, []);
  const idx = all.findIndex(b => Number(b.id) === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Booking not found' });
  const prev = all[idx];
  const updated = {
    ...prev,
    customerName: req.body.customerName ?? prev.customerName,
    customerPhone: req.body.customerPhone ?? prev.customerPhone,
    pickup: req.body.pickup ?? prev.pickup,
    destination: req.body.destination ?? prev.destination,
    date: req.body.date ?? prev.date,
    time: req.body.time ?? prev.time,
    vehicleType: req.body.vehicleType ?? prev.vehicleType,
    passengers: req.body.passengers ?? prev.passengers,
    notes: req.body.notes ?? prev.notes,
  pickupLocation: req.body.pickupLocation ?? prev.pickupLocation,
  destinationLocation: req.body.destinationLocation ?? prev.destinationLocation,
    status: req.body.status ?? prev.status,
  };
  all[idx] = updated;
  writeJSON(bookingsFile, all);
  // Update by-date files if date changed
  try {
    if (prev.date) {
      const dateFile = path.join(DRIVER_DATA_DIR, 'bookings-by-date', `${prev.date}.json`);
      const list = readJSON(dateFile, []);
      const di = list.findIndex(b => Number(b.id) === id);
      if (di !== -1) {
        list.splice(di, 1);
        writeJSON(dateFile, list);
      }
    }
    if (updated.date) {
      const dateFileNew = path.join(DRIVER_DATA_DIR, 'bookings-by-date', `${updated.date}.json`);
      const listNew = readJSON(dateFileNew, []);
      listNew.push(updated);
      writeJSON(dateFileNew, listNew);
    }
  } catch {}
  res.json({ ok: true, booking: updated });
});

// Delete booking
app.delete('/api/bookings/:id', (req, res) => {
  const id = Number(req.params.id);
  const bookingsFile = path.join(DRIVER_DATA_DIR, 'bookings.json');
  const all = readJSON(bookingsFile, []);
  const idx = all.findIndex(b => Number(b.id) === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Booking not found' });
  const removed = all.splice(idx, 1)[0];
  writeJSON(bookingsFile, all);
  // Remove from by-date file
  try {
    if (removed.date) {
      const dateFile = path.join(DRIVER_DATA_DIR, 'bookings-by-date', `${removed.date}.json`);
      const list = readJSON(dateFile, []);
      const di = list.findIndex(b => Number(b.id) === id);
      if (di !== -1) {
        list.splice(di, 1);
        writeJSON(dateFile, list);
      }
    }
  } catch {}
  res.json({ ok: true });
});

// Upload driver form + files
// Expect multipart/form-data with fields and files: selfie, aadharFront, aadharBack, drivingLicense, carRegistrationDoc, policeVerification
app.post('/api/drivers', upload.fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'drivingLicense', maxCount: 1 },
  { name: 'carRegistrationDoc', maxCount: 1 },
  { name: 'policeVerification', maxCount: 1 },
]), (req, res) => {
  try {
    const {
      name,
      contact,
      address,
      aadharNumber,
      licenseNumber,
      carRegistration,
      chassisNumber,
      carName,
    } = req.body || {};

    const safeName = sanitizeName(name);
    const folderName = `${safeName}${formatDDMMYYYY(new Date())}`;
    const driverFolder = path.join(DRIVER_DATA_DIR, folderName);
    fs.mkdirSync(driverFolder, { recursive: true });

    // Save metadata
    const meta = {
      name,
      contact,
      address,
      aadharNumber,
      licenseNumber,
      carRegistration,
      chassisNumber,
      carName,
      folderName,
      folderPath: path.relative(__dirname, driverFolder),
      receivedAt: new Date().toISOString(),
      id: nanoid(),
    };
    writeJSON(path.join(driverFolder, 'driver_info.json'), meta);
    // Also write a readable text file
    const txt = [
      'RAJ TAXI SERVICE - Driver Application',
      '====================================',
      `Name: ${name || ''}`,
      `Contact: ${contact || ''}`,
      `Address: ${address || ''}`,
      `Aadhar Number: ${aadharNumber || ''}`,
      `License Number: ${licenseNumber || ''}`,
      `Car Registration: ${carRegistration || ''}`,
      `Chassis Number: ${chassisNumber || ''}`,
      `Car Name/Model: ${carName || ''}`,
      `Folder: ${folderName}`,
      `Saved At: ${new Date().toLocaleString()}`,
      ''
    ].join('\n');
    fs.writeFileSync(path.join(driverFolder, 'driver_info.txt'), txt, 'utf8');

    // Helper to persist a file buffer as original filename
    const saveFile = (fileField, prettyName) => {
      const file = (req.files?.[fileField] || [])[0];
      if (!file) return null;
      const original = file.originalname || `${fileField}.bin`;
      const safe = original.replace(/[^a-zA-Z0-9_.\-]/g, '_');
      const filePath = path.join(driverFolder, `${prettyName || fileField}__${safe}`);
      fs.writeFileSync(filePath, file.buffer);
      return path.relative(__dirname, filePath);
    };

    const filesSaved = {
      selfie: saveFile('selfie', 'selfie'),
      aadharFront: saveFile('aadharFront', 'aadhar_front'),
      aadharBack: saveFile('aadharBack', 'aadhar_back'),
      drivingLicense: saveFile('drivingLicense', 'driving_license'),
      carRegistrationDoc: saveFile('carRegistrationDoc', 'car_registration'),
      policeVerification: saveFile('policeVerification', 'police_verification'),
    };

    // Index drivers
    const indexFile = path.join(DRIVER_DATA_DIR, 'drivers-index.json');
    const index = readJSON(indexFile, []);
    index.push({ ...meta, files: filesSaved });
    writeJSON(indexFile, index);

    res.json({ ok: true, folderName, folderPath: meta.folderPath, files: filesSaved, meta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to save driver data' });
  }
});

// List drivers
app.get('/api/drivers', (req, res) => {
  const indexFile = path.join(DRIVER_DATA_DIR, 'drivers-index.json');
  res.json(readJSON(indexFile, []));
});

// Update driver meta (no file updates here)
app.put('/api/drivers/:id', (req, res) => {
  const id = String(req.params.id);
  const indexFile = path.join(DRIVER_DATA_DIR, 'drivers-index.json');
  const index = readJSON(indexFile, []);
  const idx = index.findIndex(d => String(d.id) === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Driver not found' });
  const meta = index[idx];
  const updated = {
    ...meta,
    name: req.body.name ?? meta.name,
    contact: req.body.contact ?? meta.contact,
    address: req.body.address ?? meta.address,
    aadharNumber: req.body.aadharNumber ?? meta.aadharNumber,
    licenseNumber: req.body.licenseNumber ?? meta.licenseNumber,
    carRegistration: req.body.carRegistration ?? meta.carRegistration,
    chassisNumber: req.body.chassisNumber ?? meta.chassisNumber,
    carName: req.body.carName ?? meta.carName,
  };
  index[idx] = updated;
  writeJSON(indexFile, index);
  // Also update driver folder's driver_info.json
  try {
    const folderPath = path.join(__dirname, updated.folderPath);
    writeJSON(path.join(folderPath, 'driver_info.json'), updated);
  } catch {}
  res.json({ ok: true, driver: updated });
});

// Delete driver (remove folder and index entry)
app.delete('/api/drivers/:id', (req, res) => {
  const id = String(req.params.id);
  const indexFile = path.join(DRIVER_DATA_DIR, 'drivers-index.json');
  const index = readJSON(indexFile, []);
  const idx = index.findIndex(d => String(d.id) === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Driver not found' });
  const entry = index[idx];
  // Remove folder
  try {
    const folderPath = path.join(__dirname, entry.folderPath);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
  } catch (e) { console.error('Failed to delete folder', e); }
  // Remove index entry
  index.splice(idx, 1);
  writeJSON(indexFile, index);
  res.json({ ok: true });
});

// Mark drivers read/unread
app.post('/api/drivers/mark', (req, res) => {
  const { ids, read } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ ok: false, error: 'ids required' });
  const indexFile = path.join(DRIVER_DATA_DIR, 'drivers-index.json');
  const index = readJSON(indexFile, []);
  let updated = 0;
  ids.forEach(id => {
    const i = index.findIndex(d => String(d.id) === String(id));
    if (i !== -1) { index[i].read = !!read; updated++; }
  });
  writeJSON(indexFile, index);
  res.json({ ok: true, updated });
});

// Export selected drivers as ZIP (metadata + files)
app.post('/api/drivers/export-zip', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ ok: false, error: 'ids required' });
  const indexFile = path.join(DRIVER_DATA_DIR, 'drivers-index.json');
  const index = readJSON(indexFile, []);
  const selected = index.filter(d => ids.includes(String(d.id)) || ids.includes(d.id));
  if (selected.length === 0) return res.status(404).json({ ok: false, error: 'No drivers found' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="drivers_export.zip"');
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', err => { console.error(err); res.status(500).end(); });
  archive.pipe(res);

  selected.forEach(d => {
    const folderAbs = path.join(__dirname, d.folderPath || '');
    if (fs.existsSync(folderAbs)) {
      archive.directory(folderAbs, d.folderName || path.basename(folderAbs));
    } else {
      // still include metadata if folder missing
      archive.append(JSON.stringify(d, null, 2), { name: `${d.folderName || d.id}/driver_info.json` });
    }
  });

  archive.finalize();
});

// Serve DriverData with directory index, then general static site
app.use('/DriverData', express.static(path.join(__dirname, 'DriverData')));
app.use('/DriverData', serveIndex(path.join(__dirname, 'DriverData'), { icons: true }));
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
