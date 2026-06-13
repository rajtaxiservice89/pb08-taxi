// script.js for RAJ TAXI SERVICE

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation link based on current page
    setActiveNavLink();
    // Mobile nav toggle
    ensureMobileNavToggle();
    
    // Initialize date field with today's date
    const dateField = document.getElementById('date');
    if (dateField) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        
        dateField.value = `${yyyy}-${mm}-${dd}`;
        dateField.min = `${yyyy}-${mm}-${dd}`;
    }
    
    // Form submissions
    const taxiBookingForm = document.getElementById('taxiBookingForm');
    if (taxiBookingForm) {
        taxiBookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Create booking object
            const booking = {
                customerName: document.getElementById('customerName').value,
                customerPhone: document.getElementById('customerPhone').value,
                pickup: document.getElementById('pickup').value,
                destination: document.getElementById('destination').value,
                pickupLocation: {
                    lat: parseFloat(document.getElementById('pickupLat')?.value || '') || null,
                    lng: parseFloat(document.getElementById('pickupLng')?.value || '') || null,
                    address: document.getElementById('pickupAddress')?.value || ''
                },
                destinationLocation: {
                    lat: parseFloat(document.getElementById('destLat')?.value || '') || null,
                    lng: parseFloat(document.getElementById('destLng')?.value || '') || null,
                    address: document.getElementById('destAddress')?.value || ''
                },
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                vehicleType: document.getElementById('vehicleType').value,
                passengers: document.getElementById('passengers').value,
                notes: document.getElementById('notes').value,
            };
            // India-only check: if we have coords, verify reverse geocode country ISO == IN
            try {
                const locs = [booking.pickupLocation, booking.destinationLocation];
                for (const loc of locs) {
                    if (loc && loc.lat && loc.lng) {
                        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=10&addressdetails=1`;
                        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                        const data = await res.json();
                        const cc = data?.address?.country_code;
                        if (cc && String(cc).toLowerCase() !== 'in') {
                            alert('Sorry, we currently accept bookings within India only.');
                            return;
                        }
                    }
                }
            } catch {}
            
            // Try centralized backend first
            try {
                const resp = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(booking)
                });
                if (!resp.ok) throw new Error('Failed');
                const data = await resp.json();
                // Also mirror to local for UI continuity
                saveBooking({ ...booking, id: data.booking?.id || Date.now(), timestamp: new Date().toLocaleString(), status: 'pending' });
            } catch (err) {
                // Fallback to local-only
                saveBooking({ ...booking, id: Date.now(), timestamp: new Date().toLocaleString(), status: 'pending' });
            }
            
            alert('Your taxi has been booked successfully! We will contact you shortly.');
            try { playNewBookingSound(); } catch {}
            this.reset();
            
            // Reset date to today
            const today = new Date();
            const yyyy = today.getFullYear();
            let mm = today.getMonth() + 1;
            let dd = today.getDate();
            
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            
            document.getElementById('date').value = `${yyyy}-${mm}-${dd}`;
        });
    }
    
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Check admin credentials
            if (username === 'smash89kumar' && password === 'Deepak_143') {
                // Show admin dashboard
                document.getElementById('adminLoginFormContainer').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                
                // Load and display bookings
                loadBookings();
                
                // Set admin as logged in
                localStorage.setItem('adminLoggedIn', 'true');
            } else {
                alert('Invalid username or password. Please try again.');
            }
            
            this.reset();
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            document.getElementById('adminLoginFormContainer').style.display = 'block';
            document.getElementById('adminDashboard').style.display = 'none';
            localStorage.setItem('adminLoggedIn', 'false');
        });
    }
    
    // Export data functionality
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportBookingsToTxt();
        });
    }
    
    // Export by date functionality
    const exportByDateBtn = document.getElementById('exportByDateBtn');
    if (exportByDateBtn) {
        exportByDateBtn.addEventListener('click', function() {
            exportBookingsByDateToTxt();
        });
    }
    // Add click event for the new spreadsheet button (if present)
    const spreadsheetBtn = document.getElementById('spreadsheetBtn');
    if (spreadsheetBtn) {
        spreadsheetBtn.addEventListener('click', function() {
            const sheetId = "1WK59UVAWEt2A3S8ZbF4d13JPDgH3Rhmqavht216RJHc";
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}`;
            window.open(url, '_blank');
        });
    }
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }
    
    // Initialize bookings table if on admin page
    if (window.location.pathname.endsWith('admin.html')) {
        // Check if admin is already logged in
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (isLoggedIn) {
            document.getElementById('adminLoginFormContainer').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadBookings();
        }
    }
});

