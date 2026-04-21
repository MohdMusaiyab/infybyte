# 🏛️ InfyBite (Ex-InfyByte)

> **Disclaimer:** Yes, the repo name says `infybyte`. No, I'm not changing it. Consider the 'y' a vintage design choice from the first 5 minutes of the project's life. It's not a typo; it's *heritage*.

**Infybite** is a high-performance, enterprise-grade catering management ecosystem. Built for the grand scale of VVIP Indian hospitality.

---

## 🏗️ The Tech Stack

This project is built with a "No Compromise" philosophy on speed and security:

* **Frontend:** React.js + Tailwind CSS
* **State Management:** Redux Toolkit (RTK) for predictable data flow.
* **Backend:** Go (Golang) using the **Gin Gonic** framework for lightning-fast API responses.
* **Real-time:** WebSockets integration for live status and price updates.
* **Database:** MongoDB with **GORM** (Go ORM) for flexible yet structured data handling.
* **Auth:** Secure Cookie-based sessions with Role-Based Access Control (RBAC).

---

## 🔐 Advanced Role-Based Access (RBAC)

The system is strictly partitioned into four distinct authority levels to ensure operational integrity:

| Role | Responsibility |
| :--- | :--- |
| **Admin** | Full system oversight, and and master data control. |
| **Manager** | For Managing Food Courts Assigned to them by their Vendors |
| **Vendor** | Creaetd by Admins, can create Managers to manage the track and status updates of items |
| **User/Client** | Menu selection and real-time menu tracking |

---

## ✨ Key Features

* **Secure Backend:** Engineered with Go-Gin, featuring middleware-protected routes and robust error handling.
* **Live Event Pulse:** WebSocket integration allows managers and kitchens to stay synced during high-pressure 5,000+ guest events.
* **Persistence:** Redux-persist combined with secure HTTP-only cookies ensures user sessions remain stable and safe from XSS.
---

## 🚀 Getting Started

### Prerequisites
* Go (1.21+)
* Node.js (18+)
* MongoDB Instance

### Installation

1. **Clone the repo (with the 'wrong' name):**
   ```bash
   git clone https://github.com/MohdMusaiyab/infybyte/
   cd infybyte

2. **Copy the .env values from .env.sample and set your own ones in both client and server folder**

3. **Backend Setup**
   ```
   cd server
   go mod tidy
   air

4. **Frontend Setup**
   ```
   cd client
   npm install
   npm run dev

---

## 🛠️ Maintenance & Keep-Alive

If you are hosting the backend on a free-tier service (like Render) that goes to sleep after inactivity, you can use the included keep-alive script.

### Running the Keep-Alive Script
1. Ensure `SERVER_URL` is set in `server/.env` to your production backend URL.
2. Run the script from the `server` directory:
   ```bash
   cd server
   go run scripts/keep_alive.go
   ```
The script will ping the `/health` endpoint every 10 minutes to keep the instance and database connection active.
