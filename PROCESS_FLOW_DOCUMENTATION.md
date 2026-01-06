# Inventory System - Add New Inventory Item Process Flow

## Overview

This document explains the complete step-by-step process of adding a new inventory item, including how the request flows through the application from the frontend to the backend and back.

---

## 1. USER ACTION - Frontend Start Point

### Location: `frontend/src/pages/Inventory.jsx`

**What Happens:**

- User clicks "Add New Inventory Item" button
- A Modal dialog opens displaying the form
- Form displays input fields for inventory data

**Form Fields:**

- Full Name (required)
- Department (required)
- PC Name (optional)
- PC Type (required) - Dropdown with values: DESKTOP, LAPTOP
- Windows Version (optional) - Select dropdown
- Microsoft Office (optional) - Select dropdown
- Applications System (optional) - Text field
- Status (optional)
- Brand, Model, Serial Number, etc.

---

## 2. FORM SUBMISSION - React State & Validation

### Location: `frontend/src/components/Modal.jsx`

**What Happens:**

1. User fills the form and clicks "Save" or "Submit"
2. Form data is collected from React state
3. Basic frontend validation occurs (check required fields)
4. Form data is prepared as a JavaScript object

**Data Structure Before Sending:**

```javascript
{
  fullName: "John Doe",
  department: "IT Department",
  pcName: "PC-001",
  pcType: "DESKTOP",
  windowsVersion: "Windows 11",
  microsoftOffice: "Office 365",
  applicationsSystem: "MS Office, Viber, Messenger",
  status: "Active User",
  brand: "Dell",
  model: "OptiPlex 7090",
  serialNumber: "SN12345",
  purchaseDate: "2024-01-15",
  remarks: "Working condition"
}
```

---

## 3. API CALL - Frontend Service Layer

### Location: `frontend/src/services/inventoryService.js`

**What Happens:**

1. The form submission triggers: `inventoryService.create(formData)`
2. This function makes an HTTP POST request to the backend

**Code Flow:**

```
Modal.jsx (Form Component)
    ↓
Calls: inventoryService.create(data)
    ↓
inventoryService.js
    ↓
api.post('/inventory', data)
```

**Network Request Details:**

- **Method:** POST
- **URL:** `http://localhost:5173/api/inventory`
- **Headers:**
  - Content-Type: application/json
  - Authorization: Bearer {JWT_TOKEN}
- **Body:** Form data as JSON

---

## 4. BACKEND ROUTING - Express Route Handler

### Location: `backend/src/routes/inventoryRoutes.js`

**What Happens:**

1. Backend server receives the POST request to `/api/inventory`
2. Route checks:
   - ✓ User is authenticated (middleware: `authenticate`)
   - ✓ User has permission (middleware: `authorize` - 'admin' or 'manager' only)
   - ✓ Data validation (middleware: `inventoryValidation`)
   - ✓ No validation errors (middleware: `validate`)
3. Request is passed to controller

**Route Definition:**

```javascript
router.post(
  "/", // Route path
  authorize("admin", "manager"), // Authorization check
  inventoryValidation, // Validation rules
  validate, // Execute validation
  inventoryController.createInventory // Handler function
);
```

**Validation Rules:**

- `fullName` - Required, trimmed string
- `department` - Required, trimmed string
- `pcType` - Required, must be: LAPTOP, DESKTOP, or LAPTOP DESKTOP

---

## 5. VALIDATION - Express-Validator Middleware

### Location: `backend/src/middleware/errorHandler.js` (validate function)

**What Happens:**

1. Validation rules are checked against the request body
2. If validation fails:
   - Error response is sent back to frontend
   - HTTP Status: 400 (Bad Request)
3. If validation passes:
   - Request continues to controller

**Validation Flow:**

```
Request Data
    ↓
Check fullName (required & trimmed)
    ↓
Check department (required & trimmed)
    ↓
Check pcType (required & valid enum)
    ↓
All Valid? → YES → Continue to Controller
         → NO → Return 400 Error
```

---

## 6. DATABASE CHECK - Duplicate Detection

### Location: `backend/src/controllers/inventoryController.js` - createInventory function

