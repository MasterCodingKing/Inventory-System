# Architecture & Data Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                   │
│                    http://localhost:5173                                    │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │                                                                       │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Pages/Inventory.jsx                                         │    │   │
│ │  │ - User clicks "Add New Inventory Item"                     │    │   │
│ │  │ - Renders inventory list and table                         │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │ opens                                     │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Components/Modal.jsx                                        │    │   │
│ │  │ - Form modal with input fields                             │    │   │
│ │  │ - Collects: fullName, department, pcType, etc.            │    │   │
│ │  │ - On submit: calls inventoryService.create(data)          │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │ calls                                      │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Services/inventoryService.js                               │    │   │
│ │  │ - create(data) → api.post('/inventory', data)             │    │   │
│ │  │ - Makes HTTP POST request                                 │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Store/inventoryStore.js (Zustand/Context)                │    │   │
│ │  │ - Stores inventory list state                             │    │   │
│ │  │ - Updates on successful creation                          │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ └─────────────────────────┼───────────────────────────────────────────┘   │
│                           │                                               │
└───────────────────────────┼───────────────────────────────────────────────┘
                            │
                    POST /api/inventory
                    Content-Type: application/json
                    Authorization: Bearer {JWT}
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NETWORK / HTTP REQUEST                                 │
│                                                                             │
│  Headers:                                                                   │
│  - Content-Type: application/json                                          │
│  - Authorization: Bearer eyJhbGc...                                         │
│  - User-Agent: Mozilla/5.0...                                              │
│                                                                             │
│  Body (JSON):                                                               │
│  {                                                                          │
│    "fullName": "John Doe",                                                │
│    "department": "IT Department",                                          │
│    "pcType": "DESKTOP",                                                   │
│    "windowsVersion": "Windows 11",                                        │
│    ...                                                                     │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express.js)                                 │
│                   http://localhost:5000                                     │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │                                                                       │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ server.js (Entry Point)                                     │    │   │
│ │  │ - Express app initialization                               │    │   │
│ │  │ - Middleware setup                                          │    │   │
│ │  │ - Route registration                                        │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Routes/inventoryRoutes.js                                   │    │   │
│ │  │ ─────────────────────────────────────────────────          │    │   │
│ │  │ POST / :                                                    │    │   │
│ │  │  1. authorize('admin', 'manager')  [CHECK ROLE]            │    │   │
│ │  │  2. inventoryValidation            [VALIDATE INPUT]        │    │   │
│ │  │  3. validate                       [EXECUTE VALIDATION]    │    │   │
│ │  │  4. createInventory                [CONTROLLER]            │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Middleware/auth.js                                          │    │   │
│ │  │ ──────────────────                                          │    │   │
│ │  │ authenticate(req, res, next)                               │    │   │
│ │  │ - Extract JWT from Authorization header                    │    │   │
│ │  │ - Verify JWT signature                                      │    │   │
│ │  │ - Attach user to req.user                                   │    │   │
│ │  │                                                              │    │   │
│ │  │ authorize('admin', 'manager')                              │    │   │
│ │  │ - Check if req.user.role is in allowed roles              │    │   │
│ │  │ - If not → Return 403 Forbidden                            │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │ (if authorized)                            │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Middleware/errorHandler.js (validate function)             │    │   │
│ │  │ ──────────────────────────────────────────────             │    │   │
│ │  │ Validation Rules:                                          │    │   │
│ │  │ ✓ fullName: required & trimmed                            │    │   │
│ │  │ ✓ department: required & trimmed                          │    │   │
│ │  │ ✓ pcType: required & in [LAPTOP, DESKTOP, ...]          │    │   │
│ │  │                                                              │    │   │
│ │  │ If validation fails:                                        │    │   │
│ │  │ - Return 400 Bad Request with error details               │    │   │
│ │  │                                                              │    │   │
│ │  │ If validation passes:                                       │    │   │
│ │  │ - Call next() → Continue to controller                    │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Controllers/inventoryController.js                          │    │   │
│ │  │ ────────────────────────────────────                        │    │   │
│ │  │ createInventory(req, res, next):                           │    │   │
│ │  │                                                              │    │   │
│ │  │ 1. Extract data from req.body:                            │    │   │
│ │  │    - fullName, department, pcType, etc.                   │    │   │
│ │  │                                                              │    │   │
│ │  │ 2. Check for duplicate serialNumber:                      │    │   │
│ │  │    - Inventory.findOne({                                  │    │   │
│ │  │        where: { serialNumber }                            │    │   │
│ │  │      })                                                    │    │   │
│ │  │    - If exists → Return 400                               │    │   │
│ │  │                                                              │    │   │
│ │  │ 3. Create new inventory:                                  │    │   │
│ │  │    - Inventory.create({                                   │    │   │
│ │  │        fullName, department, pcType, ...                  │    │   │
│ │  │      })                                                    │    │   │
│ │  │    - DB generates UUID for id                             │    │   │
│ │  │    - Sets default values                                   │    │   │
│ │  │                                                              │    │   │
│ │  │ 4. Return response (201 Created)                          │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Models/Inventory.js (Sequelize ORM)                        │    │   │
│ │  │ ───────────────────────────────────                        │    │   │
│ │  │ Defines inventory model with fields:                       │    │   │
│ │  │ - id (UUID, Primary Key)                                   │    │   │
│ │  │ - fullName (String, required)                             │    │   │
│ │  │ - department (String, required)                           │    │   │
│ │  │ - pcType (ENUM)                                            │    │   │
│ │  │ - windowsVersion (ENUM)                                    │    │   │
│ │  │ - microsoftOffice (ENUM)                                   │    │   │
│ │  │ - serialNumber (String, unique)                           │    │   │
│ │  │ - ... (and 10+ more fields)                               │    │   │
│ │  │                                                              │    │   │
│ │  │ Generates Sequelize methods:                               │    │   │
│ │  │ - create(), findOne(), findByPk(), update(), destroy()    │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Config/sequelize.js                                        │    │   │
│ │  │ ─────────────────                                          │    │   │
│ │  │ - Sequelize instance                                       │    │   │
│ │  │ - DB connection configuration                             │    │   │
│ │  │ - Model sync                                               │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Database Layer                                              │    │   │
│ │  │ ──────────────                                             │    │   │
│ │  │ Generates SQL & executes:                                  │    │   │
│ │  │                                                              │    │   │
│ │  │ INSERT INTO inventory (                                     │    │   │
│ │  │   id, full_name, department, pc_type,                     │    │   │
│ │  │   windows_version, microsoft_office, ...                  │    │   │
│ │  │ ) VALUES (                                                 │    │   │
│ │  │   'uuid', 'John Doe', 'IT Dept', 'DESKTOP', ...          │    │   │
│ │  │ )                                                           │    │   │
│ │  │                                                              │    │   │
│ │  │ Returns:                                                    │    │   │
│ │  │ - Generated ID                                             │    │   │
│ │  │ - Confirmation of creation                                │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ │                         ▼                                           │   │
│ │  ┌─────────────────────────────────────────────────────────────┐    │   │
│ │  │ Response Preparation                                        │    │   │
│ │  │ ───────────────────                                        │    │   │
│ │  │ {                                                            │    │   │
│ │  │   "success": true,                                         │    │   │
│ │  │   "message": "Inventory item created successfully",       │    │   │
│ │  │   "data": {                                               │    │   │
│ │  │     "id": "550e8400...",                                 │    │   │
│ │  │     "fullName": "John Doe",                              │    │   │
│ │  │     "department": "IT Department",                       │    │   │
│ │  │     "pcType": "DESKTOP",                                 │    │   │
│ │  │     "createdAt": "2024-01-06T10:30:45.000Z",            │    │   │
│ │  │     ...                                                    │    │   │
│ │  │   }                                                         │    │   │
│ │  │ }                                                            │    │   │
│ │  │                                                              │    │   │
│ │  │ HTTP Status: 201 Created                                   │    │   │
│ │  └──────────────────────┬──────────────────────────────────────┘    │   │
│ │                         │                                           │   │
│ └─────────────────────────┼───────────────────────────────────────────┘   │
│                           │                                               │
└───────────────────────────┼───────────────────────────────────────────────┘
                            │
                    HTTP Response (201)
                    Content-Type: application/json
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Response Handling)                           │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ inventoryService.js receives 201 response                        │     │
│  │ - Response data contains new inventory item                      │     │
│  └────────────────┬─────────────────────────────────────────────────┘     │
│                   │                                                        │
│                   ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ Pages/Inventory.jsx handles success                              │     │
│  │ - Show toast: "Item added successfully"                          │     │
│  │ - Update inventory store/state                                   │     │
│  │ - Add new item to inventory list                                 │     │
│  │ - Close modal                                                    │     │
│  │ - Reset form fields                                              │     │
│  └────────────────┬─────────────────────────────────────────────────┘     │
│                   │                                                        │
│                   ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ UI Update                                                        │     │
│  │ - Inventory list shows new item                                  │     │
│  │ - Item count increases                                           │     │
│  │ - User sees confirmation                                         │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```
┌─────────────────────────────────────┐
│         INVENTORY TABLE             │
├─────────────────────────────────────┤
│ id (UUID) - PRIMARY KEY             │
│ full_name (VARCHAR) - NOT NULL      │
│ department (VARCHAR) - NOT NULL     │
│ pc_name (VARCHAR)                   │
│ pc_type (ENUM) - NOT NULL           │
│   ├─ LAPTOP                         │
│   ├─ DESKTOP                        │
│   └─ LAPTOP DESKTOP                 │
│ windows_version (ENUM)              │
│   ├─ Windows 10                     │
│   ├─ Windows 11                     │
│   └─ Windows Server                 │
│ microsoft_office (ENUM)             │
│   ├─ Office 365                     │
│   ├─ Office LTSC                    │
│   ├─ Office 2021                    │
│   ├─ Office 2019                    │
│   └─ None                           │
│ applications_system (VARCHAR)       │
│ status (ENUM)                       │
│   ├─ Active User (default)          │
│   ├─ Transfer                       │
│   ├─ For Upgrade                    │
│   ├─ Available                      │
│   ├─ Maintenance                    │
│   └─ Retired                        │
│ user_status (ENUM)                  │
│   ├─ Active User (default)          │
│   ├─ Inactive                       │
│   └─ On Leave                       │
│ remarks (TEXT)                      │
│ serial_number (VARCHAR) - UNIQUE    │
│ brand (VARCHAR)                     │
│ model (VARCHAR)                     │
│ purchase_date (DATE)                │
│ warranty_expiry (DATE)              │
│ assigned_to (UUID) - FOREIGN KEY    │
│ is_borrowed (BOOLEAN) - DEFAULT 0   │
│ specifications (JSON)               │
│ created_at (TIMESTAMP)              │
│ updated_at (TIMESTAMP)              │
└─────────────────────────────────────┘
         │
         └─► REFERENCES: users(id)
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────┐
│ Store/inventoryStore.js (Zustand/Context)          │
│ ────────────────────────────────────────────       │
│                                                     │
│ State:                                              │
│ ├─ inventoryList: []                               │
│ ├─ isLoading: false                                │
│ ├─ error: null                                      │
│ └─ filters: {}                                      │
│                                                     │
│ Actions:                                            │
│ ├─ setInventoryList(items)                          │
│ ├─ addInventoryItem(item)        ◄── NEW ITEM     │
│ ├─ updateInventoryItem(id, data)                    │
│ ├─ deleteInventoryItem(id)                          │
│ ├─ setLoading(boolean)                             │
│ └─ setError(error)                                 │
│                                                     │
└────────────────┬──────────────────────────────────┘
                 │ used by
                 ▼
┌─────────────────────────────────────────────────────┐
│ Components that consume inventory state             │
│ ──────────────────────────────────────            │
│ - Pages/Inventory.jsx                               │
│ - Components/InventoryTable.jsx                     │
│ - Components/InventoryList.jsx                      │
│ - And other components                              │
└─────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────┐
│ Error Occurs at Any Point                                │
└────────────────┬─────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    Backend         Frontend
         │                │
         ▼                │
   try/catch block        │
         │                │
    ┌────┴────┐           │
    │          │           │
   Error    Pass           │
    │                      │
    ▼                      │
next(error) ─────────────► │
         │                 │
         ▼                 │
Error Handler Middleware   │
         │                 │
    ┌────┴──────────────────────────┐
    │                               │
Validation Error?  Unique Constraint?  Database Error?
    │                   │                 │
    ▼                   ▼                 ▼
  400              400                 500
  Bad            Duplicate            Internal
  Request        Entry                Server Error
    │                   │                 │
    └───────┬───────────┴─────────────────┘
            │
            ▼
    JSON Error Response
            │
            ├─ success: false
            ├─ message: "Error description"
            └─ errors: [{field, message}]
            │
            └──────► Frontend receives response
                            │
                            ▼
                    Show toast/alert to user
                    Display error message
                    Log to console (dev)
```

