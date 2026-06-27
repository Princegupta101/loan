# Loan Management System (LMS)

This repository implements a complete Loan Management System (LMS) comprising a **Borrower Portal** and an **Internal Operations Dashboard** with role-based access control (RBAC).

## Technology Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs hashing

---

## Key Modules & Roles

### 1. Borrower Portal
- **Authentication**: Full registration and sign-in.
- **Application & Underwriting**: Personal profile collection. Upon submission, an automated **Business Rule Engine (BRE)** enforces the following eligibility rules:
  1. **Age**: Must be between 23 and 50 (inclusive).
  2. **Monthly Income**: Must be at least ₹25,000.
  3. **PAN Number**: Verified against standard regular expression `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`.
  4. **Employment Status**: Must be `Salaried` (rejects `Unemployed` and `Self-Employed`).
  *If any check fails, the loan status is immediately set to `BRE_Rejected` with a detailed audit note.*
- **Income Verification Document**: Upload pay slip (formats: PDF, JPG, PNG; max size: 5 MB).
- **Loan Configurator**: Interactive sliders to select:
  - Principal: ₹50,000 to ₹500,000
  - Tenure: 30 to 365 days
  - *Interest Math*: Uses a fixed 12% per annum simple interest:
    $$\text{Interest} = \text{Principal} \times 0.12 \times \frac{\text{Tenure (Days)}}{365}$$
    $$\text{Total Repayment} = \text{Principal} + \text{Interest}$$
- **Repayment Simulation**: Borrowers can submit installments directly from the dashboard (updating payment history and outstanding balance) to simulate repayment.

### 2. Operations Dashboard Modules
Enforces role-based permissions (RBAC) on both frontend page elements and backend API endpoints:
- **Sales**: Tracks registered borrowers who have not yet submitted active loan applications (potential leads, including those rejected by the automated BRE).
- **Sanction**: Audits active applications, inspects uploaded salary slips, and clicks **Approve (Sanction)** or **Reject** with custom underwriting notes.
- **Disbursement**: Reviews sanctioned applications and releases funds (**Disburse**), changing status to active (`Disbursed`).
- **Collection**: Monitors active payments, logs recoveries, and prints payments history.
  - **Auto-Closure Rule**: Once total repayments meet or exceed the total repayment goal, the loan status automatically transitions to `Closed`.
- **Admin**: A consolidated control panel featuring statistics (Counts of state, total disbursed amount, total collections, outstanding portfolio) and access to all module interfaces.

---

## Pre-seeded Credentials
To make evaluation quick and seamless, the database is pre-populated with accounts for all roles. All accounts use the password: **`Password123`**

| Role | Email Login | Password | Description |
|---|---|---|---|
| **Admin** | `admin@lms.com` | `Password123` | Full access to all dashboard panels & statistics |
| **Sales** | `sales@lms.com` | `Password123` | Access to the Sales Leads pipeline |
| **Sanction** | `sanction@lms.com` | `Password123` | Underwriter review and approval desk |
| **Disbursement** | `disbursement@lms.com` | `Password123` | Releases funds for sanctioned applications |
| **Collection** | `collection@lms.com` | `Password123` | Recovery tracking and logging installment payments |
| **Borrower** | `borrower@lms.com` | `Password123` | Pre-registered borrower template profile |

---

## Installation & Running

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB running locally on port `27017`

### 1. Database Seeding & Backend API
In a new terminal shell:
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run database seed (Creates the pre-seeded role accounts above)
npm run seed

# Start the Express server (Hot reload enabled on http://localhost:5000)
npm run dev
```

### 2. Frontend client
In another terminal shell:
```bash
# From workspace root
npm install

# Run the Next.js development client (Runs on http://localhost:3000)
npm run dev
```

---

## Verification & API Endpoints

### Automated Rule Engine Checks
Verify by applying for a loan with:
- Age: `20` (Expected Status: `BRE_Rejected`)
- Monthly Salary: `20000` (Expected Status: `BRE_Rejected`)
- PAN Card: `INVALID123` (Expected Status: `BRE_Rejected`)
- Employment: `Self-Employed` (Expected Status: `BRE_Rejected`)

### Simple Interest Calculations Check
- Principal: `₹1,00,000`
- Tenure: `180 Days`
- Formula: $100000 \times 0.12 \times \frac{180}{365} = 5917.8082...$
- Expected Interest: `₹5,917.81`
- Expected Total Repayment: `₹1,05,917.81`
