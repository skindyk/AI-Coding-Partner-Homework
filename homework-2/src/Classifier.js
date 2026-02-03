class Classifier {
  // Confidence scoring constant - normalize keyword matches to 0-1 range
  static CONFIDENCE_NORMALIZATION_FACTOR = 3;

  static classify(ticketData) {
    const text = `${ticketData.subject} ${ticketData.description}`.toLowerCase();

    // Category classification
    let category = 'other';
    let categoryScore = 0;

    const categoryPatterns = {
      account_access: [
        'can\'t access', 'cannot access', 'login', 'password', '2fa', '2-factor',
        'sign in', 'signin', 'locked out', 'lock out', 'unable to login',
        'authentication', 'account locked'
      ],
      technical_issue: [
        'error', 'crash', 'not working', 'broken', 'failing',
        'exception', 'technical', 'system error', 'timeout', 'slow', 'lag'
      ],
      billing_question: [
        'payment', 'invoice', 'refund', 'charge', 'billing', 'bill',
        'credit card', 'subscription', 'cost', 'price', 'money',
        'pay', 'payment method'
      ],
      feature_request: [
        'feature', 'request', 'suggestion', 'enhancement', 'add',
        'implement', 'would like', 'would be nice', 'support for',
        'capability', 'ability'
      ],
      bug_report: [
        'bug', 'defect', 'steps to reproduce',
        'reproduce', 'reproduction', 'occurs when', 'happens when'
      ]
    };

    // Count keyword matches for each category
    const scores = {};
    Object.entries(categoryPatterns).forEach(([cat, patterns]) => {
      let score = 0;
      patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          score++;
        }
      });
      scores[cat] = score;
    });

    // Find category with highest score
    const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (topCategory[1] > 0) {
      category = topCategory[0];
      // Normalize score to 0-1 range based on keyword match count
      categoryScore = Math.min(1, topCategory[1] / Classifier.CONFIDENCE_NORMALIZATION_FACTOR);
    }

    // Priority classification
    let priority = 'medium'; // default
    const priorityPatterns = {
      urgent: [
        'can\'t access', 'cannot access', 'critical', 'production down',
        'security', 'urgent', 'emergency', 'asap', 'immediately'
      ],
      high: [
        'important', 'blocking', 'priority', 'high', 'major'
      ],
      low: [
        'minor', 'cosmetic', 'suggestion', 'nice to have',
        'low', 'trivial'
      ]
    };

    // Check urgent
    if (priorityPatterns.urgent.some(p => text.includes(p))) {
      priority = 'urgent';
    } else if (priorityPatterns.high.some(p => text.includes(p))) {
      priority = 'high';
    } else if (priorityPatterns.low.some(p => text.includes(p))) {
      priority = 'low';
    }

    // Find keywords that matched
    const foundKeywords = [];
    const allPatterns = categoryPatterns[category] || [];
    allPatterns.forEach(pattern => {
      if (text.includes(pattern)) {
        foundKeywords.push(pattern);
      }
    });

    return {
      category,
      priority,
      confidence: categoryScore,
      reasoning: `Classified as "${category}" based on keyword matching. Assigned priority "${priority}".`,
      keywords_found: foundKeywords
    };
  }
}

module.exports = Classifier;
