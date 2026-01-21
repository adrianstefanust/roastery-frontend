# Roastery OS - React Frontend

> Modern Coffee Roastery ERP System built with Next.js 15, React 19, and shadcn/ui

A comprehensive Enterprise Resource Planning system designed specifically for coffee roasteries, managing everything from green coffee purchasing to roasted coffee sales.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Available Modules](#available-modules)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Core Features

- **Multi-tenant Architecture**: Complete tenant isolation with role-based access control
- **Purchasing Management**: Supplier management, purchase orders, and invoice tracking
- **Sales Management**: Client management, sales orders, and automated invoice generation
- **Inventory Management**:
  - Green coffee lot tracking with weighted average cost (WAC)
  - Roasted coffee inventory with Available/Reserved tracking
  - Real-time stock level monitoring
  - Low stock alerts (Green < 50kg, Roasted < 10kg)
  - SKU-based organization with filtering
- **Production Management**:
  - Roast batch tracking with one-step QC workflow
  - Integrated quality control (QC Pass/Fail during roasting)
  - Automatic inventory availability on QC approval
  - Shrinkage calculation
- **Finance Management**:
  - Flexible date-based indirect cost tracking
  - Purchase and sales invoice management
  - Payment status tracking (UNPAID → PARTIALLY_PAID → PAID)
  - Manual payment recording
- **User Management**: Role-based permissions (Owner, Accountant, Roaster)
- **Dashboard**: Real-time metrics, low stock alerts, and activity monitoring
- **Multi-currency Support**: Single currency per tenant with flexible display

### Recent Improvements (January 2026)

- ✅ **Streamlined QC Workflow**: Select QC status (Pass/Fail) directly when finishing roasting
- ✅ **Fixed Batch List Display**: Batches now show immediately after creation
- ✅ **Inventory Tracking**: Added available_quantity_kg and reserved_quantity_kg display
- ✅ **Product SKU Display**: Batches grouped by product SKU (using green coffee origin)
- ✅ **Filtered Views**: Click "View" on stock page to see batches by specific SKU
- ✅ **Low Stock Alerts**: Prominently displayed below page titles
- ✅ **Payment Status Auto-calculation**: Invoice payment status updates based on paid amount
- ✅ **Helpful Error Messages**: Clear guidance when operations fail (e.g., QC requirements)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)
- **Git**: For version control
- **Roastery OS Backend**: The backend API must be running (default: http://localhost:8080)

You can verify your installations by running:

```bash
node --version
npm --version
git --version
```

## 📦 Installation

### Step 1: Navigate to Project

```bash
cd /home/adrian/Desktop/project/roasteryOS/roastery-frontend-react
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15 with Turbopack
- React 19
- shadcn/ui components
- Zustand (state management)
- Tailwind CSS v4
- TypeScript
- date-fns, sonner, lucide-react

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# API Configuration
# Set this to your backend API URL
# For local development: http://localhost:8080
# For production: https://your-api-domain.com
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

**Important**: Never commit `.env.local` to version control. It's already included in `.gitignore`.

## 🚀 Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## 📁 Project Structure

```
roastery-frontend-react/
├── app/                          # Next.js App Router
│   ├── dashboard/                # Main dashboard pages
│   │   ├── page.tsx              # Dashboard home with metrics
│   │   ├── layout.tsx            # Dashboard layout with sidebar navigation
│   │   ├── inventory/            # Inventory management
│   │   │   ├── stock/            # Stock overview with low alerts
│   │   │   ├── lots/             # Green coffee lots CRUD
│   │   │   └── grn/              # Goods Received Notes
│   │   ├── production/           # Production management
│   │   │   └── batches/          # Roast batches with QC
│   │   ├── purchasing/           # Purchasing management
│   │   │   ├── suppliers/        # Supplier CRUD
│   │   │   ├── orders/           # Purchase orders
│   │   │   └── invoices/         # Purchase invoices
│   │   ├── sales/                # Sales management
│   │   │   ├── clients/          # Client CRUD
│   │   │   ├── orders/           # Sales orders with FIFO
│   │   │   └── invoices/         # Sales invoices
│   │   ├── finance/              # Finance management
│   │   │   └── costs/            # Cost tracking
│   │   └── users/                # User management (Owner only)
│   ├── auth/                     # Authentication pages
│   │   ├── login/                # Login page
│   │   └── register/             # Registration page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utilities and configuration
│   ├── config/                   # Configuration files
│   │   └── env.ts                # Environment validation
│   ├── stores/                   # Zustand state stores
│   │   └── auth-store.ts         # Authentication state
│   ├── hooks/                    # Custom React hooks
│   │   └── use-auth.ts           # Authentication hook
│   └── utils.ts                  # Utility functions
├── types/                        # TypeScript type definitions
│   └── models.ts                 # Domain models and interfaces
├── public/                       # Static assets
├── .env.example                  # Environment variable template
├── .env.local                    # Your local environment (create this)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies
└── README.md                     # This file
```

## 🎯 Available Modules

### 1. Dashboard (`/dashboard`)
- **Overview metrics**: Users, lots, batches, roasted stock, orders
- **Low stock alerts**: Automatically shown when inventory is low
- **Quick actions**: Create orders, batches, lots
- **Recent activity**: Latest operations across modules

### 2. Inventory Management (`/dashboard/inventory`)

**Stock Overview** (`/stock`)
- View all green and roasted coffee inventory
- Low stock alerts at the top (Green < 50kg, Roasted < 10kg)
- Summary cards with total weight and value
- Green coffee table with SKU, weight, WAC, suppliers
- Roasted coffee table with Product SKU, Available, Reserved, Total
- Click "View" to filter batches by product SKU

**Green Coffee Lots** (`/lots`)
- List all green coffee lots with search
- View lot details (SKU, origin, weight, moisture, WAC)
- Create new lots via GRN (Goods Received Notes)
- Edit lot information
- Delete lots (with safety checks)
- WAC automatically calculated on updates

**GRN** (`/grn`)
- Create Goods Received Notes
- Link to purchase orders
- Auto-calculate WAC for inventory

### 3. Production Management (`/dashboard/production/batches`)
- List all roast batches with Product SKU column
- Create new roast batches from green coffee lots
- **One-Step QC Workflow**:
  - Finish roasting and select QC status (Pass/Fail) in one dialog
  - Add optional QC notes
  - Automatic inventory availability on QC approval
- Track batch status: PENDING_ROAST → IN_PROGRESS → PENDING_APPROVAL → QC_APPROVED/QC_FAILED
- Calculate shrinkage percentage automatically
- View batch details with available/reserved quantities
- Filter batches by Product SKU (click from stock page)
- Delete batches (safety checks)

### 4. Purchasing Management (`/dashboard/purchasing`)

**Suppliers** (`/suppliers`)
- Create, view, edit, delete suppliers
- Track supplier contact information (email, phone, address)
- Filter active/inactive suppliers
- View purchase history per supplier

**Purchase Orders** (`/orders`)
- Create purchase orders with multiple line items
- Auto-generate PO numbers (PO-YYYY-MM-NNNN)
- Track PO status workflow: DRAFT → SENT → CONFIRMED → IN_TRANSIT → RECEIVED → COMPLETED
- Receive goods with auto-GRN creation
- Link POs to inventory lots
- View complete PO history

**Purchase Invoices** (`/invoices`)
- Create invoices manually or from purchase orders
- Auto-generate invoice numbers (PINV-0001, PINV-0002, etc.)
- Track payment status: UNPAID → PARTIALLY_PAID → PAID / OVERDUE
- Manual payment recording with date and reference
- Filter by payment status
- View invoice details with line items

### 5. Sales Management (`/dashboard/sales`)

**Clients** (`/clients`)
- Create, view, edit, delete clients
- Track client contact and address information
- Filter active/inactive clients
- View sales history per client

**Sales Orders** (`/orders`)
- Create sales orders with multiple line items
- Auto-generate SO numbers (SO-YYYY-MM-NNNN)
- Track SO status workflow: PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED
- FIFO inventory reservation on confirmation
- Helpful error messages if QC-passed inventory unavailable
- Track inventory reservations per order
- Ship orders with automatic inventory deduction

**Sales Invoices** (`/invoices`)
- Create invoices manually or from sales orders
- Auto-generate invoice numbers (SINV-0001, SINV-0002, etc.)
- Track payment status with automatic calculation
- Manual payment recording
- Filter and search invoices
- Generate invoices only after order confirmation

### 6. Finance Management (`/dashboard/finance/costs`)
- Track indirect costs with flexible date ranges
- Manage cost entries by date (not monthly)
- Allocate costs across departments
- View cost summaries and analytics
- Edit and delete cost entries
- Multi-currency display

### 7. User Management (`/dashboard/users`)
- Invite new users to tenant (Owner only)
- Assign roles (Owner, Accountant, Roaster)
- Manage user permissions
- View user activity
- Delete users (cannot delete self)

## 👥 User Roles

### Owner
- Full system access
- Can manage all modules
- Can create/edit/delete all resources
- Can manage users and assign roles
- Can view all financial data

### Accountant
- Full access to purchasing, sales, finance
- Can create suppliers, clients, orders, invoices
- Can manage costs and financial data
- Can view production and inventory
- Cannot manage users

### Roaster
- Full access to production module
- Can view inventory lots
- Can create roast batches
- Can perform QC on batches (Pass/Fail during roasting)
- Cannot access purchasing, sales, or finance

## 🔐 Authentication

1. **Register**: Create a new tenant account at `/auth/register`
   - Company name (becomes tenant identifier)
   - Owner email and password
   - Automatic Owner role assignment

2. **Login**: Sign in at `/auth/login`
   - Email and password authentication
   - JWT token returned and stored

3. **Session**: JWT token stored in Zustand store
   - Persisted in localStorage
   - Automatic rehydration on page reload
   - Token included in all API requests

4. **Multi-tenant**: Each tenant has completely isolated data
   - Tenant ID embedded in JWT token
   - All API requests filtered by tenant
   - No cross-tenant data access

## 📦 Tech Stack

### Core Technologies
- **Next.js 15**: React framework with App Router and Turbopack
- **React 19**: Latest React with improved hooks and performance
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first CSS with custom configuration

### UI Components
- **shadcn/ui**: Accessible component library based on Radix UI
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

### State Management
- **Zustand**: Lightweight state management
- **Persist middleware**: LocalStorage persistence for auth

### Utilities
- **date-fns**: Date formatting and manipulation
- **clsx**: Conditional className utility
- **tailwind-merge**: Merge Tailwind classes

## 🐛 Troubleshooting

### Issue: "Cannot connect to API"
**Solution**:
- Verify backend is running on http://localhost:8080
- Check `NEXT_PUBLIC_API_BASE` in `.env.local`
- Check browser console for CORS errors
- Test API health: `curl http://localhost:8080/api/v1/health`

### Issue: "No batches found" after creating batch
**Solution**: This should now be fixed. If you still see this:
- Check browser console for errors
- Verify API is returning batches: `curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/v1/roast-batches`
- Clear browser cache and reload

### Issue: "Roasted coffee stock always 0kg"
**Solution**:
- Batches must have status QC_APPROVED (or QC_PASSED for old data)
- When finishing roasting, select QC Pass/Fail status
- Check inventory stock page - should show available quantity

### Issue: "Module not found" errors
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build errors with shadcn/ui components
**Solution**:
```bash
npx shadcn@latest add [component-name]
```

### Issue: TypeScript errors
**Solution**:
- Ensure all types are defined in `/types/models.ts`
- Run `npm run build` to check for type errors
- Check that optional properties use `?.` operator
- Verify API response structure matches frontend types

### Issue: Currency not showing correctly
**Solution**:
- Verify user's tenant has currency set in backend
- Check that `getCurrencyIcon` utility handles the currency code
- Default is USD if currency not set

### Issue: Low stock alerts not showing
**Solution**:
- Alerts show when Green coffee < 50kg or Roasted coffee < 10kg available
- Check inventory values in stock page
- Verify batches have QC_APPROVED status

## 🛠️ Commands

```bash
npm run dev        # Development server with hot reload
npm run build      # Production build
npm start          # Production server
npm run lint       # ESLint code quality check
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

This is a private project. For issues or feature requests, contact the project maintainer.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for Coffee Roasteries**
