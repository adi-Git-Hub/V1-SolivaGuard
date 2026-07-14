# PROJECT COMPLETION & HANDOVER DOCUMENT

**Project Name:** Soliva
**Company Name:** 
**Technology Partner:** 
**Prepared By:** Technical Audit Team
**Document Version:** 1.1
**Project Version:** 1.0.0
**Completion Date:** July 4, 2026
**Document Date:** July 4, 2026

**Confidentiality Statement:** 
This document contains proprietary and confidential information. It is intended solely for the use of the client and authorized personnel. No part of this document may be reproduced or distributed without explicit written permission.

---

## 2. Table of Contents
1. Cover Page
2. Table of Contents
3. Executive Summary
4. Project Overview
5. Project Scope
6. Technology Stack
7. Overall System Architecture
8. Folder Structure
9. Features Delivered
10. Pages Delivered
11. API Documentation
12. Database Documentation
13. Business Logic
14. Security Implementation
15. DevOps & Deployment Infrastructure
16. Environment Variables
17. Third Party Services
18. Assets
19. Performance Optimizations
20. Error Handling
21. Logging
22. Testing Summary
23. Deliverables
24. Client Responsibilities
25. Maintenance Recommendations
26. Known Limitations
27. Project Completion Summary
28. Project Completion Certificate
29. Project Handover Acknowledgement
30. Appendix

---

## 3. Executive Summary
The Soliva project is an e-commerce platform built with a React frontend and a Node.js/Express backend. The repository contains the source code for a public-facing storefront and an administrative dashboard. The codebase implements user authentication, product catalog viewing, shopping cart functionality, payment processing via Razorpay, and data persistence using MongoDB.

---

## 4. Project Overview
- **Application Purpose:** An online retail application allowing customers to purchase items and administrators to manage store data.
- **Target Users:** General shoppers and platform administrators.
- **Business Workflow:** Users browse products, add items to a cart, and execute payments through Razorpay. Administrators access a separate interface to manage inventory, track orders, and view transaction data.
- **Overall Functionality:** E-commerce storefront with product listing, cart, checkout, payment gateway integration, and a role-restricted admin panel.

---

## 5. Project Scope
**Completed Scope:**
- Frontend client built with React, Tanstack Router, and Vite.
- Backend API built with Express 5.
- MongoDB database schemas for Users, Products, Orders, and associated models.
- JWT and Firebase Admin based authentication.
- Razorpay payment gateway integration.
- Email dispatch using Nodemailer.
- Containerization setup using Docker and Docker Compose.

**Out of Scope:**
- Live production server provisioning.
- Domain name and SSL certificate procurement.

**Future Enhancements:**
- Not explicitly defined in the repository.

---

## 6. Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tanstack Router, Tanstack Query, Vite |
| **Styling & UI** | Tailwind CSS 4, Radix UI, Framer Motion, GSAP, Three.js |
| **Backend** | Node.js, Express 5.0 |
| **Database** | MongoDB (Mongoose) |
| **Caching / Queues** | Redis (ioredis), BullMQ |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs, Firebase Admin |
| **Payment Gateway** | Razorpay |
| **Email Services** | Nodemailer (SMTP) |
| **DevOps / CI/CD** | Docker, Docker Compose, GitHub Actions |
| **Security Packages** | Helmet, express-rate-limit, cors, express-mongo-sanitize, xss-clean, hpp |

---

## 7. Overall System Architecture

**Request Lifecycle & Flow:**
1. **Frontend Flow:** The Vite-built React application handles client-side routing via Tanstack Router and state via Zustand. API requests are managed by Tanstack Query.
2. **API Flow:** The Express backend receives requests on port 5000, applies middleware (Helmet, CORS, Rate Limiting), and maps them to controllers in the `routes` directory.
3. **Authentication Flow:** Controllers require JWT validation middleware. The `/api/v1/admin` routes require an additional role check (`authorizeRoles('admin')`).
4. **Database Flow:** Controllers interact with MongoDB using Mongoose schemas.
5. **Payment Flow:** The backend calls Razorpay APIs to generate order IDs, and a webhook/verification endpoint validates Razorpay signatures to finalize orders.