---

## Security Layers

```
┌────────────────────────────────────────────────────────┐
│ Frontend Security                                      │
│ ────────────────                                      │
│ 1. Client-side validation                             │
│ 2. Token storage in secure storage                    │
│ 3. HTTPS communication                                │
│ 4. CORS policy enforcement                            │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Network Security                                       │
│ ─────────────────                                     │
│ 1. HTTPS/TLS encryption                              │
│ 2. Secure header transmission                         │
│ 3. Token in Authorization header                     │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Backend Security - Layer 1: Authentication            │
│ ──────────────────────────────────────────           │
│ 1. JWT token verification                            │
│ 2. Token expiration check                            │
│ 3. User identification                               │
│ If fails → 401 Unauthorized                          │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Backend Security - Layer 2: Authorization             │
│ ──────────────────────────────────────────           │
│ 1. Check user role (admin/manager)                   │
│ 2. Check resource ownership                          │
│ 3. Check action permissions                          │
│ If fails → 403 Forbidden                             │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Backend Security - Layer 3: Input Validation          │
│ ────────────────────────────────────────             │
│ 1. Express-validator checks                          │
│ 2. Type validation                                   │
│ 3. Format validation                                 │
│ 4. Length limits                                     │
│ 5. Enum value validation                             │
│ If fails → 400 Bad Request                           │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Backend Security - Layer 4: Business Logic            │
│ ────────────────────────────────────────             │
│ 1. Duplicate check                                   │
│ 2. Data integrity validation                         │
│ 3. Foreign key validation                            │
│ If fails → 400 Bad Request                           │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Database Security                                      │
│ ──────────────────                                   │
│ 1. Parameterized queries (ORM)                       │
│ 2. No SQL injection possible                         │
│ 3. User isolation                                    │
│ 4. Connection encryption                             │
│ 5. Data encryption at rest                           │
└────────────────────────────────────────────────────────┘
```

This comprehensive architecture shows how data flows through the entire application with proper validation, error handling, and security at each layer.
