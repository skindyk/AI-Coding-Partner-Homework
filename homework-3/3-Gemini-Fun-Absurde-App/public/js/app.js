'use strict';

// ===== Utilities =====

/**
 * Fetch API wrapper with error handling
 */
async function fetchApi(method, path, body = null, customHeaders = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Convert cents to dollar display
 */
function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Convert timestamp to readable date
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Get sin category color/emoji
 */
function getCategoryEmoji(category) {
  const emojis = {
    GLUTTONY: '🍔',
    VANITY: '💄',
    SLOTH: '😴',
    GREED: '💰',
    LUST: '💎',
    WRATH: '😠'
  };
  return emojis[category] || '📌';
}

// ===== State Management =====

let offerings = [];
let currentPossession = null;

// ===== API Calls =====

/**
 * Load all offerings from server
 */
async function loadOfferings() {
  try {
    const result = await fetchApi('GET', '/api/v1/transactions');
    offerings = result.data || [];
    renderTransactions();
  } catch (err) {
    console.error('Failed to load offerings:', err);
    showError('Failed to load offerings');
  }
}

/**
 * Create a new offering
 */
async function createOffering(amount, description, category) {
  try {
    const amountCents = Math.round(amount * 100);
    const result = await fetchApi('POST', '/api/v1/transactions', {
      amount: amountCents,
      description,
      category
    });

    offerings.push(result.data.offering);
    renderTransactions();
    await updateDashboard();

    // Check for possession
    if (result.data.possession) {
      enterPossessedMode(result.data.possession);
    }

    showSuccess('Offering recorded');
  } catch (err) {
    console.error('Failed to create offering:', err);
    showError(err.message);
  }
}

/**
 * Update an offering
 */
async function updateOffering(id, updates) {
  try {
    const result = await fetchApi('PUT', `/api/v1/transactions/${id}`, updates);
    const index = offerings.findIndex(o => o.id === id);
    if (index >= 0) {
      offerings[index] = result.data;
    }
    renderTransactions();
    await updateDashboard();
    showSuccess('Offering updated');
  } catch (err) {
    console.error('Failed to update offering:', err);
    showError(err.message);
  }
}

/**
 * Delete an offering
 */
async function deleteOffering(id) {
  if (!confirm('Are you sure you want to delete this offering? This cannot be undone.')) {
    return;
  }

  try {
    await fetchApi('DELETE', `/api/v1/transactions/${id}`);
    offerings = offerings.filter(o => o.id !== id);
    renderTransactions();
    await updateDashboard();
    showSuccess('Offering deleted');
  } catch (err) {
    console.error('Failed to delete offering:', err);
    showError(err.message);
  }
}

/**
 * Load dashboard data
 */
async function updateDashboard() {
  try {
    const result = await fetchApi('GET', '/api/v1/dashboard');
    const data = result.data;

    document.getElementById('soulPurity').textContent = Math.round(data.soulPurity);
    document.getElementById('totalOfferings').textContent = data.totalOfferings;
    document.getElementById('exorcisedCount').textContent = data.exorcisedCount;
    document.getElementById('totalPossessions').textContent = data.totalPossessions;

    // Render breakdown
    const breakdownList = document.getElementById('breakdownList');
    breakdownList.innerHTML = '';
    Object.entries(data.breakdown).forEach(([category, cents]) => {
      if (cents > 0) {
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
          <strong>${getCategoryEmoji(category)} ${category}</strong>
          <div class="amount">${formatMoney(cents)}</div>
        `;
        breakdownList.appendChild(item);
      }
    });
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

/**
 * Export all data
 */
async function exportData() {
  try {
    const result = await fetchApi('GET', '/api/v1/compliance/export');
    const dataStr = JSON.stringify(result.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial-exorcist-export.json';
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Data exported');
  } catch (err) {
    console.error('Failed to export data:', err);
    showError(err.message);
  }
}

/**
 * Purge all data
 */
async function purgeData() {
  if (!confirm('⚠️  This will PERMANENTLY delete all your data. Are you absolutely sure?')) {
    return;
  }

  try {
    await fetchApi('DELETE', '/api/v1/compliance/purge', null, { 'x-confirm-purge': 'yes' });
    offerings = [];
    renderTransactions();
    await updateDashboard();
    showSuccess('All data purged');
    location.reload(); // Refresh page
  } catch (err) {
    console.error('Failed to purge data:', err);
    showError(err.message);
  }
}

// ===== UI Rendering =====

/**
 * Render all transactions
 */
function renderTransactions() {
  const list = document.getElementById('transactionsList');
  list.innerHTML = '';

  if (offerings.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No offerings yet. Click "+ Add Offering" to begin your journey.</p>';
    return;
  }

  offerings.forEach(offering => {
    const card = document.createElement('div');
    card.className = 'transaction-card';
    card.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-description">
          ${getCategoryEmoji(offering.category)} ${offering.description}
        </div>
        <div class="transaction-meta">
          <span><strong>Category:</strong> ${offering.category}</span>
          <span><strong>Date:</strong> ${formatDate(offering.timestamp)}</span>
          ${offering.isExorcised ? '<span style="color: #4caf50;">✓ Exorcised</span>' : '<span style="color: #f44336;">Unexorcised</span>'}
        </div>
      </div>
      <div class="transaction-amount">${formatMoney(offering.amount)}</div>
      <div class="transaction-actions">
        ${!offering.isExorcised ? `
          <button class="btn btn-secondary btn-small" onclick="markExorcised('${offering.id}')">Mark Exorcised</button>
        ` : ''}
        <button class="btn btn-danger btn-small" onclick="deleteOffering('${offering.id}')">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

/**
 * Mark offering as exorcised
 */
async function markExorcised(id) {
  await updateOffering(id, { isExorcised: true });
}

/**
 * Enter possessed mode
 */
function enterPossessedMode(demon) {
  currentPossession = demon;
  document.body.classList.add('possessed');
  openRitualChamber(demon);
}

/**
 * Exit possessed mode
 */
function exitPossessedMode() {
  currentPossession = null;
  document.body.classList.remove('possessed');
  document.getElementById('ritualModal').classList.add('hidden');
}

/**
 * Show success message
 */
function showSuccess(message) {
  alert(`✓ ${message}`);
}

/**
 * Show error message
 */
function showError(message) {
  alert(`✗ Error: ${message}`);
}

// ===== Modal Handlers =====

/**
 * Open add transaction modal
 */
function openAddModal() {
  document.getElementById('addModal').classList.remove('hidden');
  document.getElementById('addForm').reset();
}

/**
 * Close add transaction modal
 */
function closeAddModal() {
  document.getElementById('addModal').classList.add('hidden');
}

/**
 * Handle add transaction form submission
 */
async function handleAddTransaction(event) {
  event.preventDefault();

  const amount = parseFloat(document.getElementById('amount').value);
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;

  if (!amount || !description || !category) {
    showError('Please fill in all fields');
    return;
  }

  await createOffering(amount, description, category);
  closeAddModal();
}

// ===== Event Listeners =====

document.addEventListener('DOMContentLoaded', async () => {
  // Load initial data
  await loadOfferings();
  await updateDashboard();

  // Add transaction modal
  document.getElementById('addButton').addEventListener('click', openAddModal);
  document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
  document.getElementById('cancelAddForm').addEventListener('click', closeAddModal);
  document.getElementById('addForm').addEventListener('submit', handleAddTransaction);

  // Export/Purge buttons
  document.getElementById('exportButton').addEventListener('click', exportData);
  document.getElementById('purgeButton').addEventListener('click', purgeData);

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    const addModal = document.getElementById('addModal');
    if (event.target === addModal) {
      closeAddModal();
    }
  });
});
