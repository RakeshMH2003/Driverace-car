# 🚗 DriveEase — Premium Car Rental Platform

> A modern, full-featured **Full-Stack Car Rental Web Application** with User, Vendor, and Admin modules.

Website : https://driverace-car.onrender.com
---

## 🌟 Live Features

✨ Beautiful Dark Luxury UI  
🚘 Browse & Book Vehicles  
👤 User Authentication (Login / Signup)  
🏪 Vendor Dashboard (Add Vehicles & Upload Insurance)  
🛡️ Driver's License & Insurance Verification  
💬 User-to-Admin Direct Messaging  
📊 Admin Control Panel with Booking Cancellation  
⚡ Interactive Booking System  
📱 Fully Responsive Design  

---

## 🧩 Project Modules

### 👤 User Module

* Sign up / Login
* Browse vehicles
* Filter & search cars
* Book vehicles instantly
* Upload driving license (front/back)
* View booking history & status
* Cancel active bookings
* Direct messaging to admin for support

---

### 🏪 Vendor Module

* Vendor registration & login
* Add new vehicles with daily rates and seats
* Upload:
  * Vehicle images (up to 5)
  * Mandatory insurance documents (PDF or image)
* Track active orders and bookings for listed vehicles

---

### 🛠️ Admin Module

* Manage users and roles
* Approve/reject vendors
* Approve/reject vehicles (with links to view insurance documents)
* Monitor all bookings and cancel active bookings if issues arise
* Support Inbox to read and manage messages sent by users
* Real-time metrics (Total users, active vehicles, bookings, revenue)

---

## 🖥️ Tech Stack

| Technology                    | Usage                      |
| ----------------------------- | -------------------------- |
| HTML5                         | Structure                  |
| CSS3                          | Styling (Dark Luxury UI)   |
| JavaScript (Vanilla + Client) | Frontend Logic & API calls |
| Bootstrap 5                   | Layout & Interactive Modals|
| Node.js & Express             | Backend API Server         |
| SQLite3                       | Relational Database        |
| Multer                        | File & Document Uploads    |

---

## 📂 Project Structure

```
DriveEase/
│
├── public/           # Frontend Static Assets
│   ├── index.html    # Main UI file
│   ├── style.css     # Styling (Dark theme)
│   └── app.js        # Frontend Logic & API client
│
├── docs/             # GitHub Pages Deployment folder
│
├── database.js       # SQLite Database connection & schemas
├── server.js         # Node/Express Backend Server & routes
├── package.json      # Dependencies and script runner
└── README.md         # Project documentation
```

---

## 🚀 How to Run Locally

1. Clone the project:
   ```bash
   git clone https://github.com/RakeshMH2003/Driverace-car.git
   cd Driverace-car
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the backend server:
   ```bash
   npm start
   ```
4. Open in browser:
   Navigate to **`http://localhost:3000`**

---

## 🔐 Demo Credentials

### 👤 User

```
Create your own account or use:
Email: car@gmail.com
Password: (use your registered password)
```

### 🏪 Vendor

```
Email: speed@rent.com
Password: 123456
```



---

## 📸 Key Features (UI Highlights)

* Animated Hero Section
* Trending Vehicles Carousel
* Dynamic Filtering (Type, Price, Sort)
* Interactive Modal Booking System
* Responsive User, Vendor, and Admin Dashboards
* Toast Notifications

---

## 🧠 Smart Fixes & Upgrades Included

✔ Full-stack backend migration with SQLite DB  
✔ Fixed document upload issues using Multer  
✔ Handled GLIBC node binary issues on Render deployment  
✔ Admin portal fully linked to verify customer licenses  
✔ Direct user-to-admin message dashboard  
✔ Added booking cancellation engine for both users and admin  

---

## 🤝 Contribution

Feel free to fork and improve:

```bash
git clone https://github.com/RakeshMH2003/Driverace-car.git
```

---

## 📧 Contact

📩 [rakesh@gmail.com](mailto:rakesh@gmail.com)  
📍 Bengaluru, India

---

## ⭐ Support

If you like this project:

👉 Star ⭐ the repository  
👉 Share with friends  

---

## 🏁 Conclusion

DriveEase is a **complete full-stack car rental system** designed with a modern dark luxury UI and real-world workflows:

✔ Real database persistence  
✔ Document validation workflow  
✔ Comprehensive Admin controls  
