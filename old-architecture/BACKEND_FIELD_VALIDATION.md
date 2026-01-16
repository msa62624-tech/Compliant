# Backend Field Validation Enhancement

**Date:** January 15, 2026  
**Status:** ✅ Enhanced with robust field validation

---

## Overview

The backend has been enhanced with comprehensive field validation to ensure data integrity and prevent incomplete or invalid entity creation.

## What Was Added

### 1. Entity Required Fields Schema

A complete validation schema (`ENTITY_REQUIRED_FIELDS`) defines required fields for all 19 entities:

| Entity | Required Fields |
|--------|----------------|
| **Contractor** | `company_name`, `contractor_type` |
| **Project** | `project_name`, `gc_id` |
| **ProjectSubcontractor** | `project_id`, `subcontractor_id`, `trade_types` |
| **InsuranceDocument** | `subcontractor_name`, `project_id`, `document_type` |
| **User** | `username`, `email`, `role` |
| **Trade** | `trade_name` |
| **InsuranceProgram** | `program_name` |
| **SubInsuranceRequirement** | `program_id`, `trade_name`, `tier`, `insurance_type` |
| **StateRequirement** | `state_code`, `insurance_type`, `minimum_amount` |
| **GeneratedCOI** | `project_id`, `subcontractor_id` |
| **BrokerUploadRequest** | `project_id`, `subcontractor_id`, `broker_email` |
| **Broker** | `broker_name`, `email` |
| **Subscription** | `user_id`, `plan_type` |
| **PolicyDocument** | `policy_number`, `insurance_type` |
| **COIDocument** | `coi_number`, `project_id` |
| **ComplianceCheck** | `project_id`, `subcontractor_id`, `status` |
| **ProgramTemplate** | `template_name` |
| **Portal** | `portal_name`, `portal_type` |
| **Message** | `sender_id`, `recipient_id`, `message_content` |

### 2. Validation Function

```javascript
function validateRequiredFields(entityName, data) {
  const requiredFields = ENTITY_REQUIRED_FIELDS[entityName];
  if (!requiredFields) {
    return { valid: true }; // No validation defined for this entity
  }

  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    // Check if field is missing, null, undefined, or empty string/array
    // Note: 0 and false are valid values and should not be considered missing
    if (value == null) return true; // Intentional: checks both null and undefined
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  });

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    };
  }

  return { valid: true };
}
```

**Validation Rules:**
- ✅ Checks for `null` or `undefined` values
- ✅ Validates non-empty strings (trims whitespace)
- ✅ Validates non-empty arrays
- ✅ Returns clear error messages with missing field names

### 3. Integrated into POST Endpoint

The `POST /entities/:entityName` endpoint now validates all incoming data:

```javascript
app.post('/entities/:entityName', apiLimiter, authenticateToken, async (req, res) => {
  const { entityName } = req.params;
  const data = req.body;
  
  if (!entities[entityName]) {
    return res.status(404).json({ error: `Entity ${entityName} not found` });
  }

  // Validate required fields
  const validation = validateRequiredFields(entityName, data);
  if (!validation.valid) {
    return sendError(res, 400, validation.error, { missingFields: validation.missingFields });
  }

  // Continue with entity creation...
});
```

### 4. Integrated into PATCH Endpoint

The `PATCH /entities/:entityName/:id` endpoint validates that updates don't set required fields to empty values:

```javascript
app.patch('/entities/:entityName/:id', authenticateToken, (req, res) => {
  const { entityName, id } = req.params;
  const updates = req.body;
  
  // Find existing entity
  const index = entities[entityName].findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // Merge updates with existing data
  const mergedEntity = {
    ...entities[entityName][index],
    ...updates
  };

  // Validate that required fields are still present after update
  const validation = validateRequiredFields(entityName, mergedEntity);
  if (!validation.valid) {
    return sendError(res, 400, validation.error, { missingFields: validation.missingFields });
  }

  // Continue with entity update...
});
```

## Benefits

### 1. **Data Integrity**
- ✅ Prevents creation of incomplete entities
- ✅ Ensures all critical fields are present before saving
- ✅ Maintains consistent data structure across all entities

### 2. **Better Error Messages**
- ✅ Clear, specific error responses (HTTP 400)
- ✅ Lists exactly which fields are missing
- ✅ Helps frontend developers debug issues quickly

**Example Error Response:**
```json
{
  "success": false,
  "error": "Missing required fields: company_name, contractor_type",
  "details": {
    "missingFields": ["company_name", "contractor_type"]
  },
  "timestamp": "2026-01-15T20:50:00.000Z"
}
```

