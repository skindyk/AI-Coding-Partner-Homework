# Bruno API Collection - Intelligent Customer Support System

A comprehensive Bruno API test collection for validating the Customer Support Ticket Management System API.

## Overview

This collection contains 18 test scenarios covering:
- ✅ Health checks
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Bulk import (JSON, CSV, XML)
- ✅ Auto-classification
- ✅ Audit logging and statistics
- ✅ Error validation and edge cases

## Setup

### Prerequisites
- [Bruno](https://www.usebruno.com/) - API client installed
- Node.js server running on `http://localhost:3000`
- API endpoints available at `http://localhost:3000/api`

### Installation

1. Open Bruno
2. Click "Open Collection"
3. Navigate to the `bruno-collection` folder in this repository
4. The collection will load with all test scenarios

### Configuration

The collection uses the **local** environment by default:
- **Base URL**: `http://localhost:3000`
- **API URL**: `http://localhost:3000/api`

To use a different environment:
1. Create a new environment file in `environments/` folder
2. Define the variables: `base_url` and `api_url`
3. Switch to the environment in Bruno

## Test Scenarios

### Tickets Management

| # | Test | Method | Endpoint | Purpose |
|---|------|--------|----------|---------|
| 1 | Health Check | GET | `/` | Verify API is running |
| 2 | Create Ticket | POST | `/api/tickets` | Create a new support ticket |
| 3 | Get All Tickets | GET | `/api/tickets` | Retrieve all tickets |
| 4 | Get Tickets (Filtered) | GET | `/api/tickets?category=X&priority=Y` | Retrieve tickets with filters |
| 5 | Get Specific Ticket | GET | `/api/tickets/{id}` | Retrieve ticket by ID |
| 6 | Update Ticket | PUT | `/api/tickets/{id}` | Update ticket fields |
| 7 | Auto-Classify Ticket | POST | `/api/tickets/{id}/auto-classify` | Auto-classify by AI |
| 8 | Create Technical Ticket | POST | `/api/tickets` | Create high-priority tech ticket |
| 15 | Delete Ticket | DELETE | `/api/tickets/{id}` | Delete a ticket |

### Bulk Import

| # | Test | Format | Purpose |
|---|------|--------|---------|
| 9 | Import JSON | JSON | Bulk import tickets from JSON |
| 10 | Import CSV | CSV | Bulk import tickets from CSV |
| 11 | Import XML | XML | Bulk import tickets from XML |

### Audit & Logging

| # | Test | Method | Endpoint | Purpose |
|---|------|--------|----------|---------|
| 12 | Get Audit Logs | GET | `/api/audit-logs` | Retrieve all audit logs |
| 13 | Audit Logs (Filtered) | GET | `/api/audit-logs?ticket_id=X` | Get logs for specific ticket |
| 14 | Audit Statistics | GET | `/api/audit-stats` | Get audit statistics |

### Error Handling & Validation

| # | Test | Expected Status | Purpose |
|---|------|-----------------|---------|
| 16 | Missing Email | 400 | Validate required fields |
| 17 | Invalid Category | 400 | Validate enum values |
| 18 | Ticket Not Found | 404 | Validate error handling |

## Running the Tests

### Option 1: Run All Tests
1. In Bruno, right-click on "Intelligent Customer Support System - API Tests"
2. Click "Run Collection"
3. Tests will execute in sequence

### Option 2: Run Individual Test
1. Click on a specific test (e.g., "Create Ticket")
2. Click "Send" button
3. View response and test output in console

### Option 3: Run via CLI (Bruno CLI)
```bash
bru run /path/to/bruno-collection --env local
```

## Test Results

After running the collection, you'll see:
- ✅ **PASSED**: Green checkmark with test details
- ❌ **FAILED**: Red X with error information
- **Response Details**: Status code, response body, and timing

### Example Output
```
✓ Create Ticket: PASSED
  Ticket ID: 550e8400-e29b-41d4-a716-446655440000
  Status: new
✓ Auto-Classify Ticket: PASSED
  Category: account_access
  Priority: urgent
  Confidence: 0.95
```

## Key Features

### Dynamic Variables
Tests automatically capture ticket IDs and reuse them in subsequent requests:
- `{{ticket_id}}` - Used for updates, classification, deletion
- `{{ticket_id_2}}` - Used for multi-ticket scenarios

### Pre-request Scripts
- Set up variables
- Generate dynamic data

### Post-response Scripts
- Validate response structure
- Parse and log response data
- Set variables for next tests
- Display pass/fail with details

### Environment Variables
```
base_url: http://localhost:3000
api_url: http://localhost:3000/api
ticket_id: (auto-populated)
```

## API Response Format

### Success Response (201, 200)
```json
{
  "success": true,
  "ticket": { ... },
  "message": "Optional message"
}
```

### Error Response (400, 404, 500)
```json
{
  "success": false,
  "error": "Description of error",
  "details": ["Detail 1", "Detail 2"]
}
```

## Valid Enum Values

### Categories
- `account_access`
- `technical_issue`
- `billing_question`
- `feature_request`
- `bug_report`
- `other`

### Priorities
- `urgent`
- `high`
- `medium`
- `low`

### Status Values
- `new`
- `in_progress`
- `waiting_customer`
- `resolved`
- `closed`

## Troubleshooting

### ❌ "API is not responding"
- Ensure the Node.js server is running on port 3000
- Check: `http://localhost:3000` in browser
- Run `npm start` in the project directory

### ❌ "Ticket not found"
- Ensure you run tests in sequence (variables depend on previous tests)
- Or manually set `ticket_id` in environment variables
- Test 2 (Create Ticket) must run before Test 5

### ❌ Import tests failing
- Verify CSV/JSON/XML format matches specification
- Check file_type parameter matches: "csv", "json", or "xml"

### ❌ Validation errors
- Check required fields are present
- Verify enum values are correct
- Email format must be valid

## Performance Metrics

Bruno automatically tracks:
- **Response Time**: Time taken for API to respond
- **Status Code**: HTTP status of response
- **Response Size**: Size of response body

## Documentation References

- [API_REFERENCE.md](../docs/API_REFERENCE.md) - Complete API documentation
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [README.md](../README.md) - Project overview

## Support

For issues or questions:
1. Check the API_REFERENCE.md for endpoint details
2. Review error messages in the response
3. Ensure environment variables are set correctly
4. Verify data format matches examples

---

**Last Updated**: March 15, 2026
**API Version**: v1
**Collection Version**: 1.0
