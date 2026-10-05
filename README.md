# Booking and Reservation System

A full-stack booking and reservation system built with **React, Node.js, Express, and MySQL**. The system supports authentication, role-based access control, resources, availability slots, and booking management with conflict detection.

## Tech Stack

### Frontend

* React
* Vite
* React Router
* Axios
* Redux Toolkit

### Backend

* Node.js
* Express.js
* MySQL
* JWT Authentication
* bcrypt
* express-validator

### Testing

* Jest
* Supertest

---

# Project Structure

```text
booking-and-reservation project/
│
├── api/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   ├── test/
│   ├── server.js
│   ├── booking_system.sql
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── store/
│   └── package.json
│
└── README.md
```

# Requirements

Before running the project, install:

* Node.js
* npm
* MySQL

---

# Backend Setup

Go to the API folder:

```bash
cd api
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `api` folder:

```env
DB_USER=root
DB_HOST=localhost
DB_PASSWORD=your_password
DB_NAME=booking_system
DB_PORT=3306

PORT=5000

JWT_SECRET=your_secret_key

CLIENT_ORIGIN=http://localhost:5173
```

Update the database values according to your local MySQL setup.

Import the database schema from:

```text
api/booking_system.sql
```

Start the backend:

```bash
npm start
```

The backend will run on:

```text
http://localhost:5000
```

---

# Frontend Setup

Open a new terminal and go to the client folder:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The frontend will normally run on:

```text
http://localhost:5173
```

---

# Application Flow

The basic application flow is:

```text
React Frontend
      ↓
Axios API Client
      ↓
Express Routes
      ↓
Authentication / RBAC Middleware
      ↓
Controller
      ↓
MySQL Database
      ↓
Controller Response
      ↓
React Frontend
```

For example, during login:

```text
Login Form
    ↓
loginService()
    ↓
apiClient.post("/auth/login")
    ↓
Express Auth Route
    ↓
Login Controller
    ↓
Database User Check
    ↓
JWT Token Generated
    ↓
Response
    ↓
Frontend stores token and role
```

---

# Authentication

The application uses **JWT-based authentication**.

After successful login, the backend returns a JWT token.

The frontend stores the token and sends it with protected requests:

```http
Authorization: Bearer <token>
```

The authentication middleware verifies the token and adds the authenticated user to:

```js
req.user
```

This allows controllers to identify the current user.

---

# Role-Based Access Control

The system supports different roles such as:

* Customer
* Provider
* Admin

Different operations require different permissions.

For example:

```text
Customer
   ↓
Create/View own bookings

Provider
   ↓
Manage own resources
Manage availability
Manage assigned bookings

Admin
   ↓
Manage users
Manage resources
Manage bookings
```

The role is checked through authorization middleware before protected controller operations are executed.

---

# Resource Ownership

Resources are associated with their owner/provider.

The owner is taken from the authenticated user's token rather than trusting a `user_id` supplied by the frontend.

Conceptually:

```text
JWT
 ↓
req.user.id
 ↓
resource.owner_id
```

This prevents a provider from creating or modifying resources on behalf of another provider.

---

# Conflict Detection Design

The booking system prevents two active bookings from occupying the same resource at overlapping times.

The conflict check compares the requested booking interval with existing bookings.

The basic overlap condition is:

```text
existing_start < requested_end
AND
existing_end > requested_start
```

If both conditions are true, the two bookings overlap.

## Example

Existing booking:

```text
09:00 ───── 10:00
```

Requested booking:

```text
09:30 ───── 10:30
```

These overlap:

```text
09:00 ───── 10:00
      09:30 ───── 10:30
```

Therefore, the new booking is rejected.

Another example:

Existing booking:

```text
09:00 ───── 10:00
```

Requested booking:

```text
10:00 ───── 11:00
```

These do not overlap because the first booking ends exactly when the second one starts.

Therefore, the new booking is allowed.

---

# Cancelled Bookings

Cancelled bookings are excluded from conflict detection.

This means a cancelled booking does not prevent another customer from booking the same resource and time.

Conceptually:

```text
Active booking → conflict check
Cancelled booking → ignored
```

---

# Concurrency Protection

Conflict detection must also work when multiple users try to book the same resource at almost the same time.

The booking process uses a database transaction so that the conflict check and booking creation are handled as one controlled operation.

The intended behavior is:

```text
Request 1 ──┐
Request 2 ──┼──→ Conflict Check → Only one booking succeeds
Request 3 ──┘
```

For example, if three customers simultaneously request the same resource and time:

```text
Request 1 → Success
Request 2 → Conflict
Request 3 → Conflict
```

Only one booking should be created for the conflicting time slot.

---

# Availability

Providers and admins can create availability slots for resources.

Availability contains information such as:

* Resource
* Day of week
* Specific date
* Start time
* End time

Bookings are then checked against the available resource/time before being created.

---

# API Routes

Main API areas include:

```text
/api/auth
/api/resources
/api/availability
/api/bookings
/api/updateRole
```

Authentication:

```text
POST /api/auth/register
POST /api/auth/login
```

The remaining endpoints are protected according to their required role and ownership rules.

---

# Running Tests

From the `api` directory:

```bash
npm test
```

The project uses Jest and Supertest for API and integration testing.

Tests cover areas such as:

* Authentication
* Role-based access
* Resource access
* Booking behavior
* Conflict detection
* Concurrent booking attempts

---

# Environment Variables

Environment variables should not be committed to Git.

The `.env` file should remain private.

Example:

```env
DB_USER=
DB_HOST=
DB_PASSWORD=
DB_NAME=
DB_PORT=
PORT=
JWT_SECRET=
CLIENT_ORIGIN=
```

For the frontend:

```env
VITE_API_BASE_URL=
```

---

# Production Deployment

The project can be deployed using:

```text
GitHub
   ↓
Railway
   ├── Node/Express API
   └── MySQL Database
          ↓
Vercel
   └── React Frontend
```

For production, the frontend API URL should point to the deployed backend:

```env
VITE_API_BASE_URL=https://your-backend-url/api
```

The backend `CLIENT_ORIGIN` should contain the deployed frontend URL:

```env
CLIENT_ORIGIN=https://your-frontend-url
```

Production database credentials and JWT secrets should be stored as environment variables rather than committed to the repository.

---

# Summary

This project provides a complete booking workflow:

```text
User Login
    ↓
JWT Authentication
    ↓
Role Verification
    ↓
Resource Selection
    ↓
Availability Check
    ↓
Conflict Detection
    ↓
Database Transaction
    ↓
Booking Created
```

The main goal of the conflict-detection design is to ensure that a resource cannot have two active bookings occupying overlapping time periods, while allowing bookings that start exactly when another booking ends.
