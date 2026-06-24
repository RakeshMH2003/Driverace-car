# DriveEase — Premium Car Rental Platform

DriveEase is a modern, responsive, full-stack car rental web application designed with a sleek, premium dark-luxury aesthetic. It offers dedicated portals for Customers, Vendors, and Administrators, enabling a complete end-to-end car rental workflow.

---

## 🌟 Key Features

### 👤 Customer Portal
- **Vehicle Catalog**: Browse, search, sort, and filter available cars by category (Sedan, SUV, Luxury, Hatchback) and price.
- **Booking Engine**: Easy booking form with location select (pickup/return) and automated total cost calculation.
- **User Dashboard**: Manage profile details, upload driver's license (front/back), and review booking history.
- **Booking Cancellation**: Instantly cancel active bookings directly from the dashboard.
- **Support Inbox**: Direct messaging channel to contact administrators for support/issues.

### 🏢 Vendor Portal
- **Vehicle Management**: Register vehicles with daily rates, seats, images (up to 5), and mandatory insurance documents.
- **Order Notifications**: Track active orders/bookings of vehicles listed by the vendor.

### 🛡️ Admin Portal
- **Statistics Overview**: High-level metrics showing total users, active vehicles, bookings, and revenue.
- **User Verification**: View and approve/reject vendor sign-ups and inspect customer driver's licenses.
- **Vehicle Approvals**: Review and approve/reject vendor-submitted cars (with direct links to view uploaded insurance PDF/images).
- **Booking Cancellation Controls**: Terminate active bookings if conflict issues arise.
- **Message Center**: View, read, and manage all support queries submitted by users.

---

## 🛠️ Tech Stack

- **Backend**: Node.js & Express.js
- **Database**: SQLite3 (Local file-based database for simplicity and easy hosting compatibility)
- **Frontend**: HTML5, Vanilla CSS (Premium luxury style, glassmorphism, smooth animations), Bootstrap 5 (for grid layouts & modal interactions)
- **File Uploads**: Multer (stores vehicle images, insurance files, and driver's licenses)

---

## 🚀 Local Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RakeshMH2003/Driverace-car.git
   cd Driverace-car
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`.

---

## ☁️ Deployment

### Render.com (Recommended for Free Full-Stack Hosting)
This project is pre-configured to run flawlessly on Render's Web Service.

1. Create a free account at **[Render.com](https://render.com)**.
2. Click **"New +"** → **"Web Service"** and connect your GitHub repo.
3. Use the following settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
4. Click **Create Web Service**.

*Note: The project includes a configuration that automatically builds SQLite from source on Render's servers to avoid version mismatches.*