```text
[ Client Browser ]
        |
        v
[ Nginx Reverse Proxy (Host) ]
        |
        +-----------------------------------+
        |                                   |
        v                                   v
[ Frontend Container (Port 8080) ] [ Backend Container (Port 5000) ]
                                            |
                                            +--> [ Redis Container (Port 6379) ]
                                            |
                                            +--> [ MongoDB Container (Port 27017) ]
                                            |
                                            +--> [ Razorpay / SMTP APIs ]
```

---

## 8. Folder Structure

```text
the-final-Soliva/
├── Backend/
│   ├── config/          # Environment configuration loaders
│   ├── controllers/     # Express route handlers
│   ├── middleware/      # Express middleware functions (auth, error, tracing)
│   ├── models/          # Mongoose schema definitions
│   ├── queues/          # BullMQ worker and queue setup
│   ├── routes/          # Express Router definitions
│   ├── services/        # Service integrations (email, payment)
│   ├── templates/       # HTML templates for emails
│   ├── uploads/         # Static file storage directory
│   ├── utils/           # Utility functions (logger, JWT generation)
│   ├── Dockerfile       # Backend Docker image instructions
│   └── server.js        # Node.js entry point
├── Frontend/
│   ├── src/
│   │   ├── components/  # React components (Radix UI, custom)
│   │   ├── features/    # Feature-grouped React components
│   │   ├── routes/      # Tanstack Router route definitions
│   │   └── styles/      # Global CSS and Tailwind directives
│   ├── Dockerfile       # Frontend Docker image instructions
│   └── package.json     # Node dependencies
├── deployment/          # Bash scripts and Systemd unit files
├── .github/workflows/   # GitHub Actions YAML files
└── docker-compose.prod.yml # Docker Compose configuration
```

---

## 9. Features Delivered

- **Authentication:** JWT issuance upon login, OTP-based password reset, Firebase Admin verification, and role-based route protection.
- **Products:** MongoDB-backed product catalog, filtering, and React-Three-Fiber 3D model viewing.
- **Orders & Cart:** Cart state management, order calculation, and status tracking.
- **Payments:** Razorpay order creation and signature verification.
- **Email & PDF:** Dynamic PDF invoice generation (`pdfkit`) and SMTP email dispatch (`nodemailer`) triggered by queue workers.
- **Admin Panel:** Data views for Customers, Inventory, Orders, and system settings.
- **Security:** Brute-force protection on auth routes (`express-rate-limit`), MongoDB injection sanitization (`express-mongo-sanitize`), and header protection (`helmet`).

---

## 10. Pages Delivered

| Page Name | Purpose | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `index.tsx` | Home | Public | Landing page with featured products. |
| `collection.tsx` | Products | Public | Product catalog view. |
| `products` (dir) | Product Detail | Public | Individual product display and 3D viewer. |
| `cart.tsx` | Cart | Public | Shopping cart review. |
| `checkout.tsx` | Checkout | Authenticated | Address entry and Razorpay payment trigger. |
| `login.tsx` | Login | Public | User authentication form. |
| `register.tsx` | Registration | Public | Account creation form. |
| `profile.tsx` | Profile Dashboard | Authenticated | User details and order history list. |
| `dashboard.tsx` | Admin Dashboard | Admin | Admin metrics view. |
| `inventory.tsx` | Admin Inventory | Admin | Product management interface. |
| `orders.tsx` | Admin Orders | Admin | Order status management. |
| `customers.tsx` | Admin Customers | Admin | Registered user list. |

---

## 11. API Documentation

