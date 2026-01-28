# API Reference - Intelligent Customer Support System

Complete API documentation for the Customer Support Ticket Management System.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. In production, implement JWT or API key authentication.

## Response Format

All responses are in JSON format.

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": ["Detail 1", "Detail 2"]
}
```

---

## Endpoints

### 1. Create Ticket

Creates a new support ticket.

**Endpoint:** `POST /tickets`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_id": "cust_001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot access my account",
  "description": "I have been unable to access my account for the past 2 days",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "tags": ["login", "urgent"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome",
    "device_type": "desktop"
  }
}
```

**Valid Values:**
- `category`: account_access, technical_issue, billing_question, feature_request, bug_report, other
- `priority`: urgent, high, medium, low
- `status`: new, in_progress, waiting_customer, resolved, closed
- `metadata.source`: web_form, email, api, chat, phone
- `metadata.device_type`: desktop, mobile, tablet

**Response (201 Created):**
```json
{
  "success": true,
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "cust_001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot access my account",
    "description": "I have been unable to access my account for the past 2 days",
    "category": "account_access",
    "priority": "high",
    "status": "new",
    "created_at": "2026-01-27T13:42:30.123Z",
    "updated_at": "2026-01-27T13:42:30.123Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": ["login", "urgent"],
    "metadata": {
      "source": "web_form",
      "browser": "Chrome",
      "device_type": "desktop"
    },
    "classification_confidence": null,
    "classification_reasoning": null
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "customer_email is required and must be a valid email",
    "subject must be between 1 and 200 characters"
  ]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot access my account",
    "description": "I have been unable to access my account for the past 2 days",
    "category": "account_access",
    "priority": "high"
  }'
```

---

### 2. List All Tickets

Retrieves all tickets with optional filtering.

**Endpoint:** `GET /tickets`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by ticket category |
| priority | string | Filter by priority level |
| status | string | Filter by status |
| customer_id | string | Filter by customer ID |
| assigned_to | string | Filter by assignee |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "tickets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_id": "cust_001",
      "customer_email": "john@example.com",
      "customer_name": "John Doe",
      "subject": "Cannot access my account",
      "category": "account_access",
      "priority": "high",
      "status": "new",
      "created_at": "2026-01-27T13:42:30.123Z",
      "updated_at": "2026-01-27T13:42:30.123Z"
    }
  ]
}
```

**cURL Examples:**
```bash
# Get all tickets
curl http://localhost:3000/api/tickets

# Get urgent tickets
curl "http://localhost:3000/api/tickets?priority=urgent"

# Get technical issues assigned to support_team
curl "http://localhost:3000/api/tickets?category=technical_issue&assigned_to=support_team"
```

---

### 3. Get Specific Ticket

Retrieves a single ticket by ID.

**Endpoint:** `GET /tickets/{ticket_id}`

**Response (200 OK):**
```json
{
  "success": true,
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "cust_001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot access my account",
    "description": "I have been unable to access my account for the past 2 days",
    "category": "account_access",
    "priority": "high",
    "status": "new",
    "created_at": "2026-01-27T13:42:30.123Z",
    "updated_at": "2026-01-27T13:42:30.123Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": ["login", "urgent"],
    "metadata": {
      "source": "web_form",
      "browser": "Chrome",
      "device_type": "desktop"
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Ticket not found"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### 4. Update Ticket

Updates an existing ticket.

**Endpoint:** `PUT /tickets/{ticket_id}`

**Request Body (all fields optional):**
```json
{
  "subject": "Updated subject",
  "description": "Updated description",
  "category": "technical_issue",
  "priority": "urgent",
  "status": "in_progress",
  "assigned_to": "support_team",
  "tags": ["updated", "tag"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "in_progress",
    "assigned_to": "support_team",
    "updated_at": "2026-01-27T13:45:00.123Z"
  }
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "support_team"
  }'
```

---

### 5. Delete Ticket

Deletes a ticket.

**Endpoint:** `DELETE /tickets/{ticket_id}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### 6. Bulk Import Tickets

Imports multiple tickets from CSV, JSON, or XML file.

**Endpoint:** `POST /tickets/import`

**Request Body:**
```json
{
  "file_content": "[{...}]",
  "file_type": "json"
}
```

**Parameters:**
- `file_content`: String containing file contents (CSV, JSON, or XML)
- `file_type`: Type of file - "csv", "json", or "xml"

**Response (207 Multi-Status):**
```json
{
  "success": true,
  "summary": {
    "total": 100,
    "successful": 98,
    "failed": 2
  },
  "failed_records": [
    {
      "record_number": 5,
      "errors": ["customer_email is required and must be a valid email"]
    },
    {
      "record_number": 87,
      "errors": ["description must be between 10 and 2000 characters"]
    }
  ],
  "imported_tickets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_id": "cust_001",
      "customer_email": "john@example.com"
    }
  ]
}
```

**Example - CSV Import:**
```bash
CSV_CONTENT=$(cat tests/fixtures/sample_tickets.csv)

