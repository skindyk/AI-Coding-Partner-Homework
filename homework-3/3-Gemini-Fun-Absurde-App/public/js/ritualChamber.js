'use strict';

let ritualState = null;
let currentRitualDemon = null;

/**
 * Open the ritual chamber modal for a demon
 */
function openRitualChamber(demon) {
  currentRitualDemon = demon;
  document.getElementById('ritualModal').classList.remove('hidden');
  document.getElementById('ritualTitle').textContent = `${demon.title} Awaits Your Contrition`;

  // Initialize ritual based on type
  if (demon.ritualType === 'MANTRA') {
    renderMantraRitual(demon);
  } else if (demon.ritualType === 'MATH') {
    renderMathRitual(demon);
  } else if (demon.ritualType === 'WAIT') {
    renderWaitRitual(demon);
  } else if (demon.ritualType === 'SHAME') {
    renderShameRitual(demon);
  }

  document.getElementById('exorciseButton').addEventListener('click', completeRitual);
}

/**
 * Close ritual modal
 */
function closeRitualChamber() {
  document.getElementById('ritualModal').classList.add('hidden');
  exitPossessedMode();
}

/**
 * Render MANTRA ritual
 */
function renderMantraRitual(demon) {
  const content = document.getElementById('ritualContent');
  content.innerHTML = `
    <div class="ritual-mantra">
      <p style="text-align: center; margin-bottom: 20px; font-size: 1.1em;">
        ${demon.punishmentMessage}
      </p>
      <div style="text-align: center; margin-bottom: 15px;">
        <p><strong>Type this ${demon.ritualConfig.repetitions} times:</strong></p>
        <p style="font-size: 1.2em; font-weight: bold; color: #8b0000; margin: 10px 0;">
          "${demon.ritualConfig.targetString}"
        </p>
      </div>
      <textarea
        id="mantraInput"
        placeholder="Type the mantra here..."
        style="width: 100%; min-height: 100px; margin-bottom: 15px; font-size: 1em;"
      ></textarea>
      <div style="text-align: center; margin-bottom: 15px;">
        <p id="mantraProgress">Progress: 0 / ${demon.ritualConfig.repetitions}</p>
      </div>
      <button class="btn btn-primary" onclick="submitMantra()">Submit</button>
    </div>
  `;

  document.getElementById('mantraInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitMantra();
    }
  });
}

/**
 * Submit mantra
 */
async function submitMantra() {
  const input = document.getElementById('mantraInput').value;
  if (!input.trim()) {
    alert('Please type something');
    return;
  }

  const target = currentRitualDemon.ritualConfig.targetString;
  const progress = document.getElementById('mantraProgress');

  if (input.trim().toLowerCase() === target.toLowerCase()) {
    // Correct - increment progress
    const current = parseInt(progress.textContent.match(/\d+/)[0]);
    const next = current + 1;
    const target_count = currentRitualDemon.ritualConfig.repetitions;

    progress.textContent = `Progress: ${next} / ${target_count}`;
    document.getElementById('mantraInput').value = '';

    // Update progress bar
    updateProgress((next / target_count) * 100);

    // Check if complete
    if (next >= target_count) {
      updateProgress(100);
      document.getElementById('exorciseButton').disabled = false;
      alert('✓ You have spoken the truth! The demon weakens!');
    }
  } else {
    // Wrong - reset progress
    progress.textContent = `Progress: 0 / ${currentRitualDemon.ritualConfig.repetitions}`;
    updateProgress(0);
    document.getElementById('mantraInput').value = '';
    alert('✗ THE DEMON LAUGHS AT YOUR WEAKNESS!');
  }
}

/**
 * Render MATH ritual
 */
function renderMathRitual(demon) {
  const content = document.getElementById('ritualContent');
  content.innerHTML = `
    <div class="ritual-math">
      <p style="text-align: center; margin-bottom: 20px; font-size: 1.1em;">
        ${demon.punishmentMessage}
      </p>
      <div style="text-align: center; background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p id="mathProblem" style="font-size: 1.5em; font-weight: bold; margin-bottom: 15px;">
          Problem: 0 + 0 = ?
        </p>
        <input
          type="number"
          id="mathAnswer"
          placeholder="Your answer"
          style="width: 100%; padding: 10px; font-size: 1.1em; margin-bottom: 15px;"
        >
        <p id="mathProgress" style="margin-bottom: 15px;">Problem 1 of ${demon.ritualConfig.problemCount}</p>
      </div>
      <button class="btn btn-primary" onclick="submitMathAnswer()">Submit Answer</button>
    </div>
  `;

  // Generate first problem
  generateAndDisplayProblem(demon);

  document.getElementById('mathAnswer').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitMathAnswer();
    }
  });
}

/**
 * Submit math answer
 */
