# Store Rating Platform — Express.js Backend API

Production-ready backend API for the Store Rating Platform built with Node.js, Express.js, MySQL, and JWT-based Role-Based Access Control (RBAC).

---

## 1. Architecture Overview

The backend uses a clean, layered architecture:

```
server/
├── .env.example
├── .env
├── package.json
├── README.md
├── src/
│   ├── app.js                   # Express application & middleware setup
│   ├── server.js                # HTTP server bootstrap & graceful shutdown
│   ├── config/
│   │   ├── db.js                # MySQL connection pool (with SQLite test fallback)
│   │   ├── env.js               # Environment variables loader
│   │   └── sqliteAdapter.js     # In-memory test database adapter
│   ├── constants/
│   │   └── roles.js             # User roles (ADMIN, USER, STORE_OWNER)
│   ├── controllers/
│   │   ├── authController.js    # Register, login, me, password
│   │   ├── storeController.js   # Store catalog & single store profiles
│   │   ├── ratingController.js  # Submit & modify ratings
│   │   ├── ownerController.js   # Store Owner analytics & ratings
│   │   └── adminController.js   # Admin dashboard, users, stores, ratings
│   ├── middleware/
│   │   ├── auth.js              # requireAuth, optionalAuth, requireRole guards
│   │   ├── errorHandler.js      # Centralized error handler & 404 handler
│   │   ├── rateLimiter.js       # General & Auth rate limiters
│   │   └── validate.js          # express-validator runner
│   ├── routes/
│   │   ├── index.js             # API aggregator (/api/...) & health check
│   │   ├── authRoutes.js        # /api/auth
│   │   ├── storeRoutes.js       # /api/stores
│   │   ├── ownerRoutes.js       # /api/owner
│   │   └── adminRoutes.js       # /api/admin
│   ├── scripts/
│   │   └── initDb.js            # Automated schema & seed runner
│   ├── services/
│   │   ├── authService.js
│   │   ├── storeService.js
│   │   ├── ratingService.js
│   │   ├── ownerService.js
│   │   └── adminService.js
│   ├── utils/
│   │   ├── appError.js          # Custom operational error class
│   │   ├── pagination.js        # Safe pagination & sort whitelist parser
│   │   └── response.js          # Standardized response formatters
│   └── validators/
│       ├── authValidators.js
│       ├── adminValidators.js
│       └── ratingValidators.js
└── tests/
    └── run-all-tests.js         # Automated end-to-end API test suite (60 tests)
```

---

## 2. Prerequisites & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **MySQL Server**: 8.0 or higher

### Installation
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your MySQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=store_rating_db
   DB_CONNECTION_LIMIT=10

   # JWT Configuration
   JWT_SECRET=super_secret_jwt_key_store_rating_platform_2026_xyz
   JWT_EXPIRES_IN=24h
   ```

3. Initialize the database and populate seed data:
   ```bash
   npm run db:init
   ```
   *(Or run `mysql -u root -p < ../database/schema.sql` followed by `mysql -u root -p < ../database/seed.sql`)*

4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 3. Automated Test Suite

Run the full end-to-end automated test suite:
```bash
npm test
```
The test suite covers:
- Public and authenticated health checks
- Validation rules (20–60 character name lengths, password policies, 1–5 rating scores)
- Public user registration & duplicate prevention
- JWT login & token authentication across all 3 roles
- Role-Based Access Control (RBAC) permission boundaries (401/403)
- Store catalog browsing, searching, and allowlisted sorting
- User rating submissions, duplicate rating prevention (409 Conflict), and modifications (PUT)
- Store Owner analytics dashboard and rater inspection
- Admin metrics, user management, and store assignments

---

## 4. API Endpoints Reference

### Uniform Response Format
**Success (200 / 201):**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "meta": { "pagination": { "total": 10, "page": 1, "limit": 10, "totalPages": 1 } }
}
```

**Error (400 / 401 / 403 / 404 / 409 / 422 / 500):**
```json
{
  "success": false,
  "message": "Detailed error explanation",
  "errors": [ { "field": "name", "message": "Name must be between 20 and 60 characters" } ]
}
```

### Endpoints Table

| Category | Method | Path | Auth / Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Public | System & Database connectivity health check |
| **Auth** | `POST` | `/api/auth/register` | Public (Rate-limited) | Register normal user (role strictly forced to `USER`) |
| | `POST` | `/api/auth/login` | Public (Rate-limited) | Authenticate user & receive JWT token |
| | `GET` | `/api/auth/me` | Authenticated | Retrieve current session user profile |
| | `PATCH` | `/api/auth/password` | Authenticated | Update account password |
| **Stores** | `GET` | `/api/stores` | Public / Optional Auth | List stores with overall rating, user rating, search & sort |
| | `GET` | `/api/stores/:id` | Public / Optional Auth | Store profile details & 1–5 star rating distribution |
| | `GET` | `/api/stores/:id/my-rating` | Authenticated | Get current user's rating for specified store |
| | `POST` | `/api/stores/:id/rating` | Authenticated (`USER`) | Submit new rating (1–5). Returns 409 if already rated |
| | `PUT` | `/api/stores/:id/rating` | Authenticated (`USER`) | Modify existing rating |
| **Store Owner** | `GET` | `/api/owner/dashboard` | Authenticated (`STORE_OWNER`) | Store analytics, average rating, star distribution |
| | `GET` | `/api/owner/ratings` | Authenticated (`STORE_OWNER`) | Paginated list of users who rated owner's store |
| | `GET` | `/api/owner/store` | Authenticated (`STORE_OWNER`) | Owner's assigned store profile |
| **Admin** | `GET` | `/api/admin/dashboard` | Authenticated (`ADMIN`) | Summary metrics (total users, stores, ratings) |
| | `GET` | `/api/admin/users` | Authenticated (`ADMIN`) | Filter users by role, search, sort, includes store rating |
| | `GET` | `/api/admin/users/:id` | Authenticated (`ADMIN`) | User details + store details & rating if store owner |
| | `POST` | `/api/admin/users` | Authenticated (`ADMIN`) | Create user (`ADMIN`, `USER`, or `STORE_OWNER`) |
| | `GET` | `/api/admin/stores` | Authenticated (`ADMIN`) | List stores with owner details, ratings, search, sort |
| | `POST` | `/api/admin/stores` | Authenticated (`ADMIN`) | Add store and assign to an existing store owner |
| | `GET` | `/api/admin/ratings` | Authenticated (`ADMIN`) | View all rating logs across the platform |

---

## 5. Security & Engineering Implementations

1. **SQL Injection Prevention**:
   All database queries are executed using parameterized statements (`?` placeholders via `mysql2/promise`). Dynamic sort fields are strictly checked against whitelisted column maps.
2. **Password Security**:
   Passwords are never stored in plain text. Salted bcrypt hashes (work factor: 10) are generated on write, and `password_hash` fields are strictly excluded from all API output payloads.
3. **Role-Based Authorization**:
   Server-side middleware (`requireAuth`, `requireRole`, `requireAdmin`, `requireUser`, `requireStoreOwner`) verifies the user's role against the database on every protected request.
4. **Duplicate Rating Prevention**:
   Enforced at both the database level (`UNIQUE KEY uq_ratings_user_store (user_id, store_id)`) and the application service layer (HTTP 409 Conflict).
5. **Rate Limiting**:
   Configured with `express-rate-limit` for both global API throughput and strict authentication endpoints (brute-force defense).
6. **Error Interception**:
   Custom `AppError` class and centralized `errorHandler` ensure standard JSON error structures across all 4xx and 5xx conditions.
