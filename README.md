# SalesOrder Pro — Sales Order Accounting Information System

A complete, production-ready web-based Sales Order Accounting Information System for Small and Medium Enterprises (SMEs).

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS        |
| Backend    | Node.js, Express.js                 |
| Database   | MySQL + Sequelize ORM               |
| Auth       | JWT (Access + Refresh Tokens)       |
| PDF        | PDFKit                              |
| Email      | Nodemailer                          |
| Charts     | Chart.js + react-chartjs-2          |
| State      | Zustand + TanStack Query            |

---

## 📁 Project Structure

```
SalesOrderSystem/
├── client/                   # React frontend
│   ├── src/
│   │   ├── api/              # Axios client + service functions
│   │   ├── components/
│   │   │   ├── layout/       # AppLayout, Sidebar, Topbar
│   │   │   └── ui/           # Reusable UI components
│   │   ├── pages/
│   │   │   ├── auth/         # Login page
│   │   │   ├── dashboard/    # Dashboard with KPIs & charts
│   │   │   ├── customers/    # Customer management
│   │   │   ├── products/     # Product & inventory management
│   │   │   ├── orders/       # Sales order management
│   │   │   ├── invoices/     # Invoice management
│   │   │   ├── reports/      # Reports & analytics
│   │   │   ├── expenses/     # Expense tracking
│   │   │   └── settings/     # User & system settings
│   │   ├── store/            # Zustand auth store
│   │   └── utils/            # Helpers, formatters
│   └── package.json
│
├── server/                   # Express backend
│   ├── src/
│   │   ├── config/           # Database, logger config
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, error, audit middleware
│   │   ├── models/           # Sequelize models + associations
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # PDF, email services
│   │   ├── utils/            # Code generators
│   │   └── database/
│   │       └── seeders/      # Sample data seeder
│   └── package.json
│
└── database/
    └── schema.sql            # Complete SQL schema
```

---

## ⚙️ Installation Guide

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- Git

### 1. Clone / Setup

```bash
# Navigate to project
cd C:\SalesOrderSystem
```

### 2. Database Setup

```sql
-- In MySQL client:
CREATE DATABASE sales_order_db;
-- Or run the schema file:
mysql -u root -p < database/schema.sql
```

### 3. Backend Setup

```bash
cd server
npm install

# Copy and configure environment
copy .env.example .env
# Edit .env with your DB credentials and secrets

# Run seeder (creates tables + sample data)
npm run seed

# Start development server
npm run dev
```

### 4. Frontend Setup

```bash
cd client
npm install

# Configure environment
# Edit .env with your API URL

# Start development server
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 🔐 Default Login Credentials

| Role        | Email                        | Password      |
|-------------|------------------------------|---------------|
| Super Admin | admin@salesorder.com         | Admin@1234    |
| Manager     | manager@salesorder.com       | Manager@1234  |
| Accountant  | accountant@salesorder.com    | Account@1234  |
| Sales Staff | sales@salesorder.com         | Sales@1234    |

---

## 🔑 Role Permissions

| Feature              | Super Admin | Manager | Accountant | Sales Staff |
|----------------------|:-----------:|:-------:|:----------:|:-----------:|
| Dashboard            | ✅          | ✅      | ✅         | ✅          |
| Create Orders        | ✅          | ✅      | ✅         | ✅          |
| Manage Customers     | ✅          | ✅      | ❌         | ✅          |
| Manage Products      | ✅          | ✅      | ❌         | ❌          |
| View Invoices        | ✅          | ✅      | ✅         | ✅          |
| Mark Invoice Paid    | ✅          | ✅      | ✅         | ❌          |
| View Reports         | ✅          | ✅      | ✅         | ❌          |
| Manage Expenses      | ✅          | ✅      | ✅         | ❌          |
| User Management      | ✅          | ✅      | ❌         | ❌          |
| Audit Logs           | ✅          | ❌      | ❌         | ❌          |
| Cancel Orders        | ✅          | ✅      | ❌         | ❌          |

---

## 📡 API Reference

### Authentication
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| POST   | /api/v1/auth/login          | Login                 |
| POST   | /api/v1/auth/logout         | Logout                |
| POST   | /api/v1/auth/refresh        | Refresh access token  |
| POST   | /api/v1/auth/forgot-password| Request password reset|
| POST   | /api/v1/auth/reset-password | Reset password        |
| GET    | /api/v1/auth/profile        | Get current user      |
| PUT    | /api/v1/auth/profile        | Update profile        |

### Dashboard & Reports
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /api/v1/dashboard/stats     | Dashboard KPIs        |
| GET    | /api/v1/reports/sales       | Sales report          |
| GET    | /api/v1/reports/inventory   | Inventory report      |
| GET    | /api/v1/reports/profit-loss | P&L report            |

### Customers
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/v1/customers                 | List customers           |
| POST   | /api/v1/customers                 | Create customer          |
| GET    | /api/v1/customers/:id             | Get customer             |
| PUT    | /api/v1/customers/:id             | Update customer          |
| DELETE | /api/v1/customers/:id             | Deactivate customer      |
| GET    | /api/v1/customers/:id/transactions| Transaction history      |
| GET    | /api/v1/customers/:id/analytics   | Customer analytics       |

### Products
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/v1/products                  | List products            |
| POST   | /api/v1/products                  | Create product           |
| GET    | /api/v1/products/low-stock        | Low stock products       |
| GET    | /api/v1/products/:id              | Get product              |
| PUT    | /api/v1/products/:id              | Update product           |
| DELETE | /api/v1/products/:id              | Deactivate product       |
| POST   | /api/v1/products/:id/adjust-stock | Adjust stock             |

### Orders
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /api/v1/orders              | List orders           |
| POST   | /api/v1/orders              | Create order          |
| GET    | /api/v1/orders/:id          | Get order details     |
| PATCH  | /api/v1/orders/:id/status   | Update order status   |
| POST   | /api/v1/orders/:id/cancel   | Cancel order          |

### Invoices
| Method | Endpoint                        | Description           |
|--------|---------------------------------|-----------------------|
| GET    | /api/v1/invoices                | List invoices         |
| GET    | /api/v1/invoices/:id            | Get invoice           |
| GET    | /api/v1/invoices/:id/download   | Download PDF          |
| POST   | /api/v1/invoices/:id/email      | Email invoice         |
| PATCH  | /api/v1/invoices/:id/mark-paid  | Mark as paid          |

---

## 🗄️ Database ERD (Entity Relationships)

```
users ──────────────────────────────────────────────────────────┐
  │ (created_by)                                                 │
  ▼                                                              │
