<p align="center">
  <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80" alt="DriveEase Logo" width="600" style="border-radius: 15px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);" />
</p>

<h1 align="center">🚗 DriveEase — Premium Car Rental Platform</h1>

<p align="center">
  A state-of-the-art, full-featured <strong>Full-Stack Car Rental Web Application</strong> featuring a luxurious dark UI and distinct portals for Customers, Vendors, and Administrators.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node.js-v20.x-green?style=for-the-badge&logo=node.js" alt="Node Version" />
  <img src="https://img.shields.io/badge/express.js-v5.x-blue?style=for-the-badge&logo=express" alt="Express Version" />
  <img src="https://img.shields.io/badge/postgresql-Neon.tech-blue?style=for-the-badge&logo=postgresql" alt="Postgres Database" />
  <img src="https://img.shields.io/badge/hosted-on_render-violet?style=for-the-badge&logo=render" alt="Hosted on Render" />
  <img src="https://img.shields.io/badge/license-ISC-orange?style=for-the-badge" alt="License" />
</p>

## Website :- https://driverace-car.onrender.com
---

## 🌟 Platform Features

### 👤 Customer Module
- **Luxury Catalog**: Filter, search, and sort high-end vehicles by type and daily rate.
- **Instant Booking**: Simple booking interface with custom pickup/return locations and real-time total price calculations.
- **Interactive Dashboard**: Track booking status, download/view uploaded drivers licenses, and cancel bookings.
- **Support Inbox**: Direct support request channel to administrators.

### 🏪 Vendor Module
- **Fleet Onboarding**: List new vehicles with rates, seats, images, and mandatory insurance files.
- **Order Notifications**: Track active car bookings in real-time.
- **Persistence Support**: Upload documents seamlessly (stored directly as secure Base64 strings in PostgreSQL).

### 🛠️ Admin Module
- **Verification Panel**: Approve/reject user accounts and verify uploaded drivers licenses.
- **Vehicle Quality Gate**: View and review vendor-submitted cars and inspect uploaded insurance files.
- **Centralized Support**: Read, manage, and respond to support messages in the messages center.
- **Analytics Dashboard**: Real-time stats (Total Users, Active Vehicles, Bookings, Revenue).

---

## 🖥️ Tech Stack

| Component | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3, JS | Ultra-premium Dark Glassmorphic Theme |
| **Framework** | Bootstrap 5 | Responsive structure and interactive modals |
| **Server** | Node.js, Express.js | REST APIs, routing, and user management |
| **Database** | PostgreSQL (Neon.tech) | Permanent storage of bookings, vehicles, and users |
| **Uploads** | Multer | Memory-buffered secure file-to-Base64 encoder |

---

## 📂 Project Structure

```
DriveEase/
│
├── public/           # Frontend Static Files (UI, scripts, styles)
│   ├── index.html    # Main page layout
│   ├── style.css     # Luxury dark design system
│   └── app.js        # Dynamic UI render engine & API client
│
├── docs/             # GitHub Pages Deployment folder
│
├── database.js       # PostgreSQL Pool connection & tables schema
├── server.js         # Express Server & route handlers
├── package.json      # Dependencies and execution scripts
└── README.md         # Interactive documentation
```

---

## 🚀 How to Run Locally

### 1. Prerequisites
Ensure you have **Node.js (v20.x or later)** and a local or remote PostgreSQL instance.

### 2. Installation
```bash
git clone https://github.com/RakeshMH2003/Driverace-car.git
cd Driverace-car
npm install
```

### 3. Database Configurations
Create a `.env` file in the root directory and add your connection string:
```env
DATABASE_URL=postgres://your_user:your_password@localhost:5432/driveease
```

### 4. Run Server
```bash
npm start
```
Open **`http://localhost:3000`** in your browser.

---

## ☁️ Permanent Deployment to Render.com

This project is optimized to run on **Render** (Node Web Service) connected to **Neon PostgreSQL** (Free Remote Database).

### Step 1: Create your Neon Postgres DB
1. Go to **[Neon.tech](https://neon.tech)** and create a new project.
2. Copy the **Connection String** from your Neon dashboard.

### Step 2: Set up Render Web Service
1. Connect this repo to **[Render.com](https://render.com)**.
2. In **Environment**, add:
   - **Key**: `DATABASE_URL`
   - **Value**: *Paste the Neon Connection String you copied in Step 1*
3. Set the **Build Command** to: `npm install`
4. Set the **Start Command** to: `node server.js`
5. Click **Deploy**. Your app is now online with permanent storage!

---

## 🔐 Demo Credentials

### 👤 User
```
Create a new user account directly via the UI, or log in with:
Email: car@gmail.com
Password: (your password)
```

### 🏪 Vendor
```
Email: speed@rent.com
Password: 123456
```

### 🛠️ Admin
```
Email: rakesh@gmail.com
Password: rakesh@123
```

---

## 🏁 Conclusion

DriveEase is a **production-ready** portfolio project demonstrating premium frontend styling and a robust server-side architecture. By utilizing PostgreSQL, data is 100% persistent and will not be deleted when the server goes to sleep.

👉 **Star ⭐ the repository if you love this design!**
