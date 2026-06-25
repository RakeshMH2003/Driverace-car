// --- STATE & INITIALIZATION ---
let currentUser = JSON.parse(localStorage.getItem('driveease_user')) || null;
const API_BASE = '/api';

// Helper: Open Base64 document (image or PDF) in a new browser tab
function viewDocument(base64Str) {
    if (!base64Str) return;
    const newTab = window.open();
    if (!newTab) { alert('Please allow popups to view documents.'); return; }
    if (base64Str.startsWith('data:application/pdf')) {
        newTab.document.write(`<html><head><title>Document Viewer</title></head><body style="margin:0;"><iframe src="${base64Str}" style="width:100%;height:100vh;border:none;"></iframe></body></html>`);
    } else {
        newTab.document.write(`<html><head><title>Document Viewer</title></head><body style="margin:0;background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="${base64Str}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></body></html>`);
    }
    newTab.document.close();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1000);

    updateNav();
    showPage('home');
    loadVehicles();

    // Listeners for file uploads styling
    setupFileInputs();
});

function setupFileInputs() {
    const bindUpload = (boxId, inputId, textId) => {
        const box = document.getElementById(boxId);
        const input = document.getElementById(inputId);
        if(!box || !input) return;
        box.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                document.getElementById(textId).innerText = e.target.files[0].name;
            }
        });
    }

    bindUpload('licFrontBox', 'licFront', 'licFStat');
    bindUpload('licBackBox', 'licBack', 'licBStat');
    bindUpload('insBox', 'carIns', 'insStat');

    const vImgsInput = document.getElementById('vImgs');
    if(vImgsInput) {
        document.getElementById('imgUpBox').addEventListener('click', () => vImgsInput.click());
        vImgsInput.addEventListener('change', (e) => {
            const prevs = document.getElementById('imgPrevs');
            prevs.innerHTML = '';
            Array.from(e.target.files).slice(0,5).forEach(file => {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'img-thumb';
                prevs.appendChild(img);
            });
        });
    }
}

// --- UI & NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Auth Guards
    if(pageId === 'user-dashboard' && (!currentUser || currentUser.role !== 'user')) return showPage('home');
    if(pageId === 'vendor-dashboard' && (!currentUser || currentUser.role !== 'vendor')) return showPage('home');
    if(pageId === 'admin-dashboard' && (!currentUser || currentUser.role !== 'admin')) return showPage('home');

    const page = document.getElementById('page-' + pageId);
    if(page) page.classList.add('active');

    window.scrollTo(0, 0);

    // Dashboard Data loading
    if(pageId === 'user-dashboard') initUserDashboard();
    if(pageId === 'vendor-dashboard') initVendorDashboard();
    if(pageId === 'admin-dashboard') initAdminDashboard();
}

function updateNav() {
    const navActions = document.getElementById('navActions');
    if(currentUser) {
        let dashBtn = '';
        if(currentUser.role === 'admin') dashBtn = `<button class="btn btn-de-primary" onclick="showPage('admin-dashboard')">Admin Dashboard</button>`;
        else if(currentUser.role === 'vendor') dashBtn = `<button class="btn btn-vendor-pill" onclick="showPage('vendor-dashboard')">Vendor Dashboard</button>`;
        else dashBtn = `<button class="btn btn-de-primary" onclick="showPage('user-dashboard')">My Dashboard</button>`;
        
        navActions.innerHTML = `
            ${dashBtn}
            <div class="nav-ava">${currentUser.name.charAt(0).toUpperCase()}</div>
        `;
    } else {
        navActions.innerHTML = `
            <button class="btn btn-de-outline" onclick="openSignIn()">Sign In</button>
            <button class="btn btn-de-primary" onclick="openSignUp()">Get Started</button>
            <button class="btn btn-vendor-pill" onclick="openVendorSignIn()"><i class="fas fa-store"></i> Vendor</button>
        `;
    }
}

