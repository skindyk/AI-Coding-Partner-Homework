# GitHub Copilot Instructions - FinTech Virtual Card Management

## Financial Data Handling

### Monetary Calculations - CRITICAL
```typescript
// ✅ ALWAYS use Decimal.js for monetary calculations
import Decimal from 'decimal.js';
const amount = new Decimal('10.50');
const total = amount.plus(new Decimal('5.25'));

// ❌ NEVER use JavaScript Number for currency
const amount = 10.50; // This will cause precision errors
```

### Currency Standards
- Always include ISO 4217 currency codes with monetary values
- Round to appropriate decimal places: USD (2), JPY (0), BHD (3)
- Validate all currency codes against ISO 4217 standard
- Use proper currency formatting for display

## Security Requirements - NON-NEGOTIABLE

### Sensitive Data Protection
```typescript
// ✅ CORRECT - Encrypt sensitive data
const encryptedCardNumber = encrypt(cardNumber, encryptionKey);
logger.info('Card created', { cardId, userId }); // Safe logging

// ❌ WRONG - Never log sensitive data
logger.info('Card created', { cardNumber, cvv }); // Security violation
```

### Authentication Patterns
```typescript
// ✅ ALWAYS validate authentication
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !validateJWT(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

## Database Security

### SQL Injection Prevention
```typescript
// ✅ ALWAYS use parameterized queries
const card = await db.query(
  'SELECT * FROM virtual_cards WHERE card_id = $1 AND user_id = $2',
  [cardId, userId]
);

// ❌ NEVER use string concatenation
const card = await db.query(
  `SELECT * FROM virtual_cards WHERE card_id = '${cardId}'`
); // SQL injection risk
```

### Transaction Management
```typescript
// ✅ ALWAYS use database transactions for financial operations
const transaction = await db.beginTransaction();
try {
  await cardRepository.updateBalance(cardId, amount, transaction);
  await transactionRepository.create(transactionData, transaction);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## API Design Standards

### Error Handling
```typescript
// ✅ Structured error responses
interface ApiError {
  code: string;
  message: string;
  type: 'VALIDATION_ERROR' | 'BUSINESS_RULE_ERROR' | 'SYSTEM_ERROR';
  requestId: string;
  timestamp: Date;
}

// Example response
{
  "code": "INSUFFICIENT_FUNDS",
  "message": "Transaction amount exceeds available balance",
  "type": "BUSINESS_RULE_ERROR",
  "requestId": "req_123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### RESTful Endpoints
```typescript
// ✅ CORRECT REST patterns
POST /api/v1/cards              // Create card
GET /api/v1/cards/:cardId       // Get card details
PUT /api/v1/cards/:cardId/status // Update card status
GET /api/v1/cards/:cardId/transactions // Get transactions

// Include proper HTTP status codes
// 200: Success, 201: Created, 400: Bad Request
// 401: Unauthorized, 403: Forbidden, 404: Not Found, 500: Server Error
```

## Audit and Compliance

### Audit Trail Requirements
```typescript
// ✅ ALWAYS create comprehensive audit entries
const auditEvent: AuditEvent = {
  eventId: generateUUID(),
  userId: req.user.id,
  eventType: 'CARD_STATUS_CHANGED',
  entityId: cardId,
  entityType: 'VIRTUAL_CARD',
  action: 'UPDATE',
  timestamp: new Date(),
  ipAddress: req.ip,
  userAgent: req.get('User-Agent'),
  result: 'SUCCESS',
  details: {
    previousStatus: 'ACTIVE',
    newStatus: 'FROZEN'
  }
};
```

### Logging Standards
```typescript
// ✅ Structured logging with correlation IDs
logger.info('Transaction processed', {
  correlationId: req.correlationId,
  transactionId,
  cardId,
  amount: amount.toString(), // Convert Decimal to string
  currency,
  merchantName,
  status: 'SUCCESS'
});

// ❌ NEVER log sensitive data
logger.info('Transaction', { cardNumber, cvv }); // Security violation
```

## TypeScript Best Practices

### Type Safety
```typescript
// ✅ Use strict TypeScript configuration
enum CardStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED'
}

