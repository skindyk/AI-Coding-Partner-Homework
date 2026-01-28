# How to Run - Intelligent Customer Support System

Complete instructions for running the Customer Support Ticket Management System.

## Prerequisites

- **Node.js**: Version 14.x or higher
- **npm**: Version 6.x or higher
- **Git**: For cloning repository

### Check Your Environment

```bash
node --version    # Should output v14.0.0 or higher
npm --version     # Should output 6.0.0 or higher
```

---

## Installation

### 1. Navigate to Project Directory

```bash
cd homework-2
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web framework
- `uuid` - Unique ID generation
- `csv-parse` - CSV file parsing
- `xml2js` - XML parsing
- `validator` - Email validation
- `jest` - Testing framework
- `supertest` - HTTP assertion library

**Expected Output**:
```
added 87 packages, and audited 89 packages in 3s
```

---

## Starting the Server

### Option 1: Production Mode (Default)

```bash
npm start
```

**Output**:
```
Server running at http://localhost:3000
Health check: GET http://localhost:3000/health
API base: http://localhost:3000/api
```

The server will start on **port 3000** by default.

**Access the Web UI**: Open your browser and navigate to:
```
http://localhost:3000
```

The interactive web interface allows you to:
- Create and manage tickets
- View all tickets in a sortable table
- Filter tickets by category, priority, and status
- Import tickets from CSV/JSON/XML files
- Auto-classify tickets
- Real-time health status indicator

### Option 2: Development Mode (Watch for Changes)

```bash
npm run dev
```

Requires `nodemon` to be installed globally or as dev dependency.

### Option 3: Custom Port

```bash
PORT=3001 npm start
```

Server will start on port 3001 instead.

### Verify Server is Running

```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{ "status": "healthy" }
```

---

## Testing

### Run All Tests

```bash
npm test
```

**Expected Output** (87.82% coverage):
```
PASS  tests/test_ticket_model.test.js
PASS  tests/test_ticket_api.test.js
PASS  tests/test_import_csv.test.js
PASS  tests/test_import_json.test.js
PASS  tests/test_import_xml.test.js
PASS  tests/test_categorization.test.js
PASS  tests/test_store.test.js
PASS  tests/test_bulk_import.test.js
PASS  tests/test_auto_classify_api.test.js
PASS  tests/test_auto_classify_on_create.test.js
PASS  tests/test_integration.test.js
PASS  tests/test_audit_log.test.js
PASS  tests/test_performance.test.js
PASS  tests/test_sanitizer.test.js

Test Suites: 14 passed, 14 total
Tests:       118 passed, 118 total
Snapshots:   0 total
Time:        X.XXs
Coverage summary:
├─ Statements   : 87.82% ( 159/181 )
├─ Branches     : 87.07% ( 47/54 )
├─ Functions    : 85.48% ( 47/55 )
└─ Lines        : 89.15% ( 196/220 )

Tests:       118 passed (118)
Test Suites: 14 passed (14)
```

### Run Specific Test File

```bash
npm test -- test_ticket_model.test.js
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

Auto-reruns tests when files change. Press `q` to quit.

### Generate Coverage Report

```bash
npm test -- --coverage
```

Generates detailed coverage report and creates `coverage/` directory with HTML report.

### View Coverage HTML Report

After running coverage, open:
```bash
open coverage/lcov-report/index.html     # macOS
start coverage/lcov-report/index.html    # Windows
xdg-open coverage/lcov-report/index.html # Linux
```

---

## API Usage

### Quick Test Workflow

Once server is running:

#### 1. Health Check
```bash
curl http://localhost:3000/health
```

#### 2. Create a Ticket
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot access my account",
    "description": "I have been unable to access my account since yesterday",
    "category": "account_access",
    "priority": "high"
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "cust_001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot access my account",
    "description": "I have been unable to access my account since yesterday",
    "category": "account_access",
    "priority": "high",
    "status": "new",
    "created_at": "2026-01-27T14:00:00.000Z",
    "updated_at": "2026-01-27T14:00:00.000Z",
    "resolved_at": null,
    "assigned_to": null
  }
}
```

#### 3. List All Tickets
```bash
curl http://localhost:3000/api/tickets
```

#### 4. Get Specific Ticket
```bash
# Replace {ticket_id} with ID from step 2
curl http://localhost:3000/api/tickets/{ticket_id}
```

#### 5. Auto-Classify Ticket
```bash
curl -X POST http://localhost:3000/api/tickets/{ticket_id}/auto-classify
```

#### 6. Update Ticket
```bash
curl -X PUT http://localhost:3000/api/tickets/{ticket_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "support_team"
  }'
```

#### 7. Delete Ticket
```bash
curl -X DELETE http://localhost:3000/api/tickets/{ticket_id}
```

### Full API Documentation

See [API_REFERENCE.md](./API_REFERENCE.md) for complete endpoint documentation with:
- All HTTP methods
- Request/response formats
- Error handling
- cURL examples
- Query parameters

---

## Using Postman or Insomnia

### Import Collection

1. Copy one of the endpoint examples from API_REFERENCE.md
2. Create new request in Postman/Insomnia
3. Paste the cURL command
4. Click "Import as raw text"

### Common Requests

**Create Ticket**:
- Method: POST
- URL: `http://localhost:3000/api/tickets`
- Headers: `Content-Type: application/json`
- Body: JSON object with customer_id, email, name, subject, description, category, priority

**List Tickets**:
- Method: GET
- URL: `http://localhost:3000/api/tickets?category=technical_issue&priority=urgent`

**Get Single Ticket**:
- Method: GET
- URL: `http://localhost:3000/api/tickets/{ticket_id}`