function toggleNav() {
    document.getElementById('mobileNav').classList.toggle('open');
}
function closeMobileNav() {
    document.getElementById('mobileNav').classList.remove('open');
}

// --- MODALS ---
function showModal(id) { new bootstrap.Modal(document.getElementById(id)).show(); }
function hideModal(id) { 
    const el = document.getElementById(id);
    const modal = bootstrap.Modal.getInstance(el);
    if(modal) modal.hide();
}
function switchModal(closeId, openId) {
    hideModal(closeId);
    setTimeout(() => showModal(openId), 400);
}

function openSignUp() { showModal('signupModal'); }
function openSignIn() { showModal('signinModal'); }
function openVendorSignUp() { showModal('vendorSignupModal'); }
function openVendorSignIn() { showModal('vendorSigninModal'); }

function showToast(msg) {
    document.getElementById('toastBody').innerText = msg;
    new bootstrap.Toast(document.getElementById('liveToast')).show();
}

// --- API HELPERS ---
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: {} };
    if(body instanceof FormData) {
        options.body = body;
    } else if(body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const res = await fetch(API_BASE + endpoint, options);
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'API Error');
    return data;
}

// --- AUTHENTICATION ---
async function signUp() {
    const name = document.getElementById('suName').value;
    const email = document.getElementById('suEmail').value;
    const pass = document.getElementById('suPass').value;
    try {
        const data = await apiCall('/auth/signup', 'POST', { name, email, password: pass, role: 'user' });
        currentUser = data;
        localStorage.setItem('driveease_user', JSON.stringify(currentUser));
        hideModal('signupModal');
        updateNav();
        showPage('user-dashboard');
        showToast('Account created successfully!');
    } catch(e) {
        const err = document.getElementById('suError');
        err.innerText = e.message; err.classList.remove('d-none');
    }
}

async function signIn() {
    const email = document.getElementById('siEmail').value;
    const pass = document.getElementById('siPass').value;
    try {
        const data = await apiCall('/auth/login', 'POST', { email, password: pass });
        currentUser = data.user;
        localStorage.setItem('driveease_user', JSON.stringify(currentUser));
        hideModal('signinModal');
        updateNav();
        
        if(currentUser.role === 'admin') showPage('admin-dashboard');
        else if(currentUser.role === 'vendor') showPage('vendor-dashboard');
        else showPage('user-dashboard');
        
        showToast('Signed in successfully!');
    } catch(e) {
        const err = document.getElementById('siError');
        err.innerText = e.message; err.classList.remove('d-none');
    }
}

async function vendorSignUp() {
    const name = document.getElementById('vuName').value;
    const email = document.getElementById('vuEmail').value;
    const pass = document.getElementById('vuPass').value;
    try {
        const data = await apiCall('/auth/signup', 'POST', { name, email, password: pass, role: 'vendor' });
        currentUser = data;
        localStorage.setItem('driveease_user', JSON.stringify(currentUser));
        hideModal('vendorSignupModal');
        updateNav();
        showPage('vendor-dashboard');
        showToast('Vendor registration successful! Pending admin approval.');
    } catch(e) {
        const err = document.getElementById('vuError');
        err.innerText = e.message; err.classList.remove('d-none');
    }
}

async function vendorSignIn() {
    const email = document.getElementById('vsEmail').value;
    const pass = document.getElementById('vsPass').value;
    try {
        const data = await apiCall('/auth/login', 'POST', { email, password: pass });
        if(data.user.role !== 'vendor' && data.user.role !== 'admin') throw new Error('Not a vendor account');
        currentUser = data.user;
        localStorage.setItem('driveease_user', JSON.stringify(currentUser));
        hideModal('vendorSigninModal');
        updateNav();
        if(currentUser.role === 'admin') showPage('admin-dashboard');
        else showPage('vendor-dashboard');
        showToast('Vendor signed in successfully!');
    } catch(e) {
        const err = document.getElementById('vsError');
        err.innerText = e.message; err.classList.remove('d-none');
    }
}

