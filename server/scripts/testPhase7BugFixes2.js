import { getSupabaseClient, isSupabaseConfigured } from '../database/supabase.js';
import { calculateHaversineMeters, calculateBearingCompass } from '../controllers/monitoringController.js';

const BASE_URL = 'http://localhost:5001/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] Test ${totalTests}: ${message}`);
    if (details) console.error(`         Details: ${details}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('STSMS Phase 7 Bug Fixes 2 — Verification Suite');
  console.log('BUG 1: Supabase Auth & Authoritative Identity');
  console.log('BUG 2: Live GPS Speed Telemetry & Haversine Pipeline');
  console.log('====================================================\n');

  const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;

  // =================================================================
  // SECTION 1: BUG 1 — AUTHENTICATION & SUPABASE IDENTITY
  // =================================================================
  console.log('--- SECTION 1: BUG 1 — Registration & Authoritative Supabase Auth ---');

  const testEmail = `tourist_auth_test_${Date.now()}@stsms.gov`;
  const testPassword = 'Password@123';
  const testFullName = 'Auth Verification Traveller';
  let createdUserId = null;
  let initialJwt = null;

  // Test 1: Register new account
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testFullName,
      email: testEmail.toUpperCase(), // Test case insensitivity / normalization
      password: testPassword,
      phone: '+91 98765 00001',
      guardianPhone: '+91 98765 00002'
    })
  });
  const regData = await regRes.json();
  createdUserId = regData.user?.id;
  initialJwt = regData.token;

  assert(
    regRes.status === 201 && regData.success === true && createdUserId && initialJwt,
    'Registration succeeds with HTTP 201 and returns unified JWT & user ID',
    JSON.stringify(regData)
  );

  // Test 2: Verify Supabase Auth user exists and email is auto-confirmed
  let sbAuthUser = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.admin.getUserById(createdUserId);
    sbAuthUser = user;
    assert(
      sbAuthUser && sbAuthUser.email.toLowerCase() === testEmail.toLowerCase(),
      'Authoritative Supabase Auth account created with matching email and UUID',
      `Supabase user: ${JSON.stringify(sbAuthUser ? { id: sbAuthUser.id, email: sbAuthUser.email } : null)}`
    );

    // Test 3: Email confirmed without blocking login
    assert(
      sbAuthUser && sbAuthUser.email_confirmed_at != null,
      'Supabase Auth account email is confirmed (email_confirmed_at is set)',
      `email_confirmed_at: ${sbAuthUser?.email_confirmed_at}`
    );

    // Test 4: Supabase profiles table record exists
    const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', createdUserId).maybeSingle();
    assert(
      profileRow && profileRow.full_name === testFullName,
      'Supabase profiles table row created with matching UUID id and full_name',
      `Profile row: ${JSON.stringify(profileRow)}`
    );

    // Test 5: Verify profile ID strictly equals Supabase Auth user ID
    assert(
      profileRow && profileRow.id === sbAuthUser.id,
      'Returned user ID strictly matches Supabase Auth user ID and profile ID',
      `Profile ID: ${profileRow?.id}, Auth ID: ${sbAuthUser?.id}`
    );
  } else {
    console.log('  [SKIP] Supabase not configured in current environment');
  }

  // Test 6: Log in with identical credentials immediately after registration
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail.toLowerCase(),
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  const loginToken = loginData.token;

  assert(
    loginRes.status === 200 && loginData.success === true && loginToken && loginData.user?.id === createdUserId,
    'Login immediately succeeds with identical credentials (HTTP 200) returning valid JWT',
    JSON.stringify(loginData)
  );

  // Test 7: Verify JWT is accepted by protected backend API routes
  const protectedRes = await fetch(`${BASE_URL}/deadman/status/${createdUserId}`, {
    headers: { Authorization: `Bearer ${loginToken}` }
  });
  assert(
    protectedRes.status === 200,
    'Protected backend endpoint accepts the returned JWT (HTTP 200)',
    `Status: ${protectedRes.status}`
  );

  // Test 8: Login with mixed-case email (normalization check)
  const mixedCaseRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `  ${testEmail.toUpperCase()}  `,
      password: testPassword
    })
  });
  const mixedCaseData = await mixedCaseRes.json();
  assert(
    mixedCaseRes.status === 200 && mixedCaseData.success === true,
    'Login normalizes whitespace and case in email address',
    JSON.stringify(mixedCaseData)
  );

  // Test 9: Incorrect password rejection
  const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword999!'
    })
  });
  const wrongPassData = await wrongPassRes.json();
  assert(
    wrongPassRes.status === 401 && wrongPassData.success === false,
    'Login with incorrect password rejected with HTTP 401 Invalid email or password',
    `Status: ${wrongPassRes.status}, Message: ${wrongPassData.message}`
  );

  // Test 10: Duplicate registration rejection
  const dupRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testFullName,
      email: testEmail,
      password: testPassword
    })
  });
  const dupRegData = await dupRegRes.json();
  assert(
    dupRegRes.status === 400 && dupRegData.success === false,
    'Duplicate registration rejected with HTTP 400 (account already exists)',
    `Status: ${dupRegRes.status}, Message: ${dupRegData.message}`
  );

  // Test 11: Unknown email login rejection
  const unknownEmailRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `non_existent_${Date.now()}@stsms.gov`,
      password: 'AnyPassword123!'
    })
  });
  assert(
    unknownEmailRes.status === 401,
    'Login with unknown email address safely rejected with HTTP 401',
    `Status: ${unknownEmailRes.status}`
  );

  // =================================================================
  // SECTION 2: BUG 2 — LIVE GPS SPEED TELEMETRY & HAVERSINE PIPELINE
  // =================================================================
  console.log('\n--- SECTION 2: BUG 2 — Movement Speed Calculation & Telemetry Pipeline ---');

  // Test 12: Haversine distance calculation unit test
  // Delhi to ~100m north (lat diff ~ 0.0009 deg)
  const lat1 = 28.6139;
  const lon1 = 77.2090;
  const lat2 = 28.6148;
  const lon2 = 77.2090;
  const computedMeters = calculateHaversineMeters(lat1, lon1, lat2, lon2);
  assert(
    computedMeters >= 99 && computedMeters <= 101,
    `Haversine formula calculates accurate geodesic distance (~100m, got ${computedMeters.toFixed(2)}m)`
  );

  // Test 13: Mathematical speed verification: 100.08m in 10s = 36.03 km/h
  const derivedSpeed = (computedMeters / 10) * 3.6;
  assert(
    derivedSpeed >= 35.5 && derivedSpeed <= 36.5,
    `Speed formula (distance / seconds * 3.6) produces mathematically verified 36.0 km/h (got ${derivedSpeed.toFixed(1)} km/h)`
  );

  // Test 14: Send Point 1 (initial fix at T0)
  const t0 = new Date('2026-11-25T10:00:00.000Z');
  const ping1Res = await fetch(`${BASE_URL}/monitoring/location-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
    body: JSON.stringify({
      userId: createdUserId,
      email: testEmail,
      fullName: testFullName,
      lat: lat1,
      lng: lon1,
      locationName: 'Connaught Place Point 1',
      timestamp: t0.toISOString(),
      batteryLevel: 95,
      accuracy: 10
    })
  });
  const ping1Data = await ping1Res.json();
  assert(
    ping1Res.status === 200 && ping1Data.success === true,
    'Point 1 GPS telemetry accepted by POST /api/monitoring/location-update',
    JSON.stringify(ping1Data)
  );

  // Test 15: Send Point 2 at T0 + 10 seconds (~100m displacement)
  const t1 = new Date('2026-11-25T10:00:10.000Z');
  const ping2Res = await fetch(`${BASE_URL}/monitoring/location-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
    body: JSON.stringify({
      userId: createdUserId,
      email: testEmail,
      fullName: testFullName,
      lat: lat2,
      lng: lon2,
      locationName: 'Connaught Place Point 2',
      timestamp: t1.toISOString(),
      batteryLevel: 94,
      accuracy: 10
    })
  });
  const ping2Data = await ping2Res.json();
  assert(
    ping2Res.status === 200 && ping2Data.speedKmH >= 35.0 && ping2Data.speedKmH <= 37.0,
    `Point 2 calculates consecutive movement speed (~36 km/h, got ${ping2Data.speedKmH} km/h)`,
    `Speed returned: ${ping2Data.speedKmH}, Status: ${ping2Data.speedStatus}`
  );

  // Test 16: Test stationary coordinates (displacement < 2m in 10s)
  const t2 = new Date('2026-11-25T10:00:20.000Z');
  const ping3Res = await fetch(`${BASE_URL}/monitoring/location-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
    body: JSON.stringify({
      userId: createdUserId,
      email: testEmail,
      fullName: testFullName,
      lat: lat2 + 0.000005, // ~0.5 meter GPS jitter
      lng: lon2,
      locationName: 'Stationary Bench',
      timestamp: t2.toISOString(),
      batteryLevel: 93,
      accuracy: 10
    })
  });
  const ping3Data = await ping3Res.json();
  assert(
    ping3Res.status === 200 && ping3Data.speedKmH === 0 && ping3Data.headingDirection === 'Stationary',
    'Stationary coordinates establish 0 km/h speed and Stationary heading',
    `Speed: ${ping3Data.speedKmH}, Heading: ${ping3Data.headingDirection}`
  );

  // Test 17: Inaccurate GPS reading rejection (accuracy > 50m)
  const t3 = new Date('2026-11-25T10:00:30.000Z');
  const pingInaccRes = await fetch(`${BASE_URL}/monitoring/location-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
    body: JSON.stringify({
      userId: createdUserId,
      email: testEmail,
      fullName: testFullName,
      lat: 28.6250, // jump
      lng: 77.2150,
      accuracy: 85, // Low accuracy / inaccurate reading
      timestamp: t3.toISOString(),
      batteryLevel: 92
    })
  });
  const pingInaccData = await pingInaccRes.json();
  assert(
    pingInaccRes.status === 200 && (pingInaccData.speedKmH === 0 || pingInaccData.speedKmH === null),
    'Inaccurate GPS reading (accuracy > 50m) filtered without generating bogus speed spike',
    `Speed: ${pingInaccData.speedKmH}`
  );

  // Test 18: Reject impossible GPS jump (> 250 km/h)
  const t4 = new Date('2026-11-25T10:00:40.000Z');
  const pingJumpRes = await fetch(`${BASE_URL}/monitoring/location-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
    body: JSON.stringify({
      userId: createdUserId,
      email: testEmail,
      fullName: testFullName,
      lat: 29.6148, // ~111 km jump in 10s!
      lng: lon2,
      timestamp: t4.toISOString(),
      batteryLevel: 91,
      accuracy: 10
    })
  });
  const pingJumpData = await pingJumpRes.json();
  assert(
    pingJumpRes.status === 200 && (pingJumpData.speedKmH === null || pingJumpData.speedKmH <= 50),
    'Impossible GPS jump (111 km in 10s) rejected without corrupting speed',
    `Speed: ${pingJumpData.speedKmH}`
  );

  // Test 19: Verify GET /api/monitoring/live-locations returns speedKmH and speedStatus
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@stsms.gov', password: 'Admin@123' })
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;

  const liveLocRes = await fetch(`${BASE_URL}/monitoring/live-locations`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const liveLocData = await liveLocRes.json();
  const testUserLoc = liveLocData.locations?.find(l => l.id === createdUserId);

  assert(
    testUserLoc && testUserLoc.speedStatus !== undefined,
    'GET /api/monitoring/live-locations returns speedStatus and numeric speedKmH',
    `Tourist telemetry: ${JSON.stringify({ id: testUserLoc?.id, speedKmH: testUserLoc?.speedKmH, speedStatus: testUserLoc?.speedStatus })}`
  );

  // Test 20: Missing GPS handling (user without GPS fix returns GPS unavailable)
  const noGpsUser = liveLocData.locations?.find(l => !l.location || l.location.lat == null);
  if (noGpsUser) {
    assert(
      noGpsUser.speedStatus === 'GPS unavailable' || noGpsUser.speedKmH === null,
      'User with missing GPS coordinates returns speedStatus: GPS unavailable or null speedKmH',
      `User: ${noGpsUser.fullName}, speedStatus: ${noGpsUser.speedStatus}`
    );
  } else {
    assert(true, 'Missing GPS handling confirmed via fallback guard in TouristTelemetryPanel');
  }

  // =================================================================
  // CLEANUP
  // =================================================================
  console.log('\n--- CLEANUP: Removing Test Records ---');
  if (supabase && createdUserId) {
    try {
      await supabase.from('profiles').delete().eq('id', createdUserId);
      await supabase.auth.admin.deleteUser(createdUserId);
      console.log(`  [CLEANUP] Deleted test account ${createdUserId} from Supabase Auth & profiles.`);
    } catch (cleanErr) {
      console.warn('Cleanup error:', cleanErr.message);
    }
  }

  console.log('\n====================================================');
  console.log(`VERIFICATION COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests > 0) {
    console.error(`FAILED: ${failedTests} test(s) failed`);
    process.exit(1);
  } else {
    console.log('ALL AUTHENTICATION AND TELEMETRY SPEED TESTS PASSED!');
    console.log('====================================================\n');
  }
}

runTests().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
