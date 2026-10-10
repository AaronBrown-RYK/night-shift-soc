const assert = require('node:assert');

async function testCampaignUnlock() {
  console.log('Testing campaign unlock & reset endpoints...');
  
  // 1. Unlock all campaigns
  const unlockRes = await fetch('http://localhost:3001/api/analyst/unlock-campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callsign: 'Echo-Seven' })
  }).then(r => r.json());
  assert.strictEqual(unlockRes.success, true);
  assert.strictEqual(unlockRes.profile.unlocked_campaign_shift, 5);
  console.log('  [OK] unlock-campaigns sets unlocked_campaign_shift to 5');

  // 2. Check campaign shifts list
  const campList = await fetch('http://localhost:3001/api/shifts/campaign?callsign=Echo-Seven').then(r => r.json());
  assert.strictEqual(campList.success, true);
  assert.strictEqual(campList.campaignShifts.length, 5);
  campList.campaignShifts.forEach(cs => {
    assert.strictEqual(cs.isUnlocked, true, `Shift ${cs.shiftNumber} should be unlocked`);
  });
  console.log('  [OK] all 5 campaign shifts marked isUnlocked: true');

  // 3. Test launch of Shift 5 (Zero Hour Outbreak)
  const launchRes = await fetch('http://localhost:3001/api/shifts/start-campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shiftNumber: 5, analystCallsign: 'Echo-Seven' })
  }).then(r => r.json());
  assert.strictEqual(launchRes.success, true);
  assert.strictEqual(launchRes.shift.campaignShiftNumber, 5);
  console.log('  [OK] launch Shift 5 succeeded:', launchRes.shift.shiftTitle);

  // 4. Test reset campaign
  const resetRes = await fetch('http://localhost:3001/api/analyst/reset-campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callsign: 'Echo-Seven' })
  }).then(r => r.json());
  assert.strictEqual(resetRes.success, true);
  assert.strictEqual(resetRes.profile.unlocked_campaign_shift, 1);
  console.log('  [OK] reset-campaigns sets unlocked_campaign_shift back to 1');

  console.log('\n✅ All campaign unlock testing checks PASSED!\n');
}

testCampaignUnlock().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