function signOut() {
    currentUser = null;
    localStorage.removeItem('driveease_user');
    updateNav();
    showPage('home');
    showToast('Signed out.');
}

// --- VEHICLES & BOOKING ---
let allVehicles = [];

async function loadVehicles() {
    try {
        allVehicles = await apiCall('/vehicles');
        renderVehicles(allVehicles, 'vehiclesGrid');
        renderVehicles(allVehicles.slice(0, 4), 'trendingVehicles'); // Homepage preview
    } catch (e) {
        console.error('Error loading vehicles:', e);
    }
}

function renderVehicles(vehicles, gridId) {
    const grid = document.getElementById(gridId);
    if(!grid) return;
    grid.innerHTML = vehicles.map(v => `
        <div class="vcard">
            <div class="vcard-badge">${v.type}</div>
            <div class="vcard-img-wrap">
                <img src="${v.images && v.images.length > 0 ? v.images[0] : 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&h=300&fit=crop'}" class="vcard-img" alt="${v.name}"/>
            </div>
            <div class="vcard-body">
                <div class="vcard-vendor"><i class="fas fa-store"></i> ${v.vendor_name}</div>
                <h3 class="vcard-title">${v.name}</h3>
                <div class="vcard-specs">
                    <span class="vspec"><i class="fas fa-users"></i> ${v.seats} Seats</span>
                    <span class="vspec"><i class="fas fa-cog"></i> Auto</span>
                </div>
                <div class="vcard-foot">
                    <div class="vcard-price">₹${v.price} <small>/day</small></div>
                    <button class="btn btn-de-primary btn-sm" onclick="openBookingModal(${v.id})">Book</button>
                </div>
            </div>
        </div>
    `).join('') || '<p class="text-center w-100 mt-4 text-muted">No vehicles found.</p>';
}

function goCat(type) {
    showPage('vehicles');
    document.querySelectorAll('.ftag').forEach(t => t.classList.remove('active'));
    document.querySelector(`.ftag[onclick="filterTag(this,'${type}')"]`)?.classList.add('active');
    
    if(type === '') renderVehicles(allVehicles, 'vehiclesGrid');
    else renderVehicles(allVehicles.filter(v => v.type.toLowerCase() === type.toLowerCase()), 'vehiclesGrid');
}

function filterTag(btn, type) {
    document.querySelectorAll('.ftag').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    
    if(type === '') renderVehicles(allVehicles, 'vehiclesGrid');
    else renderVehicles(allVehicles.filter(v => v.type.toLowerCase() === type.toLowerCase()), 'vehiclesGrid');
}

function filterVehicles() {
    const search = document.getElementById('vSearch').value.toLowerCase();
    const sort = document.getElementById('vSort').value;
    
    let filtered = allVehicles.filter(v => v.name.toLowerCase().includes(search));
    
    if(sort === 'pa') filtered.sort((a,b) => a.price - b.price);
    if(sort === 'pd') filtered.sort((a,b) => b.price - a.price);
    if(sort === 'r') filtered.sort((a,b) => b.id - a.id); // Mock rating sort

    renderVehicles(filtered, 'vehiclesGrid');
}

// --- USER DASHBOARD ---
function showDashTab(tabId, el) {
    document.querySelectorAll('#page-user-dashboard .sl').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#page-user-dashboard .dtab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');

    if(tabId === 'browseVehicles') renderVehicles(allVehicles, 'dashVehiclesGrid');
}