curl -X POST http://localhost:3000/api/tickets/import \
  -H "Content-Type: application/json" \
  -d "{
    \"file_content\": \"$CSV_CONTENT\",
    \"file_type\": \"csv\"
  }"
```

**Example - JSON Import:**
```bash
curl -X POST http://localhost:3000/api/tickets/import \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/import-request.json
```

Where `import-request.json` contains:
```json
{
  "file_content": "[{...tickets...}]",
  "file_type": "json"
}
```

---

### 7. Auto-Classify Ticket

Automatically categorizes and assigns priority to a ticket.

**Endpoint:** `POST /tickets/{ticket_id}/auto-classify`

**Response (200 OK):**
```json
{
  "success": true,
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "account_access",
    "priority": "high",
    "classification_confidence": 0.75,
    "classification_reasoning": "Classified as 'account_access' based on keyword matching"
  },
  "classification": {
    "category": "account_access",
    "priority": "high",
    "confidence": 0.75,
    "reasoning": "Classified as 'account_access' based on keyword matching",
    "keywords_found": ["cannot access", "account", "password", "locked"]
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

---

## Ticket Data Model

Complete ticket schema with all fields and their types:

```json
{
  "id": "uuid",
  "customer_id": "string",
  "customer_email": "email",
  "customer_name": "string",
  "subject": "string (1-200 chars)",
  "description": "string (10-2000 chars)",
  "category": "account_access | technical_issue | billing_question | feature_request | bug_report | other",
  "priority": "urgent | high | medium | low",
  "status": "new | in_progress | waiting_customer | resolved | closed",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime",
  "resolved_at": "ISO 8601 datetime (nullable)",
  "assigned_to": "string (nullable)",
  "tags": ["string array"],
  "metadata": {
    "source": "web_form | email | api | chat | phone",
    "browser": "string",
    "device_type": "desktop | mobile | tablet"
  },
  "classification_confidence": "number (0-1)",
  "classification_reasoning": "string"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto-generated | Unique ticket identifier |
| customer_id | String | Yes | Customer identifier |
| customer_email | Email | Yes | Customer's email address |
| customer_name | String | Yes | Customer's full name |
| subject | String | Yes | Ticket subject (1-200 chars) |
| description | String | Yes | Detailed description (10-2000 chars) |
| category | Enum | Yes | Ticket category |
| priority | Enum | Yes | Ticket priority level |
| status | Enum | Auto-set | Current ticket status (default: "new") |
| created_at | DateTime | Auto-generated | Creation timestamp |
| updated_at | DateTime | Auto-updated | Last update timestamp |
| resolved_at | DateTime | Optional | Resolution timestamp |
| assigned_to | String | Optional | Assigned team/person |
| tags | Array | Optional | Custom tags for filtering |
| metadata | Object | Optional | Additional metadata |
| classification_confidence | Number | Auto-set | Classification confidence (0-1) |
| classification_reasoning | String | Auto-set | Reasoning for classification |

---

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 207 | Multi-Status | Partial success (used in bulk operations) |
| 400 | Bad Request | Invalid input or validation error |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- Implementing per-IP rate limits
- Adding API key based throttling
- Using middleware like `express-rate-limit`

---

## Pagination

Currently no pagination is implemented. For large result sets, consider:
- Implementing limit/offset pagination
- Adding cursor-based pagination
- Response size limits

---

## Field Validation

### Email Format
Must be valid email format: `user@domain.com`

### String Length Constraints
- `subject`: 1-200 characters
- `description`: 10-2000 characters

### Enums
All enum fields must use exact values (case-sensitive):
- Categories: account_access, technical_issue, billing_question, feature_request, bug_report, other
- Priorities: urgent, high, medium, low
- Statuses: new, in_progress, waiting_customer, resolved, closed

---

## Error Message Examples

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "customer_email is required and must be a valid email",
    "subject must be between 1 and 200 characters",
    "priority must be one of: urgent, high, medium, low"
  ]
}
```

### Not Found Error
```json
{
  "success": false,
  "error": "Ticket not found"
}
```

### Import Error
```json
{
  "success": false,
  "error": "Invalid JSON format",
  "details": ["Unexpected token } in JSON"]
}
```

---

## Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{ "status": "healthy" }
```

### Quick Test Workflow
```bash
# 1. Create a ticket
TICKET_ID=$(curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{...}' | jq -r '.ticket.id')

# 2. Get the ticket
curl http://localhost:3000/api/tickets/$TICKET_ID

# 3. Auto-classify it
curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/auto-classify

# 4. Update it
curl -X PUT http://localhost:3000/api/tickets/$TICKET_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'

# 5. Delete it
curl -X DELETE http://localhost:3000/api/tickets/$TICKET_ID
```

---

**Last Updated**: January 28, 2026