---

## Bulk Import from Files

### Example 1: Import CSV

1. Ensure `tests/fixtures/sample_tickets.csv` exists
2. Read file contents and import:

```bash
# On macOS/Linux
CONTENT=$(cat tests/fixtures/sample_tickets.csv)
curl -X POST http://localhost:3000/api/tickets/import \
  -H "Content-Type: application/json" \
  -d "{\"file_content\": \"$CONTENT\", \"file_type\": \"csv\"}"

# On Windows (PowerShell)
$CONTENT = Get-Content tests/fixtures/sample_tickets.csv -Raw
$BODY = @{file_content = $CONTENT; file_type = "csv"} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3000/api/tickets/import `
  -Method Post -ContentType "application/json" -Body $BODY
```

### Example 2: Import JSON

```bash
# On macOS/Linux
CONTENT=$(cat tests/fixtures/sample_tickets.json)
curl -X POST http://localhost:3000/api/tickets/import \
  -H "Content-Type: application/json" \
  -d "{\"file_content\": \"$CONTENT\", \"file_type\": \"json\"}"
```

### Example 3: Import XML

```bash
# On macOS/Linux
CONTENT=$(cat tests/fixtures/sample_tickets.xml)
curl -X POST http://localhost:3000/api/tickets/import \
  -H "Content-Type: application/json" \
  -d "{\"file_content\": \"$CONTENT\", \"file_type\": \"xml\"}"
```

---

## Sample Data

### Available Fixtures

```
tests/fixtures/
├── sample_tickets.csv       (50 valid tickets)
├── sample_tickets.json      (20 valid tickets)
├── sample_tickets.xml       (30 valid tickets)
├── invalid_tickets.csv      (10 tickets with validation errors)
├── invalid_tickets.json     (10 tickets with validation errors)
└── invalid_tickets.xml      (10 tickets with validation errors)
```

### Using Sample Data in Tests

Sample data is automatically loaded in test fixtures. To use in manual testing:

```bash
# Count tickets in CSV
wc -l tests/fixtures/sample_tickets.csv

# View first 5 lines
head -5 tests/fixtures/sample_tickets.csv

# View JSON structure
cat tests/fixtures/sample_tickets.json | jq '.[0]'

# Validate CSV format
cat tests/fixtures/sample_tickets.csv | head -1  # See headers
```

---

## Troubleshooting

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000                    # macOS/Linux
netstat -ano | findstr :3000    # Windows

# Kill the process
kill -9 <PID>                   # macOS/Linux
taskkill /PID <PID> /F          # Windows

# Or use different port
PORT=3001 npm start
```

### Module Not Found

**Problem**: `Cannot find module 'uuid'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Tests Failing

**Problem**: `Tests failing with connection errors`

**Solution**:
```bash
# Clear any leftover processes
pkill -f "node.*app.js"

# Run tests again
npm test
```

### Memory Issues

**Problem**: Tests timeout or hang

**Solution**:
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

---

## Project Structure

```
homework-2/
├── src/
│   ├── models/
│   │   └── Ticket.js           (Data model with validation)
│   ├── TicketStore.js           (CRUD operations)
│   ├── FileImporter.js          (CSV/JSON/XML parsing)
│   ├── Classifier.js            (Auto-classification)
│   ├── routes.js                (API endpoints)
│   └── app.js                   (Express app)
├── tests/
│   ├── test_ticket_model.test.js
│   ├── test_ticket_api.test.js
│   ├── test_import_csv.test.js
│   ├── test_import_json.test.js
│   ├── test_import_xml.test.js
│   ├── test_categorization.test.js
│   ├── test_store.test.js
│   ├── test_bulk_import.test.js
│   ├── test_auto_classify_api.test.js
│   ├── test_auto_classify_on_create.test.js
│   ├── test_integration.test.js
│   ├── test_audit_log.test.js
│   ├── test_performance.test.js
│   ├── test_sanitizer.test.js
│   └── fixtures/
│       ├── sample_tickets.csv
│       ├── sample_tickets.json
│       ├── sample_tickets.xml
│       └── invalid_*.{csv,json,xml}
├── docs/
│   ├── README.md                (Overview for developers)
│   ├── API_REFERENCE.md         (API documentation)
│   ├── ARCHITECTURE.md          (Technical design)
│   ├── TESTING_GUIDE.md         (Testing documentation)
│   └── screenshots/
│       └── test_coverage.png
├── package.json
├── jest.config.js
└── HOWTORUN.md                  (This file)
```

---

## npm Scripts

```bash
npm start          # Start server (production)
npm test           # Run all tests
npm test -- --coverage  # Run tests with coverage
npm test -- --watch    # Run tests in watch mode
npm test -- <filename> # Run specific test file
```

---

## Stopping the Server

### Manual Stop
Press `Ctrl+C` in the terminal running the server.

### Auto-Stop
Server automatically stops when:
- Port is released
- Terminal is closed
- Error occurs

---

## Next Steps

1. **Explore the API**: Use cURL or Postman to test endpoints
2. **Review Code**: Check [README.md](./README.md) for architecture overview
3. **Run Tests**: Execute `npm test` to verify everything works
4. **Read Docs**: See [API_REFERENCE.md](./API_REFERENCE.md) for detailed endpoint documentation
5. **Try Import**: Use `fixtures/sample_tickets.csv` to bulk import tickets

---

## Support

For issues or questions:
1. Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for test troubleshooting
2. Review [API_REFERENCE.md](./API_REFERENCE.md) for API details
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for design details

---

**Last Updated**: January 27, 2026
**Node.js Version**: 14.x or higher
**npm Version**: 6.x or higher
