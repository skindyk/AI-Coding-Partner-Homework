const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import agent modules
const transactionValidator = require('./agents/transaction-validator');
const fraudDetector = require('./agents/fraud-detector');
const complianceChecker = require('./agents/compliance-checker');

/**
 * Shared directory path - can be overridden via environment variable for testing
 */
const SHARED_DIR = process.env.SHARED_DIR || path.join(__dirname, '../shared');

/**
 * Initialize directory structure
 * Creates input/, processing/, output/, and results/ subdirectories
 */
function initializeDirectories() {
  const dirs = ['input', 'processing', 'output', 'results'];
  for (const dir of dirs) {
    const dirPath = path.join(SHARED_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`[${new Date().toISOString()}] Created directory: ${dirPath}`);
    }
  }
}

/**
 * Masks an account number for safe logging and output
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
 * Masks all account fields in transaction data for output
 * @param {Object} transaction - Transaction object
 * @returns {Object} Transaction with masked accounts
 */
function maskAccountsInData(transaction) {
  const masked = { ...transaction };
  if (masked.source_account) {
    masked.source_account = maskAccount(masked.source_account);
  }
  if (masked.destination_account) {
    masked.destination_account = maskAccount(masked.destination_account);
  }
  return masked;
}

/**
 * Reads sample transactions from JSON file
 * @returns {Array<Object>} Array of transaction objects
 */
function readSampleTransactions() {
  const filePath = path.join(__dirname, '../sample-transactions.json');
  if (!fs.existsSync(filePath)) {
    console.error(`Error: sample-transactions.json not found at ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Writes a message to a file in a specific directory
 * @param {string} directory - Subdirectory (input, processing, output, results)
 * @param {string} filename - Filename
 * @param {Object} message - Message object to write
 */
function writeMessageToFile(directory, filename, message) {
  const dirPath = path.join(SHARED_DIR, directory);
  const filePath = path.join(dirPath, filename);
  fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
}

/**
 * Removes a file from a directory
 * @param {string} directory - Subdirectory
 * @param {string} filename - Filename
 */
function deleteFileFromDirectory(directory, filename) {
  const filePath = path.join(SHARED_DIR, directory, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Logs an integrator operation
 * @param {string} transactionId - Transaction ID
 * @param {string} operation - Operation description
 */
function logOperation(transactionId, operation) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [integrator] ${transactionId} → ${operation}`);
}

/**
 * Processes a single transaction through the entire agent pipeline
 * @param {Object} transaction - Raw transaction from sample data
 * @returns {Object} Final result message
 */
function processTransaction(transaction) {
  const transactionId = transaction.transaction_id;
  const messageId = uuidv4();

  logOperation(transactionId, 'processing started');

  // Create initial message envelope
  const initialMessage = {
    message_id: messageId,
    timestamp: new Date().toISOString(),
    source_agent: 'integrator',
    target_agent: 'transaction-validator',
    message_type: 'transaction',
    agent_chain: ['integrator'],
    data: {
      ...transaction,
      status: null,
      reason: null
    }
  };

  // Write to input/
  const inputFilename = `${transactionId}.json`;
  writeMessageToFile('input', inputFilename, initialMessage);
  logOperation(transactionId, 'written to input/');

  // Stage 1: Transaction Validator
  let message = transactionValidator.processMessage(initialMessage);
  writeMessageToFile('processing', inputFilename, message);
  logOperation(transactionId, `validator: ${message.data.status}`);

  // If validation failed, skip downstream agents and move to results
  if (message.data.status === 'rejected') {
    deleteFileFromDirectory('processing', inputFilename);
    const resultMessage = {
      ...message,
      data: maskAccountsInData(message.data)
    };
    writeMessageToFile('results', inputFilename, resultMessage);
    logOperation(transactionId, `rejected (${message.data.reason}) → results/`);
    return resultMessage;
  }

  // Stage 2: Fraud Detector
  message = fraudDetector.processMessage(message);
  writeMessageToFile('processing', inputFilename, message);
  logOperation(
    transactionId,
    `fraud-detector: score=${message.data.fraud_risk_score}, level=${message.data.fraud_risk_level}`
  );

  // Stage 3: Compliance Checker
  message = complianceChecker.processMessage(message);
  writeMessageToFile('output', inputFilename, message);
  logOperation(transactionId, `compliance-checker: ${message.data.status}`);

  // Move to results
  deleteFileFromDirectory('processing', inputFilename);
  const resultMessage = {
    ...message,
    data: maskAccountsInData(message.data)
  };
  writeMessageToFile('results', inputFilename, resultMessage);
  logOperation(transactionId, `final: ${message.data.status} → results/`);

  return resultMessage;
}

/**
 * Main pipeline orchestrator
 * Reads sample transactions, processes each through the agent pipeline,
 * and generates final results
 */
function runPipeline() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('Banking Transaction Pipeline');
  console.log('═══════════════════════════════════════════════════\n');

  // Initialize directory structure
  initializeDirectories();

  // Read sample transactions
  const transactions = readSampleTransactions();
  console.log(`\nRead ${transactions.length} transactions from sample-transactions.json\n`);

  // Process each transaction
  const results = [];
  for (const transaction of transactions) {
    try {
      const result = processTransaction(transaction);
      results.push(result);
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] [integrator] ERROR processing ${transaction.transaction_id}: ${err.message}`
      );
    }
  }

  // Generate summary report
  const approved = results.filter((r) => r.data.status === 'approved').length;
  const rejected = results.filter((r) => r.data.status === 'rejected').length;
  const complianceHold = results.filter(
    (r) => r.data.status === 'compliance_hold'
  ).length;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('Pipeline Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total processed: ${results.length}`);
  console.log(`Approved: ${approved}`);
  console.log(`Rejected: ${rejected}`);
  console.log(`Compliance hold: ${complianceHold}`);

  // List rejections
  const rejectedTransactions = results.filter((r) => r.data.status === 'rejected');
  if (rejectedTransactions.length > 0) {
    console.log('\nRejected transactions:');
    for (const result of rejectedTransactions) {
      console.log(
        `  - ${result.data.transaction_id}: ${result.data.reason}`
      );
    }
  }

  console.log('\nResult files written to: ' + path.join(SHARED_DIR, 'results/'));
  console.log('═══════════════════════════════════════════════════\n');

  return {
    summary: {
      total: results.length,
      approved,
      rejected,
      complianceHold
    },
    results
  };
}

// Run the pipeline if this is the main module
if (require.main === module) {
  runPipeline();
}

module.exports = {
  runPipeline,
  processTransaction,
  initializeDirectories,
  maskAccount,
  maskAccountsInData,
  readSampleTransactions,
  writeMessageToFile,
  deleteFileFromDirectory,
  SHARED_DIR
};
