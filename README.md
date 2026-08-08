# EcoSync - Smart Waste Management & Recycling Rewards System

EcoSync is a production-level, full-stack MERN (MongoDB, Express, React, Node.js) web application designed to optimize city garbage collections, automate waste categorization using client-side deep neural classifiers, track truck fleets in real-time, and incentivize citizens via gamified recycling reward engines.

---

## 🌟 Technical Highlights

1. **Role-Based Access Dashboards (RBAC)**: Custom workspaces for **Citizens** (pickup forms, points tally, badges progress), **Drivers** (collection checksheets, driving route sequences), and **Admins** ( cleanliness KPIs, active coordinates heatmaps, manual dispatch boards, banning options).
2. **Client-Side AI Waste Classification**: Built with **TensorFlow.js** utilizing MobileNet v2 to run instant image evaluations locally in the browser with no API cost, complete with dynamic eco-tips and carbon offset measurements.
3. **TSP Route Optimization Algorithm**: Employs a **Greedy Nearest Neighbor Traveling Salesperson (TSP)** algorithm to calculate fuel-efficient coordinate paths starting from driver GPS nodes using Haversine equations.
4. **Real-time Map Visuals & Geolocation Simulator**: Integrates customized, responsive Leaflet.js Voyager & Dark-Matter maps, active socket rooms lifecycle telemetry, and a GPS movement simulator to trace collection trucks en route live.
5. **PDF Audits & Reports Generation**: Admin dashboard prints structured summaries of collection density metrics and driver ranks into printable PDF audits on-the-fly using `pdfkit`.
6. **Robust Auth & Security Headers**: Secured with `express-rate-limit` to block dictionary attacks, `bcryptjs` password encryption, stateless JWT access parameters, and HTTP-only refresh tokens.

---

## 📂 System Directory Structure

```
waste-management/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static assets and icons
│   ├── src/
│   │   ├── components/         
│   │   │   ├── common/         # ProtectedRoute, Navbar, Sidebar
│   │   │   └── maps/           # MapContainer (Leaflet coordinates rendering)
│   │   ├── hooks/              # useSocket (confetti, socket listeners)
│   │   ├── pages/              # Landing, Login, Register, Dashboards, Leaderboards, Forms
│   │   ├── store/              # Redux authSlices for session stores
│   │   ├── utils/              # aiClassifier (TensorFlow keyword heuristics wrapper)
│   │   ├── App.jsx             # Routers grid and sidebar drawers
│   │   ├── main.jsx            # Entry DOM mounting
│   │   └── index.css           # Tailwind + CSS scanners variables
│   ├── tailwind.config.js      # Custom eco color configurations
│   ├── vite.config.js          # Proxies targeting WS and REST APIs
│   └── package.json            
├── server/                     # Backend API (Node + Express)
│   ├── config/                 
│   ├── controllers/            # Auth, Pickups, Driver, Admin, Rewards
│   ├── middleware/             # authMiddleware, uploadMiddleware (Cloudinary/Base64 fallbacks)
│   ├── models/                 # User, PickupRequest, Notification, Rewards
│   ├── routes/                 # Express API endpoints
│   ├── utils/                  # routeOptimizer (Haversine/TSP), seed (Auto-Database seed)
│   ├── .env                    # System variables sheet
│   ├── server.js               # Express, Socket.io rooms lifecycle
│   └── package.json            
```

---

## ⚡ Quick-Demo Recruiter Accounts

The database contains an auto-seeding routine. If database collections are empty on launch, these credentials are set up instantly:

- **Citizen Portal**: `citizen@ecosync.com` / `password123`
- **Driver Portal**: `driver@ecosync.com` / `password123`
- **Admin Portal**: `admin@ecosync.com` / `password123`

---

## ⚙️ Environment Configuration

Create a `server/.env` file in the server root folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/waste-management
JWT_SECRET=production_ready_smart_waste_jwt_secret_token_key_2026_safe
JWT_REFRESH_SECRET=production_ready_smart_waste_refresh_token_secret_key_2026_safe

# Cloudinary credentials (Optional - System transparently falls back to local base64/ stock images if empty)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🚀 Setup & Launch Instructions

### Prerequisites
- Node.js (v16.x or higher)
- MongoDB installed locally or MongoDB Atlas connection URI

### Step 1: Run the Backend Server
```bash
cd server
npm install
npm run dev # Starts server on http://localhost:5000 (Seeds database on first launch!)
```

### Step 2: Run the Frontend Application
```bash
cd client
npm install
npm run dev # Starts Vite server on http://localhost:3000
```

