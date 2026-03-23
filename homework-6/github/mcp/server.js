'use strict';

const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../shared/results');

const server = new McpServer({
  name: 'pipeline-status',
  version: '1.0.0'
});

// Tool 1: get_transaction_status
server.tool(
  'get_transaction_status',
  'Returns the current status of a transaction from shared/results/ including fraud risk and compliance flags',
  {
    transaction_id: z.string().describe('Transaction ID, e.g. TXN001')
  },
  async ({ transaction_id }) => {
    const filePath = path.join(RESULTS_DIR, `${transaction_id}.json`);

    if (!fs.existsSync(filePath)) {
      return {
        content: [{
          type: 'text',
          text: `No result found for transaction ${transaction_id}. Run npm run pipeline first.`
        }]
      };
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const msg = JSON.parse(raw);
    const d = msg.data || {};

    const result = {
      transaction_id: d.transaction_id,
      status: d.status,
      reason: d.reason || null,
      fraud_risk_level: d.fraud_risk_level || null,
      fraud_risk_score: d.fraud_risk_score !== undefined ? d.fraud_risk_score : null,
      compliance_flags: d.compliance_flags || [],
      agent_chain: msg.agent_chain || []
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// Tool 2: list_pipeline_results
server.tool(
  'list_pipeline_results',
  'Returns a summary of all processed transactions from shared/results/ with status, fraud level, and compliance flags',
  {},
  async () => {
    if (!fs.existsSync(RESULTS_DIR)) {
      return {
        content: [{
          type: 'text',
          text: 'No results directory found. Run npm run pipeline first.'
        }]
      };
    }

    const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No result files found. Run npm run pipeline first.'
        }]
      };
    }

    const summary = files.map(f => {
      const msg = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf-8'));
      const d = msg.data || {};
      return {
        transaction_id: d.transaction_id,
        status: d.status,
        reason: d.reason || null,
        fraud_risk_level: d.fraud_risk_level || null,
        compliance_flags: d.compliance_flags || []
      };
    });

    const approved = summary.filter(r => r.status === 'approved').length;
    const rejected = summary.filter(r => r.status === 'rejected').length;
    const onHold = summary.filter(r => r.status === 'compliance_hold').length;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          summary: {
            total: files.length,
            approved,
            rejected,
            compliance_hold: onHold
          },
          transactions: summary
        }, null, 2)
      }]
    };
  }
);

// Resource: pipeline://summary
server.resource(
  'pipeline-summary',
  new ResourceTemplate('pipeline://summary', { list: undefined }),
  async (uri) => {
    if (!fs.existsSync(RESULTS_DIR)) {
      return {
        contents: [{ uri: uri.href, text: 'Pipeline not yet run. Execute: npm run pipeline' }]
      };
    }

    const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      return {
        contents: [{ uri: uri.href, text: 'No results yet. Execute: npm run pipeline' }]
      };
    }

    let approved = 0, rejected = 0, onHold = 0;
    const rejectedList = [];
    const holdList = [];

    files.forEach(f => {
      const msg = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf-8'));
      const d = msg.data || {};
      if (d.status === 'approved') approved++;
      else if (d.status === 'rejected') {
        rejected++;
        rejectedList.push(`${d.transaction_id}: ${d.reason}`);
      } else if (d.status === 'compliance_hold') {
        onHold++;
        holdList.push(`${d.transaction_id}: ${(d.compliance_flags || []).join(', ')}`);
      }
    });

    const lines = [
      'Pipeline Summary',
      '----------------',
      `Total processed: ${files.length}`,
      `Approved: ${approved}`,
      `Rejected: ${rejected}${rejectedList.length ? '\n  ' + rejectedList.join('\n  ') : ''}`,
      `Compliance hold: ${onHold}${holdList.length ? '\n  ' + holdList.join('\n  ') : ''}`
    ];

    return {
      contents: [{ uri: uri.href, text: lines.join('\n') }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error('MCP server error:', err);
  process.exit(1);
});
