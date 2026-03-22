const Decimal = require('decimal.js');

/**
 * Masks an account number for safe logging
 * @param {string} accountNumber - Account to mask (e.g., "ACC-1001")
 * @returns {string} Masked account (e.g., "ACC-****")
 */
function maskAccount(accountNumber) {
  if (!accountNumber || accountNumber.length <= 4) {
    return accountNumber;
  }
  return accountNumber.substring(0, 4) + '-****';
}

/**
 * Logs a fraud detection event
 * @param {string} transactionId - Transaction ID
 * @param {number} fraudScore - Fraud risk score
 * @param {string} riskLevel - Risk level (LOW/MEDIUM/HIGH)
 * @param {string} sourceAccount - Source account (will be masked)
 */
function logFraudDetection(transactionId, fraudScore, riskLevel, sourceAccount) {
  const timestamp = new Date().toISOString();
  const maskedAccount = maskAccount(sourceAccount);
  console.log(
    `[${timestamp}] [fraud-detector] ${transactionId} → score:${fraudScore}, level:${riskLevel} (${maskedAccount})`
  );
}

/**
 * Calculates fraud risk score based on heuristics
 * Scoring rules:
 * - amount > $10,000: +3 points
 * - amount > $50,000: +4 additional points
 * - timestamp hour 02-05 UTC: +2 points (unusual hour)
 * - country != 'US': +1 point (cross-border)
 * - destination_account == 'ACC-9999': +5 points (watchlist hit)
 *
 * Risk levels:
 * - 0-2 points: LOW
 * - 3-6 points: MEDIUM
 * - 7+ points: HIGH
 *
 * @param {string} amount - Amount as string or Decimal
 * @param {string} destinationAccount - Destination account
 * @param {string} timestamp - ISO 8601 timestamp
 * @param {Object} metadata - Transaction metadata with country field
 * @returns {Object} { score, level }
 */
function calculateFraudScore(amount, destinationAccount, timestamp, metadata = {}) {
  let score = 0;

  // Parse amount as Decimal
  const decimalAmount = new Decimal(amount);

  // Amount-based scoring (additive)
  if (decimalAmount.gt(50000)) {
    score += 4; // +4 for >$50K (in addition to >$10K)
  }
  if (decimalAmount.gt(10000)) {
    score += 3; // +3 for >$10K
  }

  // Timestamp-based scoring: unusual hour (02:00-05:00 UTC)
  if (timestamp) {
    try {
      const date = new Date(timestamp);
      const utcHour = date.getUTCHours();
      if (utcHour >= 2 && utcHour <= 5) {
        score += 2;
      }
    } catch (err) {
      // Invalid timestamp, skip scoring
    }
  }

  // Geographic scoring: cross-border (non-US)
  if (metadata && metadata.country && metadata.country !== 'US') {
    score += 1;
  }

  // Watchlist scoring: destination ACC-9999
  if (destinationAccount === 'ACC-9999') {
    score += 5;
  }

  // Determine risk level
  let level;
  if (score >= 7) {
    level = 'HIGH';
  } else if (score >= 3) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  return { score, level };
}

/**
 * Processes a validated transaction through fraud detection
 * Pure function: no side effects, only logging
 *
 * @param {Object} message - Standard message envelope with validated transaction
 * @returns {Object} Enhanced message with fraud risk assessment
 */
function processMessage(message) {
  const tx = message.data;

  // Only process validated transactions
  if (tx.status !== 'validated') {
    return {
      ...message,
      source_agent: 'fraud-detector',
      target_agent: 'compliance-checker',
      agent_chain: [...(message.agent_chain || []), 'fraud-detector'],
      data: tx
    };
  }

  // Calculate fraud score and risk level
  const { score, level } = calculateFraudScore(
    tx.amount,
    tx.destination_account,
    tx.timestamp,
    tx.metadata
  );

  // Determine if CTR (Customer Transaction Report) is required
  // Rule: wire_transfer AND amount > $10,000
  const decimalAmount = new Decimal(tx.amount);
  const ctrRequired =
    tx.transaction_type === 'wire_transfer' && decimalAmount.gt(10000);

  logFraudDetection(tx.transaction_id, score, level, tx.source_account);

  return {
    ...message,
    source_agent: 'fraud-detector',
    target_agent: 'compliance-checker',
    agent_chain: [...(message.agent_chain || []), 'fraud-detector'],
    data: {
      ...tx,
      fraud_risk_score: score,
      fraud_risk_level: level,
      ctr_required: ctrRequired
    }
  };
}

module.exports = {
  processMessage,
  calculateFraudScore,
  maskAccount
};
