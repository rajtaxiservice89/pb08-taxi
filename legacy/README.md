# RAJ TAXI SERVICE (Ready)

Centralized storage for Booking and Driver forms via a small Node.js backend.

## What was added
- Node backend (`server.js`) with APIs:
  - POST /api/bookings, GET /api/bookings
  - POST /api/drivers, GET /api/drivers
- Driver uploads saved to `./DriverData/<NameDDMMYYYY>/` with files + `driver_info.json` + `driver_info.txt`.
- Bookings saved to `./DriverData/bookings.json` and `./DriverData/bookings-by-date/<YYYY-MM-DD>.json`.
- Frontend wired to call backend (booking form and driver form).
- Admin page shows centralized Drivers and Bookings and a refresh button.

## Run (Windows PowerShell)
1. Install dependencies (first time):
   - `npm install`
2. Start the server:
   - `npm start`
3. Open the site at:
   - http://localhost:3000/

Important: Use the site via the above address so the frontend can reach the `/api/*` endpoints.

## Where data goes
- Drivers: `DriverData/<NameDDMMYYYY>/`
- Bookings (all): `DriverData/bookings.json`
- Bookings by date: `DriverData/bookings-by-date/2025-09-08.json` (example)

## Admin access to centralized data
- Go to `admin.html` in the running site (http://localhost:3000/admin.html)
- Login with your configured admin user(s)
- Click "Refresh Central Data" to load data from the backend

## Notes
- Google Drive features remain optional and unchanged. Local saving happens on Submit; Drive save button still works if configured.
- Keep the server running to accept new submissions.
