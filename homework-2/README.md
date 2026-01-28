# Intelligent Customer Support System

A Node.js/Express REST API for managing customer support tickets with automatic categorization and multi-format import capabilities.

## Features

- **Web UI**: Interactive web interface for ticket management
- **Multi-Format Import**: CSV, JSON, and XML support
- **Auto-Classification**: Automatic ticket categorization and priority assignment
- **REST API**: Full CRUD operations with filtering and search
- **Data Validation**: Comprehensive input validation
- **High Test Coverage**: 87%+ coverage with 118 tests across 14 test suites

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Run tests
npm test
```

Server runs on `http://localhost:3000`

**Web UI**: Open `http://localhost:3000` in your browser for the interactive web interface

## Usage Options

### Option 1: Web Interface (Recommended for Quick Testing)
Simply open `http://localhost:3000` in your browser to access the interactive UI where you can:
- Create tickets with a user-friendly form
- View and filter tickets in real-time
- Import files via drag-and-drop or file picker
- Auto-classify tickets with one click

### Option 2: REST API (Programmatic Access)

#### Create a Ticket
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot access my account",
    "description": "I have been unable to access my account for 2 days",
    "category": "account_access",
    "priority": "high"
  }'
```

#### Get All Tickets
```bash
curl http://localhost:3000/api/tickets?category=account_access&priority=high
```

#### Auto-Classify Ticket
```bash
curl -X POST http://localhost:3000/api/tickets/{ticket_id}/auto-classify
```

## Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets` | Create a new ticket |
| GET | `/api/tickets` | List all tickets (with filtering) |
| GET | `/api/tickets/:id` | Get specific ticket |
| PUT | `/api/tickets/:id` | Update ticket |
| DELETE | `/api/tickets/:id` | Delete ticket |
| POST | `/api/tickets/import` | Bulk import from CSV/JSON/XML |
| POST | `/api/tickets/:id/auto-classify` | Auto-classify ticket |

## Tech Stack

- **Express.js** - Web framework
- **Node.js** - JavaScript runtime
- **Jest** - Testing framework
- **csv-parse** - CSV parsing
- **xml2js** - XML parsing

## Documentation

- **[HOWTORUN.md](HOWTORUN.md)** - Detailed setup and usage instructions
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design
- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Testing documentation
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guidelines and project structure

## Requirements

- Node.js 14.0 or higher
- npm 6.0 or higher

---

**Last Updated**: January 28, 2026