interface VirtualCard {
  cardId: string;
  userId: string;
  cardNumber: string; // Encrypted
  amount: Decimal;
  currency: string; // ISO 4217
  status: CardStatus;
  createdAt: Date;
}
```

### Error Types
```typescript
// ✅ Define custom error types
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class BusinessRuleError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}
```

## Performance and Caching

### Redis Caching Patterns
```typescript
// ✅ Implement caching with proper TTL
const cacheKey = `card:${cardId}`;
const cachedCard = await redis.get(cacheKey);

if (!cachedCard) {
  const card = await cardRepository.findById(cardId);
  await redis.setex(cacheKey, 300, JSON.stringify(card)); // 5 min TTL
  return card;
}

return JSON.parse(cachedCard);
```

### Database Optimization
```typescript
// ✅ Use proper indexing and pagination
const transactions = await transactionRepository.find({
  where: { cardId },
  order: { createdAt: 'DESC' },
  skip: (page - 1) * limit,
  take: limit
});
```

## Testing Requirements

### Unit Test Patterns
```typescript
// ✅ Comprehensive test coverage
describe('CardManagementService', () => {
  it('should create virtual card with valid user and return encrypted data', async () => {
    // Arrange
    const userId = 'user123';
    const cardRequest = { dailyLimit: new Decimal('1000') };
    
    // Act
    const result = await cardService.createVirtualCard(userId, cardRequest);
    
    // Assert
    expect(result.cardId).toBeDefined();
    expect(result.userId).toBe(userId);
    expect(result.status).toBe(CardStatus.ACTIVE);
  });

  it('should throw ValidationError for invalid spending limit', async () => {
    // Test error scenarios
    await expect(
      cardService.createVirtualCard('user123', { dailyLimit: new Decimal('-100') })
    ).rejects.toThrow(ValidationError);
  });
});
```

## Naming Conventions

### File Structure
```
src/
├── controllers/     # API controllers (PascalCase)
├── services/       # Business logic (PascalCase)
├── repositories/   # Data access (PascalCase)
├── models/         # Data models (PascalCase)
├── middleware/     # Express middleware (camelCase)
├── utils/          # Utility functions (camelCase)
└── types/          # TypeScript types (PascalCase)
```

### Code Naming
- Classes: `PascalCase` (CardManagementService)
- Functions/Variables: `camelCase` (createVirtualCard)
- Constants: `UPPER_SNAKE_CASE` (MAX_DAILY_LIMIT)
- Files: `kebab-case` (card-management.service.ts)

## Compliance Checklist

### PCI DSS Requirements
- [ ] Encrypt all cardholder data (card numbers, CVV)
- [ ] Use secure key management (HashiCorp Vault)
- [ ] Implement access controls and authentication
- [ ] Maintain audit trails for all operations
- [ ] Regular security testing and vulnerability scans

### GDPR Compliance
- [ ] Data minimization and purpose limitation
- [ ] Right to be forgotten implementation
- [ ] Data portability features
- [ ] Consent management
- [ ] Privacy by design principles

### Audit Requirements
- [ ] Immutable audit trails for all financial operations
- [ ] 7-year data retention policy
- [ ] Comprehensive logging with correlation IDs
- [ ] Automated compliance reporting
- [ ] Suspicious activity detection and alerting

## Code Review Checklist

Before suggesting any code, verify:
- [ ] Uses Decimal.js for all monetary calculations
- [ ] Implements proper authentication and authorization
- [ ] Includes comprehensive audit logging
- [ ] Follows PCI DSS security requirements
- [ ] Uses parameterized database queries
- [ ] Implements proper error handling
- [ ] Includes appropriate TypeScript types
- [ ] Follows naming conventions
- [ ] Includes unit tests for business logic
- [ ] Implements proper caching strategies