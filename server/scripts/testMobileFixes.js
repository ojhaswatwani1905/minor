import { readJson } from '../utils/jsonDb.js';

const BASE_URL = 'http://localhost:5001/api';

const runMobileFixTests = async () => {
  console.log('===============================================================');
  console.log('STSMS — MOBILE AUDIT & FIX INTEGRATION VERIFICATION');
  console.log('===============================================================');

  let passed = 0;
  let total = 6;

  // 1. Authenticate or get valid token
  console.log('\n[TEST 1] Logging in as demo tourist account...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@stsms.gov', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error('Failed to log in: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  console.log('  ✓ Logged in successfully. Token acquired.');
  passed++;

  // 2. Profile GET endpoint
  console.log('\n[TEST 2] Verifying GET /api/profile...');
  const profileRes = await fetch(`${BASE_URL}/profile`, { headers: authHeaders });
  const profileData = await profileRes.json();
  if (!profileData.success || !profileData.profile) {
    throw new Error('GET /api/profile failed: ' + JSON.stringify(profileData));
  }
  console.log(`  ✓ Profile loaded: Name="${profileData.profile.name}", Email="${profileData.profile.email}"`);
  passed++;

  // 3. Profile repeated save with phone, blood group, and guardian
  console.log('\n[TEST 3] Verifying repeated saving via PUT /api/profile...');
  const testPhone = '+91 91234 56789';
  const testBlood = 'B+';
  const testGuardian = '+91 99887 76655';

  // Save 1
  const updateRes1 = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Priya Sharma (Verified)',
      phone: testPhone,
      bloodGroup: testBlood,
      guardianName: 'Anita Sharma (Mother)',
      guardianPhone: testGuardian
    })
  });
  const updateData1 = await updateRes1.json();
  if (!updateData1.success) throw new Error('Profile save 1 failed: ' + JSON.stringify(updateData1));
  console.log('  ✓ Profile Save 1 successful.');

  // Save 2 (Repeated immediate save)
  const updateRes2 = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Priya Sharma (Verified)',
      phone: testPhone,
      bloodGroup: 'O+', // Changed blood group
      guardianName: 'Anita Sharma (Mother)',
      guardianPhone: testGuardian
    })
  });
  const updateData2 = await updateRes2.json();
  if (!updateData2.success || updateData2.profile.bloodGroup !== 'O+') {
    throw new Error('Profile Save 2 failed: ' + JSON.stringify(updateData2));
  }
  console.log('  ✓ Profile Save 2 (repeat edit) successful with updated blood group: O+');
  passed++;

  // 4. Trigger SOS first time
  console.log('\n[TEST 4] Triggering first Manual SOS alert...');
  const sos1Res = await fetch(`${BASE_URL}/alerts/sos`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      userId: profileData.profile.id,
      userName: 'Priya Sharma',
      type: 'MANUAL_SOS',
      priority: 'CRITICAL',
      message: '🚨 Test Manual SOS #1',
      location: { lat: 32.2396, lng: 77.1887 },
      batteryLevel: 94
    })
  });
  const sos1Data = await sos1Res.json();
  if (!sos1Data.success || !sos1Data.alert) {
    throw new Error('Manual SOS 1 failed: ' + JSON.stringify(sos1Data));
  }
  console.log(`  ✓ Manual SOS #1 dispatched. Alert ID: ${sos1Data.alert.id}, Status: ${sos1Data.alert.status}`);
  passed++;

  // 5. Trigger SOS second time (Testing Problem 6 Fix)
  console.log('\n[TEST 5] Triggering second Manual SOS alert (Subsequent distress signal)...');
  const sos2Res = await fetch(`${BASE_URL}/alerts/sos`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      userId: profileData.profile.id,
      userName: 'Priya Sharma',
      type: 'MANUAL_SOS',
      priority: 'CRITICAL',
      message: '🚨 Test Manual SOS #2 — Follow-up distress call',
      location: { lat: 32.2410, lng: 77.1895 },
      batteryLevel: 93
    })
  });
  const sos2Data = await sos2Res.json();
  if (!sos2Data.success || !sos2Data.alert) {
    throw new Error('Manual SOS 2 failed: ' + JSON.stringify(sos2Data));
  }
  console.log(`  ✓ Manual SOS #2 dispatched without error. Alert ID: ${sos2Data.alert.id}, Message: "${sos2Data.message}"`);
  passed++;

  // 6. Verify Trip History endpoint
  console.log('\n[TEST 6] Querying Trip History for mobile list...');
  const tripsRes = await fetch(`${BASE_URL}/trips`, { headers: authHeaders });
  const tripsData = await tripsRes.json();
  if (!tripsData.success || !Array.isArray(tripsData.trips)) {
    throw new Error('GET /api/trips failed: ' + JSON.stringify(tripsData));
  }
  console.log(`  ✓ Trip History queried successfully: ${tripsData.trips.length} expeditions found.`);
  passed++;

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passed} OF ${total} MOBILE AUDIT & FIX TESTS PASSED!`);
  console.log('===============================================================');
};

runMobileFixTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});
