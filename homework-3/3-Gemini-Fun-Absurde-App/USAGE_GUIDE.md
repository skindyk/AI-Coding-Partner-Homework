# How to Use The Financial Exorcist 👿💰

## Getting Started

```bash
cd homework-3/Fun-app
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 💡 Basic Usage

### 1. **Record an Offering (Transaction)**
Click **"+ Add Offering"** button to log a spending transaction:

- **Amount ($)** - How much you spent (e.g., 12.99)
- **Description** - What you bought (e.g., "Coffee at Starbucks")
- **Sin Category** - Choose one of:
  - 🍔 **Gluttony** - Food & drink
  - 💄 **Vanity** - Fashion & beauty
  - 😴 **Sloth** - Entertainment & comfort
  - 💰 **Greed** - Money & wealth
  - 💎 **Lust** - Luxury & desire
  - 😠 **Wrath** - Anger & revenge

Example:
```
Amount: 15.99
Description: Expensive coffee
Category: Gluttony
```

---

## 👹 When Demons Strike (Possession)

If your transaction **triggers a demon**, the app enters **Possessed Mode**:

- Screen turns **dark red** with gothic font
- A **Ritual Chamber** modal appears
- You must **complete a ritual** to regain control

### The 10 Demons & How They Trigger:

| Demon | Trigger | Ritual |
|-------|---------|--------|
| **Vogue-Zul** | Vanity purchase > $50 | Type mantra 30x: "I am not my fabric" |
| **Gluttonous Rex** | Gluttony transaction 1-4 AM | Solve 3 multiplication problems |
| **Uber-Lich** | Sloth transaction < $15 | Wait 5 minutes in silence |
| **Latte-Lucifer** | Any transaction with "coffee" + > $6 | Type mantra 10x: "It is just bean water" |
| **Sub-Succubus** | 5th Lust transaction | Wait 1 minute |
| **Amazonian Imp** | Greed transaction at 11 PM (hour 23) | Solve 1 hard math problem |
| **Stream-O-Phobia** | Lust > $15 | Confess something (10+ chars) |
| **Hoard-Wraith** | Gluttony transaction > $200 | Type mantra once: "List every item" |
| **Penny-Poltergeist** | Greed transaction ending in .99 | Solve 5 addition problems |
| **Debt-Diablo** | Wrath transaction with "interest" in description | Type mantra 50x: "I am a slave to APR" |

---

## 🔮 The Ritual Chamber

Each demon has a different mini-game:

### 1️⃣ **MANTRA** (Typing Challenge)
- Type the exact phrase correctly
- Reset to 0 if you make a typo
- Progress bar fills as you complete repetitions
- Example: Must type "I am not my fabric" 30 times perfectly

### 2️⃣ **MATH** (Equation Solver)
- Solve random arithmetic problems
- Each correct answer moves to the next problem
- Wrong answer = same problem with new numbers
- Difficulties:
  - **Easy** (Difficulty 1): Addition/subtraction up to 100
  - **Medium** (Difficulty 2): Multiplication up to 12×12
  - **Hard** (Difficulty 3): Percentage calculations

### 3️⃣ **WAIT** (Meditation)
- Sit in silence for a timer (usually 1-5 minutes)
- Just watch the countdown
- No interaction needed
- Time passes in real-time

### 4️⃣ **SHAME** (Confession)
- Write a confession of at least 10 characters
- The more you write, the more the demon weakens
- Examples: A book you haven't read, a lie you told, etc.

---

## 📊 Soul Purity Dashboard

Your **Soul Purity %** (top left) shows your financial health:

- **100%** = Perfect (no transactions)
- **Deductions:**
  - -5 for each unexorcised transaction
  - -2 for each exorcised transaction
  - -10 for any purchase over $100
  - -15 for late-night transactions (11 PM - 4 AM)
- **Bonuses:**
  - +3 per successfully completed ritual
  - +5 if no demons in last 7 days

**Sin Breakdown** shows how much you spent in each category:
```
Gluttony: $45.99
Vanity:   $129.50
Lust:     $89.99
...
```

---

## 🎮 Marking Transactions as Exorcised

In the **Recent Offerings** list, click **"Mark Exorcised"** to show you've dealt with a purchase through a ritual. This:
- Lowers the penalty (-2 instead of -5)
- Shows your financial responsibility
- Improves your Soul Purity score

---

## 📤 Export Your Data (GDPR)

Click **"Export Data"** to download all your financial data as JSON:
```json
{
  "offerings": [...all transactions...],
  "auditEvents": [...all audit log entries...],
  "exportedAt": "2024-02-07T..."
}
```

This lets you back up or analyze your spending.

---

## 🗑️ Purge All Data (Right to Erasure)

Click **"Purge All Data"** to:
1. Delete ALL transactions
2. Clear ALL audit logs
3. Reset Soul Purity to 100%

⚠️ **This is PERMANENT** - you'll need to confirm the action.

---

## 🛡️ API Endpoints (For Developers)

If you want to build tools around the API:

```bash
# Create a transaction
POST /api/v1/transactions
{
  "amount": 1999,  // cents (19.99)
  "description": "Coffee",
  "category": "GLUTTONY"
}