orders ──────────── order_items ──────── products               │
  │                                          │                  │
  │ (customer_id)                    (category_id)              │
  ▼                                          ▼                  │
customers                               categories              │
  │                                                             │
  ├── invoices ◄──── orders                                     │
  ├── transactions                                              │
  └── (outstanding_balance)                                     │
                                                                │
users ──── notifications                                        │
users ──── audit_logs ◄─────────────────────────────────────────┘
products ── inventory_logs
expenses ── (recorded_by) ── users
```

---

## 🔒 Security Features

- **JWT Authentication** with access + refresh token rotation
- **Password Hashing** with bcrypt (12 rounds)
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **Helmet.js** — HTTP security headers
- **XSS Protection** — xss-clean middleware
- **CORS** — Restricted to configured client origin
- **Input Validation** — express-validator on all endpoints
- **SQL Injection Prevention** — Sequelize parameterized queries
- **Audit Logging** — All write operations logged with user + IP
- **Role-Based Access Control** — Per-route authorization middleware

---

## 🚢 Deployment Guide

### Backend (e.g., Railway / Render / VPS)

```bash
# Set environment variables on your platform:
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_NAME=sales_order_db
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-strong-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
CLIENT_URL=https://your-frontend-domain.com

# Start command:
npm start
```

### Frontend (e.g., Vercel / Netlify)

```bash
# Build command:
npm run build

# Output directory: dist

# Environment variable:
VITE_API_URL=https://your-backend-domain.com/api/v1
```

---

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Manual API testing with curl:
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salesorder.com","password":"Admin@1234"}'
```

---

## 📋 System Modules Summary

1. **Authentication** — JWT login/logout, password reset, role-based access
2. **Dashboard** — KPI cards, revenue charts, recent orders, low stock alerts
3. **Customer Management** — CRUD, transaction history, outstanding balances
4. **Product & Inventory** — CRUD, stock tracking, low stock notifications
5. **Sales Orders** — Multi-item orders, auto tax/discount calc, status workflow
6. **Invoice System** — Auto-generated, PDF download, email delivery
7. **Accounting** — Revenue, expenses, profit/loss tracking
8. **Reports** — Sales, inventory, P&L reports with charts
9. **Notifications** — Real-time low stock and system alerts
10. **Audit Logs** — Full activity trail for compliance
11. **User Management** — Multi-role user administration
12. **Settings** — Profile management, company info

---

## 👨‍💻 Author

Built as a complete final-year university project and real-world SaaS platform.

**Stack:** React + Node.js + MySQL | **Version:** 1.0.0