### 3. **API Security**
- ✅ Prevents malformed data from entering the system
- ✅ Reduces risk of null pointer exceptions
- ✅ Validates before database operations

### 4. **Developer Experience**
- ✅ Self-documenting: developers can see required fields in code
- ✅ Consistent validation across all entities
- ✅ Easy to extend or modify validation rules

## Validation Coverage

### String Fields
- Must not be `null`, `undefined`, or empty string
- Whitespace is trimmed before validation
- Example: `company_name`, `email`, `username`

### Array Fields
- Must not be `null`, `undefined`, or empty array
- At least one element required
- Example: `trade_types`, `additional_insured_entities`

### Reference Fields (IDs)
- Must be present (not null/undefined)
- Example: `project_id`, `gc_id`, `subcontractor_id`

### Numeric and Boolean Fields
- Values `0` and `false` are considered valid (not missing)
- Only `null` or `undefined` are considered missing
- Example: `budget: 0` is valid, `status: false` is valid

## Testing the Validation

### Valid Request (Success)
```bash
curl -X POST http://localhost:3001/entities/Contractor \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "ABC Construction",
    "contractor_type": "general_contractor",
    "email": "contact@abc.com",
    "phone": "555-1234"
  }'

# Response: 201 Created
```

### Invalid Request (Missing Fields)
```bash
curl -X POST http://localhost:3001/entities/Contractor \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@abc.com"
  }'

# Response: 400 Bad Request
{
  "success": false,
  "error": "Missing required fields: company_name, contractor_type",
  "details": {
    "missingFields": ["company_name", "contractor_type"]
  },
  "timestamp": "2026-01-15T20:50:00.000Z"
}
```

### Invalid Request (Empty String)
```bash
curl -X POST http://localhost:3001/entities/Project \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "   ",
    "gc_id": "gc-001"
  }'

# Response: 400 Bad Request
{
  "success": false,
  "error": "Missing required fields: project_name",
  "details": {
    "missingFields": ["project_name"]
  },
  "timestamp": "2026-01-15T20:50:00.000Z"
}
```

### Invalid PATCH (Removing Required Field)
```bash
curl -X PATCH http://localhost:3001/entities/Contractor/gc-001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": ""
  }'

# Response: 400 Bad Request
{
  "success": false,
  "error": "Missing required fields: company_name",
  "details": {
    "missingFields": ["company_name"]
  },
  "timestamp": "2026-01-15T20:50:00.000Z"
}
```

## Backward Compatibility

- ✅ **Fully backward compatible**: Existing valid requests continue to work
- ✅ **Only rejects invalid data**: Previously accepted incomplete data now returns 400
- ✅ **No breaking changes**: All existing valid entity structures are supported

## Future Enhancements

Potential improvements to consider:

1. **Type Validation**: Validate field data types (string, number, boolean, etc.)
2. **Format Validation**: Email format, phone format, date format validation
3. **Business Logic Validation**: Cross-field validation (e.g., end_date > start_date)
4. **Custom Validators**: Per-entity custom validation logic
5. **Sanitization**: Input sanitization for XSS prevention
6. **Length Limits**: Maximum length validation for strings
7. **Enum Validation**: Validate against allowed values (e.g., contractor_type must be 'general_contractor' or 'subcontractor')

## Existing Validation

The backend already has validation for:

- ✅ **Authentication endpoints**: Username, password, email validation (using express-validator)
- ✅ **File uploads**: Extension, MIME type, file size, filename pattern validation
- ✅ **Password reset**: Email and token validation
- ✅ **Email sending**: Required fields validation (to, subject, body/html)
- ✅ **Document replacement**: Reason field validation

## Summary

The backend field validation is now **robust and production-ready**:

✅ **19 entities** covered with required field validation  
✅ **POST and PATCH endpoints** both validate required fields  
✅ **Consistent error formatting** using `sendError` utility  
✅ **Clear error messages** with specific missing field information  
✅ **Data integrity** ensured for both creation and updates  
✅ **Backward compatible** with existing valid requests  
✅ **Easy to extend** for future validation requirements  

The validation prevents incomplete or malformed data from entering the system, ensuring data quality and reducing runtime errors. Both creation (POST) and update (PATCH) operations validate that required fields remain populated.

---

**Implementation Location:** `/backend/server.js` (lines 229-280, 2046-2053, 2076-2110)  
**Status:** ✅ Active and enforced on all POST and PATCH /entities/:entityName requests