async function initUserDashboard() {
    document.getElementById('userName').innerText = currentUser.name;
    document.getElementById('userAva').innerText = currentUser.name.charAt(0).toUpperCase();

    // Load Profile
    try {
        const profile = await apiCall(`/users/${currentUser.id}`);
        document.getElementById('pName').value = profile.name || '';
        document.getElementById('pEmail').value = profile.email || '';
        document.getElementById('pPhone').value = profile.phone || '';
        document.getElementById('pCity').value = profile.city || '';
        
        if(profile.license_front && profile.license_back) {
            document.getElementById('licDone').style.display = 'block';
            currentUser.hasLicense = true;
        } else {
            currentUser.hasLicense = false;
        }
    } catch(e) { console.error(e); }

    // Load Bookings
    try {
        const bookings = await apiCall(`/users/${currentUser.id}/bookings`);
        const list = document.getElementById('userBookingsList');
        list.innerHTML = bookings.map(b => `
            <div class="bcard">
                <div class="b-info">
                    <div class="b-stat st-${b.status}">${b.status}</div>
                    <h4>${b.vehicle_name}</h4>
                    <div class="b-dates"><i class="fas fa-calendar-alt"></i> ${b.start_date} to ${b.end_date}</div>
                    <div class="b-loc"><i class="fas fa-map-marker-alt"></i> Pick: ${b.pickup_loc} | Return: ${b.return_loc}</div>
                </div>
                <div class="b-price">
                    <div class="b-amt">₹${b.total_price}</div>
                    <small class="text-muted">Total Paid</small>
                    <div class="mt-2">
                        ${b.status !== 'cancelled' ? `<button class="btn btn-sm btn-de-danger" onclick="cancelBooking(${b.id})">Cancel Booking</button>` : ''}
                    </div>
                </div>
            </div>
        `).join('') || '<p>No bookings yet.</p>';
    } catch(e) { console.error(e); }
}

async function saveProfile() {
    const formData = new FormData();
    formData.append('name', document.getElementById('pName').value);
    formData.append('phone', document.getElementById('pPhone').value);
    formData.append('city', document.getElementById('pCity').value);
    
    const licFront = document.getElementById('licFront').files[0];
    const licBack = document.getElementById('licBack').files[0];
    
    if(licFront) formData.append('license_front', licFront);
    if(licBack) formData.append('license_back', licBack);

    try {
        await apiCall(`/users/${currentUser.id}`, 'POST', formData);
        showToast('Profile saved successfully!');
        initUserDashboard(); // reload to show license status
    } catch(e) {
        showToast('Error saving profile: ' + e.message);
    }
}

// Booking Modal Logic
let currentBookingVehicle = null;

function openBookingModal(vid) {
    if(!currentUser) return openSignIn();
    if(currentUser.role !== 'user') return showToast('Please sign in as a user to book.');

    currentBookingVehicle = allVehicles.find(v => v.id === vid);
    if(!currentBookingVehicle) return;

    document.getElementById('bkVehicleName').innerText = currentBookingVehicle.name;
    
    if(!currentUser.hasLicense) {
        document.getElementById('licWarn').classList.remove('d-none');
    } else {
        document.getElementById('licWarn').classList.add('d-none');
    }

    showModal('bookingModal');
}

// Calculate total dynamically
['bkStart', 'bkEnd'].forEach(id => {
    document.getElementById(id).addEventListener('change', calcTotal);
});

function calcTotal() {
    if(!currentBookingVehicle) return;
    const start = new Date(document.getElementById('bkStart').value);
    const end = new Date(document.getElementById('bkEnd').value);
    
    if(start && end && end > start) {
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const total = days * currentBookingVehicle.price;
        document.getElementById('bkSum').innerHTML = `<strong>Total (${days} days):</strong> <span class="accent-text" style="font-size:1.5rem">₹${total}</span>`;
    }
}

