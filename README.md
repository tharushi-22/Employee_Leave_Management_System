# 🏢 Employee Leave Management System

A web application for managing employee leave requests with an admin approval system. This system allows employees to apply for leave and administrators to review, approve, or reject leave requests securely.

---

## 🚀 Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/employee-leave-management.git
cd employee-leave-management
```

---

### 2️⃣ Backend Setup

```bash
cd server
npm install
```

Create a **.env** file inside the `server/` folder and add the following:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

---

### 3️⃣ Create Admin Account

Run the database seeder to create default users:

```bash
npm run seed
```

This will create the following accounts:

* **Admin**
  Email: `admin@gmail.com`
  Password: `admin123`

* **Employee 1**
  Email: `employee@gmail.com`
  Password: `employee123`

* **Employee 2**
  Email: `john@gmail.com`
  Password: `john123`

---

### 4️⃣ Start Backend Server

```bash
npm start
```

---

### 5️⃣ Frontend Setup

```bash
cd ../client
npm install
npm start
```

---

## 🌐 Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

Login using the credentials below:

* **Admin Login**
  Email: `admin@gmail.com`
  Password: `admin123`

* **Employee Login 1**
  Email: `employee@gmail.com`
  Password: `employee123`

* **Employee Login 2**
  Email: `john@gmail.com`
  Password: `john123`

---

## ✨ Features

* Employee leave application with date validation
* Admin dashboard to approve or reject leave requests
* JWT authentication with role-based access control
* Password hashing with bcrypt for security
* Secure MongoDB database for data storage

---

## 🛠️ Technologies Used

* MongoDB
* Express.js
* React.js
* Node.js
* JSON Web Tokens (JWT)
* bcrypt
* Bootstrap 5

---

