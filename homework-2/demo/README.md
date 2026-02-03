# 📦 Demo Files - Customer Support Ticket System

This directory contains all the files needed to quickly demo and test the application.

## 🚀 Quick Start Scripts

### Windows
```bash
demo\run.bat
```

### Linux/Mac
```bash
chmod +x demo/run.sh
./demo/run.sh
```

These scripts will:
1. Check if Node.js is installed
2. Install dependencies if needed
3. Start the server at `http://localhost:3000`

## 🧪 Testing the API

### Option 1: Using VS Code REST Client Extension

1. Install the [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
2. Open `demo/test-requests.http`
3. Click "Send Request" above any request to execute it

### Option 2: Using curl (Linux/Mac/Git Bash)

```bash
chmod +x demo/requests.sh
./demo/requests.sh
```

This script will:
- Test all API endpoints
- Create sample tickets
- Demonstrate filtering and classification
- Show bulk import
- Display audit logs and statistics

**Requirements:** `curl` and `jq` must be installed

### Option 3: Manual curl Commands

```bash
# Health check
curl http://localhost:3000/health

# Create a ticket
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "test_001",
    "customer_email": "test@example.com",
    "customer_name": "Test User",
    "subject": "Test ticket",
    "description": "This is a test ticket created via curl"
  }'

# Get all tickets
curl http://localhost:3000/api/tickets
```

## 📁 Sample Data Files

The `demo/sample-data/` directory contains ready-to-import test data:

| File | Format | Records | Description |
|------|--------|---------|-------------|
| `sample_tickets.csv` | CSV | 50 | Valid tickets for testing import |
| `sample_tickets.json` | JSON | 20 | Valid JSON format tickets |
| `sample_tickets.xml` | XML | 30 | Valid XML format tickets |
| `invalid_tickets.csv` | CSV | - | Invalid data for error testing |
| `invalid_tickets.json` | JSON | - | Invalid JSON for error testing |
| `invalid_tickets.xml` | XML | - | Invalid XML for error testing |

### Importing Sample Data via UI

1. Start the server (`demo/run.bat` or `demo/run.sh`)
2. Open `http://localhost:3000` in your browser
3. Go to the "Bulk Import" tab
4. Select file format (CSV, JSON, or XML)
5. Choose a sample file from `demo/sample-data/`
6. Click "Import Tickets"

### Importing Sample Data via API

```bash
# Import CSV
curl -X POST http://localhost:3000/api/tickets/import \
  -H "Content-Type: application/json" \
  -d "{
    \"file_type\": \"csv\",
    \"file_content\": \"$(cat demo/sample-data/sample_tickets.csv)\"
  }"

# Import JSON
curl -X POST http://localhost:3000/api/tickets/import \
  -H "Content-Type: application/json" \
  -d "{
    \"file_type\": \"json\",
    \"file_content\": \"$(cat demo/sample-data/sample_tickets.json)\"
  }"
```

## 🎯 Demo Workflow

### Complete Ticket Lifecycle Demo

1. **Start the server**
   ```bash
   demo/run.bat  # or ./demo/run.sh
   ```

2. **Open the UI**
   - Navigate to `http://localhost:3000`

3. **Create a ticket**
   - Use the "Create Ticket" form
   - Enable "Auto-classify this ticket?" checkbox
   - Submit

4. **View tickets**
   - Click "Load Tickets" to see all tickets
   - Try the "Filter" tab to search by category/priority

5. **Edit a ticket**
   - Click "Edit" on any ticket
   - Change status to "in_progress"
   - Assign to a support agent

6. **View analytics**
   - Go to "Analytics" tab
   - Click "Load Analytics" to see classification stats

7. **Check audit logs**
   - Go to "Audit Logs" tab
   - Filter by ticket ID or action type
   - See complete classification history

## 📊 Available Demo Scenarios

### Scenario 1: Account Access Issue
```http
POST /api/tickets
{
  "subject": "Cannot access my account",
  "description": "I can't login and password reset is not working"
}
```
Expected: Auto-classifies as `account_access` with `urgent` priority

### Scenario 2: Billing Question
```http
POST /api/tickets
{
  "subject": "Charged twice",
  "description": "I was charged twice for my subscription and need a refund"
}
```
Expected: Auto-classifies as `billing_question` with `high` priority

### Scenario 3: Bug Report
```http
POST /api/tickets
{
  "subject": "Application crashes",
  "description": "The app crashes when I click the submit button. Steps to reproduce: 1. Open form 2. Fill fields 3. Click submit"
}
```
Expected: Auto-classifies as `bug_report` with `medium` priority

### Scenario 4: Bulk Import
- Use `sample_tickets.csv` (50 tickets)
- Import via UI or API
- Verify import summary shows success/failure counts

## 🔍 Troubleshooting

### Server won't start
- Ensure Node.js is installed: `node --version`
- Check if port 3000 is available
- Run `npm install` manually if dependencies are missing

### API requests fail
- Verify server is running: `curl http://localhost:3000/health`
- Check if correct port (3000) is being used
- Ensure request headers include `Content-Type: application/json`

### Sample data import fails
- Verify file format matches selected type
- Check file encoding (should be UTF-8)
- Review error messages in import summary

## 📝 Notes

- All data is stored in-memory and will be lost when server restarts
- The health indicator (green/red dot) in the UI shows server status
- Audit logs track all auto-classification decisions
- Sample data files are also available in `fixtures/` directory for tests
