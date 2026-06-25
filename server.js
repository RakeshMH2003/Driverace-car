const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support larger JSON payloads if base64 is sent
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up Multer for file uploads (Memory storage to avoid ephemeral disk issues)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper functions to convert uploaded files to Base64 data strings
const fileToBase64 = (file) => {
    if (!file) return null;
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
};

const filesToBase64Array = (files) => {
    if (!files || !Array.isArray(files)) return '[]';
    const urls = files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
    return JSON.stringify(urls);
};

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    const userRole = role || 'user';
    const status = userRole === 'vendor' ? 'pending' : 'approved';

    try {
        const result = await db.query(
            `INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [name, email, password, userRole, status]
        );
        res.status(201).json({ id: result.rows[0].id, name, email, role: userRole, status });
    } catch (err) {
        if (err.message.includes('unique') || err.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query(
            `SELECT id, name, email, role, status FROM users WHERE email = $1 AND password = $2`,
            [email, password]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// --- USER PROFILE & LICENSE ROUTES ---

app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, name, email, role, phone, city, license_front, license_back, status FROM users WHERE id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/users/:id', upload.fields([{ name: 'license_front', maxCount: 1 }, { name: 'license_back', maxCount: 1 }]), async (req, res) => {
    const { name, phone, city } = req.body;
    const userId = req.params.id;
    
    let updateQuery = `UPDATE users SET name = $1, phone = $2, city = $3`;
    let params = [name, phone, city];
    let paramIndex = 4;

    if (req.files && req.files['license_front']) {
        updateQuery += `, license_front = $${paramIndex++}`;
        params.push(fileToBase64(req.files['license_front'][0]));
    }
    if (req.files && req.files['license_back']) {
        updateQuery += `, license_back = $${paramIndex++}`;
        params.push(fileToBase64(req.files['license_back'][0]));
    }

    updateQuery += ` WHERE id = $${paramIndex}`;
    params.push(userId);

    try {
        await db.query(updateQuery, params);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- VEHICLE ROUTES ---

// Get all approved vehicles (for home/vehicles page)
app.get('/api/vehicles', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT v.*, u.name as vendor_name FROM vehicles v JOIN users u ON v.vendor_id = u.id WHERE v.status = 'approved'`
        );
        res.json(result.rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get vendor's vehicles
app.get('/api/vendor/:id/vehicles', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM vehicles WHERE vendor_id = $1`,
            [req.params.id]
        );
        res.json(result.rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })));
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Add a new vehicle (vendor only)
app.post('/api/vehicles', upload.fields([{ name: 'insurance_doc', maxCount: 1 }, { name: 'images', maxCount: 5 }]), async (req, res) => {
    const { vendor_id, name, type, price, seats, description } = req.body;
    
    const insuranceDocBase64 = req.files && req.files['insurance_doc'] ? fileToBase64(req.files['insurance_doc'][0]) : null;
    const imagesBase64Array = req.files && req.files['images'] ? filesToBase64Array(req.files['images']) : '[]';

    try {
        const result = await db.query(
            `INSERT INTO vehicles (vendor_id, name, type, price, seats, insurance_doc, images, description, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING id`,
            [vendor_id, name, type, price, seats, insuranceDocBase64, imagesBase64Array, description]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BOOKING ROUTES ---

app.post('/api/bookings', async (req, res) => {
    const { user_id, vehicle_id, start_date, end_date, pickup_loc, return_loc, total_price } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, pickup_loc, return_loc, total_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [user_id, vehicle_id, start_date, end_date, pickup_loc, return_loc, total_price]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/users/:id/bookings', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, v.name as vehicle_name, v.images, v.type
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
        `, [req.params.id]);
        res.json(result.rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })));
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/vendor/:id/orders', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, v.name as vehicle_name, u.name as user_name, u.phone as user_phone
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            JOIN users u ON b.user_id = u.id
            WHERE v.vendor_id = $1
            ORDER BY b.created_at DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/bookings/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.query(`UPDATE bookings SET status = $1 WHERE id = $2`, [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/stats', async (req, res) => {
    try {
        const usersCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
        const vendorsCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'vendor'");
        const vehiclesCount = await db.query("SELECT COUNT(*) as count FROM vehicles");
        const bookingsCount = await db.query("SELECT COUNT(*) as count FROM bookings");
        res.json({
            users: parseInt(usersCount.rows[0].count),
            vendors: parseInt(vendorsCount.rows[0].count),
            vehicles: parseInt(vehiclesCount.rows[0].count),
            bookings: parseInt(bookingsCount.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, name, email, role, phone, city, license_front, license_back, status, created_at FROM users WHERE role != 'admin'`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/admin/users/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.query(`UPDATE users SET status = $1 WHERE id = $2`, [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/admin/vehicles', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT v.*, u.name as vendor_name, u.email as vendor_email
            FROM vehicles v JOIN users u ON v.vendor_id = u.id
        `);
        res.json(result.rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })));
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/admin/vehicles/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.query(`UPDATE vehicles SET status = $1 WHERE id = $2`, [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/admin/bookings', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, v.name as vehicle_name, u.name as user_name, u.license_front, u.license_back
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/admin/messages', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM messages ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/contact', async (req, res) => {
    const { user_id, name, email, subject, message } = req.body;
    try {
        await db.query(`INSERT INTO messages (user_id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5)`,
            [user_id || null, name, email, subject, message]);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