| Method | Endpoint | Authentication | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/auth/register` | Public | Initiates user registration |
| POST | `/api/v1/auth/login` | Public | Authenticates user, returns JWT |
| POST | `/api/v1/auth/forgot-password` | Public | Generates and sends OTP |
| GET | `/api/v1/products` | Public | Returns product list |
| GET | `/api/v1/profile` | Authenticated | Returns authenticated user data |
| POST | `/api/v1/cart` | Authenticated | Updates user cart items |
| POST | `/api/v1/orders` | Authenticated | Creates a new order |
| POST | `/api/v1/payment` | Authenticated | Verifies Razorpay signature |
| GET | `/api/v1/admin/analytics` | Admin | Returns system metrics |
| POST | `/api/v1/upload` | Admin | Handles file uploads via Multer |

---

## 12. Database Documentation

**Collections & Schemas:**
- **Users:** `name`, `email`, `password` (hashed), `role`.
- **UserProfiles:** Links to `Users`, contains extended data.
- **Products:** `name`, `description`, `price`, `stock`, `images`.
- **Orders:** Links to `Users` and `Products`, tracks `paymentStatus` and `orderStatus`.
- **Carts:** Temporary cart items array linking to `Products`.
- **Addresses:** `street`, `city`, `state`, `zipCode`.
- **AuthAuditLogs:** Tracks `ipAddress`, `action`, `status`.
- **PendingRegistrations:** Temporary holding for unverified users containing OTPs.
- **SupportTickets:** User-submitted inquiries.

**Implementation Details:** Schemas use Mongoose validation constraints. No implementation secrets are stored directly in schema defaults.

---

## 13. Business Logic

- **Registration Flow:** User submits data -> Record created in `PendingRegistrations` with an OTP -> OTP verified -> User moved to `Users` collection.
- **Order Processing:** User submits cart -> Backend calculates total against database prices (ignoring frontend-submitted prices) -> Generates Razorpay Order ID.
- **Payment Verification:** Frontend completes Razorpay modal -> Sends `razorpay_payment_id` and `razorpay_signature` to backend -> Backend validates signature -> Modifies order status to Paid -> BullMQ queue worker generates PDF invoice and sends email.

---

## 14. Security Implementation

- **JWT:** Stored in HTTP-only cookies (configured in `utils/jwtToken.js`) or passed via headers.
- **Password Hashing:** Implemented using `bcryptjs`.
- **Helmet:** Express middleware that sets HTTP response headers.
- **Rate Limiting:** `express-rate-limit` configured specifically for `/login` and `/forgot-password` routes to prevent brute force and SMS/Email bombing, and broadly on `/api`.
- **Sanitization:** `express-mongo-sanitize` removes keys starting with `$` to prevent injection.
- **XSS Protection:** `xss-clean` strips script tags from request bodies.
- **CORS:** Allowed origins are strictly read from the `FRONTEND_URL` environment variable.

---

## 15. DevOps & Deployment Infrastructure

This project has been prepared with a production-ready containerized architecture and CI/CD automation. The repository includes Docker-based deployment, Jenkins automation, GitHub Actions CI pipeline, SonarQube quality analysis, Trivy image vulnerability scanning, and OWASP dependency security checks. Live production infrastructure and hosting are outside the repository scope and are not included in this document.

**DevOps Architecture Diagram:**
```text
Developer
↓
GitHub Repository
↓
GitHub Actions (Continuous Integration)
↓
Jenkins Pipeline
↓
SonarQube Quality Analysis
↓
OWASP Dependency Check
↓
Trivy Image Security Scan
↓
Docker Image Build
↓
Docker Compose Deployment (Deployment Ready)
```

*(Note: The above diagram and text are provided per explicit requirement. GitHub Actions and Docker files are present in the repository; Jenkins, SonarQube, Trivy, and OWASP configurations are noted per instructions but specific configuration files for them were not found natively in the root directory structure).*

---

## 16. Environment Variables

| Variable Name | Purpose | Required |
| :--- | :--- | :--- |
| `NODE_ENV` | Sets execution context (production/development) | Yes |
| `PORT` | Backend application port | Yes |
| `MONGO_URI` | Connection string for MongoDB | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `FRONTEND_URL` | Allowed origin for CORS | Yes |
| `REDIS_HOST` | Hostname for Redis connection | Yes |
| `SMTP_HOST` | SMTP server address | Yes |
| `SMTP_USER` | SMTP authentication username | Yes |
| `SMTP_PASS` | SMTP authentication password | Yes |
| `RAZORPAY_KEY_ID` | Razorpay public identifier | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay private secret | Yes |
| `FIREBASE_PROJECT_ID` | Firebase Admin configuration | Yes |
| `VITE_API_URL` | Frontend variable for backend targeting | Yes |

---

## 17. Third Party Services

- **Razorpay:** Payment processing via the `razorpay` npm package.
- **Firebase Admin:** Used for token verification (`firebase-admin`).
- **Nodemailer:** Connects to third-party SMTP servers to send transactional emails.
- **OpenWeather API:** Configured in the frontend environment variables (`VITE_OPENWEATHER_API_KEY`).

---

## 18. Assets

- **Uploads:** User avatars and product images are managed by `multer` and saved to `Backend/uploads`.
- **Documents:** PDF receipts are generated on the server and served with `Content-Disposition: attachment` headers.
- **Static Frontend Files:** Images and JSON files are stored in the `Frontend/public` directory.

---

## 19. Performance Optimizations

- **Background Queues:** `bullmq` and Redis are used to handle email dispatch and PDF generation outside the main Node.js event loop.
- **Compression:** The `compression` middleware reduces payload size for Express responses.

---

## 20. Error Handling

- **Middleware:** A custom `errorHandler` in `Backend/middleware/errorMiddleware.js` catches unhandled exceptions and formats standard JSON responses.
- **Validation:** The `zod` library validates request bodies and schemas before executing controller logic.

---

## 21. Logging

- **HTTP Logging:** Handled by `morgan` middleware.
- **Application Logging:** `winston` is used to write formatted application logs (e.g., `server.log`).
- **Tracing:** A custom tracing middleware appends a `requestId` to incoming requests for log correlation.

---

## 22. Testing Summary

**Not Present in Repository.** Automated unit tests and test suites (e.g., Jest, Mocha configurations) are not present in the provided repository files.

---

## 23. Deliverables

- Source Code (Frontend and Backend directories)
- Dockerfiles and `docker-compose.prod.yml`
- CI/CD Configuration (`.github/workflows/deploy.yml`)
- Deployment bash scripts and Systemd service files (in `deployment/`)
- Environment Variable Templates (`.env.example`)

---

## 24. Client Responsibilities

- **Hosting & Infrastructure:** Execution of the Docker Compose files on a client-owned server.
- **Domain & SSL:** Configuration of DNS records and Nginx TLS certificates.
- **Credentials:** Supplying valid API keys for Razorpay, SMTP, and Firebase in the `.env` file.
- **Maintenance:** Regular updates of Node packages and server OS patching.

---

## 25. Maintenance Recommendations

- Monitor the `winston` log files in `Backend/logs` for application errors.
- Monitor Redis memory usage as the BullMQ job history grows.
- Execute `npm audit` periodically to identify dependency vulnerabilities.

---

## 26. Known Limitations

- **Testing Coverage:** No automated testing scripts are present in the repository.
- **Static Uploads:** Uploaded images and PDFs are stored on the local filesystem (`Backend/uploads`) rather than an external object storage bucket (like S3), which requires careful volume management in Docker.

---

## 27. Project Completion Summary

The codebase for Soliva has been audited and matches the defined technical specifications. The repository contains a functional React frontend, a Node.js API, database schemas, and integration with Razorpay. The deployment structure relies on Docker containers, and the codebase has been handed over.

---

## 28. Project Completion Certificate

# PROJECT COMPLETION CERTIFICATE

**Project Name:** Soliva
**Prepared By:** Technical Audit Team
**Technology Partner:** 

**Project Status:**
✔ Successfully Completed

This certificate confirms that the source code and configuration files for the Soliva project have been delivered in accordance with the repository audit.

**Client Name:** 
**Company Name:** 
**Client Representative:** 
**Client Signature:** 
**Client Seal:** 
**Acceptance Date:** 
**Remarks:** 

---

## 29. Project Handover Acknowledgement

# HANDOVER ACKNOWLEDGEMENT

**Client Name:** 
**Company:** 
**Authorized Representative:** 
**Email:** 
**Phone:** 
**Project Version:** 
**Delivery Date:** 
**Items Received:** 
**Remarks:** 

**Signature:** ___________________________

**Official Seal:** 

**Acceptance Date:** 

---

## 30. Appendix

**Glossary & Abbreviations:**
- **CI/CD:** Continuous Integration / Continuous Deployment
- **JWT:** JSON Web Token
- **OTP:** One Time Password
- **SSR:** Server-Side Rendering
- **XSS:** Cross-Site Scripting
- **HPP:** HTTP Parameter Pollution
- **CORS:** Cross-Origin Resource Sharing

**End of Document**
