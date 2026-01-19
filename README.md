# Roastery OS - React Frontend

> Modern Coffee Roastery ERP System built with Next.js 15, React 19, and shadcn/ui

A comprehensive Enterprise Resource Planning system designed specifically for coffee roasteries, managing everything from green coffee purchasing to roasted coffee sales.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Available Modules](#available-modules)
- [User Roles](#user-roles)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Multi-tenant Architecture**: Complete tenant isolation with role-based access control
- **Purchasing Management**: Supplier management and purchase order tracking with auto-GRN creation
- **Sales Management**: Client management and sales order processing with FIFO inventory reservation
- **Inventory Management**: Green coffee lot tracking with weighted average cost (WAC) calculation
- **Production Management**: Roast batch tracking with QC workflow
- **Finance Management**: Direct and indirect cost tracking, cost pool allocation
- **User Management**: Role-based permissions (Owner, Accountant, Roaster)
- **Multi-currency Support**: Single currency per tenant

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

### Step 1: Clone the Repository

```bash
git clone https://github.com/adrianstefanust/roastery-frontend.git
cd roastery-frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- React 19
- shadcn/ui components
- Zustand (state management)
- Tailwind CSS
- TypeScript
- And other dependencies

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
│   │   ├── layout.tsx            # Dashboard layout with navigation
│   │   ├── inventory/            # Inventory management
│   │   │   └── lots/             # Green coffee lots
│   │   ├── production/           # Production management
│   │   │   └── batches/          # Roast batches
│   │   ├── purchasing/           # Purchasing management
│   │   │   ├── suppliers/        # Supplier CRUD
│   │   │   └── orders/           # Purchase orders
│   │   ├── sales/                # Sales management
│   │   │   ├── clients/          # Client CRUD
│   │   │   └── orders/           # Sales orders
│   │   ├── finance/              # Finance management
│   │   │   └── costs/            # Cost tracking
│   │   └── users/                # User management
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

### 1. Dashboard
- Overview metrics (users, lots, batches, orders)
- Quick stats cards
- Recent activity

### 2. Inventory Management (`/dashboard/inventory/lots`)
- List all green coffee lots
- View lot details (SKU, weight, moisture, cost)
- Create new lots (GRN - Goods Received Notes)
- Edit lot information
- Track weighted average cost (WAC)
- Filter by supplier

### 3. Production Management (`/dashboard/production/batches`)
- List all roast batches
- Create new roast batches
- QC workflow (PENDING → IN_PROGRESS → COOLING → QC_PASSED/QC_FAILED)
- Track roast loss percentage
- Manage batch inventory

### 4. Purchasing Management (`/dashboard/purchasing`)

**Suppliers** (`/suppliers`)
- Create, view, edit, delete suppliers
- Track supplier contact information
- Filter active/inactive suppliers
- View purchase history per supplier

**Purchase Orders** (`/orders`)
- Create purchase orders with multiple line items
- Auto-generate PO numbers (PO-YYYY-MM-NNNN)
- Track PO status workflow:
  - DRAFT → SENT → CONFIRMED → IN_TRANSIT → RECEIVED → COMPLETED
- Receive goods with auto-GRN creation
- Link POs to inventory lots

### 5. Sales Management (`/dashboard/sales`)

**Clients** (`/clients`)
- Create, view, edit, delete clients
- Track client contact and address information
- Filter active/inactive clients
- View sales history per client

**Sales Orders** (`/orders`)
- Create sales orders with multiple line items
- Auto-generate SO numbers (SO-YYYY-MM-NNNN)
- Track SO status workflow:
  - PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED
- FIFO inventory reservation on confirmation
- Track inventory reservations per order
- Ship orders with automatic inventory deduction

### 6. Finance Management (`/dashboard/finance/costs`)
- Track direct costs
- Manage indirect costs with cost pools
- Allocate costs across departments
- View cost summaries and analytics

### 7. User Management (`/dashboard/users`)
- Invite new users to tenant
- Assign roles (Owner, Accountant, Roaster)
- Manage user permissions
- View user activity

## 👥 User Roles

### Owner
- Full system access
- Can manage all modules
- Can create/edit/delete all resources
- Can manage users and assign roles

### Accountant
- Full access to purchasing, sales, finance
- Can create suppliers, clients, orders
- Can manage costs and financial data
- Can view production and inventory
- Cannot manage users

### Roaster
- Full access to production module
- Can view inventory lots
- Can create roast batches
- Can perform QC on batches
- Cannot access purchasing, sales, or finance

## 🔐 Authentication

1. **Register**: Create a new tenant account at `/auth/register`
2. **Login**: Sign in at `/auth/login`
3. **Session**: JWT token stored in Zustand store
4. **Multi-tenant**: Each tenant has isolated data

## 🐛 Troubleshooting

### Issue: "Cannot connect to API"
**Solution**:
- Verify backend is running on http://localhost:8080
- Check `NEXT_PUBLIC_API_BASE` in `.env.local`
- Check browser console for CORS errors

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

### Issue: "Property 'json' does not exist on type 'Response'"
**Solution**: This usually means you need to add a type guard:
```typescript
if (response.ok && 'json' in response) {
  const data = await response.json()
}
```

### Issue: Currency not showing correctly
**Solution**: Verify user's tenant has currency set in backend

### Issue: Cannot read properties of undefined (reading 'name')
**Solution**: Apply fallback pattern in API response handling:
```typescript
const data = await response.json()
const resource = data.resource || data
```

## 📦 Tech Stack

- Next.js 15 + React 19 + TypeScript
- shadcn/ui (Radix UI + Tailwind CSS v4)
- Zustand (state management)
- Sonner (toasts)
- Lucide React (icons)

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

## 🛠️ Commands

```bash
npm run dev        # Development
npm run build      # Production build
npm start          # Production server
npm run lint       # ESLint
```

## 🤝 Contributing

This is a private project. For issues or feature requests, contact the project maintainer.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for Coffee Roasteries**

**Migrated from Nuxt/Vue - See MIGRATION_GUIDE.md**