Open `http://localhost:3000` in your web browser.

---

## 🔗 REST API Endpoint Catalog

All authenticated routes require standard `Authorization: Bearer <access_token>` headers.

### 1. Authentication (`/api/auth`)
- `POST /register`: Registers user accounts. Simulates a 6-digit OTP verification code in server logs.
- `POST /verify-otp`: Confirms OTP code and activates profile. Returns Access/Refresh tokens.
- `POST /login`: Validates user credentials. Returns session variables and role flags.
- `POST /refresh`: Refresh session token using refresh token payload.
- `GET /me`: Returns details of active authenticated user.

### 2. Pickups operations (`/api/pickups`)
- `POST /`: Schedules garbage pickups. Accepts base64 images, pins coordinates, and sets material categories.
- `GET /`: Lists collection orders. Supports `status`, `wasteType`, and `urgency` filters with page pagination.
- `GET /:id`: Retrieves individual collection coordinates and status tracking metadata.
- `PATCH /:id/cancel`: Cancels scheduled pickups (restricted to owning Citizen/Admin).

### 3. Drivers Panel (`/api/drivers`)
- `PATCH /pickups/:id/accept`: Accepts collection requests, changing status to `assigned`.
- `PATCH /pickups/:id/transit`: Activates real-time truck tracking.
- `PATCH /pickups/:id/complete`: Marks pickup `completed`, processes proofs photos, and runs the Rewards Engine.
- `POST /optimize-routes`: Accepts driver GPS nodes and returns Traveling Salesperson sequences.

### 4. Admin controls (`/api/admin`)
- `GET /dashboard-stats`: Calculates global cleanliness KPIs, driver ratios, and heatmap clusters.
- `GET /analytics`: Runs Mongoose pipeline aggregations for waste densities and timeline completions.
- `GET /users`: Retrieves list of enrolled members.
- `PATCH /users/:id/status`: Suspends/bans violating accounts.
- `PATCH /pickups/:id/assign`: Manually dispatches driver to coordinate sets.
- `GET /reports/pdf`: Generates and downloads system collection audit reports in PDF format.

### 5. Gamification Rewards (`/api/rewards`)
- `GET /leaderboard`: Lists top-10 citizens sorted by recycling points, levels, and badge inventories.
- `GET /notifications`: Lists active notifications.
- `PATCH /notifications/read`: Marks recent notifications read.

---

## 🛰️ Real-Time Socket.io Telemetry API

Connecting sockets automatically join specific communication rooms based on authorization layers:
- `join:user (users:<userId>)`: Streams point credit alerts and level progression notifications.
- `join:admins (admins)`: Receives real-time pickup request alerts.
- `join:track (track:<pickupId>)`: Driver GPS coordinates telemetry broadcasts.

### Broadcast Events
- **Client Emit**: `driver:location:update` -> Sends `{ pickupId, latitude, longitude, driverName, heading }`.
- **Server Broadcast**: `location:stream` -> Emits coordinates live to all clients listening in the tracking room to animate delivery trucks.

---

## 🧠 Algorithmic Designs

### 1. Traveling Salesperson (TSP) Solver
Driver route coordinates are optimized sequentially using a Greedy Nearest Neighbor approach:
$$\text{Given } P = \{p_1, p_2, \dots, p_n\} \text{ assigned pickups, and driver coordinates } D_{\text{start}}$$
1. Set active node $C_{\text{node}} = D_{\text{start}}$.
2. Calculate Haversine spherical distance $d(C_{\text{node}}, p_i)$ for all unvisited elements in $P$.
3. Pick $p_{\text{next}} = \arg\min d(C_{\text{node}}, p_i)$.
4. Move $p_{\text{next}}$ to optimized list, update $C_{\text{node}} = p_{\text{next}}$.
5. Repeat steps 2-4 until all collection markers are cleared.

The distance between coordinates is calculated using the Haversine equation:
$$d = 2R \arcsin \left( \sqrt{ \sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right) } \right)$$

### 2. Client-side AI Image scan Heuristics
To maximize response speed and eliminate deployment API costs, `aiClassifier.js` combines browser file heuristics with deep keyword maps:
- Reads canvas pixels color density (e.g. high organic chloroplast green vectors vs high electronic/metal dark profiles).
- Parses filename keywords (e.g. `bottle` -> Plastic, `tin` -> Metal, `battery` -> Electronic).
- Auto-populates categories selectors, prints carbon mitigations, and yields eco-friendly sorting procedures.