async function confirmBooking() {
    if(!currentUser.hasLicense) return showToast('You must upload your driving license in My Profile first.');
    
    const start_date = document.getElementById('bkStart').value;
    const end_date = document.getElementById('bkEnd').value;
    const pickup_loc = document.getElementById('bkPickup').value;
    const return_loc = document.getElementById('bkReturn').value;

    if(!start_date || !end_date || !pickup_loc || !return_loc) return showToast('Please fill all fields');
    
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    if(days <= 0) return showToast('Invalid dates');
    const total_price = days * currentBookingVehicle.price;

    try {
        await apiCall('/bookings', 'POST', {
            user_id: currentUser.id,
            vehicle_id: currentBookingVehicle.id,
            start_date, end_date, pickup_loc, return_loc, total_price
        });
        showToast('Booking confirmed successfully!');
        hideModal('bookingModal');
        showPage('user-dashboard');
    } catch(e) {
        showToast('Booking failed: ' + e.message);
    }
}

// --- VENDOR DASHBOARD ---
function showVendorTab(tabId, el) {
    document.querySelectorAll('#page-vendor-dashboard .sl').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#page-vendor-dashboard .dtab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
}

async function initVendorDashboard() {
    document.getElementById('vendorName').innerText = currentUser.name;
    document.getElementById('vendorAva').innerText = currentUser.name.charAt(0).toUpperCase();

    // Check vendor status
    try {
        const vendor = await apiCall(`/users/${currentUser.id}`);
        const badge = document.getElementById('vendorStatusBadge');
        if(vendor.status === 'pending') {
            badge.innerHTML = `<span class="badge bg-warning text-dark">Pending Admin Approval</span>`;
            document.getElementById('vendorPendingNotice').style.display = 'flex';
        } else {
            badge.innerHTML = `<span class="badge bg-success">Approved Vendor</span>`;
            document.getElementById('vendorPendingNotice').style.display = 'none';
        }
    } catch(e) { console.error(e); }

    loadVendorVehicles();
    loadVendorOrders();
}

