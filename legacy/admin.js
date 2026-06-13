// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation link based on current page
    setActiveNavLink();
    
    // Form submissions
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Server-based login
            let ok = false;
            try {
                const resp = await fetch('/api/admins/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                const data = await resp.json();
                ok = !!data.ok;
            } catch {}

            if (ok) {
                // Show admin dashboard
                document.getElementById('adminLoginFormContainer').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                
                // Load and display bookings
                loadBookings();
                loadCentralizedData();
                
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
    
    // Export to Excel functionality
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            exportBookingsToExcel();
        });
    }
    
    // Export by date functionality
    const exportByDateBtn = document.getElementById('exportByDateBtn');
    if (exportByDateBtn) {
        exportByDateBtn.addEventListener('click', function() {
            exportBookingsByDateToTxt();
        });
    }

    // Refresh centralized data
    const refreshCentralBtn = document.getElementById('refreshCentralBtn');
    if (refreshCentralBtn) {
        refreshCentralBtn.addEventListener('click', function() {
            loadCentralizedData();
        });
    }

    const exportCentralDriversBtn = document.getElementById('exportCentralDriversBtn');
    if (exportCentralDriversBtn) {
        exportCentralDriversBtn.addEventListener('click', exportCentralDriversTxt);
    }
    const driversHeaderCheckbox = document.getElementById('driversHeaderCheckbox');
    if (driversHeaderCheckbox) {
        driversHeaderCheckbox.addEventListener('change', function() {
            document.querySelectorAll('.driver-checkbox').forEach(cb => cb.checked = driversHeaderCheckbox.checked);
        });
    }
    const driversMarkReadBtn = document.getElementById('driversMarkReadBtn');
    if (driversMarkReadBtn) {
        driversMarkReadBtn.addEventListener('click', () => bulkMarkDrivers(true));
    }
    const driversMarkUnreadBtn = document.getElementById('driversMarkUnreadBtn');
    if (driversMarkUnreadBtn) {
        driversMarkUnreadBtn.addEventListener('click', () => bulkMarkDrivers(false));
    }
    const driversExportZipBtn = document.getElementById('driversExportZipBtn');
    if (driversExportZipBtn) {
        driversExportZipBtn.addEventListener('click', exportSelectedDriversZip);
    }
    const exportCentralBookingsBtn = document.getElementById('exportCentralBookingsBtn');
    if (exportCentralBookingsBtn) {
        exportCentralBookingsBtn.addEventListener('click', exportCentralBookingsTxt);
    }

    // Zoom controls for Centralized sections
    function setupZoom(zoomAreaId, outId, resetId, inId){
        const cont = document.getElementById(zoomAreaId);
        if(!cont) return;
        let scale = 1;
        function apply(){ cont.style.transform = `scale(${scale})`; }
        document.getElementById(outId)?.addEventListener('click', ()=>{ scale = Math.max(0.6, +(scale-0.1).toFixed(2)); apply(); });
        document.getElementById(inId)?.addEventListener('click', ()=>{ scale = Math.min(2, +(scale+0.1).toFixed(2)); apply(); });
        document.getElementById(resetId)?.addEventListener('click', ()=>{ scale = 1; apply(); });
    }
    setupZoom('centralBookingsZoomArea','bookingsZoomOut','bookingsZoomReset','bookingsZoomIn');
    setupZoom('centralDriversZoomArea','driversZoomOut','driversZoomReset','driversZoomIn');
    
    // Spreadsheet button
    const spreadsheetBtn = document.getElementById('spreadsheetBtn');
    if (spreadsheetBtn) {
        spreadsheetBtn.addEventListener('click', function() {
            const sheetId = getSpreadsheetId();
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}`;
            window.open(url, '_blank');
        });
    }
    
    // Add new booking button
    const addBookingBtn = document.getElementById('addBookingBtn');
    if (addBookingBtn) {
        addBookingBtn.addEventListener('click', function() {
            // Clear the form and open modal
            document.getElementById('editBookingForm').reset();
            document.getElementById('editBookingId').value = '';
            document.getElementById('editModal').style.display = 'block';
        });
    }
    
    // Bulk actions
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.booking-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll.checked;
            });
        });
    }
    
    const applyBulkAction = document.getElementById('applyBulkAction');
    if (applyBulkAction) {
        applyBulkAction.addEventListener('click', function() {
            const action = document.getElementById('bulkAction').value;
            if (!action) {
                alert('Please select a bulk action');
                return;
            }
            
            const selectedBookings = getSelectedBookings();
            if (selectedBookings.length === 0) {
                alert('Please select at least one booking');
                return;
            }
            
            if (action === 'delete') {
                if (confirm(`Are you sure you want to delete ${selectedBookings.length} booking(s)?`)) {
                    deleteBookings(selectedBookings);
                }
            } else if (action === 'export') {
                exportSelectedBookings(selectedBookings);
            } else if (action === 'confirm') {
                confirmBookings(selectedBookings);
            }
        });
    }
    
    // Edit modal close button
    const closeModalButtons = document.querySelectorAll('.close');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Edit form submission
    const editBookingForm = document.getElementById('editBookingForm');
    if (editBookingForm) {
        editBookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const bookingId = document.getElementById('editBookingId').value;
            const booking = {
                customerName: document.getElementById('editCustomerName').value,
                customerPhone: document.getElementById('editCustomerPhone').value,
                pickup: document.getElementById('editPickup').value,
                destination: document.getElementById('editDestination').value,
                date: document.getElementById('editDate').value,
                time: document.getElementById('editTime').value,
                vehicleType: document.getElementById('editVehicleType').value,
                passengers: document.getElementById('editPassengers').value,
                notes: document.getElementById('editNotes').value,
                status: bookingId ? getBookingStatus(bookingId) : 'pending' // Set status to pending for new bookings
            };
            
            if (bookingId) {
                // Update existing booking
                updateBooking(bookingId, booking);
            } else {
                // Add new booking
                booking.id = Date.now();
                booking.timestamp = new Date().toLocaleString();
                saveBooking(booking);
            }
            
            // Close modal and refresh table
            document.getElementById('editModal').style.display = 'none';
            loadBookings();
            alert('Booking saved successfully!');
        });
    }
    
    // Configuration buttons
    const spreadsheetConfigBtn = document.getElementById('spreadsheetConfigBtn');
    if (spreadsheetConfigBtn) {
        spreadsheetConfigBtn.addEventListener('click', function() {
            document.getElementById('spreadsheetId').value = getSpreadsheetId();
            document.getElementById('spreadsheetConfigModal').style.display = 'block';
        });
    }
    
    const webappConfigBtn = document.getElementById('webappConfigBtn');
    if (webappConfigBtn) {
        webappConfigBtn.addEventListener('click', function() {
            document.getElementById('webappUrl').value = getWebappUrl();
            document.getElementById('webappConfigModal').style.display = 'block';
        });
    }
    
    const whatsappConfigBtn = document.getElementById('whatsappConfigBtn');
    if (whatsappConfigBtn) {
        whatsappConfigBtn.addEventListener('click', async function() {
            await loadWhatsappLinksServer();
            document.getElementById('whatsappLinksModal').style.display = 'block';
        });
    }
    
    const adminManagementBtn = document.getElementById('adminManagementBtn');
    if (adminManagementBtn) {
        adminManagementBtn.addEventListener('click', async function() {
            await loadAdminsListServer();
            document.getElementById('adminManagementModal').style.display = 'block';
        });
    }
    
    // Spreadsheet ID edit/save
    const editSpreadsheetIdBtn = document.getElementById('editSpreadsheetId');
    const saveSpreadsheetIdBtn = document.getElementById('saveSpreadsheetId');
    const spreadsheetIdInput = document.getElementById('spreadsheetId');
    
    if (editSpreadsheetIdBtn && saveSpreadsheetIdBtn && spreadsheetIdInput) {
        editSpreadsheetIdBtn.addEventListener('click', function() {
            spreadsheetIdInput.readOnly = false;
            editSpreadsheetIdBtn.style.display = 'none';
            saveSpreadsheetIdBtn.style.display = 'inline-block';
        });
        
        saveSpreadsheetIdBtn.addEventListener('click', function() {
            const newId = spreadsheetIdInput.value.trim();
            if (newId) {
                localStorage.setItem('rajTaxiSpreadsheetId', newId);
                spreadsheetIdInput.readOnly = true;
                editSpreadsheetIdBtn.style.display = 'inline-block';
                saveSpreadsheetIdBtn.style.display = 'none';
                alert('Spreadsheet ID updated successfully!');
            } else {
                alert('Please enter a valid Spreadsheet ID');
            }
        });
    }
    
    // Web App URL edit/save
    const editWebappUrlBtn = document.getElementById('editWebappUrl');
    const saveWebappUrlBtn = document.getElementById('saveWebappUrl');
    const webappUrlInput = document.getElementById('webappUrl');
    
    if (editWebappUrlBtn && saveWebappUrlBtn && webappUrlInput) {
        editWebappUrlBtn.addEventListener('click', function() {
            webappUrlInput.readOnly = false;
            editWebappUrlBtn.style.display = 'none';
            saveWebappUrlBtn.style.display = 'inline-block';
        });
        
        saveWebappUrlBtn.addEventListener('click', function() {
            const newUrl = webappUrlInput.value.trim();
            if (newUrl) {
                localStorage.setItem('rajTaxiWebappUrl', newUrl);
                webappUrlInput.readOnly = true;
                editWebappUrlBtn.style.display = 'inline-block';
                saveWebappUrlBtn.style.display = 'none';
                alert('Web App URL updated successfully!');
            } else {
                alert('Please enter a valid Web App URL');
            }
        });
    }
    
    // WhatsApp link management
    const addWhatsappLinkBtn = document.getElementById('addWhatsappLink');
    if (addWhatsappLinkBtn) {
        addWhatsappLinkBtn.addEventListener('click', function() {
            document.getElementById('whatsappLinkForm').reset();
            document.getElementById('whatsappLinkIndex').value = '';
            document.getElementById('whatsappLinkFormTitle').textContent = 'Add WhatsApp Link';
            document.getElementById('whatsappLinkFormModal').style.display = 'block';
        });
    }
    
    const whatsappLinkForm = document.getElementById('whatsappLinkForm');
    if (whatsappLinkForm) {
        whatsappLinkForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const index = document.getElementById('whatsappLinkIndex').value;
            const url = document.getElementById('whatsappLinkUrl').value;
            const position = document.getElementById('whatsappLinkPosition').value;
            await saveWhatsappLinkServer(url, position, index);
            document.getElementById('whatsappLinkFormModal').style.display = 'none';
            await loadWhatsappLinksServer();
            alert('WhatsApp link saved successfully!');
        });
    }
    
    // Admin management forms
    const changeAdminCredentialsForm = document.getElementById('changeAdminCredentialsForm');
    if (changeAdminCredentialsForm) {
        changeAdminCredentialsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentUsername = document.getElementById('currentUsername').value;
            const currentPassword = document.getElementById('currentPassword').value;
            const newUsername = document.getElementById('newUsername').value;
            const newPassword = document.getElementById('newPassword').value;
            try {
                const resp = await fetch('/api/admins/change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentUsername, currentPassword, newUsername, newPassword }) });
                if (!resp.ok) throw new Error();
                alert('Credentials updated successfully!');
                this.reset();
            } catch {
                alert('Current credentials are incorrect!');
            }
        });
    }
    
    const addAdminForm = document.getElementById('addAdminForm');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('newAdminUsername').value;
            const password = document.getElementById('newAdminPassword').value;
            try {
                const resp = await fetch('/api/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                if (!resp.ok) throw new Error();
                alert('Admin added successfully!');
                this.reset();
                await loadAdminsListServer();
            } catch {
                alert('Failed to add admin. Username might already exist.');
            }
        });
    }
    
    const deleteAdminBtn = document.getElementById('deleteAdminBtn');
    if (deleteAdminBtn) {
        deleteAdminBtn.addEventListener('click', async function() {
            const adminToDelete = document.getElementById('adminToDelete').value;
            
            if (adminToDelete && confirm(`Are you sure you want to delete admin "${adminToDelete}"?`)) {
                try {
                    const resp = await fetch(`/api/admins/${encodeURIComponent(adminToDelete)}`, { method: 'DELETE' });
                    if (!resp.ok) throw new Error();
                    alert('Admin deleted successfully!');
                    await loadAdminsListServer();
                } catch { alert('Cannot delete the last admin account.'); }
            }
        });
    }
    
    // Initialize bookings table if on admin page
    if (window.location.pathname.endsWith('admin.html') || window.location.href.includes('admin.html')) {
        // Check if admin is already logged in
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (isLoggedIn) {
            document.getElementById('adminLoginFormContainer').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadBookings();
            loadCentralizedData();
        }
    }
    
    // Close modal if clicked outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Ensure map modal controls are wired after DOM is ready
    const mmc = document.getElementById('mapModalClose');
    if (mmc) {
        mmc.addEventListener('click', () => {
            const m = document.getElementById('mapModal');
            if (m) m.style.display = 'none';
        });
    }
    const msb = document.getElementById('mapSaveBtn');
    if (msb) {
        msb.addEventListener('click', async () => {
            if(!_mapBookingId) return;
            const pickupLocation = _pickupMarker ? { lat: _pickupMarker.getLatLng().lat, lng: _pickupMarker.getLatLng().lng, address: document.getElementById('mapPickupAddress').value } : null;
            const destinationLocation = _destMarker ? { lat: _destMarker.getLatLng().lat, lng: _destMarker.getLatLng().lng, address: document.getElementById('mapDestAddress').value } : null;
            await fetch(`/api/bookings/${_mapBookingId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pickupLocation, destinationLocation }) });
            const m = document.getElementById('mapModal');
            if (m) m.style.display = 'none';
            await loadCentralizedData();
        });
    }
    const mshare = document.getElementById('mapShareBtn');
    if (mshare) {
        mshare.addEventListener('click', async () => {
            const link = buildDirectionsLink();
            if(!link){ alert('Please set both Pickup (green) and Destination (red) on the map first.'); return; }
            const text = `Pickup to Destination directions:\n${link}`;
            try{ if(navigator.share){ await navigator.share({ title: 'Trip Directions', text, url: link }); return; } } catch {}
            try{ await navigator.clipboard.writeText(link); alert('Share link copied to clipboard'); } catch { window.open(link, '_blank'); }
        });
    }
    const msOpen = document.getElementById('mapShareOpenMaps');
    if (msOpen) {
        msOpen.addEventListener('click', (e) => {
            const link = buildDirectionsLink();
            if(!link){ e.preventDefault(); alert('Set both pickup and destination first.'); return; }
            e.currentTarget.href = link;
        });
    }
    const msWa = document.getElementById('mapShareWhatsApp');
    if (msWa) {
        msWa.addEventListener('click', (e) => {
            const link = buildDirectionsLink();
            if(!link){ e.preventDefault(); alert('Set both pickup and destination first.'); return; }
            e.currentTarget.href = `https://api.whatsapp.com/send?text=${encodeURIComponent('Trip directions:\n'+link)}`;
        });
    }
    const msCopy = document.getElementById('mapShareCopy');
    if (msCopy) {
        msCopy.addEventListener('click', async () => {
            const link = buildDirectionsLink();
            if(!link){ alert('Set both pickup and destination first.'); return; }
            try{ await navigator.clipboard.writeText(link); alert('Share link copied'); } catch { alert('Copy failed'); }
        });
    }
});