**What Happens:**

1. Controller checks if serial number already exists in database
2. Query: `Inventory.findOne({ where: { serialNumber } })`
3. If duplicate found:
   - Return error: "Serial number already exists"
   - HTTP Status: 400
4. If no duplicate:
   - Continue to creation

**SQL Query:**

```sql
SELECT * FROM inventory
WHERE serial_number = 'SN12345'
LIMIT 1;
```

---

## 7. DATABASE CREATE - Insert New Record

### Location: `backend/src/models/Inventory.js`

**What Happens:**

1. Sequelize ORM creates a new database record
2. Data is inserted with all provided fields
3. Default values are applied if not provided:
   - `status` → 'Active User'
   - `userStatus` → 'Active User'
   - `isBorrowed` → false
4. UUID is auto-generated for the `id` field

**SQL Generated (Behind the Scenes):**

```sql
INSERT INTO inventory (
  id, full_name, department, pc_name, pc_type,
  windows_version, microsoft_office, applications_system,
  status, user_status, remarks, serial_number,
  brand, model, purchase_date, warranty_expiry,
  assigned_to, is_borrowed, specifications,
  created_at, updated_at
) VALUES (
  'uuid-here', 'John Doe', 'IT Department', 'PC-001', 'DESKTOP',
  'Windows 11', 'Office 365', 'MS Office, Viber, Messenger',
  'Active User', 'Active User', 'Working condition', 'SN12345',
  'Dell', 'OptiPlex 7090', '2024-01-15', null,
  null, false, null,
  NOW(), NOW()
);
```

---

## 8. SUCCESS RESPONSE - Return Data to Frontend

### Location: `backend/src/controllers/inventoryController.js`

**What Happens:**

1. Created inventory object is returned
2. Response is sent to frontend with:
   - HTTP Status: 201 (Created)
   - Success flag: true
   - Message: "Inventory item created successfully"
   - Data: Complete inventory object with generated ID

**Response Structure:**

```json
{
  "success": true,
  "message": "Inventory item created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "department": "IT Department",
    "pcName": "PC-001",
    "pcType": "DESKTOP",
    "windowsVersion": "Windows 11",
    "microsoftOffice": "Office 365",
    "applicationsSystem": "MS Office, Viber, Messenger",
    "status": "Active User",
    "userStatus": "Active User",
    "brand": "Dell",
    "model": "OptiPlex 7090",
    "serialNumber": "SN12345",
    "purchaseDate": "2024-01-15",
    "isBorrowed": false,
    "createdAt": "2024-01-06T10:30:45.000Z",
    "updatedAt": "2024-01-06T10:30:45.000Z"
  }
}
```

---

## 9. FRONTEND RESPONSE HANDLING

### Location: `frontend/src/pages/Inventory.jsx` & Store

**What Happens:**

1. Frontend receives the 201 response
2. Success toast notification is shown: "Item added successfully"
3. Frontend state is updated:
   - New item is added to the inventory list
   - Modal dialog is closed
   - Form is reset
4. User sees the new item in the inventory table

**Update Flow:**

```
API Response (201)
    ↓
Toast: "Item added successfully"
    ↓
Update Inventory Store/State
    ↓
Refresh Inventory List Display
    ↓
Close Modal
    ↓
Reset Form Fields
```

---

## Directory Structure & File Paths

### Frontend Files Involved:

```
frontend/
├── src/
│   ├── pages/
│   │   └── Inventory.jsx          ← User clicks button here
│   ├── components/
│   │   └── Modal.jsx              ← Form component renders
│   ├── services/
│   │   └── inventoryService.js    ← API call is made from here
│   └── store/
│       └── inventoryStore.js      ← State management (if using)
```

### Backend Files Involved:

```
backend/
├── src/
│   ├── routes/
│   │   └── inventoryRoutes.js         ← Route definition (POST /api/inventory)
│   ├── controllers/
│   │   └── inventoryController.js     ← createInventory function
│   ├── models/
│   │   └── Inventory.js               ← Database model definition
│   ├── middleware/
│   │   ├── auth.js                    ← Authentication & authorization
│   │   └── errorHandler.js            ← Validation middleware
│   └── config/
│       └── database.js                ← Database connection
```

