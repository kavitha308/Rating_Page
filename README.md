# Store Rating Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B%20%7C%20v22%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1.svg)](https://www.mysql.com/)
[![Tests](https://img.shields.io/badge/Automated%20Tests-174%20Passing-brightgreen.svg)]()

A modern, full-stack enterprise web application designed to connect consumers with local retail stores, facilitate verified customer rating feedback, empower merchant store owners with real-time reputation analytics, and provide administrators with comprehensive platform governance and user oversight.

Built from the ground up to satisfy all rigorous requirements of a **Senior/Full-Stack Intern Coding Assessment**, featuring strict input validation, robust Role-Based Access Control (RBAC), layered architecture, parameter-safe database queries, and a modern, responsive UI.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [User Roles](#3-user-roles)
4. [Technology Stack](#4-technology-stack)
5. [Architecture](#5-architecture)
6. [Database Schema Explanation](#6-database-schema-explanation)
7. [Folder Structure](#7-folder-structure)
8. [API Documentation](#8-api-documentation)
9. [Authentication Flow](#9-authentication-flow)
10. [Authorization Flow](#10-authorization-flow)
11. [Environment Variables](#11-environment-variables)
12. [Local Installation](#12-local-installation)
13. [Database Setup](#13-database-setup)
14. [Running Frontend](#14-running-frontend)
15. [Running Backend](#15-running-backend)
16. [Demo Credentials](#16-demo-credentials)
17. [Screenshots Section](#17-screenshots-section)
18. [Validation Rules](#18-validation-rules)
19. [Security Considerations](#19-security-considerations)
20. [Future Improvements](#20-future-improvements)

---

## 1. Project Overview

The **Store Rating Platform** is a multi-tier SaaS platform engineered to solve transparency and trust challenges in customer-to-merchant interactions:
- **Consumers** discover registered retail stores, search by store name or physical address, submit star ratings (1 to 5), and dynamically update their feedback.
- **Store Owners** access an exclusive operational dashboard displaying live reputation scores, total review volume, star distribution metrics, and a paginated feed of verified raters.
- **System Administrators** command a dedicated enterprise management console that monitors platform health, aggregate totals, user accounts, store registries, and assigned store ownership relationships.

---

## 2. Features

### Consumer Features (`USER`)
- **Store Directory**: Browse paginated catalog of all registered platform stores.
- **Debounced Instant Search**: Search stores by Name or Address with client-side 300ms debounce to minimize unnecessary backend requests.
- **Multi-Field Sorting**: Sort stores dynamically by Store Name (A-Z, Z-A) or Overall Average Rating (Highest, Lowest).
- **Interactive Star Rating**: Hover-interactive 5-star modal component supporting scores from 1 to 5.
- **Idempotent Rating Lifecycle**: Clear visual distinction between unrated stores (`"Rate Store"`) and rated stores (`"Modify Rating"` with `"My Rating: X/5"` badge). Duplicate submissions are strictly prevented.
- **Full-Page Profile View**: Comprehensive personal account view displaying identity, email, member since timestamp, and formatted physical address.
- **Self-Service Password Rotation**: Securely rotate account password requiring current password verification.

### Store Owner Features (`STORE_OWNER`)
- **Merchant Reputation Dashboard**: Real-time aggregated metrics displaying overall average rating score and total rating volume.
- **Rating Distribution Breakdown**: Visual breakdown of ratings across 1, 2, 3, 4, and 5-star reviews.
- **Customer Ratings Table**: Scoped audit table showing all verified consumers who rated the merchant's store, displaying customer name, email, rating score, and submission timestamp.
- **Horizontal Access Boundary**: Strict isolation preventing store owners from viewing or tampering with ratings belonging to other merchants.
- **Non-Modifiable Reviews**: Store owners have read-only visibility into consumer feedback to preserve rating integrity.

### Administrator Features (`ADMIN`)
- **Executive Metric Cards**: High-level platform statistics displaying Total Registered Users (with role breakdown), Total Registered Stores (with assignment counts), and Total Submitted Ratings.
- **User Directory Management**: Complete searchable, filterable (by Role), sortable (Name, Email, Address, Role), and paginated user registry.
- **Detailed User Profile View**: Deep inspection view into any user account. For Store Owners, automatically displays their assigned store and current store rating.
- **Admin User Provisioning**: Modal interface for creating new platform accounts across all roles with complete server-side input validation.
- **Store Directory Management**: Searchable and sortable registry of all merchant stores.
- **Store Creation & Owner Assignment**: Interface to register new stores with strict 1-to-1 owner assignment validation (prevents assigning an owner already attached to another store).

---

## 3. User Roles

The platform enforces three distinct, immutable roles defined in `ROLES` enum (`ADMIN`, `STORE_OWNER`, `USER`):

| Role | Access Scope | Allowed Capabilities |
| :--- | :--- | :--- |
| **`ADMIN`** | Platform-wide | View aggregate dashboard, manage all users, create users of any role, view user details, create stores, assign store owners, view all stores and ratings. |
| **`STORE_OWNER`** | Merchant-specific | View own store dashboard, inspect average rating and review counts, view customer reviews for own store only. Prohibited from rating stores. |
| **`USER`** | Consumer | Browse store catalog, search stores, submit ratings (1-5), modify existing ratings, view personal account profile, rotate password. |

---

## 4. Technology Stack

### Frontend Architecture
- **Framework**: React 18 (Functional Components, Hooks, Context API)
- **Tooling & Bundler**: Vite 5 (Lightning-fast HMR, ES module bundling)
- **Routing**: React Router DOM v6 (Nested layouts, ProtectedRoute, RoleRoute guards)
- **HTTP Client**: Axios (Standardized request/response interceptors, bearer token injection, automated 401 session expiration handling)
- **Styling**: Pure Vanilla CSS with a centralized Design Token System (CSS variables for dark/light surfaces, shadows, elevations, badges, and typography)
- **Iconography**: Lucide React (Tree-shaken modern SVG icons)

### Backend Architecture
- **Runtime**: Node.js (v18.x, v20.x, v22.x LTS compatible)
- **Web Framework**: Express.js 4 (Layered MVC architecture)
- **Database Driver**: `mysql2/promise` (Connection pooling, prepared statements)
- **In-Memory Testing Database**: `sqlite3` adapter (Zero-config embedded execution)
- **Security & Hardening**:
  - `bcryptjs` (Cost factor 10 password hashing)
  - `jsonwebtoken` (HS256 stateless token authentication)
  - `helmet` (HTTP security headers: CSP, X-Frame-Options, HSTS, Sniffing protection)
  - `cors` (Whitelisted client origin protection)
  - `express-rate-limit` (Window-based IP rate limiting on API and Auth endpoints)
  - `express-validator` (Schema validation and sanitization)

---

## 5. Architecture

The platform follows a clean, decoupled **Layered Client-Server Architecture**:

```
                       ┌─────────────────────────────────────────┐
                       │           React Client (SPA)            │
                       │    (Vite, Context API, React Router)    │
                       └────────────────────┬────────────────────┘
                                            │ HTTP / JSON (Axios)
                                            │ Bearer JWT Token
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │          Express REST API Gateway       │
                       │      (Helmet, CORS, Rate Limiter)       │
                       └────────────────────┬────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │ Middleware Layer                              │
                    │  ├── Request Body Sanitizer                   │
                    │  ├── authMiddleware (JWT Verification)        │
                    │  └── roleMiddleware (RBAC Authorization)      │
                    └───────────────────────┬───────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │ Controller Layer (HTTP Request/Response)      │
                    └───────────────────────┬───────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │ Service Layer (Business Logic & Transactions) │
                    └───────────────────────┬───────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │ Data Access Layer (Parameterized SQL Queries) │
                    └───────────────────────┬───────────────────────┘
                                            │
                         ┌──────────────────┴──────────────────┐
                         │                                     │
                         ▼                                     ▼
             ┌───────────────────────┐             ┌───────────────────────┐
             │   MySQL 8.0+ Engine   │  (OR)       │ SQLite In-Memory DB   │
             │ (Production/Dev Pool) │             │  (Zero-Config Testing)│
             └───────────────────────┘             └───────────────────────┘
```

---

## 6. Database Schema Explanation

The relational database model consists of three core tables enforcing referential integrity, unique constraints, and foreign key cascades:

```sql
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│              users              │       │             stores              │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id (PK, INT AUTO_INCREMENT)     │◄──┐   │ id (PK, INT AUTO_INCREMENT)     │◄──┐
│ name (VARCHAR 60)               │   │   │ name (VARCHAR 100)              │   │
│ email (VARCHAR 100, UNIQUE)     │   └───┼ owner_id (FK, INT UNIQUE, NULL) │   │
│ password_hash (VARCHAR 255)     │       │ email (VARCHAR 100)             │   │
│ address (VARCHAR 400)           │       │ address (VARCHAR 400)           │   │
│ role (ENUM: ADMIN, OWNER, USER) │       │ created_at, updated_at          │   │
│ created_at, updated_at          │       └─────────────────────────────────┘   │
└────────────────┬────────────────┘                                             │
                 │ 1                                                            │ 1
                 │                                                              │
                 │ N                                                            │ N
                 │        ┌────────────────────────────────────────┐            │
                 └───────►│                ratings                 │────────────┘
                          ├────────────────────────────────────────┤
                          │ id (PK, INT AUTO_INCREMENT)            │
                          │ user_id (FK, INT NOT NULL)             │
                          │ store_id (FK, INT NOT NULL)            │
                          │ rating (TINYINT, 1 to 5)               │
                          │ created_at, updated_at                 │
                          │ CONSTRAINT uq_user_store UNIQUE (u, s) │
                          └────────────────────────────────────────┘
```

### Table Details:
1. **`users` Table**:
   - `id`: Unique primary key.
   - `name`: Full legal name constrained to 20–60 characters.
   - `email`: Indexed, case-insensitive unique email address.
   - `password_hash`: Bcrypt hashed password (cost factor 10).
   - `address`: Physical residential or business address (max 400 chars).
   - `role`: Role enum strictly defaulting to `'USER'`.

2. **`stores` Table**:
   - `owner_id`: Foreign key referencing `users(id)` with a `UNIQUE` index. This guarantees a strict **1-to-1 mapping** where a store owner can manage at most one retail store.
   - `ON DELETE SET NULL`: If a store owner user is removed, the store remains intact for administrative re-assignment.

3. **`ratings` Table**:
   - `rating`: Constrained to integer values between 1 and 5.
   - `UNIQUE(user_id, store_id)`: **Compound Unique Key** that enforces duplicate prevention at the database engine level. A user can only submit one rating per store.
   - `ON DELETE CASCADE`: Removing a store or user automatically cleans associated rating records.

---

## 7. Folder Structure

```
Assignment/
├── .env.example                     # Root environment configuration template
├── .gitignore                       # Root Git ignore rules (secrets, dist, node_modules)
├── package.json                     # Root workspace scripts (unified install, test, run)
├── README.md                        # Complete project documentation
│
├── database/
│   ├── schema.sql                   # MySQL 8.0 DDL (table schemas, indexes, foreign keys)
│   └── seed.sql                     # Realistic demo seed data (users, stores, ratings)
│
├── server/                          # Backend Express Application
│   ├── .env.example                 # Backend environment variable template
│   ├── .gitignore                   # Backend Git ignore rules
│   ├── package.json                 # Backend dependencies and scripts
│   ├── src/
│   │   ├── server.js                # Server entry point (starts Express on PORT)
│   │   ├── app.js                   # Express app configuration, security middleware, routing
│   │   ├── config/
│   │   │   ├── env.js               # Validated environment settings
│   │   │   ├── db.js                # Dual-mode database interface (MySQL / SQLite)
│   │   │   ├── constants.js         # Platform constants and ROLES enum
│   │   │   └── sqliteAdapter.js     # Embedded in-memory SQLite fallback adapter
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register, login, me, password update
│   │   │   ├── storeController.js   # Store catalog, single store, user ratings
│   │   │   ├── ownerController.js   # Merchant dashboard and customer feedback
│   │   │   └── adminController.js   # Admin metrics, user & store management
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT bearer verification and request user injection
│   │   │   ├── roleMiddleware.js    # Role-Based Access Control authorization guard
│   │   │   ├── validator.js         # express-validator result handler
│   │   │   ├── rateLimiter.js       # Global and authentication rate limiters
│   │   │   └── errorHandler.js      # Centralized error handler and payload formatter
│   │   ├── routes/
│   │   │   ├── index.js             # Root API router aggregator (/api)
│   │   │   ├── authRoutes.js        # Authentication endpoints (/api/auth)
│   │   │   ├── storeRoutes.js       # Store catalog & rating endpoints (/api/stores)
│   │   │   ├── ownerRoutes.js       # Merchant endpoints (/api/owner)
│   │   │   └── adminRoutes.js       # Administrator endpoints (/api/admin)
│   │   ├── services/
│   │   │   ├── authService.js       # Authentication business logic & password rotation
│   │   │   ├── storeService.js      # Rating lifecycle & arithmetic average calculation
│   │   │   ├── ownerService.js      # Merchant metrics aggregation & review queries
│   │   │   └── adminService.js      # System analytics, user/store provisioning
│   │   ├── utils/
│   │   │   ├── appError.js          # Operational AppError class with HTTP status codes
│   │   │   ├── responseHandler.js   # Standardized JSON response envelope
│   │   │   └── querySanitizer.js    # SQL identifier whitelist and string sanitizer
│   │   └── scripts/
│   │       └── initDb.js            # Automated database initialization and seeding script
│   └── tests/
│       ├── run-all-tests.js         # Core integration test suite (60 tests)
│       ├── full-qa-suite.js         # End-to-end challenge checklist test suite (82 tests)
│       └── security-audit.test.js   # OWASP and security audit suite (32 tests)
│
└── client/                          # Frontend React Application (Vite SPA)
    ├── .gitignore                   # Client Git ignore rules
    ├── index.html                   # HTML5 entry template with Google Fonts
    ├── package.json                 # Client dependencies and scripts
    ├── vite.config.js               # Vite bundler configuration with API reverse proxy
    └── src/
        ├── main.jsx                 # React root mount wrapped in ErrorBoundary
        ├── App.jsx                  # Main application routes & routing architecture
        ├── index.css                # Centralized Design System tokens & utilities
        ├── components/
        │   ├── auth/
        │   │   ├── ProtectedRoute.jsx   # Authentication route guard
        │   │   └── RoleRoute.jsx        # RBAC permission route guard
        │   ├── common/
        │   │   ├── Button.jsx           # Reusable button component with loading state
        │   │   ├── DataTable.jsx        # Responsive table with sorting & pagination
        │   │   ├── ErrorBoundary.jsx    # Graceful runtime error capture fallback
        │   │   ├── FilterPanel.jsx      # Clean role filter dropdown component
        │   │   ├── FormError.jsx        # Accessible validation alert banners
        │   │   ├── Input.jsx            # Form input with character counters & validation
        │   │   ├── LoadingSpinner.jsx   # Centered & full-screen loading spinner
        │   │   ├── Modal.jsx            # Accessible modal dialog with backdrop
        │   │   ├── Navbar.jsx           # Dynamic topbar navigation with user pill
        │   │   ├── PasswordInput.jsx    # Password input with show/hide toggle
        │   │   ├── SearchBar.jsx        # Debounced search bar with clear button
        │   │   └── StarRating.jsx       # Interactive & static 5-star rating component
        │   └── layout/
        │       └── AdminLayout.jsx      # Dedicated enterprise sidebar layout for admins
        ├── context/
        │   └── AuthContext.jsx          # JWT state, login, register, logout, me restore
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.jsx            # User sign-in with role-based redirection
        │   │   ├── Register.jsx         # Consumer account registration
        │   │   └── ChangePassword.jsx   # Password change form with rule validation
        │   ├── user/
        │   │   ├── UserStores.jsx       # Consumer stores catalog & rating modal
        │   │   └── Profile.jsx          # Full-page personal account view
        │   ├── owner/
        │   │   └── OwnerDashboard.jsx   # Store owner metrics & ratings audit table
        │   └── admin/
        │       ├── AdminDashboard.jsx   # Platform metric cards & system health
        │       ├── AdminUsers.jsx       # User management table with create modal
        │       ├── AdminUserDetail.jsx  # Individual user inspection & store details
        │       ├── AdminStores.jsx      # Store registry table
        │       └── AdminCreateStore.jsx # New store creation & owner assignment
        ├── services/
        │   ├── api.js                   # Base Axios instance with JWT interceptor
        │   ├── authService.js           # Auth API service calls
        │   ├── storeService.js          # Store & rating API service calls
        │   ├── ownerService.js          # Store owner API service calls
        │   └── adminService.js          # Admin API service calls
        └── utils/
            ├── navigation.js            # Pure role redirection helper
            └── validators.js            # Client-side validation rule functions
```

---

## 8. API Documentation

All API responses follow a predictable JSON format:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "meta": { "pagination": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 } }
}
```

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new normal user (`USER`). Role override attempts are ignored. |
| `POST` | `/api/auth/login` | Public | Authenticate user with Email/Password; returns JWT and user payload. |
| `GET` | `/api/auth/me` | Authenticated | Fetch current authenticated session user profile and assigned store. |
| `PATCH` | `/api/auth/password` | Authenticated | Update user password. Revokes previous tokens. |

### Store & Rating Endpoints (`/api/stores`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stores` | Public / Auth | List stores with pagination, search (`name`, `address`), and sorting. |
| `GET` | `/api/stores/:id` | Public / Auth | Fetch single store details including star breakdown. |
| `GET` | `/api/stores/:id/my-rating` | User Only | Check if the authenticated user has already rated this store. |
| `POST` | `/api/stores/:id/rating` | User Only | Submit a new rating (1–5). Returns `409 Conflict` if already rated. |
| `PUT` | `/api/stores/:id/rating` | User Only | Modify an existing rating. Recalculates store overall average. |

### Store Owner Endpoints (`/api/owner`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/owner/dashboard` | Store Owner | Get merchant store profile, average rating, and total rating count. |
| `GET` | `/api/owner/ratings` | Store Owner | Paginated feed of customer reviews submitted for the owner's store. |
| `GET` | `/api/owner/store` | Store Owner | Fetch merchant store profile details. |

### Admin Endpoints (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin Only | Get system statistics (total users, total stores, total ratings). |
| `GET` | `/api/admin/users` | Admin Only | Paginated user list with search, sorting, and role filtering. |
| `GET` | `/api/admin/users/:id` | Admin Only | Get individual user details and their managed store (if store owner). |
| `POST` | `/api/admin/users` | Admin Only | Create a new user (`ADMIN`, `STORE_OWNER`, or `USER`). |
| `GET` | `/api/admin/stores` | Admin Only | Paginated store list with search and sorting. |
| `POST` | `/api/admin/stores` | Admin Only | Register a new store and assign a store owner. |
| `GET` | `/api/admin/ratings` | Admin Only | Global system audit log of all ratings across the platform. |

---

## 9. Authentication Flow

1. **User Credentials Submission**: The user submits their email and password through the login form.
2. **Server-Side Verification**:
   - Sanitizes and validates email format.
   - Retrieves the user record by email.
   - Compares the submitted password with the stored hash using `bcrypt.compare()`.
3. **JWT Generation**:
   - Signs a stateless JSON Web Token using the HMAC-SHA256 (`HS256`) algorithm.
   - Injects the payload: `{ id, email, role }`.
   - Sets a 24-hour expiration (`expiresIn: '24h'`).
4. **Client-Side Persistence**:
   - The token and sanitized user profile are stored in `localStorage`.
   - The Axios request interceptor injects the token into the `Authorization: Bearer <token>` header for all subsequent API calls.
5. **Session Expiration Handling**:
   - If any protected API call returns an HTTP `401 Unauthorized`, an Axios response interceptor triggers a custom `session-expired` event.
   - The client application automatically clears local credentials and safely redirects the user to `/login` with an informative session-expired message.

---

## 10. Authorization Flow

Role-Based Access Control (RBAC) is enforced at both the backend and frontend levels:

### Backend Guard Pipeline
1. **`authMiddleware`**: Verifies the presence of the `Bearer` token in the `Authorization` header, verifies its digital signature against `JWT_SECRET`, checks expiration, and attaches `req.user` to the Express request object.
2. **`roleMiddleware(allowedRoles)`**: Inspects `req.user.role`. If the user's role is not within `allowedRoles`, the request is immediately terminated with `403 Forbidden`:
   ```javascript
   router.get('/dashboard', authMiddleware, roleMiddleware(['ADMIN']), adminController.getDashboard);
   ```
3. **Horizontal Scoping (IDOR Prevention)**:
   - In Store Owner endpoints, store lookups are hard-filtered by `owner_id = req.user.id`. A store owner cannot access ratings from any store other than their own.
   - In Rating submissions, the rating is linked to `req.user.id`. Users cannot modify ratings belonging to other accounts.

### Frontend Route Protection
- **`<ProtectedRoute />`**: Inspects `isAuthenticated`. Unauthenticated visitors are redirected to `/login` while preserving their intended destination in router state.
- **`<RoleRoute allowedRoles={[...]} />`**: Inspects `user.role`. If the authenticated user does not have permission, they are routed to their designated home path (`/admin/dashboard`, `/owner/dashboard`, or `/user/stores`).

---

## 11. Environment Variables

Create a `.env` file in the `server/` directory (or copy from `.env.example`):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port on which the Express backend listens. |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`). |
| `CLIENT_URL` | `http://localhost:3000` | Whitelisted client origin for CORS. |
| `USE_SQLITE` | `true` | When set to `true`, enables zero-config embedded SQLite. Set to `false` for MySQL. |
| `DB_HOST` | `localhost` | MySQL server hostname. |
| `DB_PORT` | `3306` | MySQL server port. |
| `DB_USER` | `root` | MySQL username. |
| `DB_PASSWORD` | `your_mysql_password` | MySQL password. |
| `DB_NAME` | `store_rating_db` | MySQL database name. |
| `DB_CONNECTION_LIMIT` | `10` | Maximum connections in the MySQL pool. |
| `JWT_SECRET` | `super_secret_jwt_key...` | Cryptographic secret used to sign JWTs (min 32 chars in production). |
| `JWT_EXPIRES_IN` | `24h` | Token expiration duration string. |
| `RATE_LIMIT_WINDOW_MINUTES` | `15` | Window duration for IP rate limiting. |
| `RATE_LIMIT_MAX_REQUESTS` | `2000` | Max requests per IP in the rate-limiting window. |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | `1000` | Max requests per IP on sensitive authentication routes. |

---

## 12. Local Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* **MySQL 8.0+** (if you choose to run with a dedicated MySQL server instead of SQLite)

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/store-rating-platform.git
cd store-rating-platform
```

### Step 2: Install Dependencies
You can install dependencies for both frontend and backend using the root helper script:
```bash
# Install both server and client packages
npm run install:all
```
*Or install them individually:*
```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

---

## 13. Database Setup

The platform includes two database modes:

### Option A: Zero-Config In-Memory SQLite (Quick Evaluation)
No MySQL installation required. The application initializes and seeds complete demo data automatically upon starting.
1. In `server/.env`, verify:
   ```env
   USE_SQLITE=true
   ```
2. Proceed to [Running Backend](#15-running-backend).

### Option B: Persistent MySQL 8.0+ Setup
1. Ensure your local MySQL service is running on port 3306.
2. In `server/.env`, set:
   ```env
   USE_SQLITE=false
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_actual_mysql_password
   DB_NAME=store_rating_db
   ```
3. Run the database initialization script:
   ```bash
   cd server
   npm run db:init
   ```
   *This automatically executes [`database/schema.sql`](database/schema.sql) to create the schema and [`database/seed.sql`](database/seed.sql) to populate demo records.*

---

## 14. Running Frontend

Start the Vite development server:
```bash
cd client
npm run dev
```
The React frontend will be available at: **`http://localhost:3000`**

To create an optimized production build:
```bash
cd client
npm run build
```

---

## 15. Running Backend

Start the Express API server:
```bash
cd server
npm start
```
*For active development with automated server reloads:*
```bash
cd server
npm run dev
```
The backend API will be available at: **`http://localhost:5000`**  
API Health Check endpoint: **`http://localhost:5000/api/health`**

---

## 16. Demo Credentials

The platform is pre-seeded with accounts across all three roles for evaluation:

| Role | Email Address | Password | Permissions & Pre-assigned Context |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@storerating.com` | `AdminPass123!` | Super Administrator with full access to Platform Console, Users, Stores, and Metrics. |
| **Store Owner** | `harrington@storerating.com` | `OwnerPass123!` | Manages *"Apex Organic Gourmet Supermarket"*. |
| **Store Owner** | `montgomery@storerating.com` | `OwnerPass123!` | Manages *"Heritage Artisan Coffee Roasters"*. |
| **Normal User** | `jonathan.higgins@example.com` | `UserPass123!` | Verified Consumer with submitted store ratings. |
| **Normal User** | `bart.davis@example.com` | `UserPass123!` | Verified Consumer. |

---

## 17. Screenshots Section

### 1. Administrator Overview Dashboard
*Displays real-time platform metrics, user role distribution, store registration counts, and total rating volume.*
```
┌────────────────────────────────────────────────────────────────────────┐
│ [★ StoreRate Admin Console]  Admin > Overview Dashboard               │
│                                                                        │
│ ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│ │  Total Users: 10 │  │ Total Stores: 5  │  │   Total Ratings: 14    │ │
│ │  1 Admin, 4 Own  │  │ 4 Active Owners  │  │   Avg Score: 4.4 / 5.0 │ │
│ └──────────────────┘  └──────────────────┘  └────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. User Directory & Management
*Paginated table of all registered platform users with search, role filtering, and modal user provisioning.*
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Search by name, email, or address...] [Search]  Role: [All Roles ▾]   │
│                                                                        │
│ Name                   Email                 Role        Store Name    │
│ Administrator Super    admin@storerating.com ADMIN       —             │
│ Christopher Harrington harrington@storerat.. STORE_OWNER Apex Organic  │
│ Jonathan Higginsworth  jonathan@example.com  CONSUMER    —             │
└────────────────────────────────────────────────────────────────────────┘
```

### 3. Consumer Store Browser & Rating Modal
*Consumer view displaying searchable stores, average ratings, individual user rating state, and rating modification modal.*
```
┌────────────────────────────────────────────────────────────────────────┐
│ [★ StoreRate]  Browse Stores                [J] Jonathan  [CONSUMER]   │
│                                                                        │
│ Store Name                 Address             Overall Rating   Action │
│ Apex Organic Supermarket   42 Market Street    ★★★★☆ 4.5 (4)   [Modify]│
│ Heritage Coffee Roasters   88 Elmwood Avenue   ★★★★☆ 4.5 (4)   [Rate]  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4. Store Owner Reputation Dashboard
*Merchant dashboard showing store details, reputation metrics, rating breakdown, and customer feedback table.*
```
┌────────────────────────────────────────────────────────────────────────┐
│ Apex Organic Gourmet Supermarket                 Overall Rating: 4.5   │
│ 42 Market Street, Downtown Financial City        Total Reviews: 4      │
│                                                                        │
│ Customer Name          Customer Email        Rating      Date          │
│ Jonathan Higginsworth  jonathan@example.com  ★★★★★ 5.0   Oct 27, 2026  │
│ Madeline Abernathy     madeline@example.com  ★★★★☆ 4.0   Oct 26, 2026  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 18. Validation Rules

Validation is strictly enforced on both the client (for UX feedback) and backend (via `express-validator`):

| Target Field | Validation Criteria | Error Message |
| :--- | :--- | :--- |
| **Name** | Minimum 20 characters, Maximum 60 characters | `Name must be between 20 and 60 characters long.` |
| **Email** | Valid RFC 5322 email syntax, Normalized & Lowercased | `Please provide a valid email address.` |
| **Address** | Maximum 400 characters, Non-empty | `Address is required and cannot exceed 400 characters.` |
| **Password** | 8 to 16 characters long; at least one uppercase letter; at least one special character (`!@#$%^&*()_+-=[]{};':"\\\|,.<>/?`) | `Password must be 8-16 characters long, contain at least one uppercase letter and one special character.` |
| **Rating** | Integer value strictly between 1 and 5 (inclusive) | `Rating must be an integer between 1 and 5.` |

---

## 19. Security Considerations

- **Password Storage**: Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with 10 salt rounds.
- **Stateless JWT with Signature Verification**: Tokens are digitally verified with strict HS256 algorithm validation. Requests attempting `alg: none` or invalid signatures are rejected with `401 Unauthorized`.
- **Session Revocation on Password Change**: When a user rotates their password, all previously issued tokens are invalidated.
- **SQL Injection Prevention**: All queries use parameterized statements (`?` placeholders) via `mysql2/promise`. Sorting parameters (`sortBy`, `sortOrder`) are strictly validated against field whitelists.
- **IDOR Protection**: Store Owners can only query ratings linked to their assigned `store_id`. Normal Users can only mutate ratings where `user_id == req.user.id`.
- **HTTP Security Headers**: Powered by `helmet`:
  - `X-Content-Type-Options: nosniff` (prevents MIME type sniffing)
  - `X-Frame-Options: DENY` (clickjacking protection)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - Removal of `X-Powered-By: Express` header to minimize footprint.
- **Rate Limiting**: Defends against brute-force attacks by limiting IP request frequencies. Sensitive authentication endpoints are restricted to 15 attempts per 15-minute window in production.
- **Payload Size Limits**: Body parser limits request bodies to 10kb to mitigate Denial of Service (DoS) attacks via memory exhaustion.

---

## 20. Future Improvements

- **Refresh Token Rotation**: Implement short-lived access tokens (15 minutes) paired with `httpOnly`, `SameSite=Strict` refresh tokens stored in cookies.
- **Email Verification**: Integrate transactional email providers (SendGrid/AWS SES) to verify user emails upon registration.
- **Merchant Store Media**: Allow store owners to upload store banners, storefront images, and business logos using AWS S3 or Cloudinary.
- **Full-Text Search Engine**: Upgrade catalog search from SQL `LIKE` queries to PostgreSQL/MySQL Full-Text Search or Elasticsearch for fuzzy matching and typo tolerance.
- **Caching Layer**: Introduce Redis caching for read-heavy public store catalogs and rating aggregations with automated cache invalidation upon rating submission.
- **Real-Time Notification Websockets**: Push notifications to store owners via Socket.io when a new rating is submitted for their store.

---

## Automated Test Suites

The project includes three automated test suites ensuring complete code coverage and specification adherence:

```bash
# 1. Run Core Integration Test Suite (60 tests)
npm run test

# 2. Run Comprehensive End-to-End QA Checklist (82 tests)
npm run test:qa

# 3. Run OWASP Security Audit Test Suite (32 tests)
npm run test:security
```

**Total Automated Tests**: **174 Tests Passing (100% Success Rate)**.