// Load centralized data from backend server
async function loadCentralizedData() {
    try {
        // Drivers
    const dRes = await fetch('/api/drivers');
        const drivers = dRes.ok ? await dRes.json() : [];
        const dBody = document.getElementById('centralDriversBody');
        const dEmpty = document.getElementById('noCentralDrivers');
        if (dBody) dBody.innerHTML = '';
        if (drivers.length === 0) {
            if (dEmpty) dEmpty.style.display = 'block';
        } else {
            if (dEmpty) dEmpty.style.display = 'none';
            drivers.slice().reverse().forEach(dr => {
                const tr = document.createElement('tr');
                const files = dr.files || {};
                const fileLinks = Object.keys(files).filter(k => files[k]).map(k => {
                    const rel = files[k];
                    return `<a href="/${rel.replace(/\\/g,'/')}" target="_blank">${k}</a>`;
                }).join(' | ');
                tr.innerHTML = `
            <td><input type="checkbox" class="driver-checkbox" data-id="${dr.id}"></td>
                    <td>${dr.name || ''}</td>
                    <td>${dr.contact || ''}</td>
                    <td>${dr.carName || ''}</td>
                    <td>${dr.folderName || ''}</td>
                    <td>${fileLinks || '-'}</td>
            <td><span class="status-badge ${dr.read ? 'status-confirmed' : 'status-pending'}">${dr.read ? 'Read' : 'Unread'}</span></td>
                    <td>${dr.receivedAt ? new Date(dr.receivedAt).toLocaleString() : ''}</td>
                    <td class="action-buttons">
                        <button class="btn action-btn" onclick="editCentralDriver('${dr.id}')">Edit</button>
                        <button class="btn delete-btn" onclick="deleteCentralDriver('${dr.id}')">Delete</button>
                        <a class="btn action-btn" href="/${(dr.folderPath || '').replace(/\\/g,'/')}" target="_blank">Open Folder</a>
                    </td>
                `;
                if (dBody) dBody.appendChild(tr);
            });
        }

        // Bookings
        const bRes = await fetch('/api/bookings');
        const bookings = bRes.ok ? await bRes.json() : [];
        const bBody = document.getElementById('centralBookingsBody');
        const bEmpty = document.getElementById('noCentralBookings');
        if (bBody) bBody.innerHTML = '';
        if (bookings.length === 0) {
            if (bEmpty) bEmpty.style.display = 'block';
        } else {
            if (bEmpty) bEmpty.style.display = 'none';
            bookings.slice().reverse().forEach(b => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="booking-checkbox" data-id="${b.id}"></td>
                    <td>${b.id}</td>
                    <td>${b.customerName}</td>
                    <td>${b.customerPhone}</td>
                    <td>${b.pickup} ${b.pickupLocation?.address ? `<br><small>${b.pickupLocation.address}</small>` : ''} <br><button class="btn action-btn" onclick="openBookingMap(${b.id})">Map</button></td>
                    <td>${b.destination} ${b.destinationLocation?.address ? `<br><small>${b.destinationLocation.address}</small>` : ''}</td>
                    <td>${b.date} ${b.time}</td>
                    <td>${b.vehicleType}</td>
                    <td><span class="status-badge status-${b.status || 'pending'}">${b.status || 'Pending'}</span></td>
                    <td class="action-buttons">
                        <button class="btn action-btn" onclick="editCentralBooking(${b.id})">Edit</button>
                        <button class="btn action-btn" onclick="confirmCentralBooking(${b.id})">Confirm</button>
                        <button class="btn delete-btn" onclick="deleteCentralBooking(${b.id})">Delete</button>
                    </td>
                `;
                if (bBody) bBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Failed to load centralized data', err);
    }
}

// Edit/Confirm/Delete centralized booking
async function editCentralBooking(id) {
    const bookings = await (await fetch('/api/bookings')).json();
    const b = bookings.find(x => Number(x.id) === Number(id));
    if (!b) return alert('Booking not found');
    // Reuse existing edit modal
    document.getElementById('editBookingId').value = b.id;
    document.getElementById('editCustomerName').value = b.customerName;
    document.getElementById('editCustomerPhone').value = b.customerPhone;
    document.getElementById('editPickup').value = b.pickup;
    document.getElementById('editDestination').value = b.destination;
    document.getElementById('editDate').value = b.date;
    document.getElementById('editTime').value = b.time;
    document.getElementById('editVehicleType').value = b.vehicleType;
    document.getElementById('editPassengers').value = b.passengers || 1;
    document.getElementById('editNotes').value = b.notes || '';
    document.getElementById('editModal').style.display = 'block';
}

async function confirmCentralBooking(id) {
    await fetch(`/api/bookings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) });
    await loadCentralizedData();
}

