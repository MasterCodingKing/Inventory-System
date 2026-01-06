# Troubleshooting Guide - Add Inventory Item

## Common Errors & Solutions

### Error: 500 Internal Server Error

**Cause:** Server-side error in the create inventory function.

**Steps to Fix:**

1. **Check Backend Server is Running**

   - Terminal: `node`
   - Command: `cd backend && npm start`
   - Expected: Server running on `http://localhost:5173`

2. **Check Database Connection**

   - Verify MySQL/PostgreSQL is running
   - Check connection settings in `backend/src/config/database.js`
   - Ensure database exists and is accessible

3. **Check Logs**

   - Look at terminal output for detailed error message
   - Error log format: `Error: [error details]`

4. **Common Backend Errors:**
   - Database not running → Start your database service
   - Invalid JWT token → Re-login to refresh token
   - Model mismatch → Check field names match database schema

---

### Error: 400 Bad Request - Validation Failed

**Cause:** Form data doesn't match validation rules.

**Required Fields:**

- ✅ `fullName` - Cannot be empty
- ✅ `department` - Cannot be empty
- ✅ `pcType` - Must be: LAPTOP, DESKTOP, or LAPTOP DESKTOP

**Solution:**

- Fill all required fields (marked with `*`)
- Check dropdown selection for `pcType`
- Ensure no leading/trailing spaces

---

### Error: 403 Forbidden - Insufficient Permissions

**Cause:** User doesn't have admin or manager role.

**Solution:**

- Login as admin or manager user
- Only admin and manager can create inventory items
- Check user role in `backend/src/models/User.js`

---

### Error: Duplicate Serial Number

**Cause:** Serial number already exists in database.

**Solution:**

- Leave serial number blank (it's optional)
- OR use a unique serial number
- Serial number must be unique across all inventory items

---

## Testing the Add Inventory Flow

### Prerequisites Check:

- [ ] Backend server is running
- [ ] Database is connected
- [ ] User is logged in with admin/manager role
- [ ] JWT token is valid

### Step-by-Step Test:

1. **Open Inventory Page**

   - Navigate to: Inventory tab
   - Click: "Add New Inventory Item" button
   - Modal should appear with form

2. **Fill Form**

   ```
   Full Name: John Doe (required)
   Department: IT Department (required)
   PC Type: DESKTOP (required - select from dropdown)
   PC Name: PC-001 (optional)
   Windows Version: Windows 11 (optional)
   Microsoft Office: Office 365 (optional)
   ```

3. **Check Browser Console**

   - Open DevTools (F12)
   - Go to Console tab
   - Look for errors or API responses
   - Check Network tab for POST request

4. **Submit Form**

   - Click "Save" or "Submit" button
   - Check response:
     - ✅ Success: Item appears in list, toast shows "Item added successfully"
     - ❌ Error: Error message appears, check error details

5. **Verify in Database**
   - Query: `SELECT * FROM inventory ORDER BY created_at DESC LIMIT 1;`
   - New item should be there

---

## API Endpoint Details

### Endpoint: POST /api/inventory

**Request Format:**

```http
POST /api/inventory HTTP/1.1
Host: localhost:5173
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "fullName": "John Doe",
  "department": "IT Department",
  "pcName": "PC-001",
  "pcType": "DESKTOP",
  "windowsVersion": "Windows 11",
  "microsoftOffice": "Office 365",
  "applicationsSystem": "MS Office, Viber, Messenger",
  "brand": "Dell",
  "model": "OptiPlex 7090",
  "serialNumber": "SN12345",
  "purchaseDate": "2024-01-15",
  "remarks": "Working condition"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Inventory item created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "department": "IT Department",
    "pcType": "DESKTOP",
    "createdAt": "2024-01-06T10:30:45.000Z",
    ...
  }
}
```

**Error Response (400/500):**

```json
{
  "success": false,
  "message": "Error description",
  "errors": [...]
}
```

---

## Debugging Tips

### Enable Detailed Logging

**Backend (backend/src/controllers/inventoryController.js):**

```javascript
// Add at start of createInventory function
console.log("Create Inventory Request:");
console.log("Body:", req.body);
console.log("User:", req.user);
```

### Browser DevTools

**Network Tab:**

- Click on POST request to `/api/inventory`
- Check `Request` tab for sent data
- Check `Response` tab for server response
- Check `Headers` for authorization token

**Console Tab:**

- Look for JavaScript errors
- API response logs
- Network errors

---

## Required Environment Variables

### Backend (.env file)

```
DATABASE_URL=mysql://user:password@localhost:3306/inventory_db
JWT_SECRET=your_secret_key
NODE_ENV=development
PORT=5000
```

### Frontend (.env file)

```
VITE_API_URL=http://localhost:5173/api
```

---

## File Checklist for Add Inventory Feature

### Frontend Files Required:

- ✅ `frontend/src/pages/Inventory.jsx` - Main inventory page
- ✅ `frontend/src/components/Modal.jsx` - Form modal component
- ✅ `frontend/src/services/inventoryService.js` - API service
- ✅ `frontend/src/store/inventoryStore.js` - State management

### Backend Files Required:

- ✅ `backend/src/routes/inventoryRoutes.js` - Route definition
- ✅ `backend/src/controllers/inventoryController.js` - Controller logic
- ✅ `backend/src/models/Inventory.js` - Database model
- ✅ `backend/src/middleware/auth.js` - Authentication
- ✅ `backend/src/middleware/errorHandler.js` - Error handling
- ✅ `backend/src/config/database.js` - Database config

---

## Quick Restart Guide

### If Everything Fails:

1. **Stop Services**

   ```bash
   # Backend terminal
   Ctrl+C

   # Frontend terminal
   Ctrl+C
   ```

2. **Clean and Rebuild**

   ```bash
   # Backend
   cd backend
   rm -rf node_modules
   npm install
   npm start

   # Frontend (new terminal)
   cd frontend
   rm -rf node_modules
   npm install
   npm run dev
   ```

3. **Clear Browser Cache**

   - F12 → Application → Storage → Clear All
   - Reload page: Ctrl+Shift+R

4. **Check Database**
   - Ensure database service is running
   - Test connection: `mysql -u user -p database_name`

---

## Success Indicators

✅ **Everything is working when:**

- Form modal opens without errors
- Form data submits successfully
- Toast notification shows "Item added successfully"
- New item appears in inventory table
- Item appears in database
- Console has no errors
- Network tab shows 201 response

---

## Support Matrix

| Issue             | Location             | Check                             |
| ----------------- | -------------------- | --------------------------------- |
| Form doesn't open | `Modal.jsx`          | Check Modal component is imported |
| Fields are empty  | `inventoryStore.js`  | Check state initialization        |
| Validation errors | `inventoryRoutes.js` | Check validation rules            |
| Database error    | `Inventory.js`       | Check model definition            |
| Permission error  | `auth.js`            | Check user role                   |
| Network error     | Network tab          | Check API URL and CORS            |
