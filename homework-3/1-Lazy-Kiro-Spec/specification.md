# Virtual Card Management System Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective
- Build a secure virtual card management system that enables users to create, manage, and monitor virtual payment cards with comprehensive lifecycle management, real-time transaction processing, and regulatory compliance suitable for FinTech environments.

## Mid-Level Objectives
- Implement secure virtual card creation and management with PCI DSS compliant data handling and field-level encryption
- Provide real-time card status controls (freeze/unfreeze) with immediate transaction blocking capabilities
- Enable dynamic spending limit configuration with real-time enforcement and user notifications
- Deliver comprehensive transaction history with filtering, search, and suspicious activity detection
- Maintain immutable audit trails for all operations with 7-year retention for regulatory compliance
- Implement multi-channel notification system for real-time transaction and security alerts

## Implementation Notes
- Use Node.js with TypeScript and Express.js for type-safe backend development
- Implement PostgreSQL for transactional data and MongoDB for audit log storage
- Use Redis for high-performance caching and session management
- Implement AES-256 encryption for all sensitive financial data (card numbers, CVV)
- Use Decimal.js library for all monetary calculations to ensure precision
- Implement JWT authentication with OAuth 2.0 integration
- Follow microservices architecture with clear service boundaries
- Implement comprehensive audit logging for all financial operations
- Use HashiCorp Vault for secure key management and secrets storage
- Implement circuit breaker patterns for external service resilience
- Follow PCI DSS compliance requirements for cardholder data protection
- Implement GDPR compliance features for data privacy and user rights

## Context

### Beginning context
- Empty Node.js project directory
- PostgreSQL and MongoDB databases available
- Redis cache server available
- HashiCorp Vault for secrets management
- Development environment with TypeScript configuration
- Testing framework (Jest) available
- Basic project structure and package.json

### Ending context
- Complete virtual card management API with all endpoints
- Secure card creation, status management, and transaction processing
- Real-time notification system with multi-channel delivery
- Comprehensive audit trail and compliance reporting system
- Production-ready deployment configuration with monitoring
- Complete test suite with unit, integration, and security tests
- API documentation and compliance documentation

## Low-Level Tasks

### 1. Set up project foundation and security infrastructure

What prompt would you run to complete this task?
Initialize a secure Node.js project with TypeScript configuration, database connections for PostgreSQL and MongoDB, Redis caching setup, and HashiCorp Vault integration for secrets management. Configure environment-based configuration management and implement basic project structure following FinTech security standards.

What file do you want to CREATE or UPDATE?
package.json, tsconfig.json, src/config/database.ts, src/config/redis.ts, src/config/vault.ts, src/config/environment.ts

What function do you want to CREATE or UPDATE?
Database connection functions, Redis client setup, Vault client configuration, Environment configuration loader

What are details you want to add to drive the code changes?
- TypeScript strict mode configuration with no implicit any
- PostgreSQL connection with connection pooling and health checks
- MongoDB connection for audit log storage with proper indexing
- Redis client with connection retry logic and error handling
- Vault integration for secure key retrieval and rotation
- Environment variable validation and type-safe configuration
- Basic logging setup with Winston for structured logging

### 2. Create core data models and encryption utilities

What prompt would you run to complete this task?
Create TypeScript interfaces and classes for VirtualCard, Transaction, and AuditEvent data models. Implement field-level encryption utilities using AES-256 for PCI DSS compliance. Build data validation schemas and database entity models with proper relationships and constraints.

What file do you want to CREATE or UPDATE?
src/models/VirtualCard.ts, src/models/Transaction.ts, src/models/AuditEvent.ts, src/utils/encryption.ts, src/schemas/validation.ts

What function do you want to CREATE or UPDATE?
VirtualCard interface and class, Transaction interface and class, AuditEvent interface, encrypt/decrypt functions, validation schemas

What are details you want to add to drive the code changes?
- VirtualCard model with encrypted card number and CVV fields
- Transaction model with Decimal amounts and proper currency handling
- AuditEvent model for immutable compliance logging
- AES-256 encryption utilities with key rotation support
- Joi validation schemas for all input data
- Database entity decorators for TypeORM integration
- Proper TypeScript types for all financial data

### 3. Implement authentication and authorization middleware

