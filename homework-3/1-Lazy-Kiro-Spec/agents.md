# AI Agent Guidelines for Virtual Card Management System

## Tech Stack Requirements

### Primary Technologies
- **Backend**: Node.js with TypeScript and Express.js framework
- **Database**: PostgreSQL for transactional data, MongoDB for audit logs
- **Caching**: Redis for session management and performance optimization
- **Authentication**: JWT tokens with OAuth 2.0 integration
- **Message Queue**: RabbitMQ for asynchronous processing
- **Security**: HashiCorp Vault for secrets management, AES-256 encryption

### Development Tools
- **Testing**: Jest for unit tests, Supertest for API testing
- **Code Quality**: ESLint with TypeScript rules, Prettier for formatting
- **Documentation**: JSDoc for code documentation, OpenAPI/Swagger for APIs
- **Monitoring**: Prometheus metrics, structured logging with Winston

## Domain-Specific Rules (FinTech/Banking)

### Financial Data Handling
- **ALWAYS** use `Decimal` type for monetary calculations, never `number` or `float`
- **NEVER** perform arithmetic operations on currency values without proper decimal precision
- **ALWAYS** validate currency codes against ISO 4217 standards
- **ALWAYS** include currency information with every monetary value
- **ALWAYS** round monetary values to appropriate decimal places (2 for USD, 0 for JPY)

### Security and Compliance Requirements
- **ALWAYS** encrypt PII and sensitive financial data at rest using AES-256
- **ALWAYS** use parameterized queries to prevent SQL injection
- **ALWAYS** validate and sanitize all user inputs
- **NEVER** log sensitive data (card numbers, CVV, PII) in plain text
- **ALWAYS** implement proper authentication before any financial operations
- **ALWAYS** use HTTPS for all API communications
- **ALWAYS** implement rate limiting on all public endpoints

### Audit and Logging Requirements
- **ALWAYS** create audit trail entries for every financial operation
- **ALWAYS** include user ID, timestamp, IP address, and operation details in audit logs
- **ALWAYS** make audit logs immutable once created
- **NEVER** delete audit logs - implement soft deletion with retention policies
- **ALWAYS** include correlation IDs for request tracking across services
- **ALWAYS** log both successful and failed operations with appropriate detail levels

### Data Privacy and Protection
- **ALWAYS** implement data masking for non-production environments
- **ALWAYS** provide data export capabilities for GDPR compliance
- **ALWAYS** implement proper data retention policies (7 years for financial records)
- **NEVER** expose sensitive data in API responses without proper authorization
- **ALWAYS** implement field-level access controls for sensitive data

## Code Style and Patterns

### TypeScript Standards
- **ALWAYS** use strict TypeScript configuration with no implicit any
- **ALWAYS** define interfaces for all data models and API contracts
- **ALWAYS** use enums for fixed value sets (card status, transaction types)
- **ALWAYS** implement proper error types with structured error handling
- **ALWAYS** use async/await pattern instead of callbacks or raw promises

### API Design Patterns
- **ALWAYS** follow RESTful design principles
- **ALWAYS** use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- **ALWAYS** implement consistent error response format across all endpoints
- **ALWAYS** include API versioning in URL path (/api/v1/)
- **ALWAYS** implement proper pagination for list endpoints
- **ALWAYS** use JSON for request/response bodies

### Database Patterns
- **ALWAYS** use database transactions for multi-table operations
- **ALWAYS** implement proper foreign key constraints
- **ALWAYS** use UUIDs for primary keys in financial systems
- **ALWAYS** implement database connection pooling
- **ALWAYS** use database migrations for schema changes
- **NEVER** perform database operations without proper error handling

### Error Handling Standards
- **ALWAYS** implement structured error responses with error codes
- **ALWAYS** use try-catch blocks for all async operations
- **ALWAYS** log errors with appropriate context and correlation IDs
- **ALWAYS** implement circuit breaker patterns for external service calls
- **ALWAYS** provide meaningful error messages without exposing system internals

## Testing Expectations

### Unit Testing Requirements
- **ALWAYS** achieve minimum 80% code coverage for business logic
- **ALWAYS** test both happy path and error scenarios
- **ALWAYS** mock external dependencies in unit tests
- **ALWAYS** test input validation and edge cases
- **ALWAYS** use descriptive test names that explain the scenario

### Integration Testing Requirements
- **ALWAYS** test database operations with real database connections
- **ALWAYS** test API endpoints with actual HTTP requests
- **ALWAYS** test authentication and authorization flows
- **ALWAYS** test external service integrations with proper mocking
- **ALWAYS** validate audit trail creation in integration tests

### Security Testing Requirements
- **ALWAYS** test authentication and authorization mechanisms
- **ALWAYS** test input validation and sanitization
- **ALWAYS** test rate limiting and throttling mechanisms
- **ALWAYS** validate encryption and decryption processes
- **ALWAYS** test for common security vulnerabilities (OWASP Top 10)

## Performance and Scalability

### Performance Requirements
- **ALWAYS** implement caching for frequently accessed data
- **ALWAYS** use database indexes for query optimization
- **ALWAYS** implement connection pooling for database and external services
- **ALWAYS** set appropriate timeouts for all external service calls
- **ALWAYS** implement pagination for large data sets

### Monitoring and Observability
- **ALWAYS** implement health check endpoints for all services
- **ALWAYS** collect metrics for business operations (card creation, transactions)
- **ALWAYS** implement structured logging with correlation IDs
- **ALWAYS** set up alerts for critical business and system metrics
- **ALWAYS** implement distributed tracing for complex workflows

## Regulatory and Compliance Constraints

### PCI DSS Requirements
- **NEVER** store sensitive authentication data (CVV, PIN)
- **ALWAYS** encrypt cardholder data using strong cryptography
- **ALWAYS** implement proper access controls for cardholder data
- **ALWAYS** maintain secure audit trails
- **ALWAYS** regularly test security systems and processes

### Data Retention and Privacy
- **ALWAYS** implement automated data retention policies
- **ALWAYS** provide data portability features for user requests
- **ALWAYS** implement right to be forgotten capabilities where legally permitted
- **ALWAYS** maintain data processing records for compliance audits
- **ALWAYS** implement proper consent management for data processing

### Audit and Reporting Requirements
- **ALWAYS** maintain immutable audit trails for all financial operations
- **ALWAYS** implement compliance reporting capabilities
- **ALWAYS** provide audit trail search and filtering functionality
- **ALWAYS** maintain audit logs for minimum 7 years
- **ALWAYS** implement automated compliance monitoring and alerting