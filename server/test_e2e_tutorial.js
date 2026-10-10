const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTutorialE2ETest() {
  console.log('=== Night Shift: SOC - Tutorial E2E Verification ===\n');

  // 1. Get initial analyst profile
  const profileRes = await makeRequest('GET', '/api/analyst/profile?callsign=Echo-Seven');
  console.log('[1] Analyst Profile Check:');
  console.log(`    Callsign: ${profileRes.body.profile.callsign}`);
  console.log(`    Shifts Completed: ${profileRes.body.profile.shifts_completed}`);
  console.log(`    Tutorial Completed: ${profileRes.body.profile.tutorial_completed}`);
  const initialShiftsCompleted = profileRes.body.profile.shifts_completed;

  // 2. Start Tutorial Shift
  console.log('\n[2] Launching Scripted Tutorial Shift:');
  const startRes = await makeRequest('POST', '/api/shifts/start-tutorial', {
    analystCallsign: 'Echo-Seven'
  });
  
  if (!startRes.body.success) {
    throw new Error(`Failed to start tutorial shift: ${JSON.stringify(startRes.body)}`);
  }

  const shift = startRes.body.shift;
  console.log(`    Shift ID: ${shift.shiftId}`);
  console.log(`    Is Practice: ${shift.isPractice}`);
  console.log(`    Is Tutorial: ${shift.isTutorial}`);
  console.log(`    Alerts in Shift: ${shift.alerts.length}`);
  shift.alerts.forEach((a, i) => {
    console.log(`      Alert ${i + 1}: [${a.scenarioId}] "${a.title}" (Sev: ${a.severity}, DestPort: ${a.destination_port})`);
  });

  if (shift.alerts.length !== 3) {
    throw new Error(`Expected 3 tutorial alerts, got ${shift.alerts.length}`);
  }

  // 3. Triage Alert 1: Port Scan -> Block IP
  console.log('\n[3] Step 4 Action: Triaging Alert 1 (Port Scan) with "Block IP":');
  const a1 = shift.alerts[0];
  const a1Res = await makeRequest('POST', `/api/shifts/${shift.shiftId}/action`, {
    alertId: a1.id,
    actionTaken: 'Block IP',
    gameSecond: 5
  });
  console.log(`    Result isCorrect: ${a1Res.body.result.isCorrect}`);
  console.log(`    Points Awarded: ${a1Res.body.result.totalPoints}`);
  console.log(`    Feedback: ${a1Res.body.result.feedback}`);
  if (!a1Res.body.result.isCorrect) throw new Error('Expected Block IP to be correct for Alert 1');

  // 4. Triage Alert 2: Benign Scanner -> Dismiss
  console.log('\n[4] Step 5 Action: Triaging Alert 2 (Benign Scanner) with "Dismiss":');
  const a2 = shift.alerts[1];
  const a2Res = await makeRequest('POST', `/api/shifts/${shift.shiftId}/action`, {
    alertId: a2.id,
    actionTaken: 'Dismiss',
    gameSecond: 10
  });
  console.log(`    Result isCorrect: ${a2Res.body.result.isCorrect}`);
  console.log(`    Points Awarded: ${a2Res.body.result.totalPoints}`);
  console.log(`    Feedback: ${a2Res.body.result.feedback}`);
  if (!a2Res.body.result.isCorrect) throw new Error('Expected Dismiss to be correct for Alert 2');

  // 5. Triage Alert 3: Brute Force -> Block IP
  console.log('\n[5] Step 6 Action: Triaging Alert 3 (Brute Force) with "Block IP":');
  const a3 = shift.alerts[2];
  const a3Res = await makeRequest('POST', `/api/shifts/${shift.shiftId}/action`, {
    alertId: a3.id,
    actionTaken: 'Block IP',
    gameSecond: 15
  });
  console.log(`    Result isCorrect: ${a3Res.body.result.isCorrect}`);
  console.log(`    Points Awarded: ${a3Res.body.result.totalPoints}`);
  console.log(`    Feedback: ${a3Res.body.result.feedback}`);
  if (!a3Res.body.result.isCorrect) throw new Error('Expected Block IP to be correct for Alert 3');

  // 6. Conclude Shift
  console.log('\n[6] Step 7: Concluding Shift & Compiling Debrief Report:');
  const completeRes = await makeRequest('POST', `/api/shifts/${shift.shiftId}/complete`, {
    gameSecond: 20
  });
  const report = completeRes.body.report;
  console.log(`    Report Status Summary: ${report.statusSummary}`);
  console.log(`    Report Final Score: ${report.finalScore}`);
  console.log(`    Report Accuracy: ${report.accuracyPercent}%`);
  console.log(`    Report Grade: ${report.grade}`);
  console.log(`    Is Practice Flag: ${report.isPractice}`);
  console.log(`    Is Tutorial Flag: ${report.isTutorial}`);

  if (!report.isPractice) {
    throw new Error('Report should be marked as isPractice: true');
  }

  // 7. Check Profile & Database Isolation
  console.log('\n[7] Verifying SQLite Database Isolation & Tutorial Flags:');
  const postProfileRes = await makeRequest('GET', '/api/analyst/profile?callsign=Echo-Seven');
  const postProfile = postProfileRes.body.profile;
  console.log(`    Shifts Completed before: ${initialShiftsCompleted}, after: ${postProfile.shifts_completed}`);
  console.log(`    Tutorial Completed flag: ${postProfile.tutorial_completed}`);

  if (postProfile.shifts_completed !== initialShiftsCompleted) {
    throw new Error(`Practice shift leaked into shifts_completed! Before: ${initialShiftsCompleted}, After: ${postProfile.shifts_completed}`);
  }

  if (postProfile.tutorial_completed !== 1) {
    throw new Error('tutorial_completed should be 1 after finishing tutorial shift');
  }

  // 8. Test Explicit Tutorial Complete endpoint
  console.log('\n[8] Testing POST /api/analyst/tutorial-complete:');
  const markRes = await makeRequest('POST', '/api/analyst/tutorial-complete', {
    callsign: 'Echo-Seven'
  });
  console.log(`    Response success: ${markRes.body.success}`);
  console.log(`    Profile tutorial_completed: ${markRes.body.profile.tutorial_completed}`);

  console.log('\n✅ ALL TUTORIAL BACKEND & DATABASE INTEGRATION TESTS PASSED CLEANLY!\n');
}

runTutorialE2ETest().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
