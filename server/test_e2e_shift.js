// Automated End-to-End Test for Night Shift: SOC Phase 1 Core Shift Loop
const assert = require('node:assert');

async function runTest() {
  console.log('=== Night Shift: SOC Phase 1 E2E Integration Test ===\n');

  const BASE_URL = 'http://localhost:3001/api';

  // 1. Health check
  console.log('1. Checking Server Health...');
  const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
  assert.strictEqual(healthRes.status, 'ONLINE');
  console.log('   [OK] Server is ONLINE\n');

  // 2. Start Shift
  console.log('2. Starting 10-minute Shift...');
  const startRes = await fetch(`${BASE_URL}/shifts/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analystCallsign: 'Echo-Seven', shiftTitle: 'E2E Verification Watch' })
  }).then(r => r.json());
  assert.strictEqual(startRes.success, true);
  const shiftId = startRes.shift.shiftId;
  console.log(`   [OK] Shift initiated: ${shiftId}, duration: ${startRes.shift.durationSeconds}s\n`);

  // 3. Triage Alert 1 at game second 20 (Port Scan)
  console.log('3. Triaging Alert 1 (Port Scan)...');
  const state20 = await fetch(`${BASE_URL}/shifts/${shiftId}?gameSecond=20`).then(r => r.json());
  assert.strictEqual(state20.shift.alerts.length >= 1, true);
  const portScanAlert = state20.shift.alerts.find(a => a.category === 'port_scan') || state20.shift.alerts[0];
  console.log(`   Found alert: ${portScanAlert.id} - ${portScanAlert.title} (${portScanAlert.severity})`);

  // Action: Block IP (Optimal)
  const act1 = await fetch(`${BASE_URL}/shifts/${shiftId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId: portScanAlert.id, actionTaken: 'Block IP', gameSecond: 25 })
  }).then(r => r.json());
  assert.strictEqual(act1.success, true);
  assert.strictEqual(act1.result.isCorrect, true);
  assert.strictEqual(act1.result.isOptimal, true);
  assert.strictEqual(act1.result.totalPoints > 100, true);
  console.log(`   [OK] Optimal action verified! Points: +${act1.result.totalPoints}`);
  console.log(`   Rationale: ${act1.result.educationalRationale.topic}\n`);

  // 4. Triage Alert 2 at game second 85 (Brute Force)
  console.log('4. Triaging Alert 2 (Brute Force - Testing Breach Penalty)...');
  const state85 = await fetch(`${BASE_URL}/shifts/${shiftId}?gameSecond=85`).then(r => r.json());
  const bruteAlert = state85.shift.alerts.find(a => a.category === 'brute_force');
  assert.ok(bruteAlert, 'Brute force alert should be visible at second 85');
  console.log(`   Found alert: ${bruteAlert.id} - ${bruteAlert.title} (${bruteAlert.severity})`);

  // Action: Dismiss (Wrong! Real threat dismissed)
  const act2 = await fetch(`${BASE_URL}/shifts/${shiftId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId: bruteAlert.id, actionTaken: 'Dismiss', gameSecond: 75 })
  }).then(r => r.json());
  assert.strictEqual(act2.success, true);
  assert.strictEqual(act2.result.isCorrect, false);
  assert.strictEqual(act2.result.totalPoints < 0, true);
  console.log(`   [OK] Breach penalty verified! Points: ${act2.result.totalPoints} (Dismissing real attack incurs heavy penalty)`);
  console.log(`   Feedback: ${act2.result.feedback.slice(0, 80)}...\n`);

  // 5. Triage Alert 3 at game second 170 (Benign Vuln Scanner)
  console.log('5. Triaging Alert 3 (Benign Qualys/Nessus Scanner)...');
  const state170 = await fetch(`${BASE_URL}/shifts/${shiftId}?gameSecond=170`).then(r => r.json());
  const scannerAlert = state170.shift.alerts.find(a => a.category === 'benign_baseline') || state170.shift.alerts[0];
  assert.ok(scannerAlert, 'Benign scanner alert should be visible');
  console.log(`   Found alert: ${scannerAlert.id} - ${scannerAlert.title}`);

  // Action: Dismiss (Correct for benign baseline)
  const act3 = await fetch(`${BASE_URL}/shifts/${shiftId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId: scannerAlert.id, actionTaken: 'Dismiss', gameSecond: 175 })
  }).then(r => r.json());
  assert.strictEqual(act3.success, true);
  assert.strictEqual(act3.result.isCorrect, true);
  assert.strictEqual(act3.result.totalPoints > 0, true);
  console.log(`   [OK] Benign dismissal rewarded! Points: +${act3.result.totalPoints}\n`);

  // 6. Conclude Shift & Compile Report
  console.log('6. Concluding Shift & Compiling Debrief Report...');
  const completeRes = await fetch(`${BASE_URL}/shifts/${shiftId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameSecond: 600 })
  }).then(r => r.json());
  assert.strictEqual(completeRes.success, true);
  const rep = completeRes.report;
  console.log(`   [OK] Report generated: Grade=${rep.grade}, Accuracy=${rep.accuracyPercent}%, MTTT=${rep.mtttSeconds}s`);
  console.log(`   Breakdown count: ${rep.breakdown.length} items`);
  console.log(`   Caught: ${rep.caughtCount}, Missed: ${rep.missedCount}`);
  assert.strictEqual(rep.breakdown.length >= 5, true);
  console.log('');

  // 7. Verify SQLite Persistence
  console.log('7. Verifying SQLite Database Persistence...');
  const profileRes = await fetch(`${BASE_URL}/analyst/profile`).then(r => r.json());
  assert.strictEqual(profileRes.success, true);
  console.log(`   Analyst: ${profileRes.profile.callsign} [${profileRes.profile.rank}]`);
  console.log(`   Total Shifts Completed in SQLite: ${profileRes.profile.shifts_completed}`);
  console.log(`   Total Alerts Triaged in SQLite: ${profileRes.profile.total_alerts_triaged}`);
  assert.strictEqual(profileRes.profile.shifts_completed >= 1, true);

  const historyRes = await fetch(`${BASE_URL}/analyst/history`).then(r => r.json());
  assert.strictEqual(historyRes.success, true);
  assert.strictEqual(historyRes.history.length >= 1, true);
  console.log(`   Recent Shifts logged: ${historyRes.history.length} records in SQLite`);

  console.log('\n=== ALL PHASE 1 REQUIREMENTS VERIFIED SUCCESSFULLY! ===');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