async function loadVendorVehicles() {
    try {
        const vehicles = await apiCall(`/vendor/${currentUser.id}/vehicles`);
        const list = document.getElementById('vVehiclesList');
        
        if(vehicles.length === 0) {
            list.innerHTML = `<div class="p-4 text-center text-muted">You haven't listed any vehicles yet.</div>`;
            return;
        }

        let html = `<div class="dt-row dt-hdr"><div>Vehicle</div><div>Price/Day</div><div>Status</div><div>Actions</div></div>`;
        vehicles.forEach(v => {
            const statusClass = v.status === 'approved' ? 'bg-success-subtle' : (v.status === 'pending' ? 'bg-warning-subtle' : 'bg-danger-subtle');
            html += `
                <div class="dt-row">
                    <div><strong>${v.name}</strong><br/><small class="text-muted">${v.type}</small></div>
                    <div>₹${v.price}</div>
                    <div><span class="badge ${statusClass}">${v.status}</span></div>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-edit"></i></button>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch(e) { console.error(e); }
}

async function loadVendorOrders() {
    try {
        const orders = await apiCall(`/vendor/${currentUser.id}/orders`);
        const list = document.getElementById('vOrdersList');
        list.innerHTML = orders.map(o => `
            <div class="bcard">
                <div class="b-info">
                    <h4>${o.vehicle_name}</h4>
                    <div class="b-dates">Renter: ${o.user_name} (${o.user_phone})</div>
                    <div class="b-dates"><i class="fas fa-calendar-alt"></i> ${o.start_date} to ${o.end_date}</div>
                    <div class="b-loc"><i class="fas fa-map-marker-alt"></i> Pick: ${o.pickup_loc} | Return: ${o.return_loc}</div>
                </div>
                <div class="b-price">
                    <div class="b-amt">₹${o.total_price}</div>
                    <div class="b-stat st-confirmed">Confirmed</div>
                </div>
            </div>
        `).join('') || '<p class="text-muted">No orders yet.</p>';
    } catch(e) { console.error(e); }
}

async function addVehicle() {
    const formData = new FormData();
    formData.append('vendor_id', currentUser.id);
    formData.append('name', document.getElementById('vName').value);
    formData.append('type', document.getElementById('vType').value);
    formData.append('price', document.getElementById('vPrice').value);
    formData.append('seats', document.getElementById('vSeats').value);
    formData.append('description', document.getElementById('vDesc').value);

    const insDoc = document.getElementById('carIns').files[0];
    if(!insDoc) return showToast('Insurance document is mandatory!');
    formData.append('insurance_doc', insDoc);

    const images = document.getElementById('vImgs').files;
    for(let i=0; i<images.length; i++) {
        formData.append('images', images[i]);
    }

    try {
        await apiCall('/vehicles', 'POST', formData);
        showToast('Vehicle submitted for review!');
        
        // Reset form
        document.getElementById('vName').value = '';
        document.getElementById('vPrice').value = '';
        document.getElementById('vDesc').value = '';
        document.getElementById('insStat').innerText = '';
        document.getElementById('imgPrevs').innerHTML = '';
        
        initVendorDashboard();
        showVendorTab('vVehicles', document.getElementById('vTab-vVehicles'));
    } catch(e) {
        showToast('Error adding vehicle: ' + e.message);
    }
}

// --- ADMIN DASHBOARD ---
function showAdminTab(tabId, el) {
    document.querySelectorAll('#page-admin-dashboard .sl').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#page-admin-dashboard .dtab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
}

async function initAdminDashboard() {
    try {
        // Load Stats
        const stats = await apiCall('/admin/stats');
        document.getElementById('adminStats').innerHTML = `
            <div class="stat-card"><i class="fas fa-users"></i><h3>${stats.users}</h3><p>Customers</p></div>
            <div class="stat-card"><i class="fas fa-store"></i><h3>${stats.vendors}</h3><p>Vendors</p></div>
            <div class="stat-card"><i class="fas fa-car"></i><h3>${stats.vehicles}</h3><p>Vehicles</p></div>
            <div class="stat-card"><i class="fas fa-calendar-check"></i><h3>${stats.bookings}</h3><p>Total Bookings</p></div>
        `;
        
        loadAdminUsers();
        loadAdminVehicles();
        loadAdminBookings();
        loadAdminMessages();
    } catch(e) { console.error('Admin init error', e); }
}

let adminUserDocs = {};
async function loadAdminUsers() {
    try {
        const users = await apiCall('/admin/users');
        adminUserDocs = {};
        users.forEach(u => { adminUserDocs[u.id] = { front: u.license_front, back: u.license_back }; });
        
        // Split vendors and customers for different tabs
        const vendors = users.filter(u => u.role === 'vendor');
        const customers = users.filter(u => u.role === 'user');

        const vList = document.getElementById('aVendorsList');
        let vHtml = `<div class="dt-row dt-hdr"><div>Vendor Info</div><div>Contact</div><div>Status</div><div>Actions</div></div>`;
        vendors.forEach(v => {
            vHtml += `
                <div class="dt-row">
                    <div><strong>${v.name}</strong></div>
                    <div>${v.email}</div>
                    <div><span class="badge ${v.status === 'approved' ? 'bg-success-subtle' : 'bg-warning-subtle'}">${v.status}</span></div>
                    <div>
                        ${v.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="updateUserStatus(${v.id}, 'approved')"><i class="fas fa-check"></i></button>` : ''}
                        ${v.status === 'approved' ? `<button class="btn btn-sm btn-danger" onclick="updateUserStatus(${v.id}, 'suspended')"><i class="fas fa-ban"></i></button>` : ''}
                    </div>
                </div>
            `;
        });
        vList.innerHTML = vHtml;

        const uList = document.getElementById('aUsersList');
        let uHtml = `<div class="dt-row dt-hdr"><div>Customer Info</div><div>City/Phone</div><div>License</div><div>Actions</div></div>`;
        customers.forEach(u => {
            uHtml += `
                <div class="dt-row">
                    <div><strong>${u.name}</strong><br/>${u.email}</div>
                    <div>${u.city || 'N/A'}<br/>${u.phone || 'N/A'}</div>
                    <div>
                        ${u.license_front ? `<a href="javascript:void(0)" onclick="viewDocument(adminUserDocs[${u.id}].front)" class="accent-text"><i class="fas fa-id-card"></i> View Front</a>` : '<span class="text-muted">Missing</span>'}<br/>
                        ${u.license_back ? `<a href="javascript:void(0)" onclick="viewDocument(adminUserDocs[${u.id}].back)" class="accent-text"><i class="fas fa-id-card-alt"></i> View Back</a>` : ''}
                    </div>
                    <div>
                        <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        uList.innerHTML = uHtml;

    } catch(e) { console.error(e); }
}

async function updateUserStatus(id, status) {
    try {
        await apiCall(`/admin/users/${id}/status`, 'POST', { status });
        showToast('User status updated');
        loadAdminUsers();
    } catch(e) { showToast('Error: ' + e.message); }
}

let adminVehiclesDocs = {};
async function loadAdminVehicles() {
    try {
        const vehicles = await apiCall('/admin/vehicles');
        const list = document.getElementById('aVehiclesList');
        adminVehiclesDocs = {};
        vehicles.forEach(v => { if(v.insurance_doc) adminVehiclesDocs[v.id] = v.insurance_doc; });
        
        let html = `<div class="dt-row dt-hdr"><div>Vehicle</div><div>Vendor</div><div>Insurance Doc</div><div>Status</div><div>Actions</div></div>`;
        vehicles.forEach(v => {
            const statusClass = v.status === 'approved' ? 'bg-success-subtle' : (v.status === 'pending' ? 'bg-warning-subtle' : 'bg-danger-subtle');
            // BUG FIX: Link directly to the uploaded file using target="_blank" so the admin can view the document
            const insDocLink = v.insurance_doc 
                ? `<button class="btn btn-sm btn-outline-info" onclick="viewDocument(adminVehiclesDocs[${v.id}])"><i class="fas fa-file-pdf"></i> View Doc</button>` 
                : `<span class="text-danger">Not Uploaded</span>`;

            html += `
                <div class="dt-row">
                    <div><strong>${v.name}</strong><br/><small class="text-muted">${v.type} | ₹${v.price}/d</small></div>
                    <div>${v.vendor_name}<br/><small class="text-muted">${v.vendor_email}</small></div>
                    <div>${insDocLink}</div>
                    <div><span class="badge ${statusClass}">${v.status}</span></div>
                    <div class="d-flex gap-1">
                        ${v.status !== 'approved' ? `<button class="btn btn-sm btn-success" onclick="updateVehicleStatus(${v.id}, 'approved')" title="Approve"><i class="fas fa-check"></i></button>` : ''}
                        ${v.status !== 'rejected' ? `<button class="btn btn-sm btn-danger" onclick="updateVehicleStatus(${v.id}, 'rejected')" title="Reject"><i class="fas fa-times"></i></button>` : ''}
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch(e) { console.error(e); }
}

async function updateVehicleStatus(id, status) {
    try {
        await apiCall(`/admin/vehicles/${id}/status`, 'POST', { status });
        showToast('Vehicle status updated to ' + status);
        loadAdminVehicles();
        loadVehicles(); // refresh homepage vehicles
    } catch(e) { showToast('Error: ' + e.message); }
}

let adminBookingDocs = {};
async function loadAdminBookings() {
    try {
        const bookings = await apiCall('/admin/bookings');
        adminBookingDocs = {};
        bookings.forEach(b => { if(b.license_front) adminBookingDocs[b.id] = b.license_front; });
        const list = document.getElementById('aBookingsList');
        
        list.innerHTML = bookings.map(b => `
            <div class="bcard">
                <div class="b-info">
                    <h4>${b.vehicle_name} <span class="badge bg-secondary ms-2">Booking #${b.id}</span></h4>
                    <div class="b-dates"><strong>Customer:</strong> ${b.user_name} 
                        ${b.license_front ? `<a href="javascript:void(0)" onclick="viewDocument(adminBookingDocs[${b.id}])" class="ms-2 accent-text"><i class="fas fa-id-card"></i> License</a>` : ''}
                    </div>
                    <div class="b-dates"><i class="fas fa-calendar-alt"></i> ${b.start_date} to ${b.end_date}</div>
                    <div class="b-loc"><i class="fas fa-map-marker-alt"></i> Pick: ${b.pickup_loc} | Return: ${b.return_loc}</div>
                </div>
                <div class="b-price">
                    <div class="b-amt">₹${b.total_price}</div>
                    <div class="b-stat st-${b.status}">${b.status}</div>
                    <div class="mt-2">
                        ${b.status !== 'cancelled' ? `<button class="btn btn-sm btn-de-danger" onclick="cancelBooking(${b.id})">Cancel Booking</button>` : ''}
                    </div>
                </div>
            </div>
        `).join('') || '<p>No bookings found.</p>';
    } catch(e) { console.error(e); }
}

// Support Messages
async function submitContact() {
    const data = {
        name: document.getElementById('cName').value,
        email: document.getElementById('cEmail').value,
        subject: document.getElementById('cSubj').value,
        message: document.getElementById('cMsg').value,
        user_id: currentUser ? currentUser.id : null
    };
    try {
        await apiCall('/contact', 'POST', data);
        showToast('Message sent to admin successfully!');
        document.getElementById('cName').value = '';
        document.getElementById('cEmail').value = '';
        document.getElementById('cMsg').value = '';
    } catch(e) { showToast('Error sending message'); }
}

async function submitUserContact() {
    const data = {
        name: currentUser ? currentUser.name : 'Unknown User',
        email: currentUser ? currentUser.email : 'No Email',
        subject: document.getElementById('ucSubj').value,
        message: document.getElementById('ucMsg').value,
        user_id: currentUser ? currentUser.id : null
    };
    try {
        await apiCall('/contact', 'POST', data);
        showToast('Message sent to admin successfully!');
        document.getElementById('ucSubj').value = '';
        document.getElementById('ucMsg').value = '';
    } catch(e) { showToast('Error sending message'); }
}

async function loadAdminMessages() {
    try {
        const messages = await apiCall('/admin/messages');
        const list = document.getElementById('aMessagesList');
        
        list.innerHTML = messages.map(m => `
            <div class="bcard" style="display:block;">
                <div class="b-info" style="width: 100%;">
                    <h4 style="color: var(--accent); margin-bottom: 10px;">${m.subject}</h4>
                    <div class="b-dates" style="margin-bottom: 5px;"><strong>From:</strong> <span style="color: var(--text);">${m.name} (${m.email})</span></div>
                    <div class="b-dates" style="margin-bottom: 15px;"><i class="fas fa-calendar-alt"></i> ${new Date(m.created_at).toLocaleString()}</div>
                    <div style="background: var(--bg2); border: 1px solid var(--border2); padding: 15px; border-radius: 10px; color: var(--text); font-size: 1rem; line-height: 1.5; white-space: pre-wrap;">${m.message}</div>
                </div>
            </div>
        `).join('') || '<p>No messages found.</p>';
    } catch(e) { console.error(e); }
}

async function cancelBooking(id) {
    if(!confirm('Are you sure you want to cancel this booking?')) return;
    try {
        await apiCall(`/bookings/${id}/status`, 'POST', { status: 'cancelled' });
        showToast('Booking cancelled successfully.');
        // Refresh the appropriate dashboard
        if(currentUser.role === 'admin') {
            loadAdminBookings();
        } else if(currentUser.role === 'user') {
            initUserDashboard();
        }
    } catch(e) {
        showToast('Error cancelling booking: ' + e.message);
    }
}
