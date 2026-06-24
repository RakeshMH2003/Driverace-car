const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database (local file)
// Note for Vercel Deployment: Vercel is serverless, meaning this local file will reset on every function invocation.
// Before deploying to Vercel, you should migrate this to Vercel Postgres (@vercel/postgres) or another remote SQL DB.
const dbPath = path.resolve(__dirname, 'driveease.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Setup Tables
        db.serialize(() => {
            // Users Table (covers Admin, Vendors, and Customers)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'vendor', 'user'
                phone TEXT,
                city TEXT,
                license_front TEXT,
                license_back TEXT,
                status TEXT DEFAULT 'approved', -- vendors can be 'pending'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Vehicles Table
            db.run(`CREATE TABLE IF NOT EXISTS vehicles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vendor_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                price REAL NOT NULL,
                seats INTEGER NOT NULL,
                insurance_doc TEXT, -- path to uploaded insurance document
                images TEXT, -- JSON array of image paths
                description TEXT,
                status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES users(id)
            )`);

            // Bookings Table
            db.run(`CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                vehicle_id INTEGER NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                pickup_loc TEXT NOT NULL,
                return_loc TEXT NOT NULL,
                total_price REAL NOT NULL,
                status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
            )`);

            // Messages Table (Contact Us)
            db.run(`CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Insert default admin user if it doesn't exist
            const adminEmail = 'rakesh@gmail.com';
            db.get(`SELECT id FROM users WHERE email = ?`, [adminEmail], (err, row) => {
                if (!row) {
                    // For demo, storing plain text. In production, use bcrypt.
                    db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
                        ['Rakesh Admin', adminEmail, 'rakesh@123', 'admin']);
                }
            });

            // Insert demo vendor if it doesn't exist
            const vendorEmail = 'speed@rent.com';
            db.get(`SELECT id FROM users WHERE email = ?`, [vendorEmail], (err, row) => {
                if (!row) {
                    db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
                        ['Speed Rentals', vendorEmail, '123456', 'vendor']);
                }
            });
        });
    }
});

module.exports = db;
