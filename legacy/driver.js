document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('driverForm');
    const selfieInput = document.getElementById('selfie');
    const licenseInput = document.getElementById('drivingLicense');
    const verificationInput = document.getElementById('policeVerification');
    const aadharFrontInput = document.getElementById('aadharFront');
    const aadharBackInput = document.getElementById('aadharBack');
    const carRegistrationDocInput = document.getElementById('carRegistrationDoc');
    
    const selfieName = document.getElementById('selfieName');
    const licenseName = document.getElementById('licenseName');
    const verificationName = document.getElementById('verificationName');
    const aadharFrontName = document.getElementById('aadharFrontName');
    const aadharBackName = document.getElementById('aadharBackName');
    const carRegistrationDocName = document.getElementById('carRegistrationDocName');
    
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const spinner = document.getElementById('spinner');
    const driveStatusText = document.getElementById('driveStatusText');
    
    const whatsappBtn = document.getElementById('whatsappBtn');
    const uploadDocsBtn = document.getElementById('uploadDocsBtn');
    const googleDriveAuthBtn = document.getElementById('googleDriveAuthBtn');
    const whatsappModal = document.getElementById('whatsappModal');
    const googleDriveAuthModal = document.getElementById('googleDriveAuthModal');
    const closeButtons = document.querySelectorAll('.close');
    
    // Google Drive API configuration
    const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your Google Client ID
    const API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with your Google API Key
    const SCOPES = 'https://www.googleapis.com/auth/drive.file';
    
    let googleTokenClient = null;
    let isGoogleDriveAuthorized = false;
    
    // Initialize Google Drive API
    function initGoogleDrive() {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                });
                
                googleTokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (response) => {
                        if (response.error) {
                            console.error('Google Drive auth error:', response.error);
                            updateDriveStatus('Authorization failed');
                            return;
                        }
                        
                        isGoogleDriveAuthorized = true;
                        updateDriveStatus('Connected');
                        googleDriveAuthModal.style.display = 'none';
                    },
                });
                
                // Check if we already have a valid token
                const token = localStorage.getItem('googleDriveToken');
                if (token) {
                    gapi.client.setToken({ access_token: token });
                    isGoogleDriveAuthorized = true;
                    updateDriveStatus('Connected');
                } else {
                    updateDriveStatus('Authorization required');
                }
            } catch (error) {
                console.error('Error initializing Google Drive:', error);
                updateDriveStatus('Initialization failed');
            }
        });
    }
    
    // Update Google Drive status display
    function updateDriveStatus(status) {
        driveStatusText.textContent = `Google Drive: ${status}`;
        
        if (status === 'Connected') {
            driveStatusText.style.color = '#4CAF50';
        } else if (status === 'Authorization required') {
            driveStatusText.style.color = '#FF9800';
        } else {
            driveStatusText.style.color = '#f44336';
        }
    }
    
    // Authorize Google Drive
    function authorizeGoogleDrive() {
        if (!googleTokenClient) {
            updateDriveStatus('Initializing...');
            initGoogleDrive();
            return;
        }
        
        googleTokenClient.requestAccessToken();
    }
    
    // Create folder in Google Drive
    async function createDriveFolder(folderName) {
        if (!isGoogleDriveAuthorized) {
            googleDriveAuthModal.style.display = 'block';
            throw new Error('Google Drive not authorized');
        }
        
        try {
            const response = await gapi.client.drive.files.create({
                resource: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    fields: 'id',
                },
            });
            
            return response.result.id;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw new Error('Failed to create folder in Google Drive');
        }
    }
    
    // Upload file to Google Drive
    async function uploadToDrive(file, folderId, fileName) {
        if (!isGoogleDriveAuthorized) {
            throw new Error('Google Drive not authorized');
        }
        
        const metadata = {
            name: fileName,
            parents: [folderId],
        };
        
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);
        
        try {
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({
                    'Authorization': 'Bearer ' + gapi.auth.getToken().access_token,
                }),
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload file to Google Drive');
        }
    }
    
    // Create text file with driver data
    async function createDriverDataFile(driverData, folderId) {
        const textContent = `RAJ TAXI SERVICE - Driver Application\n
Driver Name: ${driverData.name}
Contact Number: ${driverData.contact}
Address: ${driverData.address}
Aadhar Card Number: ${driverData.aadharNumber}
Driving License Number: ${driverData.licenseNumber}
Car Registration Number: ${driverData.carRegistration}
Car Chassis Number: ${driverData.chassisNumber}
Car Name/Model: ${driverData.carName}
Application Date: ${new Date().toLocaleString()}`;
        
        const blob = new Blob([textContent], { type: 'text/plain' });
        const file = new File([blob], `driver_info_${Date.now()}.txt`, { type: 'text/plain' });
        
        return await uploadToDrive(file, folderId, `driver_info.txt`);
    }
    
    // Save all driver data to Google Drive
    async function saveDriverToGoogleDrive(driverData, files) {
        updateDriveStatus('Creating folder...');
        
        // Create folder with driver name and timestamp
        const folderName = `Driver_${driverData.name.replace(/\s+/g, '_')}_${Date.now()}`;
        const folderId = await createDriveFolder(folderName);
        
        updateDriveStatus('Saving data...');
        
        // Create and upload text file with driver info
        await createDriverDataFile(driverData, folderId);
        
        updateDriveStatus('Uploading documents...');
        
        // Upload all files
        const uploadPromises = [];
        
        if (files.selfie) {
            uploadPromises.push(uploadToDrive(files.selfie, folderId, `selfie.${files.selfie.name.split('.').pop()}`));
        }
        
        if (files.aadharFront) {
            uploadPromises.push(uploadToDrive(files.aadharFront, folderId, `aadhar_front.${files.aadharFront.name.split('.').pop()}`));
        }
        
        if (files.aadharBack) {
            uploadPromises.push(uploadToDrive(files.aadharBack, folderId, `aadhar_back.${files.aadharBack.name.split('.').pop()}`));
        }
        
        if (files.license) {
            uploadPromises.push(uploadToDrive(files.license, folderId, `driving_license.${files.license.name.split('.').pop()}`));
        }
        
        if (files.carRegistrationDoc) {
            uploadPromises.push(uploadToDrive(files.carRegistrationDoc, folderId, `car_registration.${files.carRegistrationDoc.name.split('.').pop()}`));
        }
        
        if (files.verification) {
            uploadPromises.push(uploadToDrive(files.verification, folderId, `police_verification.${files.verification.name.split('.').pop()}`));
        }
        
        await Promise.all(uploadPromises);
        
        updateDriveStatus('Connected');
        return folderName;
    }
    
    // Get WhatsApp links from localStorage
    async function getWhatsappLinks() {
        try {
            const res = await fetch('/api/whatsapp-links');
            const data = await res.json();
            const links = data.links || [];
            return links.filter(link => link);
        } catch { return []; }
    }
    
    // Load WhatsApp links modal
    async function loadWhatsappLinks() {
        const links = await getWhatsappLinks();
        const whatsappLinksContainer = document.getElementById('whatsappLinks');
        
        if (links.length === 0) {
            whatsappLinksContainer.innerHTML = '<p>No WhatsApp links available. Please contact administrator.</p>';
            return;
        }
        
        whatsappLinksContainer.innerHTML = '';
        links.forEach((link, index) => {
            if (link) {
                const linkElement = document.createElement('a');
                linkElement.href = link;
                linkElement.target = '_blank';
                linkElement.className = 'whatsapp-link';
                linkElement.textContent = `Join WhatsApp Group ${index + 1}`;
                whatsappLinksContainer.appendChild(linkElement);
            }
        });
    }
    
    // Update file names when files are selected
    selfieInput.addEventListener('change', function() {
        selfieName.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
    });

    licenseInput.addEventListener('change', function() {
        licenseName.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
    });

    verificationInput.addEventListener('change', function() {
        verificationName.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
    });
    
    aadharFrontInput.addEventListener('change', function() {
        aadharFrontName.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
    });
    
    aadharBackInput.addEventListener('change', function() {
        aadharBackName.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
    });
    
    carRegistrationDocInput.addEventListener('change', function() {
        carRegistrationDocName.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
    });

    // WhatsApp button click handler
    whatsappBtn.addEventListener('click', async function() {
        await loadWhatsappLinks();
        whatsappModal.style.display = 'block';
    });
    
    // Google Drive auth button click handler
    googleDriveAuthBtn.addEventListener('click', function() {
        authorizeGoogleDrive();
    });
    
    // Close modal buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            whatsappModal.style.display = 'none';
            googleDriveAuthModal.style.display = 'none';
        });
    });
    
    // Close modal if clicked outside
    window.addEventListener('click', function(event) {
        if (event.target === whatsappModal) {
            whatsappModal.style.display = 'none';
        }
        if (event.target === googleDriveAuthModal) {
            googleDriveAuthModal.style.display = 'none';
        }
    });
    
    // Save to Google Drive button click handler
    uploadDocsBtn.addEventListener('click', async function() {
        // Validate form first
        const name = document.getElementById('name').value;
        const contact = document.getElementById('contact').value;
        const address = document.getElementById('address').value;
        const carName = document.getElementById('carName').value;
        const aadharNumber = document.getElementById('aadharNumber').value;
        const licenseNumber = document.getElementById('licenseNumber').value;
        const carRegistration = document.getElementById('carRegistration').value;
        const chassisNumber = document.getElementById('chassisNumber').value;
        
        if (!name || !contact || !address || !carName || !aadharNumber || 
            !licenseNumber || !carRegistration || !chassisNumber) {
            errorMessage.textContent = 'Please fill all required fields before saving to Google Drive';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (!selfieInput.files[0] || !licenseInput.files[0] || !verificationInput.files[0] ||
            !aadharFrontInput.files[0] || !aadharBackInput.files[0] || !carRegistrationDocInput.files[0]) {
            errorMessage.textContent = 'Please upload all required documents';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Show loading spinner
        spinner.style.display = 'block';
        errorMessage.style.display = 'none';
        
        try {
            // Create driver data object
            const driverData = {
                name: name,
                contact: contact,
                address: address,
                carName: carName,
                aadharNumber: aadharNumber,
                licenseNumber: licenseNumber,
                carRegistration: carRegistration,
                chassisNumber: chassisNumber,
                timestamp: new Date().toLocaleString()
            };
            
            // Get files
            const files = {
                selfie: selfieInput.files[0],
                aadharFront: aadharFrontInput.files[0],
                aadharBack: aadharBackInput.files[0],
                license: licenseInput.files[0],
                carRegistrationDoc: carRegistrationDocInput.files[0],
                verification: verificationInput.files[0]
            };
            
            // Save to Google Drive
            const folderName = await saveDriverToGoogleDrive(driverData, files);
            
            // Show success message
            successMessage.textContent = `Driver data successfully saved to Google Drive. Folder: ${folderName}`;
            successMessage.style.display = 'block';
            
            // Scroll to success message
            successMessage.scrollIntoView({ behavior: 'smooth' });
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
            
        } catch (error) {
            console.error('Error saving to Google Drive:', error);
            errorMessage.textContent = `Error saving to Google Drive: ${error.message}`;
            errorMessage.style.display = 'block';
        } finally {
            // Hide spinner
            spinner.style.display = 'none';
        }
    });
    
    // Form submission handler (centralized local save)
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorMessage.style.display = 'none';
        
        // Basic validation
        const name = document.getElementById('name').value;
        const contact = document.getElementById('contact').value;
        const address = document.getElementById('address').value;
        const carName = document.getElementById('carName').value;
        const aadharNumber = document.getElementById('aadharNumber').value;
        const licenseNumber = document.getElementById('licenseNumber').value;
        const carRegistration = document.getElementById('carRegistration').value;
        const chassisNumber = document.getElementById('chassisNumber').value;
        const terms = document.getElementById('terms').checked;
        
        if (!name || !contact || !address || !carName || !aadharNumber || 
            !licenseNumber || !carRegistration || !chassisNumber || !terms) {
            errorMessage.textContent = 'Please fill all required fields';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (!selfieInput.files[0] || !licenseInput.files[0] || !verificationInput.files[0] ||
            !aadharFrontInput.files[0] || !aadharBackInput.files[0] || !carRegistrationDocInput.files[0]) {
            errorMessage.textContent = 'Please upload all required documents';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Validate file types
        const selfieFile = selfieInput.files[0];
        const licenseFile = licenseInput.files[0];
        const verificationFile = verificationInput.files[0];
        const aadharFrontFile = aadharFrontInput.files[0];
        const aadharBackFile = aadharBackInput.files[0];
        const carRegistrationDocFile = carRegistrationDocInput.files[0];
        
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const validPdfType = 'application/pdf';
        
        if (!validImageTypes.includes(selfieFile.type)) {
            errorMessage.textContent = 'Please upload a valid image for your selfie (JPEG, PNG, or GIF)';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (!(validImageTypes.includes(licenseFile.type) || licenseFile.type === validPdfType)) {
            errorMessage.textContent = 'Please upload a valid image or PDF for your driving license';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (!(validImageTypes.includes(verificationFile.type) || verificationFile.type === validPdfType)) {
            errorMessage.textContent = 'Please upload a valid image or PDF for your police verification';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (!validImageTypes.includes(aadharFrontFile.type)) {
            errorMessage.textContent = 'Please upload a valid image for Aadhar front (JPEG, PNG, or GIF)';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (!validImageTypes.includes(aadharBackFile.type)) {
            errorMessage.textContent = 'Please upload a valid image for Aadhar back (JPEG, PNG, or GIF)';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (!(validImageTypes.includes(carRegistrationDocFile.type) || carRegistrationDocFile.type === validPdfType)) {
            errorMessage.textContent = 'Please upload a valid image or PDF for car registration document';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Show loading spinner
        spinner.style.display = 'block';

        try {
            // Build multipart form for backend uploading to local DriverData
            const fd = new FormData();
            fd.append('name', name);
            fd.append('contact', contact);
            fd.append('address', address);
            fd.append('carName', carName);
            fd.append('aadharNumber', aadharNumber);
            fd.append('licenseNumber', licenseNumber);
            fd.append('carRegistration', carRegistration);
            fd.append('chassisNumber', chassisNumber);
            fd.append('selfie', selfieFile);
            fd.append('aadharFront', aadharFrontFile);
            fd.append('aadharBack', aadharBackFile);
            fd.append('drivingLicense', licenseFile);
            fd.append('carRegistrationDoc', carRegistrationDocFile);
            fd.append('policeVerification', verificationFile);

            const resp = await fetch('/api/drivers', { method: 'POST', body: fd });
            if (!resp.ok) throw new Error('Server error');
            const result = await resp.json();

            spinner.style.display = 'none';
            successMessage.textContent = `Driver data saved. Folder: ${result.folderName}`;
            successMessage.style.display = 'block';

            try { if (window.playNewDriverSound) window.playNewDriverSound(); } catch {}

            // Reset form
            form.reset();
            selfieName.textContent = 'No file chosen';
            licenseName.textContent = 'No file chosen';
            verificationName.textContent = 'No file chosen';
            aadharFrontName.textContent = 'No file chosen';
            aadharBackName.textContent = 'No file chosen';
            carRegistrationDocName.textContent = 'No file chosen';

            // Auto-hide
            setTimeout(() => { successMessage.style.display = 'none'; }, 5000);
        } catch (err) {
            console.error(err);
            spinner.style.display = 'none';
            errorMessage.textContent = 'There was an error submitting your application. Please try again.';
            errorMessage.style.display = 'block';
        }
    });
    
    // Contact number validation
    document.getElementById('contact').addEventListener('input', function(e) {
        // Allow only numbers
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    
    // Aadhar number validation
    document.getElementById('aadharNumber').addEventListener('input', function(e) {
        // Allow only numbers and spaces
        this.value = this.value.replace(/[^0-9\s]/g, '');
    });
    
    // Initialize Google Drive when page loads
    initGoogleDrive();
});