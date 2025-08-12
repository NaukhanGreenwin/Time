// Capital Fire and Security Sign-In App
class SignInApp {
    constructor() {
        this.signinBtn = document.getElementById('signinBtn');
        this.signoutBtn = document.getElementById('signoutBtn');
        this.employeeIdInput = document.getElementById('employeeId');
        this.statusMessage = document.getElementById('statusMessage');
        this.btnText = document.querySelector('.btn-text');
        this.loadingSpinner = document.querySelector('.loading-spinner');
        
        this.init();
    }
    
    init() {
        this.signinBtn.addEventListener('click', () => this.handleSignIn());
        this.signoutBtn.addEventListener('click', () => this.handleSignOut());
        this.employeeIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSignIn();
            }
        });
    }
    
    async handleSignIn() {
        const employeeId = this.employeeIdInput.value.trim();
        
        if (!employeeId) {
            this.showMessage('Please enter your Employee ID or Name', 'error');
            return;
        }
        
        this.setLoading(true);
        this.showMessage('Getting your location...', 'warning');
        
        try {
            const location = await this.getCurrentLocation();
            
            // Display location information
            this.displayLocationInfo(location);
            
            const signInData = {
                employeeId: employeeId,
                location: location,
                timestamp: new Date().toISOString()
            };
            
            // Open native mail immediately
            this.openNativeMail(signInData);
            
            this.showMessage('Email app opened! Please send the email.', 'success');
            
            // Hide the entire form group (input field and label)
            const formGroup = this.employeeIdInput.parentElement;
            formGroup.style.display = 'none';
            
            this.signinBtn.disabled = true;
            this.signinBtn.innerHTML = '<span class="btn-text">Signed In ✓</span>';
            
        } catch (error) {
            console.error('Sign-in error:', error);
            this.showMessage(error.message || 'Sign-in failed. Please try again.', 'error');
            this.hideLocationInfo();
        } finally {
            this.setLoading(false);
        }
    }
    
    async handleSignOut() {
        const employeeId = this.employeeIdInput.value.trim();
        
        if (!employeeId) {
            this.showMessage('Please enter your Employee ID or Name', 'error');
            return;
        }
        
        this.setLoading(true, 'signout');
        this.showMessage('Getting your location...', 'warning');
        
        try {
            const location = await this.getCurrentLocation();
            
            // Display location information
            this.displayLocationInfo(location);
            
            const signOutData = {
                employeeId: employeeId,
                location: location,
                timestamp: new Date().toISOString()
            };
            
            // Open native mail immediately for sign out
            this.openNativeMailSignOut(signOutData);
            
            this.showMessage('Email app opened! Please send the sign-out email.', 'success');
            
            // Hide the entire form group (input field and label)
            const formGroup = this.employeeIdInput.parentElement;
            formGroup.style.display = 'none';
            
            this.signoutBtn.disabled = true;
            this.signoutBtn.innerHTML = '<span class="btn-text">Signed Out ✓</span>';
            
        } catch (error) {
            console.error('Sign-out error:', error);
            this.showMessage(error.message || 'Sign-out failed. Please try again.', 'error');
            this.hideLocationInfo();
        } finally {
            this.setLoading(false, 'signout');
        }
    }
    
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }
            
            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000
            };
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    
                    // Get address from coordinates
                    try {
                        const address = await this.getAddressFromCoordinates(locationData.latitude, locationData.longitude);
                        locationData.address = address;
                    } catch (error) {
                        console.log('Address lookup failed:', error);
                        locationData.address = 'Address lookup failed';
                    }
                    
                    resolve(locationData);
                },
                (error) => {
                    let message = 'Unable to get your location. ';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message += 'Please allow location access and try again.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message += 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            message += 'Location request timed out.';
                            break;
                        default:
                            message += 'An unknown error occurred.';
                            break;
                    }
                    reject(new Error(message));
                },
                options
            );
        });
    }
    
    async getAddressFromCoordinates(latitude, longitude) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                headers: {
                    'User-Agent': 'Capital Fire Security Sign-In App'
                }
            });
            
            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }
            
            const data = await response.json();
            
            if (data && data.display_name) {
                const address = data.address;
                let formattedAddress = '';
                
                if (address) {
                    const parts = [];
                    
                    if (address.house_number && address.road) {
                        parts.push(`${address.house_number} ${address.road}`);
                    } else if (address.road) {
                        parts.push(address.road);
                    }
                    
                    if (address.city || address.town || address.village) {
                        parts.push(address.city || address.town || address.village);
                    }
                    
                    if (address.state) {
                        parts.push(address.state);
                    }
                    
                    if (address.postcode) {
                        parts.push(address.postcode);
                    }
                    
                    if (address.country) {
                        parts.push(address.country);
                    }
                    
                    formattedAddress = parts.join(', ');
                }
                
                return formattedAddress || data.display_name;
            }
            
            throw new Error('No address found');
            
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
    }
    
    openNativeMail(signInData) {
        const { employeeId, location, timestamp } = signInData;
        const signInTime = new Date(timestamp);
        
        const subject = `Employee Sign-In: ${employeeId} - ${signInTime.toLocaleDateString()}`;
        
        const body = `Capital Fire & Security - Employee Sign-In Report

Employee: ${employeeId}
Date: ${signInTime.toLocaleDateString('en-CA')}
Time: ${signInTime.toLocaleTimeString('en-CA')}

Location Information:
Address: ${location.address || 'Address lookup failed'}
Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
Accuracy: ${location.accuracy ? `±${Math.round(location.accuracy)} meters` : 'Unknown'}

Google Maps Link: https://maps.google.com/?q=${location.latitude},${location.longitude}

Generated: ${new Date().toLocaleString('en-CA')}`;

        const headOfficeEmail = 'office@capitalfireandsecurity.ca';
        const mailtoUrl = `mailto:${headOfficeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        try {
            window.location.href = mailtoUrl;
        } catch (error) {
            console.error('Failed to open mail app:', error);
            window.open(mailtoUrl, '_blank');
        }
    }
    
    openNativeMailSignOut(signOutData) {
        const { employeeId, location, timestamp } = signOutData;
        const signOutTime = new Date(timestamp);
        
        const subject = `Employee Sign-Out: ${employeeId} - ${signOutTime.toLocaleDateString()}`;
        
        const body = `Capital Fire & Security - Employee Sign-Out Report

Employee: ${employeeId}
Date: ${signOutTime.toLocaleDateString('en-CA')}
Time: ${signOutTime.toLocaleTimeString('en-CA')}

Location Information:
Address: ${location.address || 'Address lookup failed'}
Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
Accuracy: ${location.accuracy ? `±${Math.round(location.accuracy)} meters` : 'Unknown'}

Google Maps Link: https://maps.google.com/?q=${location.latitude},${location.longitude}

Generated: ${new Date().toLocaleString('en-CA')}`;

        const headOfficeEmail = 'office@capitalfireandsecurity.ca';
        const mailtoUrl = `mailto:${headOfficeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        try {
            window.location.href = mailtoUrl;
        } catch (error) {
            console.error('Failed to open mail app:', error);
            window.open(mailtoUrl, '_blank');
        }
    }
    
    displayLocationInfo(location) {
        const locationInfo = document.getElementById('locationInfo');
        const mapContainer = document.getElementById('mapContainer');
        const addressElement = document.getElementById('address');
        const coordinates = document.getElementById('coordinates');
        const accuracy = document.getElementById('accuracy');
        const timestamp = document.getElementById('timestamp');
        
        locationInfo.style.display = 'block';
        
        addressElement.textContent = location.address || 'Getting address...';
        coordinates.textContent = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        accuracy.textContent = location.accuracy ? `±${Math.round(location.accuracy)}m` : 'Unknown';
        timestamp.textContent = new Date().toLocaleString();
        
        this.createMapVisualization(mapContainer, location);
    }
    
    createMapVisualization(container, location) {
        container.innerHTML = '';
        
        try {
            const map = L.map(container).setView([location.latitude, location.longitude], 16);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);
            
            const marker = L.marker([location.latitude, location.longitude]).addTo(map);
            
            const popupContent = `
                <div style="text-align: center;">
                    <strong>📍 Your Sign-In Location</strong><br>
                    <small>Lat: ${location.latitude.toFixed(6)}<br>
                    Lng: ${location.longitude.toFixed(6)}</small><br>
                    <a href="https://maps.google.com/?q=${location.latitude},${location.longitude}" target="_blank" style="color: #dc2626;">View on Google Maps</a>
                </div>
            `;
            marker.bindPopup(popupContent).openPopup();
            
            if (location.accuracy) {
                L.circle([location.latitude, location.longitude], {
                    color: '#dc2626',
                    fillColor: '#dc2626',
                    fillOpacity: 0.1,
                    radius: location.accuracy
                }).addTo(map);
            }
            
        } catch (error) {
            console.error('Failed to create map:', error);
            container.innerHTML = `
                <div class="map-placeholder">
                    <p><strong>📍 Your Location</strong></p>
                    <p>Lat: ${location.latitude.toFixed(6)}</p>
                    <p>Lng: ${location.longitude.toFixed(6)}</p>
                    <p><a href="https://maps.google.com/?q=${location.latitude},${location.longitude}" target="_blank" style="color: #dc2626;">View on Google Maps</a></p>
                </div>
            `;
        }
    }
    
    hideLocationInfo() {
        const locationInfo = document.getElementById('locationInfo');
        locationInfo.style.display = 'none';
    }
    
    setLoading(isLoading, buttonType = 'signin') {
        if (buttonType === 'signin') {
            this.signinBtn.disabled = isLoading;
            const signinBtnText = this.signinBtn.querySelector('.btn-text');
            const signinSpinner = this.signinBtn.querySelector('.loading-spinner');
            signinBtnText.style.display = isLoading ? 'none' : 'inline';
            signinSpinner.style.display = isLoading ? 'block' : 'none';
        } else if (buttonType === 'signout') {
            this.signoutBtn.disabled = isLoading;
            const signoutBtnText = this.signoutBtn.querySelector('.btn-text');
            const signoutSpinner = this.signoutBtn.querySelector('.loading-spinner');
            signoutBtnText.style.display = isLoading ? 'none' : 'inline';
            signoutSpinner.style.display = isLoading ? 'block' : 'none';
        }
    }
    
    showMessage(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                this.statusMessage.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignInApp();
});