---

## Complete Request-Response Cycle Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND - User Interaction                              │
│    Location: frontend/src/pages/Inventory.jsx               │
│    User clicks "Add New Inventory Item" button              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FORM MODAL - Data Collection                             │
│    Location: frontend/src/components/Modal.jsx              │
│    User fills form and submits                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVICE LAYER - API Call Preparation                    │
│    Location: frontend/src/services/inventoryService.js      │
│    POST /api/inventory with form data                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ══════════════╬══════════════════
         Network Boundary (HTTP POST Request)
         ══════════════╬══════════════════
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ROUTING - Request Handling                               │
│    Location: backend/src/routes/inventoryRoutes.js          │
│    Route: POST /                                             │
│    Check: Authentication ✓ Authorization ✓ Validation ✓    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. MIDDLEWARE - Validation Check                            │
│    Location: backend/src/middleware/errorHandler.js         │
│    Validate: fullName, department, pcType                   │
│    If failed → Return 400 Error                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. CONTROLLER - Business Logic                              │
│    Location: backend/src/controllers/inventoryController.js │
│    Function: createInventory()                              │
│    Check duplicate serial number                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. MODEL & DATABASE - Data Persistence                      │
│    Location: backend/src/models/Inventory.js                │
│    Action: Sequelize ORM creates record in database         │
│    SQL: INSERT INTO inventory (...)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. RESPONSE GENERATION - Success/Error                      │
│    Location: backend/src/controllers/inventoryController.js │
│    Status: 201 Created                                      │
│    Response: { success: true, data: {...} }               │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ══════════════╬══════════════════
         Network Boundary (HTTP Response)
         ══════════════╬══════════════════
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. FRONTEND RESPONSE - Update UI                            │
│    Location: frontend/src/pages/Inventory.jsx               │
│    Show success toast notification                          │
│    Update inventory list                                    │
│    Close modal and reset form                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Scenarios & Status Codes

### 400 Bad Request - Validation Failed

**Location:** `backend/src/middleware/errorHandler.js`

```json
{
  "success": false,
  "errors": [
    {
      "msg": "Full name is required",
      "param": "fullName"
    }
  ]
}
```

### 400 Bad Request - Duplicate Serial Number

**Location:** `backend/src/controllers/inventoryController.js` (line ~156)

```json
{
  "success": false,
  "message": "Serial number already exists"
}
```

### 401 Unauthorized

**Location:** `backend/src/middleware/auth.js`

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden - Insufficient Permissions

**Location:** `backend/src/middleware/auth.js` (authorize check)

```json
{
  "success": false,
  "message": "Insufficient permissions. Only admin or manager can create inventory items"
}
```

### 500 Internal Server Error

**Possible Causes:**

- Database connection issue
- Unexpected error in controller
- Model definition error

---

## Key Technologies Used

| Layer                | Technology        | Purpose                            |
| -------------------- | ----------------- | ---------------------------------- |
| **Frontend**         | React.jsx         | UI component rendering             |
| **State Management** | Zustand/Context   | Store form data and inventory list |
| **HTTP Client**      | Axios             | Make API requests                  |
| **Backend**          | Express.js        | Web server & routing               |
| **Validation**       | express-validator | Validate request data              |
| **ORM**              | Sequelize         | Database operations                |
| **Database**         | MySQL/PostgreSQL  | Data persistence                   |
| **Authentication**   | JWT               | Secure API access                  |

---

## Security Features Implemented

1. **Authentication Middleware** - JWT token validation
2. **Authorization Middleware** - Role-based access (admin/manager only)
3. **Input Validation** - Express-validator checks all inputs
4. **Duplicate Prevention** - Check serial number uniqueness
5. **Data Sanitization** - Trim and validate all string inputs

---

## Summary

The process flow is:

```
User Action → Form Submission → Service API Call → Backend Route
→ Middleware Validation → Controller Logic → Database Insert
→ Response Generation → Frontend Update → UI Refresh
```

Each step validates data and handles errors appropriately, ensuring data integrity and security throughout the entire process.
