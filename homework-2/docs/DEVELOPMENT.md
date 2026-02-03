# Development Guide

## Project Structure

```
homework-2/
├── src/
│   ├── app.js                      # Express application entry point
│   ├── routes.js                   # API route handlers
│   ├── models/
│   │   └── Ticket.js              # Ticket data model & validation
│   ├── Classifier.js              # Auto-classification engine
│   ├── FileImporter.js            # CSV/JSON/XML import handler
│   └── TicketStore.js             # In-memory ticket storage
├── public/
│   └── index.html                  # Web UI (interactive ticket management)
├── tests/
│   ├── test_ticket_api.test.js              # API endpoint tests
│   ├── test_ticket_model.test.js            # Ticket model validation
│   ├── test_import_csv.test.js              # CSV import tests
│   ├── test_import_json.test.js             # JSON import tests
│   ├── test_import_xml.test.js              # XML import tests
│   ├── test_categorization.test.js          # Auto-classification tests
│   ├── test_store.test.js                   # Ticket store tests
│   ├── test_bulk_import.test.js             # Bulk import API tests
│   ├── test_auto_classify_api.test.js       # Auto-classify endpoint tests
│   ├── test_auto_classify_on_create.test.js # Auto-classify on creation tests
│   ├── test_integration.test.js             # Integration tests
│   ├── test_audit_log.test.js               # Audit logging tests
│   ├── test_performance.test.js             # Performance benchmark tests
│   ├── test_sanitizer.test.js               # Input sanitization tests
│   └── fixtures/
│       ├── sample_tickets.csv               # 50 sample tickets (CSV)
│       ├── sample_tickets.json              # 20 sample tickets (JSON)
│       ├── sample_tickets.xml               # 30 sample tickets (XML)
│       ├── invalid_tickets.csv              # Invalid test data (CSV)
│       ├── invalid_tickets.json             # Invalid test data (JSON)
│       └── invalid_tickets.xml              # Invalid test data (XML)
├── docs/
│   ├── screenshots/                         # Demo screenshots
│   ├── API_REFERENCE.md                     # Detailed API documentation
│   ├── ARCHITECTURE.md                      # Architecture diagrams
│   ├── TESTING_GUIDE.md                     # Testing documentation
│   └── DEVELOPMENT.md                       # This file
├── demo/                                    # Demo scripts
├── package.json                             # NPM dependencies
├── jest.config.js                           # Jest test configuration
├── .gitignore                               # Git ignore rules
├── HOWTORUN.md                              # Execution instructions
└── README.md                                # Project overview
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | latest | Web framework |
| uuid | 8.3.2 | Unique identifiers |
| csv-parse | latest | CSV file parsing |
| xml2js | latest | XML file parsing |
| validator | latest | Data validation |
| jest | latest | Testing framework |
| supertest | latest | HTTP testing |

## Code Quality Standards

The codebase follows these principles:

- ✅ Clean, readable code
- ✅ Comprehensive error handling
- ✅ Meaningful variable/function names
- ✅ Separation of concerns
- ✅ Extensive test coverage (85%+ required)
- ✅ Input validation on all endpoints

## Adding New Features

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement the feature**
   - Write code in appropriate module under `src/`
   - Follow existing code patterns and structure
   - Add comprehensive error handling

3. **Write tests**
   - Create test file in `tests/` directory
   - Follow naming convention: `test_<feature_name>.test.js`
   - Aim for 85%+ code coverage
   - Include both positive and negative test cases

4. **Update documentation**
   - Update API_REFERENCE.md for new endpoints
   - Update ARCHITECTURE.md if design changes
   - Add examples to HOWTORUN.md if needed

5. **Run full test suite**
   ```bash
   npm test
   ```

6. **Verify coverage**
   ```bash
   npm test -- --coverage
   ```

7. **Commit and push**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push origin feature/your-feature-name
   ```

## Auto-Classification Logic

The system uses keyword matching to automatically categorize and assign priorities:

### Categories Detected

- `account_access` - Login, password, 2FA issues
- `technical_issue` - Bugs, errors, crashes
- `billing_question` - Payments, invoices, refunds
- `feature_request` - Enhancements, suggestions
- `bug_report` - Defects with reproduction steps
- `other` - Uncategorizable

### Priority Assignment

- `urgent` - "can't access", "critical", "production down", "security"
- `high` - "important", "blocking", "asap"
- `medium` - default
- `low` - "minor", "cosmetic", "suggestion"

## Error Handling

The API returns meaningful error messages with appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Resource created |
| 207 | Multi-status (partial success) |
| 400 | Bad request / Validation error |
| 404 | Resource not found |
| 500 | Server error |

### Error Response Format

```json
{
  "error": "Error message describing what went wrong",
  "details": "Additional context or validation errors"
}
```

## Performance Metrics

- **Test Execution**: ~2.4 seconds for full suite (118 tests)
- **Response Time**: <100ms for most API calls
- **Memory Usage**: Efficient in-memory storage
- **Import Performance**: Handles 1000+ records efficiently

## Test Coverage Breakdown

### Test Statistics
- **Total Coverage**: 87.82%
- **Test Files**: 14
- **Total Tests**: 118 passing

### Test Categories
- **API Endpoints**: 11 tests
- **Ticket Model Validation**: 9 tests
- **CSV Import**: 6 tests
- **JSON Import**: 5 tests
- **XML Import**: 5 tests
- **Auto-Classification**: 10 tests
- **Integration**: 5 tests
- **Store Operations**: 11 tests
- **Bulk Import API**: 9 tests
- **Auto-Classify API**: 9 tests
- **Audit Log**: 15 tests
- **Auto-Classify on Create**: 12 tests
- **Performance**: 18 tests
- **Input Sanitization**: 13 tests

## Module Responsibilities

### `src/app.js`
Express application setup, middleware configuration, and server initialization.

### `src/routes.js`
All API endpoint definitions and request handling logic.

### `src/models/Ticket.js`
Ticket data model with validation rules and schema definition.

### `src/TicketStore.js`
In-memory storage implementation with CRUD operations.

### `src/FileImporter.js`
Multi-format file parsing (CSV, JSON, XML) and data import logic.

### `src/Classifier.js`
Keyword-based auto-classification engine for categories and priorities.

## Debugging

### Enable Verbose Logging

```bash
DEBUG=* npm start
```

### Run Single Test File

```bash
npm test -- test_ticket_api.test.js
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Generate Coverage Report

```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Common Development Tasks

### Adding a New API Endpoint

1. Add route handler in `src/routes.js`
2. Add validation logic if needed
3. Create test file `tests/test_<endpoint>.test.js`
4. Document in `docs/API_REFERENCE.md`

### Adding a New Validation Rule

1. Update `src/models/Ticket.js`
2. Add test cases in `tests/test_ticket_model.test.js`
3. Update ticket schema documentation

### Adding a New File Format

1. Add parser in `src/FileImporter.js`
2. Create test file `tests/test_import_<format>.test.js`
3. Add sample fixture in `tests/fixtures/`
4. Document in `docs/API_REFERENCE.md`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

---

**Last Updated**: January 28, 2026