// Set active navigation link based on current page
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Save booking to localStorage
function saveBooking(booking) {
    let bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    bookings.push(booking);
    localStorage.setItem('rajTaxiBookings', JSON.stringify(bookings));
    
    // Also save to a date-specific storage for easy retrieval
    saveBookingByDate(booking);
}

// Save booking organized by date
function saveBookingByDate(booking) {
    const date = booking.date;
    let dateBookings = JSON.parse(localStorage.getItem(`rajTaxiBookings_${date}`)) || [];
    dateBookings.push(booking);
    localStorage.setItem(`rajTaxiBookings_${date}`, JSON.stringify(dateBookings));
}

// Load bookings from localStorage
function loadBookings() {
    const bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    const tableBody = document.getElementById('bookingsTableBody');
    const noBookingsMessage = document.getElementById('noBookingsMessage');
    
    // Clear existing table rows
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    
    if (bookings.length === 0) {
        if (noBookingsMessage) {
            noBookingsMessage.style.display = 'block';
        }
        return;
    }
    
    if (noBookingsMessage) {
        noBookingsMessage.style.display = 'none';
    }
    
    // Add bookings to the table in reverse chronological order (newest first)
    bookings.reverse().forEach(booking => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${booking.id}</td>
            <td>${booking.customerName}</td>
            <td>${booking.customerPhone}</td>
            <td>${booking.pickup}</td>
            <td>${booking.destination}</td>
            <td>${booking.date} ${booking.time}</td>
            <td>${booking.vehicleType}</td>
            <td>${booking.passengers}</td>
        `;
        
        if (tableBody) {
            tableBody.appendChild(row);
        }
    });
}

// Export bookings to TXT file
function exportBookingsToTxt() {
    const bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    
    if (bookings.length === 0) {
        alert('No bookings to export!');
        return;
    }
    
    let txtContent = 'RAJ TAXI SERVICE\'S - All Bookings\n';
    txtContent += '=============================================\n\n';
    
    bookings.forEach((booking, index) => {
        txtContent += `Booking ${index + 1}:\n`;
        txtContent += `ID: ${booking.id}\n`;
        txtContent += `Customer Name: ${booking.customerName}\n`;
        txtContent += `Phone: ${booking.customerPhone}\n`;
        txtContent += `Pickup: ${booking.pickup}\n`;
        txtContent += `Destination: ${booking.destination}\n`;
        txtContent += `Date: ${booking.date}\n`;
        txtContent += `Time: ${booking.time}\n`;
        txtContent += `Vehicle Type: ${booking.vehicleType}\n`;
        txtContent += `Passengers: ${booking.passengers}\n`;
        if (booking.notes) {
            txtContent += `Special Instructions: ${booking.notes}\n`;
        }
        txtContent += `Booking Timestamp: ${booking.timestamp}\n`;
        txtContent += '\n---------------------------------------------\n\n';
    });
    
    // Create download link
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'raj_taxi_all_bookings.txt';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    alert(`Exported ${bookings.length} bookings!`);
}

// NEW FUNCTION: Export bookings by date to TXT files in Data folder
function exportBookingsByDateToTxt() {
    const bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    
    if (bookings.length === 0) {
        alert('No bookings to export!');
        return;
    }
    
    // Group bookings by date
    const bookingsByDate = {};
    bookings.forEach(booking => {
        if (!bookingsByDate[booking.date]) {
            bookingsByDate[booking.date] = [];
        }
        bookingsByDate[booking.date].push(booking);
    });
    
    let exportedCount = 0;
    
    // Create a text file for each date in Data folder
    for (const date in bookingsByDate) {
        let txtContent = `RAJ TAXI SERVICE'S - Bookings for ${formatDateForDisplay(date)}\n`;
        txtContent += '=============================================\n\n';
        
        bookingsByDate[date].forEach((booking, index) => {
            txtContent += `Booking ${index + 1}:\n`;
            txtContent += `ID: ${booking.id}\n`;
            txtContent += `Customer Name: ${booking.customerName}\n`;
            txtContent += `Phone: ${booking.customerPhone}\n`;
            txtContent += `Pickup: ${booking.pickup}\n`;
            txtContent += `Destination: ${booking.destination}\n`;
            txtContent += `Time: ${booking.time}\n`;
            txtContent += `Vehicle Type: ${booking.vehicleType}\n`;
            txtContent += `Passengers: ${booking.passengers}\n`;
            if (booking.notes) {
                txtContent += `Special Instructions: ${booking.notes}\n`;
            }
            txtContent += `Booking Timestamp: ${booking.timestamp}\n`;
            txtContent += '\n---------------------------------------------\n\n';
            
            exportedCount++;
        });
        
        // Create download link with Data folder path
        const blob = new Blob([txtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Data/raj_taxi_bookings_${date}.txt`; // Save to Data folder
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    alert(`Exported ${exportedCount} bookings grouped by date to Data folder!`);
}

// Format date for display (YYYY-MM-DD to DD/MM/YYYY)
function formatDateForDisplay(dateString) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}

// Admin login function (can be called from other pages if needed)
function adminLogin(username, password) {
    if (username === 'smash89kumar' && password === 'Deepak_143') {
        localStorage.setItem('adminLoggedIn', 'true');
        return true;
    }
    return false;
}

// Admin logout function
function adminLogout() {
    localStorage.setItem('adminLoggedIn', 'false');
}

// Check if admin is logged in
function isAdminLoggedIn() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

// Get bookings for a specific date
function getBookingsByDate(date) {
    return JSON.parse(localStorage.getItem(`rajTaxiBookings_${date}`)) || [];
}

// Get all bookings
function getAllBookings() {
    return JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
}

// Clear all bookings (for testing purposes)
function clearAllBookings() {
    if (confirm('Are you sure you want to clear all booking data? This cannot be undone.')) {
        localStorage.removeItem('rajTaxiBookings');
        
        // Also clear all date-specific bookings
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('rajTaxiBookings_')) {
                localStorage.removeItem(key);
            }
        });
        
        alert('All booking data has been cleared.');
        
        // Reload the bookings table if on admin page
        if (window.location.pathname.endsWith('admin.html') && isAdminLoggedIn()) {
            loadBookings();
        }
    }
}

// Inject a mobile menu toggle and wire it up
function ensureMobileNavToggle() {
    const header = document.querySelector('header .header-content');
    const nav = document.querySelector('header nav ul');
    if (!header || !nav) return;
    if (!document.querySelector('.mobile-nav-toggle')) {
        const btn = document.createElement('button');
        btn.className = 'mobile-nav-toggle';
        btn.type = 'button';
        btn.textContent = 'Menu';
        header.insertBefore(btn, nav.parentElement.nextSibling);
        btn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
}

// --- Sound alerts ---
let newBookingAudio, newDriverAudio;
function ensureAudio(){
    if(!newBookingAudio){ newBookingAudio = new Audio('pingsound/new-booking.mp3'); newBookingAudio.preload = 'auto'; }
    if(!newDriverAudio){ newDriverAudio = new Audio('pingsound/new-driver.mp3'); newDriverAudio.preload = 'auto'; }
}
function playNewBookingSound(){ ensureAudio(); newBookingAudio?.play?.().catch(()=>{}); }
function playNewDriverSound(){ ensureAudio(); newDriverAudio?.play?.().catch(()=>{}); }