What prompt would you run to complete this task?
Build JWT token generation and validation middleware with OAuth 2.0 integration. Implement role-based access control (RBAC) system for different user types. Create API rate limiting middleware and request correlation ID generation for audit trails.

What file do you want to CREATE or UPDATE?
src/middleware/auth.ts, src/middleware/rbac.ts, src/middleware/rateLimiter.ts, src/middleware/correlationId.ts, src/services/AuthService.ts

What function do you want to CREATE or UPDATE?
JWT middleware functions, RBAC authorization functions, Rate limiting middleware, Correlation ID middleware, AuthService class

What are details you want to add to drive the code changes?
- JWT token validation with proper error handling
- Role-based permissions for card holders vs compliance officers
- Rate limiting with Redis-backed counters
- UUID correlation ID generation for request tracking
- OAuth 2.0 integration for external authentication providers
- Session management with secure cookie handling
- Authentication audit logging for security monitoring

### 4. Build audit service for compliance tracking

What prompt would you run to complete this task?
Implement AuditService class with immutable audit log creation for all financial operations. Create audit event logging middleware that automatically captures user actions. Build audit log search, filtering, and compliance report generation capabilities with 7-year retention policy.

What file do you want to CREATE or UPDATE?
src/services/AuditService.ts, src/middleware/auditLogger.ts, src/controllers/ComplianceController.ts, src/models/ComplianceReport.ts

What function do you want to CREATE or UPDATE?
AuditService class methods, Audit logging middleware, Compliance report generation functions, Audit search and filter functions

What are details you want to add to drive the code changes?
- Immutable audit event creation with MongoDB storage
- Automatic audit logging for all API operations
- User ID, IP address, timestamp, and operation details capture
- Audit log search with date range and event type filtering
- Compliance report generation for regulatory requirements
- 7-year data retention policy implementation
- Audit trail integrity verification mechanisms

### 5. Develop card management service core functionality

What prompt would you run to complete this task?
Implement CardManagementService with virtual card creation, status management (active/frozen/suspended), and spending limit configuration. Include card metadata management with proper encryption and card listing/filtering for user accounts.

What file do you want to CREATE or UPDATE?
src/services/CardManagementService.ts, src/controllers/CardController.ts, src/repositories/CardRepository.ts

What function do you want to CREATE or UPDATE?
CardManagementService class, Card CRUD operations, Card status management functions, Spending limit functions

What are details you want to add to drive the code changes?
- Virtual card creation with unique card number generation
- Card status transitions with validation rules
- Spending limit setting with account maximum validation
- Card encryption/decryption for sensitive data
- Card listing with pagination and filtering
- Integration with audit service for all operations
- Proper error handling and validation

### 6. Implement card security and validation controls

What prompt would you run to complete this task?
Build card number generation with proper validation algorithms, CVV generation and encryption storage, card expiry date management, and spending limit enforcement logic. Implement card status transition validation rules and security controls.

What file do you want to CREATE or UPDATE?
src/utils/cardGeneration.ts, src/utils/cardValidation.ts, src/services/CardSecurityService.ts

What function do you want to CREATE or UPDATE?
Card number generation functions, CVV generation functions, Card validation functions, Security control functions

What are details you want to add to drive the code changes?
- Luhn algorithm for card number validation
- Secure random CVV generation
- Card expiry date calculation and validation
- Spending limit enforcement with real-time checking
- Card status transition rules and validation
- PCI DSS compliant data handling throughout
- Security audit logging for all card operations

### 7. Build transaction processing service

What prompt would you run to complete this task?
Implement TransactionService with real-time transaction processing, validation against card status and spending limits, transaction history retrieval with filtering, and suspicious activity detection algorithms.

What file do you want to CREATE or UPDATE?
src/services/TransactionService.ts, src/controllers/TransactionController.ts, src/repositories/TransactionRepository.ts, src/utils/fraudDetection.ts

What function do you want to CREATE or UPDATE?
TransactionService class, Transaction processing functions, Transaction history functions, Fraud detection algorithms

What are details you want to add to drive the code changes?
- Real-time transaction authorization and processing
- Spending limit validation before transaction approval
- Transaction history with date range and amount filtering
- Suspicious activity pattern detection
- Transaction status management and updates
- Integration with external payment processors
- Proper decimal arithmetic for all monetary calculations

