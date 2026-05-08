# Leave Management System

A Node.js + Express + MongoDB backend for managing employee leave workflows with role-based access.

## Features

- Employee registration and login
- JWT-based authentication middleware
- Role-based authorization for `Admin`, `Manager`, and `Employee`
- Leave application with weekend/holiday validation
- Leave history views for employee/admin/manager scopes
- Leave status updates (approval flow)
- Salary view with leave-based deduction calculation
- Employee onboarding email notifications (Nodemailer)
- File upload endpoint (Multer)

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Bcrypt
- Multer
- Nodemailer

## Project Structure

```text
leave_management_system/
├── server.js
├── db.js
├── package.json
├── controllers/
│   ├── auth_controller.js
│   ├── leave_controller.js
│   ├── salary_controller.js
│   └── functions.js
├── middlewares/
│   └── auth_middleware.js
├── models/
│   ├── employees.js
│   ├── leave.js
│   └── holidays.js
└── routes/
    └── authroutes.js
```

## Installation

1. Clone repository and move into project directory.
2. Install dependencies:

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
EMAIL=your_email@gmail.com
PASSWORD=your_email_app_password
```

> The application currently uses a hardcoded MongoDB connection string in `db.js` and a hardcoded JWT secret in `middlewares/auth_middleware.js`.

## Run

```bash
npm start
```

Server starts on:

- `http://localhost:5000`

## API Endpoints

### Upload

- `POST /upload`
  - Protected: Yes
  - Body: `multipart/form-data` with field `file`

### Auth & User

- `POST /user/register`
  - Protected: Yes (`Admin` only)
  - Body fields:
    - `first_name`, `middle_name`, `last_name`, `address`, `date_of_birth`
    - `username`, `phone_number`, `manager_id`, `role`, `month_salary`
    - `email`, `password`

- `POST /user/login`
  - Protected: No
  - Body fields: `email`, `password`

### Leave

- `POST /leave/apply`
  - Protected: Yes
  - Body fields: `employee_id`, `leave_type`, `leave_date`, `leave_end_date`, `reason_for_leave`

- `GET /leave/view`
  - Protected: Yes
  - Query params supported: `page`, `limit`, and leave filters
  - Behavior:
    - Admin can view matching leave records
    - Non-admin user records are restricted to own `employee_id`

- `GET /leave/manager/:id`
  - Protected: Yes (`Manager` only)
  - Returns leave history for employee `:id` (manager ownership validated)

- `PUT /leave/manager/:id`
  - Protected: Yes (`Manager` only)
  - Updates leave record for employee `:id`

- `PUT /leave/update/:id`
  - Protected: Yes (`Admin` only)
  - Updates leave record for employee `:id`

### Salary

- `GET /salary/view`
  - Protected: Yes
  - Admin: paginated salary summaries for employees (with deductions from approved leaves)
  - Employee: own salary summary

## Authentication

Pass JWT in request headers:

```http
Authorization: Bearer <token>
```

Token is created on login and validated through `require_auth` middleware.

## Notes

- Test script in `package.json` is a placeholder and currently exits with an error.
- Ensure MongoDB network access is configured for your runtime environment.
- For production use, move all secrets and connection values to environment variables.