async function deleteCentralBooking(id) {
    if (!confirm('Delete this booking?')) return;
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    await loadCentralizedData();
}

// Edit/Delete centralized driver
async function editCentralDriver(id) {
    const drivers = await (await fetch('/api/drivers')).json();
    const d = drivers.find(x => String(x.id) === String(id));
    if (!d) return alert('Driver not found');
    const name = prompt('Name', d.name || '');
    if (name === null) return; // cancelled
    const contact = prompt('Contact', d.contact || '');
    if (contact === null) return;
    const address = prompt('Address', d.address || '');
    if (address === null) return;
    const carName = prompt('Car Name/Model', d.carName || '');
    if (carName === null) return;
    await fetch(`/api/drivers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, contact, address, carName }) });
    await loadCentralizedData();
}

async function deleteCentralDriver(id) {
    if (!confirm('Delete this driver and all files?')) return;
    await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
    await loadCentralizedData();
}

// Export centralized bookings
async function exportCentralBookingsTxt() {
    const bookings = await (await fetch('/api/bookings')).json();
    if (!bookings.length) return alert('No bookings to export');
    let txt = `RAJ TAXI SERVICE'S - Centralized Bookings\n=============================================\n\n`;
    bookings.forEach((b, i) => {
        txt += `Booking ${i + 1}:\n`;
        txt += `ID: ${b.id}\n`;
        txt += `Customer Name: ${b.customerName}\n`;
        txt += `Phone: ${b.customerPhone}\n`;
        txt += `Pickup Location: ${b.pickup}\n`;
        txt += `Destination: ${b.destination}\n`;
        txt += `Date & Time: ${b.date} ${b.time}\n`;
        txt += `Vehicle Type: ${b.vehicleType}\n`;
        txt += `Status: ${b.status || 'Pending'}\n`;
        if (b.notes) txt += `Special Instructions: ${b.notes}\n`;
        txt += `\n---------------------------------------------\n\n`;
    });
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'central_bookings.txt';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// Export centralized drivers with file links
async function exportCentralDriversTxt() {
    const drivers = await (await fetch('/api/drivers')).json();
    if (!drivers.length) return alert('No driver data to export');
    let txt = `RAJ TAXI SERVICE'S - Centralized Drivers\n=============================================\n\n`;
    drivers.forEach((d, i) => {
        txt += `Driver ${i + 1}:\n`;
        txt += `Name: ${d.name || ''}\n`;
        txt += `Contact: ${d.contact || ''}\n`;
        txt += `Address: ${d.address || ''}\n`;
        txt += `Car: ${d.carName || ''}\n`;
        txt += `Folder: ${d.folderName || ''}\n`;
        const files = d.files || {};
        Object.keys(files).forEach(k => {
            if (files[k]) txt += `${k}: http://localhost:3000/${String(files[k]).replace(/\\/g,'/')}\n`;
        });
        txt += `Received: ${d.receivedAt ? new Date(d.receivedAt).toLocaleString() : ''}\n`;
        txt += `\n---------------------------------------------\n\n`;
    });
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'central_drivers.txt';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

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
    const selectAll = document.getElementById('selectAll');
    
    // Clear existing table rows
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    
    // Reset select all checkbox
    if (selectAll) {
        selectAll.checked = false;
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
            <td><input type="checkbox" class="booking-checkbox" data-id="${booking.id}"></td>
            <td>${booking.id}</td>
            <td>${booking.customerName}</td>
            <td>${booking.customerPhone}</td>
            <td>${booking.pickup}</td>
            <td>${booking.destination}</td>
            <td>${booking.date} ${booking.time}</td>
            <td>${booking.vehicleType}</td>
            <td><span class="status-badge status-${booking.status || 'pending'}">${booking.status || 'Pending'}</span></td>
            <td class="action-buttons">
                <button class="btn action-btn edit-btn" data-id="${booking.id}">Edit</button>
                <button class="btn action-btn confirm-btn" data-id="${booking.id}">Confirm</button>
                <button class="btn delete-btn delete-btn" data-id="${booking.id}">Delete</button>
            </td>
        `;
        
        if (tableBody) {
            tableBody.appendChild(row);
        }
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-id');
            editBooking(bookingId);
        });
    });
    
    document.querySelectorAll('.confirm-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-id');
            confirmBooking(bookingId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-id');
            deleteBooking(bookingId);
        });
    });
    
    // Add event listener to checkboxes for select all functionality
    document.querySelectorAll('.booking-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllCheckbox();
        });
    });
}

// Update select all checkbox based on individual checkboxes
function updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll('.booking-checkbox');
    const selectAll = document.getElementById('selectAll');
    const headerCheckbox = document.getElementById('headerCheckbox');
    
    if (checkboxes.length === 0) {
        if (selectAll) selectAll.checked = false;
        if (headerCheckbox) headerCheckbox.checked = false;
        return;
    }
    
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    const someChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
    
    if (selectAll) selectAll.checked = allChecked;
    if (headerCheckbox) headerCheckbox.checked = allChecked;
    
    // Set indeterminate state if some are checked but not all
    if (headerCheckbox) {
        headerCheckbox.indeterminate = someChecked && !allChecked;
    }
}

// Get selected booking IDs
function getSelectedBookings() {
    const selected = [];
    document.querySelectorAll('.booking-checkbox:checked').forEach(checkbox => {
        selected.push(checkbox.getAttribute('data-id'));
    });
    return selected;
}

// Edit booking
function editBooking(bookingId) {
    const bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    const booking = bookings.find(b => b.id == bookingId);
    
    if (booking) {
        document.getElementById('editBookingId').value = booking.id;
        document.getElementById('editCustomerName').value = booking.customerName;
        document.getElementById('editCustomerPhone').value = booking.customerPhone;
        document.getElementById('editPickup').value = booking.pickup;
        document.getElementById('editDestination').value = booking.destination;
        document.getElementById('editDate').value = booking.date;
        document.getElementById('editTime').value = booking.time;
        document.getElementById('editVehicleType').value = booking.vehicleType;
        document.getElementById('editPassengers').value = booking.passengers;
        document.getElementById('editNotes').value = booking.notes || '';
        
        document.getElementById('editModal').style.display = 'block';
    }
}

// Update booking
function updateBooking(bookingId, updatedData) {
    let bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    const index = bookings.findIndex(b => b.id == bookingId);
    
    if (index !== -1) {
        // Preserve the ID, timestamp and status
        updatedData.id = bookings[index].id;
        updatedData.timestamp = bookings[index].timestamp;
        updatedData.status = bookings[index].status || 'pending';
        
        // Update the booking
        bookings[index] = updatedData;
        localStorage.setItem('rajTaxiBookings', JSON.stringify(bookings));
        
        // Also update in date-specific storage
        updateBookingByDate(bookingId, updatedData);
    }
}

// Update booking in date-specific storage
function updateBookingByDate(bookingId, updatedData) {
    const date = updatedData.date;
    let dateBookings = JSON.parse(localStorage.getItem(`rajTaxiBookings_${date}`)) || [];
    const index = dateBookings.findIndex(b => b.id == bookingId);
    
    if (index !== -1) {
        dateBookings[index] = updatedData;
        localStorage.setItem(`rajTaxiBookings_${date}`, JSON.stringify(dateBookings));
    }
}

// Confirm booking
function confirmBooking(bookingId) {
    let bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    const index = bookings.findIndex(b => b.id == bookingId);
    
    if (index !== -1) {
        bookings[index].status = 'confirmed';
        localStorage.setItem('rajTaxiBookings', JSON.stringify(bookings));
        
        // Also update in date-specific storage
        const date = bookings[index].date;
        let dateBookings = JSON.parse(localStorage.getItem(`rajTaxiBookings_${date}`)) || [];
        const dateIndex = dateBookings.findIndex(b => b.id == bookingId);
        
        if (dateIndex !== -1) {
            dateBookings[dateIndex].status = 'confirmed';
            localStorage.setItem(`rajTaxiBookings_${date}`, JSON.stringify(dateBookings));
        }
        
        loadBookings();
        alert('Booking confirmed successfully!');
    }
}

// Confirm multiple bookings
function confirmBookings(bookingIds) {
    let bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    
    bookings.forEach(booking => {
        if (bookingIds.includes(booking.id.toString())) {
            booking.status = 'confirmed';
            
            // Also update in date-specific storage
            const date = booking.date;
            let dateBookings = JSON.parse(localStorage.getItem(`rajTaxiBookings_${date}`)) || [];
            const dateIndex = dateBookings.findIndex(b => b.id == booking.id);
            
            if (dateIndex !== -1) {
                dateBookings[dateIndex].status = 'confirmed';
                localStorage.setItem(`rajTaxiBookings_${date}`, JSON.stringify(dateBookings));
            }
        }
    });
    
    localStorage.setItem('rajTaxiBookings', JSON.stringify(bookings));
    loadBookings();
    alert(`${bookingIds.length} booking(s) confirmed successfully!`);
}

// Get booking status
function getBookingStatus(bookingId) {
    const bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    const booking = bookings.find(b => b.id == bookingId);
    return booking ? (booking.status || 'pending') : 'pending';
}

// Delete booking
function deleteBooking(bookingId) {
    if (confirm('Are you sure you want to delete this booking?')) {
        let bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
        const booking = bookings.find(b => b.id == bookingId);
        
        if (booking) {
            // Remove from main storage
            bookings = bookings.filter(b => b.id != bookingId);
            localStorage.setItem('rajTaxiBookings', JSON.stringify(bookings));
            
            // Remove from date-specific storage
            deleteBookingByDate(bookingId, booking.date);
            
            // Reload the table
            loadBookings();
            alert('Booking deleted successfully!');
        }
    }
}

// Delete multiple bookings
function deleteBookings(bookingIds) {
    let bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    
    // Get the bookings to be deleted for date-specific removal
    const bookingsToDelete = bookings.filter(b => bookingIds.includes(b.id.toString()));
    
    // Remove from main storage
    bookings = bookings.filter(b => !bookingIds.includes(b.id.toString()));
    localStorage.setItem('rajTaxiBookings', JSON.stringify(bookings));
    
    // Remove from date-specific storage
    bookingsToDelete.forEach(booking => {
        deleteBookingByDate(booking.id, booking.date);
    });
    
    // Reload the table
    loadBookings();
    alert(`${bookingIds.length} booking(s) deleted successfully!`);
}

// Delete booking from date-specific storage
function deleteBookingByDate(bookingId, date) {
    let dateBookings = JSON.parse(localStorage.getItem(`rajTaxiBookings_${date}`)) || [];
    dateBookings = dateBookings.filter(b => b.id != bookingId);
    localStorage.setItem(`rajTaxiBookings_${date}`, JSON.stringify(dateBookings));
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
        txtContent += `Status: ${booking.status || 'Pending'}\n`;
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

// Export selected bookings to TXT file
function exportSelectedBookings(bookingIds) {
    const bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    const selectedBookings = bookings.filter(b => bookingIds.includes(b.id.toString()));
    
    if (selectedBookings.length === 0) {
        alert('No bookings selected for export!');
        return;
    }
    
    let txtContent = 'RAJ TAXI SERVICE\'S - Selected Bookings\n';
    txtContent += '=============================================\n\n';
    
    selectedBookings.forEach((booking, index) => {
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
        txtContent += `Status: ${booking.status || 'Pending'}\n`;
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
    a.download = 'raj_taxi_selected_bookings.txt';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    alert(`Exported ${selectedBookings.length} bookings!`);
}

// Export bookings to Excel file
function exportBookingsToExcel() {
    const bookings = JSON.parse(localStorage.getItem('rajTaxiBookings')) || [];
    
    if (bookings.length === 0) {
        alert('No bookings to export!');
        return;
    }
    
    // Prepare data for Excel
    const data = bookings.map(booking => ({
        'Booking ID': booking.id,
        'Customer Name': booking.customerName,
        'Phone': booking.customerPhone,
        'Pickup Location': booking.pickup,
        'Destination': booking.destination,
        'Date': booking.date,
        'Time': booking.time,
        'Vehicle Type': booking.vehicleType,
        'Passengers': booking.passengers,
        'Status': booking.status || 'Pending',
        'Special Instructions': booking.notes || '',
        'Booking Timestamp': booking.timestamp
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
    
    // Generate Excel file
    XLSX.writeFile(workbook, 'raj_taxi_bookings.xlsx');
    
    alert(`Exported ${bookings.length} bookings to Excel!`);
}

// Export bookings by date to TXT files in Data folder
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
            txtContent += `Status: ${booking.status || 'Pending'}\n`;
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

// Get spreadsheet ID
function getSpreadsheetId() {
    return localStorage.getItem('rajTaxiSpreadsheetId') || "1WK59UVAWEt2A3S8ZbF4d13JPDgH3Rhmqavht216RJHc";
}

// Get web app URL
function getWebappUrl() {
    return localStorage.getItem('rajTaxiWebappUrl') || "";
}

// Load WhatsApp links (server)
async function loadWhatsappLinksServer() {
    const res = await fetch('/api/whatsapp-links');
    const data = await res.json();
    const links = data.links || Array(10).fill('');
    const tableBody = document.getElementById('whatsappLinksTableBody');
    
    if (tableBody) {
        tableBody.innerHTML = '';
        
        const row = document.createElement('tr');
        let rowContent = '<td>1</td>';
        
        for (let i = 0; i < 10; i++) {
            const link = links[i] || '';
            rowContent += `<td>${link ? `<a href="${link}" target="_blank">Link ${i+1}</a>` : 'Not set'}</td>`;
        }
        
        rowContent += `
            <td class="action-buttons">
                <button class="btn action-btn edit-whatsapp-link" data-index="0">Edit All</button>
            </td>
        `;
        
        row.innerHTML = rowContent;
        tableBody.appendChild(row);
        
        // Add event listener to edit button
        document.querySelector('.edit-whatsapp-link').addEventListener('click', function() {
            document.getElementById('whatsappLinkForm').reset();
            document.getElementById('whatsappLinkIndex').value = '';
            document.getElementById('whatsappLinkFormTitle').textContent = 'Add WhatsApp Link';
            document.getElementById('whatsappLinkFormModal').style.display = 'block';
        });
    }
}

// Save WhatsApp link (server)
async function saveWhatsappLinkServer(url, position, index) {
    await fetch('/api/whatsapp-links', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: Number(position), url }) });
}

// Check admin credentials
function checkAdminCredentials(username, password) {
    const admins = JSON.parse(localStorage.getItem('rajTaxiAdmins')) || [
        { username: 'smash89kumar', password: 'Deepak_143' }
    ];
    
    return admins.some(admin => admin.username === username && admin.password === password);
}

// Change admin credentials
function changeAdminCredentials(currentUsername, currentPassword, newUsername, newPassword) {
    if (!checkAdminCredentials(currentUsername, currentPassword)) {
        return false;
    }
    
    let admins = JSON.parse(localStorage.getItem('rajTaxiAdmins')) || [
        { username: 'smash89kumar', password: 'Deepak_143' }
    ];
    
    const adminIndex = admins.findIndex(admin => 
        admin.username === currentUsername && admin.password === currentPassword);
    
    if (adminIndex !== -1) {
        if (newUsername) {
            admins[adminIndex].username = newUsername;
        }
        if (newPassword) {
            admins[adminIndex].password = newPassword;
        }
        
        localStorage.setItem('rajTaxiAdmins', JSON.stringify(admins));
        return true;
    }
    
    return false;
}

// Add new admin
function addAdmin(username, password) {
    let admins = JSON.parse(localStorage.getItem('rajTaxiAdmins')) || [
        { username: 'smash89kumar', password: 'Deepak_143' }
    ];
    
    // Check if username already exists
    if (admins.some(admin => admin.username === username)) {
        return false;
    }
    
    admins.push({ username, password });
    localStorage.setItem('rajTaxiAdmins', JSON.stringify(admins));
    return true;
}

// Delete admin
function deleteAdmin(username) {
    let admins = JSON.parse(localStorage.getItem('rajTaxiAdmins')) || [
        { username: 'smash89kumar', password: 'Deepak_143' }
    ];
    
    // Cannot delete the last admin
    if (admins.length <= 1) {
        return false;
    }
    
    admins = admins.filter(admin => admin.username !== username);
    localStorage.setItem('rajTaxiAdmins', JSON.stringify(admins));
    return true;
}

// Load admins list for deletion
async function loadAdminsListServer() {
    const resp = await fetch('/api/admins');
    const data = await resp.json();
    const admins = (data.usernames || []).map(u => ({ username: u }));
    const select = document.getElementById('adminToDelete');
    if (select) {
        select.innerHTML = '';
        
        admins.forEach(admin => {
            if (admin.username) {
                const option = document.createElement('option');
                option.value = admin.username;
                option.textContent = admin.username;
                select.appendChild(option);
            }
        });
        
        if (select.options.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No additional admins';
            option.disabled = true;
            select.appendChild(option);
        }
    }
}

// Admin login function (can be called from other pages if needed)
function adminLogin(username, password) {
    if (checkAdminCredentials(username, password)) {
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

// Helpers for driver selections
function getSelectedDriverIds() {
    return Array.from(document.querySelectorAll('.driver-checkbox:checked')).map(cb => cb.getAttribute('data-id'));
}

async function bulkMarkDrivers(read) {
    const ids = getSelectedDriverIds();
    if (ids.length === 0) return alert('Select at least one driver');
    try {
        await fetch('/api/drivers/mark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, read }) });
        await loadCentralizedData();
    } catch { alert('Failed to update status'); }
}

async function exportSelectedDriversZip() {
    const ids = getSelectedDriverIds();
    if (ids.length === 0) return alert('Select at least one driver');
    try {
        const resp = await fetch('/api/drivers/export-zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
        if (!resp.ok) { alert('Failed to export'); return; }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'drivers_export.zip';
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    } catch { alert('Export error'); }
}

// Admin map modal for booking
let _mapInstance, _pickupMarker, _destMarker, _mapBookingId;
// custom colored marker icons
const _iconGreen = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const _iconRed = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
async function openBookingMap(id){
    const bookings = await (await fetch('/api/bookings')).json();
    const b = bookings.find(x=> Number(x.id)===Number(id));
    if(!b) return alert('Booking not found');
    _mapBookingId = id;
    const modal = document.getElementById('mapModal');
    if(!modal) return;
    modal.style.display = 'block';
    setTimeout(()=>{
        if(!_mapInstance){
            _mapInstance = L.map('adminBookingMap');
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution: '&copy; OpenStreetMap' }).addTo(_mapInstance);
        }
        const center = b.pickupLocation?.lat && b.pickupLocation?.lng ? [b.pickupLocation.lat, b.pickupLocation.lng] : [31.3260, 75.5762];
        _mapInstance.setView(center, 13);
        if(_pickupMarker){ _mapInstance.removeLayer(_pickupMarker); }
        if(_destMarker){ _mapInstance.removeLayer(_destMarker); }
    if(b.pickupLocation?.lat && b.pickupLocation?.lng){ _pickupMarker = L.marker([b.pickupLocation.lat, b.pickupLocation.lng], {draggable:true, icon:_iconGreen}).addTo(_mapInstance).bindPopup('Pickup'); }
    if(b.destinationLocation?.lat && b.destinationLocation?.lng){ _destMarker = L.marker([b.destinationLocation.lat, b.destinationLocation.lng], {draggable:true, icon:_iconRed}).addTo(_mapInstance).bindPopup('Destination'); }
        document.getElementById('mapPickupAddress').value = b.pickupLocation?.address || b.pickup || '';
        document.getElementById('mapDestAddress').value = b.destinationLocation?.address || b.destination || '';
        _mapInstance.on('click', (e)=>{
            if(!_pickupMarker){ _pickupMarker = L.marker(e.latlng, {draggable:true, icon:_iconGreen}).addTo(_mapInstance).bindPopup('Pickup'); }
            else if(!_destMarker){ _destMarker = L.marker(e.latlng, {draggable:true, icon:_iconRed}).addTo(_mapInstance).bindPopup('Destination'); }
        });
    },50);
}

document.getElementById('mapModalClose')?.addEventListener('click', ()=>{
    document.getElementById('mapModal').style.display = 'none';
});

document.getElementById('mapSaveBtn')?.addEventListener('click', async ()=>{
    if(!_mapBookingId) return;
    const pickupLocation = _pickupMarker ? { lat: _pickupMarker.getLatLng().lat, lng: _pickupMarker.getLatLng().lng, address: document.getElementById('mapPickupAddress').value } : null;
    const destinationLocation = _destMarker ? { lat: _destMarker.getLatLng().lat, lng: _destMarker.getLatLng().lng, address: document.getElementById('mapDestAddress').value } : null;
    await fetch(`/api/bookings/${_mapBookingId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pickupLocation, destinationLocation }) });
    document.getElementById('mapModal').style.display = 'none';
    await loadCentralizedData();
});

