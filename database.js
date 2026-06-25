const { Pool } = require('pg');

// Initialize PostgreSQL Pool
// Connect using DATABASE_URL environment variable (set by Render/Neon)
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/driveease';

const pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
});

// Setup Tables
const setupTables = async () => {
    try {
        // Users Table (covers Admin, Vendors, and Customers)
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'vendor', 'user'
            phone TEXT,
            city TEXT,
            license_front TEXT, -- stores Base64 file string
            license_back TEXT,  -- stores Base64 file string
            status TEXT DEFAULT 'approved', -- vendors can be 'pending'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Vehicles Table
        await pool.query(`CREATE TABLE IF NOT EXISTS vehicles (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            price REAL NOT NULL,
            seats INTEGER NOT NULL,
            insurance_doc TEXT, -- stores Base64 file string
            images TEXT, -- JSON array of Base64 strings or image paths
            description TEXT,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Bookings Table
        await pool.query(`CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            vehicle_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            pickup_loc TEXT NOT NULL,
            return_loc TEXT NOT NULL,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        )`);

        // Messages Table (Contact Us)
        await pool.query(`CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insert default admin user if it doesn't exist
        const adminEmail = 'rakesh@gmail.com';
        const adminCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [adminEmail]);
        if (adminCheck.rows.length === 0) {
            await pool.query(`INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
                ['Rakesh Admin', adminEmail, 'rakesh@123', 'admin']);
            console.log('Inserted default Admin account.');
        }

        // Insert demo vendor if it doesn't exist
        const vendorEmail = 'speed@rent.com';
        const vendorCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [vendorEmail]);
        if (vendorCheck.rows.length === 0) {
            await pool.query(`INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
                ['Speed Rentals', vendorEmail, '123456', 'vendor']);
            console.log('Inserted default Vendor account.');
        }

    } catch (err) {
        console.error('Error setting up tables:', err.message);
    }
};

setupTables();

module.exports = pool;