### 8. Integrate payment processor and external services

What prompt would you run to complete this task?
Implement payment processor API integration with transaction authorization and settlement flows. Build circuit breaker patterns for external service resilience, retry logic with exponential backoff, and transaction correlation tracking.

What file do you want to CREATE or UPDATE?
src/services/PaymentProcessorService.ts, src/utils/circuitBreaker.ts, src/utils/retryLogic.ts

What function do you want to CREATE or UPDATE?
PaymentProcessorService class, Circuit breaker implementation, Retry logic functions, External service integration

What are details you want to add to drive the code changes?
- Payment processor API integration with proper authentication
- Transaction authorization and settlement workflows
- Circuit breaker pattern for external service failures
- Exponential backoff retry logic for transient failures
- Transaction correlation ID tracking across services
- Proper timeout handling for external calls
- Error handling and fallback mechanisms

### 9. Implement notification service for real-time alerts

What prompt would you run to complete this task?
Build NotificationService with multi-channel delivery (email, SMS, push), real-time transaction notification triggers, notification preference management, and security alert generation for suspicious activities.

What file do you want to CREATE or UPDATE?
src/services/NotificationService.ts, src/controllers/NotificationController.ts, src/utils/notificationProviders.ts

What function do you want to CREATE or UPDATE?
NotificationService class, Notification delivery functions, Preference management functions, Alert generation functions

What are details you want to add to drive the code changes?
- Multi-channel notification delivery (email, SMS, push)
- Real-time transaction notification triggers
- User notification preference management
- Security alert generation for suspicious activities
- Notification template management system
- Delivery status tracking and retry mechanisms
- Integration with external notification providers

### 10. Create REST API endpoints and controllers

What prompt would you run to complete this task?
Implement comprehensive REST API endpoints for card management, transaction history, compliance reporting, and notification preferences. Include proper HTTP status codes, error responses, and API documentation.

What file do you want to CREATE or UPDATE?
src/routes/cardRoutes.ts, src/routes/transactionRoutes.ts, src/routes/complianceRoutes.ts, src/routes/notificationRoutes.ts, src/app.ts

What function do you want to CREATE or UPDATE?
API route handlers, Controller methods, Express app configuration, API middleware setup

What are details you want to add to drive the code changes?
- RESTful API endpoints for all card operations
- Transaction history and filtering endpoints
- Compliance and audit reporting endpoints
- Notification preference management endpoints
- Proper HTTP status codes and error responses
- Request validation middleware for all endpoints
- API versioning and documentation setup

### 11. Add API security and validation middleware

What prompt would you run to complete this task?
Implement comprehensive API security including request validation, authentication checks, input sanitization, rate limiting, and request/response logging for audit trails.

What file do you want to CREATE or UPDATE?
src/middleware/validation.ts, src/middleware/security.ts, src/middleware/requestLogger.ts

What function do you want to CREATE or UPDATE?
Request validation middleware, Security middleware, Request logging middleware, Input sanitization functions

What are details you want to add to drive the code changes?
- Schema-based request validation using Joi
- Input sanitization for XSS and injection prevention
- API authentication and authorization checks
- Rate limiting with Redis-backed counters
- Request/response logging with correlation IDs
- Security headers and CORS configuration
- API key validation for external integrations

### 12. Implement compliance and security features

What prompt would you run to complete this task?
Build PCI DSS compliance validation utilities, data masking for non-production environments, automated encryption key rotation, GDPR data privacy controls, and compliance monitoring with alerting.

What file do you want to CREATE or UPDATE?
src/services/ComplianceService.ts, src/utils/dataMasking.ts, src/utils/keyRotation.ts, src/services/PrivacyService.ts

What function do you want to CREATE or UPDATE?
ComplianceService class, Data masking functions, Key rotation utilities, Privacy control functions

What are details you want to add to drive the code changes?
- PCI DSS compliance validation and reporting
- Data masking utilities for development environments
- Automated encryption key rotation with Vault integration
- GDPR compliance features (data export, deletion)
- Compliance monitoring and automated alerting
- Data retention policy enforcement
- Privacy by design implementation throughout