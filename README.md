# Employee Management, Attendance & Payroll Management System

A complete production-ready Employee Management, Attendance & Payroll Management System. Built using the MERN stack (MongoDB, Express, React, Node.js) with role-based access control, secure password hashing, advance salary auto-deduction, and a premium responsive dark/light glassmorphic UI.

---

## Technical Stack
- **Frontend**: React.js (Vite), React Router v6, Lucide Icons, Custom Responsive CSS
- **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs hashing
- **Database**: MongoDB (Mongoose schemas)

---

## Core Features
1. **First Time Setup**: Auto-routes to a setup screen to configure the first Super Administrator account (only when database is empty). No seeded dummy/default credentials.
2. **Role-Based Access Control**:
   - **Super Admin**: Full permissions (Employee CRUD, bulk attendance logging, leave approvals, overtime management, advance granting, payroll generation, custom holidays, exports).
   - **HR Manager**: Same admin rights except critical billing changes (same high-level privileges).
   - **Employee**: Guarded portal (can check in/out calendar, view own leaves/balances/advances, review salary statement history and print payslips).
3. **Automated Attendance Integration**: Approved leave periods (Paid, Sick, Casual) automatically pre-fill dates in the attendance registers.
4. **Payroll Calculation Formula**:
   - Monthly base salary is normalized to a 30-day month.
   - `Daily Salary` = `Monthly Salary` / 30.
   - `Unpaid Leave Deduction` = `Unpaid Leave Days` * `Daily Salary` (where Unpaid Leave Days are calculated from Absent/Half Day attendance records).
   - `Overtime Earnings` = `Overtime Hours` * `Employee Overtime Hourly Rate`.
   - `Advance Salary Deduction` = Auto-deducted from Net Earnings (up to outstanding advance balance).
   - `Net Salary` = `Base Salary` + `Overtime Earnings` - `Unpaid Leave Deduction` - `Advance Salary Deduction`.
5. **Printable Payslip System**: Standard printable payslip component optimized for high-fidelity A4 prints (`window.print()`).
6. **Holiday Calendar**: Configured with Indian national holidays (Republic Day, Holi, Diwali, Independence Day, etc.) + custom event scheduler.
7. **CSV Exports**: Allows exporting reports (Employees, Payroll, Overtime, Leave, Advance) to CSV files.

---

## Installation & Running Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally on `mongodb://localhost:27017`

### Step 1: Install Dependencies
Run the install command in the root folder. This will install packages for the root runner, backend, and frontend concurrently:
```bash
npm run install-all
```

### Step 2: Start the Application
Run the dev script in the root folder. This will start the backend Express server on port `5000` and the React frontend on port `3000` concurrently:
```bash
npm run dev
```

### Step 3: Access and Configure
1. Open your browser and go to: `http://localhost:3000`
2. You will be automatically redirected to the **Setup Wizard** page.
3. Configure your first Super Administrator username and password.
4. Sign in with the new credentials to unlock the HRMS dashboard.
