const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const qrcodeImage = require('qrcode');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.WHATSAPP_API_KEY || 'raj-taxi-secret-key-123';

let sock;
let currentQR = null;
let isConnected = false;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();
  console.log('using WA v' + version.join('.'));

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrcodeImage.toDataURL(qr, (err, url) => {
        if (!err) currentQR = url;
      });
      console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      isConnected = false;
      currentQR = null;
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        console.log('You are logged out.');
        // Delete auth folder to allow clean restart
        fs.rmSync('auth_info_baileys', { recursive: true, force: true });
        connectToWhatsApp(); // Restart to get new QR
      }
    } else if (connection === 'open') {
      isConnected = true;
      currentQR = null;
      console.log('WhatsApp connection opened successfully!');
    }
  });
}

// Connect immediately on boot
connectToWhatsApp();

// API endpoint to check status and get QR
app.get('/status', (req, res) => {
  res.json({ isConnected, hasQR: !!currentQR, qr: currentQR });
});

// API endpoint to logout
app.post('/logout', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Invalid API Key.' });
  }
  try {
    if (sock) await sock.logout();
    isConnected = false;
    currentQR = null;
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// API endpoint to send a message
app.post('/send', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Invalid API Key.' });
  }

  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message are required.' });
  }

  // Ensure phone has country code. e.g. 91XXXXXXXXXX
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;
  
  const jid = formattedPhone + '@s.whatsapp.net';

  try {
    if (!sock || !sock.user) {
      return res.status(500).json({ error: 'WhatsApp is not connected yet.' });
    }

    // Check if the number is registered on WhatsApp
    const [result] = await sock.onWhatsApp(jid);
    if (!result?.exists) {
      return res.status(400).json({ error: 'Phone number is not registered on WhatsApp.' });
    }

    await sock.sendMessage(jid, { text: message });
    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message.', details: error.message });
  }
});

// Basic health check for Render
app.get('/health', (req, res) => {
  res.send('WhatsApp Baileys Server is running.');
});

app.listen(PORT, () => {
  console.log(`WhatsApp API Server running on port ${PORT}`);
});
