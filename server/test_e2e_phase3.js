const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

// Test scenarioEngine and db directly or via local test server
const db = require('./db/database');
const scenarioEngine = require('./engine/scenarioEngine');

console.log('================================================================');
console.log('🧪 RUNNING NIGHT SHIFT: SOC — PHASE 3 E2E INTEGRATION TEST SUITE');
console.log('================================================================\n');

async function runTests() {
  const callsign = 'Echo-Seven-Test-' + Date.now();
  
  // 1. Seed test analyst in DB
  console.log(`[TEST 1] Testing Analyst Profile & Persistence (${callsign})...`);
  db.db.prepare(`
    INSERT INTO analysts (callsign, badge_number, rank, tier_level, score, shifts_completed, total_alerts_triaged, correct_actions, unlocked_campaign_shift)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(callsign, 'SOC-TEST', 'Tier 1 Triage Analyst', 1, 0, 0, 0, 0, 1);

  let profile = db.getAnalystProfile(callsign);
  assert.ok(profile, 'Analyst profile must be retrievable');
  assert.strictEqual(profile.tier_level, 1, 'Initial tier must be 1');
  assert.strictEqual(profile.unlocked_campaign_shift, 1, 'Initial unlocked campaign shift must be 1');
  assert.deepStrictEqual(profile.unlockedTools, ['LOGS', 'BLOCK_IP'], 'Tier 1 must have only LOGS & BLOCK_IP unlocked');
  console.log('  ✅ Initial Tier 1 profile created with correct tool gating metadata.');

  // 2. Test Campaign Shift Definitions
  console.log('\n[TEST 2] Testing 5 Handcrafted Campaign Shifts...');
  const campaignShifts = scenarioEngine.getCampaignShifts(callsign);
  assert.strictEqual(campaignShifts.length, 5, 'Must have exactly 5 handcrafted campaign shifts');
  
  const [s1, s2, s3, s4, s5] = campaignShifts;
  assert.strictEqual(s1.shiftNumber, 1);
  assert.strictEqual(s2.shiftNumber, 2);
  assert.strictEqual(s3.shiftNumber, 3);
  assert.strictEqual(s4.shiftNumber, 4);
  assert.strictEqual(s5.shiftNumber, 5);

  assert.strictEqual(s1.requiredTier, 1, 'Shift 1 must require Tier 1');
  assert.strictEqual(s3.requiredTier, 2, 'Shift 3 must require Tier 2');
  assert.strictEqual(s4.requiredTier, 2, 'Shift 4 must require Tier 2');
  assert.strictEqual(s5.requiredTier, 3, 'Shift 5 must require Tier 3');

  assert.strictEqual(s1.isUnlocked, true, 'Shift 1 must start unlocked');
  console.log('  ✅ All 5 campaign shifts verified with ascending tier requirements:');
  campaignShifts.forEach(cs => {
    console.log(`     - [Shift ${cs.shiftNumber}] ${cs.title} (Req: Tier ${cs.requiredTier}, Difficulty: ${cs.difficulty})`);
  });

  // 3. Test Handcrafted Shift 4: Insider Threat & Supply Chain Signed Binary
  console.log('\n[TEST 3] Testing Handcrafted Campaign Shift 4 (Insider & Supply Chain)...');
  const shift4 = scenarioEngine.startCampaignShift({ shiftNumber: 4, analystCallsign: callsign });
  assert.ok(shift4.shiftId.startsWith('CAMP-4-'), 'Shift ID must follow CAMP-4 prefix');
  assert.strictEqual(shift4.campaignShiftNumber, 4);

  // Fast forward to gameSecond 200 to reveal all scheduled alerts
  const shift4State = scenarioEngine.getShiftState(shift4.shiftId, 200);
  assert.strictEqual(shift4State.alerts.length, 3, 'Shift 4 must contain 3 alerts');

  const insiderAlert = shift4State.alerts.find(a => a.scenarioId === 'SCENARIO_INSIDER_EXFIL_01');
  const backupAlert = shift4State.alerts.find(a => a.scenarioId === 'SCENARIO_BENIGN_BACKUP_01');
  const supplyChainAlert = shift4State.alerts.find(a => a.scenarioId === 'SCENARIO_SUPPLY_CHAIN_01');

  assert.ok(insiderAlert, 'Shift 4 must contain SCENARIO_INSIDER_EXFIL_01');
  assert.ok(backupAlert, 'Shift 4 must contain SCENARIO_BENIGN_BACKUP_01 (benign noise)');
  assert.ok(supplyChainAlert, 'Shift 4 must contain SCENARIO_SUPPLY_CHAIN_01');

  // Verify Insider threat evidence
  assert.strictEqual(insiderAlert.category, 'insider_threat');
  assert.ok(insiderAlert.endpoint_processes.some(p => p.name === 'rclone.exe'), 'Insider must show rclone.exe');

  // Verify Supply Chain signed binary evidence
  assert.strictEqual(supplyChainAlert.category, 'supply_chain');
  assert.ok(supplyChainAlert.endpoint_processes.some(p => p.name === 'SolarMonitoringAgent.exe'), 'Supply chain must show signed binary');
  assert.ok(supplyChainAlert.raw_logs.some(l => l.includes('PROCESS_VM_READ') && l.includes('lsass.exe')), 'Supply chain must show LSASS access');

  // Triage Shift 4 alerts
  const resInsider = scenarioEngine.processAction(shift4.shiftId, {
    alertId: insiderAlert.id,
    actionTaken: 'Isolate Host',
    gameSecond: 50
  });
  assert.strictEqual(resInsider.result.isCorrect, true, 'Isolate Host must be optimal for rogue insider host');

  const resBackup = scenarioEngine.processAction(shift4.shiftId, {
    alertId: backupAlert.id,
    actionTaken: 'Dismiss',
    gameSecond: 120
  });
  assert.strictEqual(resBackup.result.isCorrect, true, 'Dismiss must be optimal for benign backup');

  const resSupply = scenarioEngine.processAction(shift4.shiftId, {
    alertId: supplyChainAlert.id,
    actionTaken: 'Isolate Host',
    gameSecond: 190
  });
  assert.strictEqual(resSupply.result.isCorrect, true, 'Isolate Host must be optimal for LSASS compromise');

  const completedShift4 = scenarioEngine.completeShift(shift4.shiftId, 300);
  assert.strictEqual(completedShift4.report.accuracyPercent, 100, 'Shift 4 accuracy should be 100%');
  console.log(`  ✅ Shift 4 triaged successfully: Final Score = +${completedShift4.report.finalScore} PTS, Accuracy = 100%`);

  // 4. Test Handcrafted Shift 5: Ransomware Outbreak (Shadow Copy Deletion & SMB Spread)
  console.log('\n[TEST 4] Testing Handcrafted Campaign Shift 5 (Ransomware Outbreak)...');
  const shift5 = scenarioEngine.startCampaignShift({ shiftNumber: 5, analystCallsign: callsign });
  assert.ok(shift5.shiftId.startsWith('CAMP-5-'), 'Shift ID must follow CAMP-5 prefix');

  // Fast forward to gameSecond 260
  const shift5State = scenarioEngine.getShiftState(shift5.shiftId, 260);
  assert.strictEqual(shift5State.alerts.length, 4, 'Shift 5 must contain 4 scheduled alerts');

  const ransomwareAlert = shift5State.alerts.find(a => a.scenarioId === 'SCENARIO_RANSOMWARE_01');
  assert.ok(ransomwareAlert, 'Shift 5 must include SCENARIO_RANSOMWARE_01');
  assert.strictEqual(ransomwareAlert.severity, 'Critical');
  assert.strictEqual(ransomwareAlert.category, 'ransomware_precursor');

  // Verify Educational Detection Concepts in Ransomware Telemetry
  const hasShadowCopyCmd = ransomwareAlert.endpoint_processes.some(p => 
    p.name === 'vssadmin.exe' && (p.command || p.command_line || '').includes('delete shadows /all /quiet')
  );
  assert.ok(hasShadowCopyCmd, 'Ransomware telemetry must contain vssadmin delete shadows command line');

  const hasSmbLog = ransomwareAlert.raw_logs.some(l => 
    l.includes('ADMIN$') && (l.includes('EventID=5145') || l.includes('ShareName'))
  );
  assert.ok(hasSmbLog, 'Ransomware telemetry must contain SMB lateral movement share access logs');

  const hasRenames = ransomwareAlert.raw_logs.some(l => 
    l.includes('.locked') || l.includes('RansomwareBehaviorDetected')
  );
  assert.ok(hasRenames, 'Ransomware telemetry must show mass encryption extension renaming');

  // Triage ransomware alert
  const resRansomware = scenarioEngine.processAction(shift5.shiftId, {
    alertId: ransomwareAlert.id,
    actionTaken: 'Isolate Host',
    gameSecond: 250
  });
  assert.strictEqual(resRansomware.result.isCorrect, true);
  assert.ok(resRansomware.result.totalPoints > 100, 'Ransomware containment should award > 100 pts');
  assert.ok(resRansomware.result.educationalRationale.topic.includes('Ransomware Precursors'), 'Educational topic should be present');
  console.log(`  ✅ Ransomware outbreak identified & contained (+${resRansomware.result.totalPoints} pts).`);
  console.log(`     Educational Focus: ${resRansomware.result.educationalRationale.topic}`);

  // Complete Shift 5
  const completedShift5 = scenarioEngine.completeShift(shift5.shiftId, 300);
  assert.ok(completedShift5.report, 'Shift 5 report generated');
  console.log(`  ✅ Shift 5 concluded: Final Grade = ${completedShift5.report.grade}, MTTT = ${completedShift5.report.mtttSeconds}s`);

  // 5. Test Tier Promotion & Sandbox Override
  console.log('\n[TEST 5] Testing Tier Promotions & Sandbox Override...');
  // Force Tier 1
  let profT1 = db.setAnalystTier(callsign, 1);
  assert.strictEqual(profT1.tier_level, 1);
  assert.deepStrictEqual(profT1.unlockedTools, ['LOGS', 'BLOCK_IP']);
  console.log('  ✅ Tier 1: Tools restricted to LOGS & BLOCK_IP');

  // Promote to Tier 2
  let profT2 = db.setAnalystTier(callsign, 2);
  assert.strictEqual(profT2.tier_level, 2);
  assert.deepStrictEqual(profT2.unlockedTools, ['LOGS', 'BLOCK_IP', 'PCAP', 'INTEL']);
  console.log('  ✅ Tier 2: Unlocks PCAP Dissector & Threat Intel Feed');

  // Promote to Tier 3
  let profT3 = db.setAnalystTier(callsign, 3);
  assert.strictEqual(profT3.tier_level, 3);
  assert.deepStrictEqual(profT3.unlockedTools, ['LOGS', 'BLOCK_IP', 'PCAP', 'INTEL', 'ENDPOINT', 'ISOLATE_HOST']);
  console.log('  ✅ Tier 3: Unlocks EDR Endpoint Process Tree & Host Isolation Action');

  // 6. Test Persistent Accuracy Trend
  console.log('\n[TEST 6] Testing Persistent Accuracy Trend...');
  const latestProfile = db.getAnalystProfile(callsign);
  assert.ok(Array.isArray(latestProfile.accuracyTrend), 'Accuracy trend must be an array');
  assert.ok(latestProfile.accuracyTrend.length >= 2, 'Must have at least 2 shifts in trend');
  console.log(`  ✅ Career shifts recorded: ${latestProfile.shifts_completed}`);
  console.log(`  ✅ Accuracy Trend entries (${latestProfile.accuracyTrend.length}):`);
  latestProfile.accuracyTrend.forEach((t, i) => {
    console.log(`     Shift #${i + 1}: ${t.shiftTitle} -> ${t.accuracyPercent}% (${t.finalScore >= 0 ? '+' : ''}${t.finalScore} pts)`);
  });

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 3 E2E TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('\n❌ PHASE 3 TEST FAILED:', err);
  process.exit(1);
});
