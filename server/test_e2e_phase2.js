// End-to-End Integration Test for Night Shift: SOC Phase 2 Investigation Tools Suite
const assert = require('node:assert');

async function runPhase2Test() {
  console.log('=== Night Shift: SOC Phase 2 Investigation Suite E2E Test ===\n');

  const BASE_URL = 'http://localhost:3001/api';

  // 1. Threat Intel Lookup API
  console.log('1. Testing Threat Intel Lookup API...');
  
  // Malicious IP
  const malIntel = await fetch(`${BASE_URL}/threat-intel/lookup?ip=198.51.100.99`).then(r => r.json());
  assert.strictEqual(malIntel.success, true);
  assert.strictEqual(malIntel.intel.reputation_score >= 90, true);
  assert.strictEqual(malIntel.intel.threat_level, 'CRITICAL');
  assert.ok(malIntel.intel.threat_types.includes('DNS Tunneling C2'));
  console.log('   [OK] Malicious Threat Intel verified: score =', malIntel.intel.reputation_score, malIntel.intel.asn);

  // Internal RFC 1918 IP
  const intIntel = await fetch(`${BASE_URL}/threat-intel/lookup?ip=10.0.1.88`).then(r => r.json());
  assert.strictEqual(intIntel.success, true);
  assert.strictEqual(intIntel.intel.reputation_score, 0);
  assert.strictEqual(intIntel.intel.threat_level, 'CLEAN');
  console.log('   [OK] Internal RFC 1918 Threat Intel verified: clean corporate asset');

  // Unrated Public IP
  const unratedIntel = await fetch(`${BASE_URL}/threat-intel/lookup?ip=73.4.19.82`).then(r => r.json());
  assert.strictEqual(unratedIntel.success, true);
  assert.strictEqual(unratedIntel.intel.threat_level, 'UNRATED');
  console.log('   [OK] Unrated Public IP verified: realistic neutral telemetry\n');

  // 2. Start Shift & Verify Phase 2 Scenarios
  console.log('2. Starting Shift to test Phase 2 Scenario Datasets...');
  const startRes = await fetch(`${BASE_URL}/shifts/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analystCallsign: 'Echo-Seven', shiftTitle: 'Phase 2 Forensic Triage' })
  }).then(r => r.json());
  assert.strictEqual(startRes.success, true);
  const shiftId = startRes.shift.shiftId;
  console.log(`   [OK] Shift initiated: ${shiftId}\n`);

  // Fast forward to game second 450 to reveal all Phase 2 alerts
  const shiftState = await fetch(`${BASE_URL}/shifts/${shiftId}?gameSecond=450`).then(r => r.json());
  const alerts = shiftState.shift.alerts;
  console.log(`   Retrieved ${alerts.length} visible alerts at T+450s`);

  // 3. Test DNS Tunneling Scenario Dataset
  console.log('3. Validating DNS Tunneling Scenario (MITRE T1071.004)...');
  const dnsAlert = alerts.find(a => a.category === 'dns_tunneling');
  assert.ok(dnsAlert, 'DNS Tunneling alert must be present');
  console.log(`   Found alert: ${dnsAlert.id} - ${dnsAlert.title}`);
  
  // Categorized Logs
  assert.ok(dnsAlert.logs_categorized?.dns?.length > 0, 'Must have categorized DNS logs');
  assert.ok(dnsAlert.logs_categorized.dns.some(l => l.includes('IN TXT')), 'DNS logs must contain TXT queries');
  console.log(`   [OK] Categorized DNS logs: ${dnsAlert.logs_categorized.dns.length} entries`);

  // PCAP Packets
  assert.ok(dnsAlert.pcap_packets?.length > 0, 'Must have PCAP packets');
  const txtPkt = dnsAlert.pcap_packets.find(p => p.protocol === 'DNS' && p.info.includes('TXT'));
  assert.ok(txtPkt, 'PCAP must contain DNS TXT queries');
  assert.ok(txtPkt.payload_preview, 'Packet must have payload preview');
  console.log(`   [OK] PCAP dissection: Packet #${txtPkt.no} [${txtPkt.protocol}] ${txtPkt.info.slice(0, 50)}...`);

  // Endpoint Process
  assert.ok(dnsAlert.endpoint_processes?.length > 0, 'Must have endpoint processes');
  const iodineProc = dnsAlert.endpoint_processes.find(p => p.name === 'python.exe');
  assert.ok(iodineProc, 'Must capture python DNS tunneling client process');
  assert.ok(iodineProc.command.includes('iodine_client.py'), 'Must contain iodine script command');
  console.log(`   [OK] Endpoint process: PID ${iodineProc.pid} (${iodineProc.name}) -> ${iodineProc.command}`);

  // Triage DNS Tunneling: Isolate Host
  const dnsAction = await fetch(`${BASE_URL}/shifts/${shiftId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId: dnsAlert.id, actionTaken: 'Isolate Host', gameSecond: 235 })
  }).then(r => r.json());
  assert.strictEqual(dnsAction.success, true);
  assert.strictEqual(dnsAction.result.isCorrect, true);
  console.log(`   [OK] Triage verified: Isolate Host -> +${dnsAction.result.totalPoints} pts\n`);

  // 4. Test C2 Beaconing Scenario Dataset (Interval & Jitter Analysis)
  console.log('4. Validating C2 Beaconing Scenario (30s Regular Interval)...');
  const c2Alert = alerts.find(a => a.category === 'c2_beaconing');
  assert.ok(c2Alert, 'C2 Beaconing alert must be present');
  console.log(`   Found alert: ${c2Alert.id} - ${c2Alert.title}`);

  // PCAP Delta Timing
  assert.ok(c2Alert.pcap_packets?.length >= 4, 'Must have repeating beacon packet captures');
  const p3 = c2Alert.pcap_packets.find(p => p.no === 3);
  assert.ok(p3, 'Packet 3 must exist');
  assert.strictEqual(parseFloat(p3.delta) > 29 && parseFloat(p3.delta) < 31, true);
  console.log(`   [OK] C2 Beaconing delta interval verified: +${p3.delta}s between callbacks (Zero Jitter)`);

  // Suspicious process injection
  const spoolsvProc = c2Alert.endpoint_processes.find(p => p.name === 'spoolsv.exe');
  assert.ok(spoolsvProc, 'Must capture spoolsv.exe process anomaly');
  assert.ok(spoolsvProc.note.includes('outbound TCP socket'), 'Must flag anomalous external socket');
  console.log(`   [OK] Process anomaly caught: ${spoolsvProc.name} (PID ${spoolsvProc.pid}) hollowed out for C2 callbacks`);

  // Triage C2 Beaconing: Isolate Host
  const c2Action = await fetch(`${BASE_URL}/shifts/${shiftId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId: c2Alert.id, actionTaken: 'Isolate Host', gameSecond: 240 })
  }).then(r => r.json());
  assert.strictEqual(c2Action.success, true);
  assert.strictEqual(c2Action.result.isCorrect, true);
  console.log(`   [OK] Triage verified: Isolate Host -> +${c2Action.result.totalPoints} pts\n`);

  // 5. Test Word Document Macro Spawning Encoded PowerShell
  console.log('5. Validating Word Document Macro Spawning PowerShell (MITRE T1059.001)...');
  const macroAlert = alerts.find(a => a.category === 'malicious_macro');
  assert.ok(macroAlert, 'Macro spawn alert must be present');
  console.log(`   Found alert: ${macroAlert.id} - ${macroAlert.title}`);

  // Process Tree Lineage
  const wordProc = macroAlert.endpoint_processes.find(p => p.name === 'WINWORD.EXE');
  const cmdProc = macroAlert.endpoint_processes.find(p => p.name === 'cmd.exe');
  const psProc = macroAlert.endpoint_processes.find(p => p.name === 'powershell.exe');
  assert.ok(wordProc, 'Must have WINWORD.EXE parent');
  assert.ok(cmdProc, 'Must have cmd.exe child');
  assert.ok(psProc, 'Must have powershell.exe descendant');
  assert.strictEqual(cmdProc.ppid, wordProc.pid);
  assert.strictEqual(psProc.ppid, cmdProc.pid);
  console.log(`   [OK] Process Lineage verified: WINWORD (PID ${wordProc.pid}) -> cmd.exe (PID ${cmdProc.pid}) -> powershell.exe (PID ${psProc.pid})`);

  // Encoded command line
  assert.ok(psProc.command.includes('-ExecutionPolicy Bypass'), 'Must have execution policy bypass');
  assert.ok(psProc.command.includes('-WindowStyle Hidden'), 'Must have hidden window style');
  assert.ok(psProc.command.includes('-Enc'), 'Must have encoded command');
  console.log(`   [OK] Malicious LOLBin arguments verified: ${psProc.command.slice(0, 60)}...`);

  // Triage Macro Spawn: Isolate Host
  const macroAction = await fetch(`${BASE_URL}/shifts/${shiftId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId: macroAlert.id, actionTaken: 'Isolate Host', gameSecond: 245 })
  }).then(r => r.json());
  assert.strictEqual(macroAction.success, true);
  assert.strictEqual(macroAction.result.isCorrect, true);
  console.log(`   [OK] Triage verified: Isolate Host -> +${macroAction.result.totalPoints} pts\n`);

  // 6. Conclude Shift
  console.log('6. Concluding Shift and validating Final Report...');
  const completeRes = await fetch(`${BASE_URL}/shifts/${shiftId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameSecond: 600 })
  }).then(r => r.json());
  assert.strictEqual(completeRes.success, true);
  console.log(`   [OK] Final Score: ${completeRes.report.finalScore} pts`);
  console.log(`   [OK] Threats Caught: ${completeRes.report.caughtCount}`);

  console.log('\n=== ALL PHASE 2 INVESTIGATION TOOLS & SCENARIOS VERIFIED SUCCESSFULLY! ===');
}

runPhase2Test().catch(err => {
  console.error('Phase 2 test failed:', err);
  process.exit(1);
});
