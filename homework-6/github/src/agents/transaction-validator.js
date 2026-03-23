const Decimal = require('decimal.js');

// ISO 4217 currency whitelist
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];

// Required fields for transaction validation
const REQUIRED_FIELDS = [
  'transaction_id',
  'amount',
  'currency',
  'source_account',
  'destination_account',
  'transaction_type',
  'timestamp'
];

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
 * Logs a transaction validation event
 * @param {string} transactionId - Transaction ID
 * @param {string} outcome - "validated" or rejection reason
 * @param {string} sourceAccount - Source account (will be masked)
 */
function logValidation(transactionId, outcome, sourceAccount) {
  const timestamp = new Date().toISOString();
  const maskedAccount = maskAccount(sourceAccount);
  console.log(
    `[${timestamp}] [transaction-validator] ${transactionId} → ${outcome} (${maskedAccount})`
  );
}

/**
 * Validates a transaction message
 * Pure function: no side effects, only logging
 *
 * @param {Object} message - Standard message envelope
 * @returns {Object} Enhanced message with validation status
 */
function processMessage(message) {
  const tx = message.data;

  // Validate required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in tx) || tx[field] === null || tx[field] === undefined) {
      logValidation(tx.transaction_id, `MISSING_FIELD:${field}`, tx.source_account);
      return {
        ...message,
        source_agent: 'transaction-validator',
        target_agent: 'compliance-checker',
        agent_chain: [...(message.agent_chain || []), 'transaction-validator'],
        data: {
          ...tx,
          status: 'rejected',
          reason: 'MISSING_FIELD'
        }
      };
    }
  }

  // Validate currency
  if (!VALID_CURRENCIES.includes(tx.currency)) {
    logValidation(tx.transaction_id, `INVALID_CURRENCY:${tx.currency}`, tx.source_account);
    return {
      ...message,
      source_agent: 'transaction-validator',
      target_agent: 'compliance-checker',
      agent_chain: [...(message.agent_chain || []), 'transaction-validator'],
      data: {
        ...tx,
        status: 'rejected',
        reason: 'INVALID_CURRENCY'
      }
    };
  }

  // Validate amount: parse as Decimal and check if > 0
  let decimalAmount;
  try {
    decimalAmount = new Decimal(tx.amount);
  } catch (err) {
    logValidation(tx.transaction_id, `INVALID_AMOUNT:${tx.amount}`, tx.source_account);
    return {
      ...message,
      source_agent: 'transaction-validator',
      target_agent: 'compliance-checker',
      agent_chain: [...(message.agent_chain || []), 'transaction-validator'],
      data: {
        ...tx,
        status: 'rejected',
        reason: 'INVALID_AMOUNT'
      }
    };
  }

  if (decimalAmount.lte(0)) {
    logValidation(tx.transaction_id, `INVALID_AMOUNT:${tx.amount}`, tx.source_account);
    return {
      ...message,
      source_agent: 'transaction-validator',
      target_agent: 'compliance-checker',
      agent_chain: [...(message.agent_chain || []), 'transaction-validator'],
      data: {
        ...tx,
        status: 'rejected',
        reason: 'INVALID_AMOUNT'
      }
    };
  }

  // All validations passed
  logValidation(tx.transaction_id, 'validated', tx.source_account);
  return {
    ...message,
    source_agent: 'transaction-validator',
    target_agent: 'fraud-detector',
    agent_chain: [...(message.agent_chain || []), 'transaction-validator'],
    data: {
      ...tx,
      status: 'validated',
      reason: null
    }
  };
}

module.exports = {
  processMessage,
  maskAccount
};