// Build a single Google Maps directions/share link from pickup->destination
function buildDirectionsLink(){
    const p = _pickupMarker?.getLatLng();
    const d = _destMarker?.getLatLng();
    if(p && d){
        // Use Google Maps directions with coordinates
        return `https://www.google.com/maps/dir/?api=1&origin=${p.lat},${p.lng}&destination=${d.lat},${d.lng}&travelmode=driving`;
    }
    return '';
}

document.getElementById('mapShareBtn')?.addEventListener('click', async ()=>{
    const link = buildDirectionsLink();
    if(!link){ alert('Please set both Pickup (green) and Destination (red) on the map first.'); return; }
    const text = `Pickup to Destination directions:\n${link}`;
    try{
        if(navigator.share){ await navigator.share({ title: 'Trip Directions', text, url: link }); return; }
    } catch {}
    try{ await navigator.clipboard.writeText(link); alert('Share link copied to clipboard'); } catch { window.open(link, '_blank'); }
});

// Additional dedicated share controls in the map modal
document.getElementById('mapShareOpenMaps')?.addEventListener('click', (e)=>{
    const link = buildDirectionsLink();
    if(!link){ e.preventDefault(); alert('Set both pickup and destination first.'); return; }
    e.currentTarget.href = link;
});
document.getElementById('mapShareWhatsApp')?.addEventListener('click', (e)=>{
    const link = buildDirectionsLink();
    if(!link){ e.preventDefault(); alert('Set both pickup and destination first.'); return; }
    e.currentTarget.href = `https://api.whatsapp.com/send?text=${encodeURIComponent('Trip directions:\n'+link)}`;
});
document.getElementById('mapShareCopy')?.addEventListener('click', async ()=>{
    const link = buildDirectionsLink();
    if(!link){ alert('Set both pickup and destination first.'); return; }
    try{ await navigator.clipboard.writeText(link); alert('Share link copied'); } catch { alert('Copy failed'); }
});

// Remove list-level share; sharing now via Map modal buttons.