# Get all transactions
GET /api/v1/transactions

# Get dashboard data
GET /api/v1/dashboard
→ Returns: soulPurity, breakdown, totalOfferings, etc.

# View audit log
GET /api/v1/audit?action=POSSESSION_TRIGGERED

# Export data
GET /api/v1/compliance/export

# Purge data
DELETE /api/v1/compliance/purge
(Header: x-confirm-purge: yes)
```

---

## 💡 Pro Tips

1. **Avoid Vogue-Zul** - Don't buy expensive clothes! ($50+ on VANITY)
2. **Watch the Coffee** - "Coffee" + expensive = Latte-Lucifer possesses you
3. **Avoid Late Night Shopping** - Anything after 11 PM triggers Amazonian Imp
4. **Track Your Rituals** - Complete them to boost Soul Purity faster
5. **Use Export** - Analyze your spending patterns as JSON

---

## 🧪 Running Tests

To verify everything works:

```bash
npm test              # Run all tests
npm test -- --watch  # Run in watch mode
```

You'll see 175+ tests validating the entire system! ✓

---

## Architecture Overview

### Frontend Structure
- **Sanctuary Mode** - Clean professional UI (white/gold)
- **Possessed Mode** - Dark gothic UI (dark red/neon red)
- Dynamic ritual chamber with modal overlay
- Real-time dashboard updates

### Backend Structure
- **Express.js** REST API with security middleware
- **In-memory stores** for offerings, audit events, and ritual sessions
- **10 configurable demons** with unique trigger logic
- **4 ritual types** with different game mechanics
- **Append-only audit logging** for compliance

### Database
- All data stored in-memory (Map-based)
- Perfect for development and testing
- Can be easily swapped for a real database

---

## Troubleshooting

### App won't start?
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

### Tests failing?
```bash
# Check for syntax errors
npm test -- --detectOpenHandles

# Run specific test file
npm test tests/unit/offering.test.js
```

### Possession not triggering?
- Make sure the amount is in cents (e.g., 5000 for $50)
- Check the demon trigger conditions in the table above
- Try "Coffee" with amount 700 (> 600 cents) to trigger Latte-Lucifer

---

## Security Features

✅ **Input Sanitization** - All user input escaped to prevent XSS
✅ **Security Headers** - CSP, X-Frame-Options, X-Content-Type-Options
✅ **Rate Limiting** - 30 mutations per minute per session
✅ **Immutable Records** - Transaction amount & timestamp cannot be changed
✅ **Audit Trail** - Every action logged for compliance
✅ **GDPR Compliance** - Full data export and purge support

---

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test tests/unit/money.test.js

# Check coverage
npm test -- --coverage
```

---

**May the spirits guide your financial path.** 👻
