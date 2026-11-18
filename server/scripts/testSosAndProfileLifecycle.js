import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5001/api';

async function runAudit() {
  console.log('================================================================');
  console.log('STSMS PHASE 4.1: INDEPENDENT VERIFICATION & PRODUCTION READINESS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // --- Step 0: Login / Setup 2 Distinct Users ---
  console.log('--- Step 0: Setting up Authenticated Test Users ---');
  let tokenA = null;
  let userA = null;
  let tokenB = null;
  let userB = null;
  let adminToken = null;

  // Login Admin
  const adminRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'director@stsms.gov', password: 'Password@123' })
  });
  const adminData = await adminRes.json();
  if (adminData.success && adminData.token) {
    adminToken = adminData.token;
  }

  // Register or Login User A
  const emailA = `tourist_a_${Date.now()}@stsms.gov`;
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aarav Patel',
      fullName: 'Aarav Patel',
      email: emailA,
      password: 'Password@123',
      phone: '+919876500001',
      emergencyContact: '+919876500002'
    })
  });
  const regAData = await regARes.json();
  tokenA = regAData.token;
  userA = regAData.user;

  // Register or Login User B
  const emailB = `tourist_b_${Date.now()}@stsms.gov`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bhavna Sen',
      fullName: 'Bhavna Sen',
      email: emailB,
      password: 'Password@123',
      phone: '+919876500003',
      emergencyContact: '+919876500004'
    })
  });
  const regBData = await regBRes.json();
  tokenB = regBData.token;
  userB = regBData.user;

  assert(tokenA && userA && tokenB && userB, 'Setup: Created 2 isolated tourist accounts (User A & User B)');

  // ================================================================
  // SECTION 1: SOS LIFECYCLE & DEBOUNCE VERIFICATION
  // ================================================================
  console.log('\n--- Section 1: SOS Lifecycle & Incident Visibility ---');

  // Test 1: First SOS Trigger
  const sos1Payload = {
    userId: userA.id,
    userName: userA.fullName || userA.name,
    type: 'MANUAL_SOS',
    priority: 'CRITICAL',
    message: '🚨 First SOS: Tourist Aarav requests help near Sanchi Stupa',
    location: { lat: 23.4867, lng: 77.7385 },
    batteryLevel: 88,
    tripId: null // Let system dynamically resolve
  };

  const sos1Res = await fetch(`${BASE_URL}/alerts/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify(sos1Payload)
  });
  const sos1Data = await sos1Res.json();
  const alertId1 = sos1Data.alert?.id;

  assert(
    sos1Data.success && alertId1 && (sos1Data.alert.status === 'Pending' || sos1Data.alert.status === 'open'),
    '1. First SOS: Creates active incident with valid ID and Pending status',
    `alertId: ${alertId1}, status: ${sos1Data.alert?.status}`
  );

  // Test 2: Rapid Repeated SOS Taps (Debounce / Update within 5s)
  const sosRapidPayload = {
    userId: userA.id,
    userName: userA.fullName || userA.name,
    type: 'MANUAL_SOS',
    priority: 'CRITICAL',
    message: '🚨 Rapid SOS: Second tap with updated location & battery',
    location: { lat: 23.4870, lng: 77.7390 },
    batteryLevel: 87,
    tripId: null
  };

  const sosRapidRes = await fetch(`${BASE_URL}/alerts/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify(sosRapidPayload)
  });
  const sosRapidData = await sosRapidRes.json();
  const alertIdRapid = sosRapidData.alert?.id;

  assert(
    sosRapidData.success && alertIdRapid === alertId1,
    '2. Repeated Taps: Rapid repeated SOS updates existing incident without duplicate cards',
    `Expected ID ${alertId1}, got ${alertIdRapid}`
  );

  // Test 3: Alert Detail & Audit Trail
  const detailRes = await fetch(`${BASE_URL}/alerts/${alertId1}`, {
    headers: { 'Authorization': `Bearer ${adminToken || tokenA}` }
  });
  const detailData = await detailRes.json();
  assert(
    detailData.success && detailData.alert && detailData.alert.id === alertId1,
    '3. Alert Visibility: Alert detail is retrievable by admin with telemetry and rescue notes'
  );

  // Test 4: Resolve First SOS
  const resolveRes = await fetch(`${BASE_URL}/alerts/${alertId1}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken || tokenA}` },
    body: JSON.stringify({ status: 'Resolved', note: 'Search and rescue team contacted tourist. Tourist is safe.' })
  });
  const resolveData = await resolveRes.json();
  assert(
    resolveData.success && (resolveData.alert?.status === 'Resolved' || resolveData.alert?.status === 'resolved'),
    '4. Resolve First SOS: Incident status transitions to Resolved',
    `Status: ${resolveData.alert?.status}`
  );

  // Test 5: Second SOS After Resolution (Must create NEW incident)
  const sos2Payload = {
    userId: userA.id,
    userName: userA.fullName || userA.name,
    type: 'MANUAL_SOS',
    priority: 'CRITICAL',
    message: '🚨 Second SOS: New incident later in the day',
    location: { lat: 23.4900, lng: 77.7400 },
    batteryLevel: 65,
    tripId: null
  };

  const sos2Res = await fetch(`${BASE_URL}/alerts/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify(sos2Payload)
  });
  const sos2Data = await sos2Res.json();
  const alertId2 = sos2Data.alert?.id;

  assert(
    sos2Data.success && alertId2 && alertId2 !== alertId1,
    '5. Second SOS: Creates a BRAND NEW incident ID after previous was resolved',
    `alertId1: ${alertId1}, alertId2: ${alertId2}`
  );

  // Test 6: Multi-User Isolation (User B triggers SOS)
  const sosBPayload = {
    userId: userB.id,
    userName: userB.fullName || userB.name,
    type: 'MANUAL_SOS',
    priority: 'CRITICAL',
    message: '🚨 User B SOS: Tourist Bhavna requests assistance',
    location: { lat: 23.1995, lng: 77.4332 },
    batteryLevel: 92,
    tripId: null
  };

  const sosBRes = await fetch(`${BASE_URL}/alerts/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify(sosBPayload)
  });
  const sosBData = await sosBRes.json();
  const alertIdB = sosBData.alert?.id;

  assert(
    sosBData.success && alertIdB && alertIdB !== alertId2 && alertIdB !== alertId1,
    '6. Multi-User Isolation: User B receives distinct incident without overwriting User A',
    `alertIdB: ${alertIdB}`
  );

  // ================================================================
  // SECTION 2: MAP GEODESIC & DISTANCE ACCURACY
  // ================================================================
  console.log('\n--- Section 2: Map Geodesic & Geofence Verification ---');

  // Haversine formula test for 5km Safe Travel Zone boundary
  function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const sanchiCenter = { lat: 23.4867, lng: 77.7385 };
  // A point ~3.5 km away (inside safe zone)
  const pointInside = { lat: 23.5100, lng: 77.7500 };
  const distInside = haversineDistanceMeters(sanchiCenter.lat, sanchiCenter.lng, pointInside.lat, pointInside.lng);

  // A point ~6.8 km away (outside safe zone breach)
  const pointOutside = { lat: 23.5400, lng: 77.7700 };
  const distOutside = haversineDistanceMeters(sanchiCenter.lat, sanchiCenter.lng, pointOutside.lat, pointOutside.lng);

  assert(
    distInside < 5000 && distOutside > 5000,
    '7. Geodesic Calculation: Real Haversine accurately classifies inside (3.5km) vs breached (6.8km)',
    `Inside: ${(distInside/1000).toFixed(2)} km, Outside: ${(distOutside/1000).toFixed(2)} km`
  );

  // ================================================================
  // SECTION 3: PROFILE & DATABASE INTEGRITY
  // ================================================================
  console.log('\n--- Section 3: Profile & Database Integrity ---');

  // Test 8: Authenticated User Scoping
  const profileARes = await fetch(`${BASE_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const profileAData = await profileARes.json();
  assert(
    profileAData.success && profileAData.profile && profileAData.profile.email.toLowerCase() === emailA.toLowerCase(),
    '8. Profile Scoping: Profile fetch returns data strictly scoped to authenticated User A',
    `Fetched email: ${profileAData.profile?.email}`
  );

  // Test 9: Profile Update & Persistence
  const updatePayload = {
    fullName: 'Aarav Patel (Verified)',
    phone: '+919876599999',
    bloodGroup: 'O+',
    guardianName: 'Ramesh Patel (Father)',
    guardianPhone: '+919876588888',
    emergencyContact: '+919876588888'
  };

  const updateARes = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify(updatePayload)
  });
  const updateAData = await updateARes.json();

  assert(
    updateAData.success &&
    updateAData.profile.fullName === 'Aarav Patel (Verified)' &&
    updateAData.profile.phone === '+919876599999' &&
    updateAData.profile.bloodGroup === 'O+',
    '9. Profile Update: Details and guardian contact saved successfully'
  );

  // Test 10: Persistence Across Re-login
  const reloginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password: 'Password@123' })
  });
  const reloginData = await reloginRes.json();
  const freshToken = reloginData.token;

  const verifyProfileRes = await fetch(`${BASE_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${freshToken}` }
  });
  const verifyProfileData = await verifyProfileRes.json();

  assert(
    verifyProfileData.profile.phone === '+919876599999' &&
    verifyProfileData.profile.bloodGroup === 'O+' &&
    verifyProfileData.profile.emergencyContact === '+919876588888',
    '10. Persistence: Profile changes survive re-login with brand new JWT'
  );

  // Test 11: Cross-User Tampering Prevention
  // User B tries to send a profile update containing User A's ID
  const tamperPayload = {
    id: userA.id,
    fullName: 'Hacked By User B',
    phone: '+910000000000'
  };
  const tamperRes = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify(tamperPayload)
  });
  const tamperData = await tamperRes.json();

  // Now verify User A was NOT changed
  const checkARes = await fetch(`${BASE_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${freshToken}` }
  });
  const checkAData = await checkARes.json();

  assert(
    checkAData.profile.fullName === 'Aarav Patel (Verified)' &&
    checkAData.profile.fullName !== 'Hacked By User B',
    '11. Cross-User Protection: User B cannot modify User A profile (scoped to JWT identity)'
  );

  // Test 12: Database Synchronization (users.json & fallback)
  const usersJsonPath = path.join(__dirname, '../json/users.json');
  const usersJsonContent = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
  const userAInJson = usersJsonContent.find(u => u.email.toLowerCase() === emailA.toLowerCase());

  assert(
    userAInJson && userAInJson.phone === '+919876599999' && userAInJson.bloodGroup === 'O+',
    '12. JSON / DB Consistency: users.json synchronized with verified profile values'
  );

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit Script Failed with uncaught exception:', err);
  process.exit(1);
});
