const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up Multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage: storage });

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role } = req.body;
    const userRole = role || 'user';
    const status = userRole === 'vendor' ? 'pending' : 'approved';

    db.run(`INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)`,
        [name, email, password, userRole, status],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ id: this.lastID, name, email, role: userRole, status });
        });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT id, name, email, role, status FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(401).json({ error: 'Invalid email or password' });
        res.json({ user: row });
    });
});

// --- USER PROFILE & LICENSE ROUTES ---

app.get('/api/users/:id', (req, res) => {
    db.get(`SELECT id, name, email, role, phone, city, license_front, license_back, status FROM users WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'User not found' });
        res.json(row);
    });
});

app.post('/api/users/:id', upload.fields([{ name: 'license_front', maxCount: 1 }, { name: 'license_back', maxCount: 1 }]), (req, res) => {
    const { name, phone, city } = req.body;
    const userId = req.params.id;
    
    let updateQuery = `UPDATE users SET name = ?, phone = ?, city = ?`;
    let params = [name, phone, city];

    if (req.files['license_front']) {
        updateQuery += `, license_front = ?`;
        params.push('/uploads/' + req.files['license_front'][0].filename);
    }
    if (req.files['license_back']) {
        updateQuery += `, license_back = ?`;
        params.push('/uploads/' + req.files['license_back'][0].filename);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(userId);

    db.run(updateQuery, params, function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

// --- VEHICLE ROUTES ---

// Get all approved vehicles (for home/vehicles page)
app.get('/api/vehicles', (req, res) => {
    db.all(`SELECT v.*, u.name as vendor_name FROM vehicles v JOIN users u ON v.vendor_id = u.id WHERE v.status = 'approved'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })));
    });
});

// Get vendor's vehicles
app.get('/api/vendor/:id/vehicles', (req, res) => {
    db.all(`SELECT * FROM vehicles WHERE vendor_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })));
    });
});

// Add a new vehicle (vendor only)
app.post('/api/vehicles', upload.fields([{ name: 'insurance_doc', maxCount: 1 }, { name: 'images', maxCount: 5 }]), (req, res) => {
    const { vendor_id, name, type, price, seats, description } = req.body;
    
    const insuranceDocPath = req.files['insurance_doc'] ? '/uploads/' + req.files['insurance_doc'][0].filename : null;
    const imagePaths = req.files['images'] ? req.files['images'].map(f => '/uploads/' + f.filename) : [];

    db.run(`INSERT INTO vehicles (vendor_id, name, type, price, seats, insurance_doc, images, description, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [vendor_id, name, type, price, seats, insuranceDocPath, JSON.stringify(imagePaths), description],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

// --- BOOKING ROUTES ---

app.post('/api/bookings', (req, res) => {
    const { user_id, vehicle_id, start_date, end_date, pickup_loc, return_loc, total_price } = req.body;
    db.run(`INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, pickup_loc, return_loc, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, vehicle_id, start_date, end_date, pickup_loc, return_loc, total_price],
        function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(201).json({ id: this.lastID });
        });
});

app.get('/api/users/:id/bookings', (req, res) => {
    const query = `
        SELECT b.*, v.name as vehicle_name, v.images, v.type
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `;
    db.all(query, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })));
    });
});

app.get('/api/vendor/:id/orders', (req, res) => {
    const query = `
        SELECT b.*, v.name as vehicle_name, u.name as user_name, u.phone as user_phone
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN users u ON b.user_id = u.id
        WHERE v.vendor_id = ?
        ORDER BY b.created_at DESC
    `;
    db.all(query, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/bookings/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE bookings SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

// --- ADMIN ROUTES ---

app.get('/api/admin/stats', (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as count FROM users WHERE role = "user"', (err, row) => {
        stats.users = row.count;
        db.get('SELECT COUNT(*) as count FROM users WHERE role = "vendor"', (err, row) => {
            stats.vendors = row.count;
            db.get('SELECT COUNT(*) as count FROM vehicles', (err, row) => {
                stats.vehicles = row.count;
                db.get('SELECT COUNT(*) as count FROM bookings', (err, row) => {
                    stats.bookings = row.count;
                    res.json(stats);
                });
            });
        });
    });
});

app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT id, name, email, role, phone, city, license_front, license_back, status, created_at FROM users WHERE role != 'admin'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/admin/users/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE users SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

app.get('/api/admin/vehicles', (req, res) => {
    const query = `
        SELECT v.*, u.name as vendor_name, u.email as vendor_email
        FROM vehicles v JOIN users u ON v.vendor_id = u.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })));
    });
});

app.post('/api/admin/vehicles/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE vehicles SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

app.get('/api/admin/bookings', (req, res) => {
    const query = `
        SELECT b.*, v.name as vehicle_name, u.name as user_name, u.license_front, u.license_back
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.get('/api/admin/messages', (req, res) => {
    db.all(`SELECT * FROM messages ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/contact', (req, res) => {
    const { user_id, name, email, subject, message } = req.body;
    db.run(`INSERT INTO messages (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)`,
        [user_id || null, name, email, subject, message],
        function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(201).json({ success: true });
        });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