async function submitMathAnswer() {
  const answer = document.getElementById('mathAnswer').value;
  if (!answer) {
    alert('Please enter an answer');
    return;
  }

  // Simulate answer checking (in a real app, this would be validated server-side)
  const userAnswer = parseInt(answer, 10);
  const problemText = document.getElementById('mathProblem').textContent;
  const problemMatch = problemText.match(/Problem: (.+) = \?/);

  if (!problemMatch) {
    return;
  }

  const problemExpr = problemMatch[1];
  let correctAnswer = 0;

  if (problemExpr.includes('+')) {
    const [a, b] = problemExpr.split('+').map(x => parseInt(x.trim()));
    correctAnswer = a + b;
  } else if (problemExpr.includes('×')) {
    const [a, b] = problemExpr.split('×').map(x => parseInt(x.trim()));
    correctAnswer = a * b;
  } else if (problemExpr.includes('-')) {
    const [a, b] = problemExpr.split('-').map(x => parseInt(x.trim()));
    correctAnswer = a - b;
  } else if (problemExpr.includes('% of')) {
    const [perc, val] = problemExpr.split('% of').map(x => parseInt(x.trim()));
    correctAnswer = Math.floor((perc / 100) * val);
  }

  if (userAnswer === correctAnswer) {
    const progress = document.getElementById('mathProgress').textContent;
    const match = progress.match(/Problem (\d+) of (\d+)/);
    const current = parseInt(match[1]);
    const total = parseInt(match[2]);

    if (current >= total) {
      updateProgress(100);
      document.getElementById('exorciseButton').disabled = false;
      alert('✓ All problems solved! The demon is weakened!');
    } else {
      updateProgress((current / total) * 100);
      generateAndDisplayProblem(currentRitualDemon);
      document.getElementById('mathAnswer').value = '';
      document.getElementById('mathProgress').textContent = `Problem ${current + 1} of ${total}`;
    }
  } else {
    alert(`✗ Wrong! The correct answer is ${correctAnswer}. Try again.`);
    document.getElementById('mathAnswer').value = '';
  }
}

/**
 * Generate and display a math problem
 */
function generateAndDisplayProblem(demon) {
  const difficulty = demon.ritualConfig.difficulty;
  let problem = {};

  if (difficulty === 1) {
    const a = Math.floor(Math.random() * 100);
    const b = Math.floor(Math.random() * 100);
    const op = Math.random() < 0.5 ? '+' : '-';
    problem = { expr: `${a} ${op} ${b}`, answer: op === '+' ? a + b : a - b };
  } else if (difficulty === 2) {
    const a = Math.floor(Math.random() * 13);
    const b = Math.floor(Math.random() * 13);
    problem = { expr: `${a} × ${b}`, answer: a * b };
  } else if (difficulty === 3) {
    const perc = Math.floor(Math.random() * 100) + 1;
    const val = Math.floor(Math.random() * 10000) + 100;
    problem = { expr: `${perc}% of ${val}`, answer: Math.floor((perc / 100) * val) };
  }

  document.getElementById('mathProblem').textContent = `Problem: ${problem.expr} = ?`;
}

/**
 * Render WAIT ritual
 */
function renderWaitRitual(demon) {
  const durationSeconds = demon.ritualConfig.durationSeconds;
  const content = document.getElementById('ritualContent');
  content.innerHTML = `
    <div class="ritual-wait" style="text-align: center;">
      <p style="margin-bottom: 20px; font-size: 1.1em;">
        ${demon.punishmentMessage}
      </p>
      <div style="font-size: 4em; font-weight: bold; color: #8b0000; font-family: 'Creepster', cursive; margin: 40px 0;">
        <span id="waitTimer">${durationSeconds}</span>
      </div>
      <p style="font-size: 1.1em; color: #666;">Meditate in silence...</p>
    </div>
  `;

  let remaining = durationSeconds;
  const timer = setInterval(() => {
    remaining--;
    document.getElementById('waitTimer').textContent = remaining;
    updateProgress(((durationSeconds - remaining) / durationSeconds) * 100);

    if (remaining <= 0) {
      clearInterval(timer);
      updateProgress(100);
      document.getElementById('exorciseButton').disabled = false;
      document.getElementById('waitTimer').textContent = '0';
      alert('✓ The meditation is complete. The demon releases you.');
    }
  }, 1000);
}

/**
 * Render SHAME ritual
 */
function renderShameRitual(demon) {
  const content = document.getElementById('ritualContent');
  content.innerHTML = `
    <div class="ritual-shame">
      <p style="text-align: center; margin-bottom: 20px; font-size: 1.1em;">
        ${demon.punishmentMessage}
      </p>
      <textarea
        id="shameInput"
        placeholder="Confess your truth..."
        style="width: 100%; min-height: 150px; margin-bottom: 15px; font-size: 1em;"
      ></textarea>
      <div style="text-align: center; margin-bottom: 15px;">
        <p id="shameLength">Character count: 0 / 10</p>
      </div>
      <button class="btn btn-primary" id="shameSubmit" onclick="submitShameResponse()" disabled>Confess</button>
    </div>
  `;

  const input = document.getElementById('shameInput');
  const submitBtn = document.getElementById('shameSubmit');
  const lengthDisplay = document.getElementById('shameLength');

  input.addEventListener('input', () => {
    const length = input.value.trim().length;
    lengthDisplay.textContent = `Character count: ${length} / 10`;
    submitBtn.disabled = length < 10;

    if (length >= 10) {
      updateProgress(Math.min(100, (length / 100) * 100));
    }
  });
}

/**
 * Submit shame response
 */
async function submitShameResponse() {
  const text = document.getElementById('shameInput').value;
  if (text.trim().length >= 10) {
    updateProgress(100);
    document.getElementById('exorciseButton').disabled = false;
    alert('✓ Your shame is acknowledged. The demon withdraws.');
  }
}

/**
 * Update progress bar
 */
function updateProgress(percent) {
  const fill = document.getElementById('ritualProgress');
  fill.style.width = percent + '%';
}

/**
 * Complete ritual and exorcise
 */
async function completeRitual() {
  try {
    // In a real app, this would call a server endpoint to mark the offering as exorcised
    closeRitualChamber();
    alert('🔥 THE DEMON HAS BEEN EXORCISED! 🔥');
    await updateDashboard();
  } catch (err) {
    console.error('Ritual completion error:', err);
  }
}
