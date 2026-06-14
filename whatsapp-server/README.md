# Raj Taxi - Baileys WhatsApp Server

Ye server ek chhota sa microservice hai jo WhatsApp se 24/7 connect hokar messages bhejta hai. Ye **Baileys** library use karta hai isliye isko bohat kam RAM (512MB) chahiye aur ye Render.com par bilkul free mein chal sakta hai.

## 1. Local Setup aur Login (Laptop par)
Sabse pehle aapko isko apne laptop par start karke QR code scan karna hoga.

1. Terminal mein is folder (`whatsapp-server`) mein jayen:
   ```bash
   cd whatsapp-server
   ```
2. Packages install karein (agar nahi kiye hain):
   ```bash
   npm install
   ```
3. Server start karein:
   ```bash
   npm start
   ```
4. Thodi der mein aapke terminal mein ek **QR Code** aayega.
5. Apne phone mein WhatsApp open karein -> Linked Devices par click karein -> **Link a Device** par jaakar laptop ki screen par aaya QR code scan karein.
6. Scan hone ke baad aapko terminal mein likha aayega: `WhatsApp connection opened successfully!`.
7. Iske baad `Ctrl + C` dabakar server rok dein. 
8. Aap dekhenge ki wahan ek naya folder ban gaya hoga: `auth_info_baileys`. **Ye folder aapka WhatsApp session hai**. Isko delete na karein.

## 2. GitHub par Code Push Karein
Ab aapko ye poora project (jisme `auth_info_baileys` folder bhi shamil hai) apne GitHub par push karna hai.

> **Zaroori:** WhatsApp session lagatar chalne ke liye us `auth_info_baileys` folder ka GitHub par jana zaroori hai.

## 3. Render.com par Free Hosting

1. [Render.com](https://render.com/) par jayen aur free account banayein (GitHub se login karein).
2. Dashboard par **New -> Web Service** par click karein.
3. Apni GitHub repository select karein (jisme Raj Taxi ka code hai).
4. Settings mein ye fill karein:
   - **Name:** pb08taxi-whatsapp
   - **Root Directory:** `whatsapp-server` (Yeh bohot zaroori hai)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Neeche jaakar **"Free"** plan select karein.
6. **Environment Variables (Advanced)** mein ye set karein:
   - Key: `WHATSAPP_API_KEY` | Value: `raj-taxi-secret-key-123` (ya koi bhi hard password rakh lein).
7. **Create Web Service** par click karein.
8. 2-3 minute mein aapka server live ho jayega aur aapko ek link mil jayega (e.g., `https://pb08taxi-whatsapp.onrender.com`).

## 4. Main Vercel App se Connect Karein
Aapki jo website Vercel par host hai, wahan settings mein jaakar ye 2 naye Environment Variables set karein:

1. `WHATSAPP_SERVER_URL` = `https://pb08taxi-whatsapp.onrender.com` (Jo link aapko render se mila)
2. `WHATSAPP_API_KEY` = `raj-taxi-secret-key-123`
3. `ADMIN_PHONE` = `91XXXXXXXXXX` (Apna number dalein jis par admin notifications chahiye, start with 91, bina kisi gap ke).

Phir website ko ek baar redeploy karein.
Aapka WhatsApp Automation Setup mukammal ho chuka hai!
