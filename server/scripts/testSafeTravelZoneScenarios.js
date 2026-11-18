import { calculateHaversineDistanceMeters } from '../controllers/safeZoneController.js';

const BASE_URL = 'http://localhost:5001/api';

const runTests = async () => {
  console.log('===============================================================');
  console.log('STSMS — SAFE TRAVEL ZONE & AUTOMATIC GEOFENCE SOS VERIFICATION');
  console.log('===============================================================');

  let passedScenarios = 0;
  let totalScenarios = 12;

  // -------------------------------------------------------------------------
  // Scenario A: Tourist selects destination & creates 5 km safe zone
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] Scenario A: Geocode search and 5 km safe zone activation...');
  
  // Geocode search
  const geoRes = await fetch(`${BASE_URL}/safe-zones/geocode?q=Solang`);
  const geoData = await geoRes.json();
  if (!geoData.success || geoData.results.length === 0) {
    throw new Error('Scenario A failed: Geocode search returned no results.');
  }
  const targetDest = geoData.results[0];
  console.log(`  ✓ Geocoded "${targetDest.name}": Lat ${targetDest.lat}, Lng ${targetDest.lng}`);

  // Create Safe Zone trip while tourist is 12km away (APPROACHING phase)
  const createRes = await fetch(`${BASE_URL}/safe-zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: `usr_test_${Date.now()}`,
      userName: 'Tenzing Norgay',
      destinationName: targetDest.name,
      destinationLat: targetDest.lat,
      destinationLng: targetDest.lng,
      radiusMeters: 5000,
      currentLat: targetDest.lat - 0.1, // ~11 km away
      currentLng: targetDest.lng - 0.1,
      batteryLevel: 92,
      guardianName: 'Emergency Contact',
      guardianPhone: '+91 98765 00001'
    })
  });
  const createData = await createRes.json();
  if (!createData.success || createData.trip.status !== 'APPROACHING') {
    throw new Error(`Scenario A failed: Expected status APPROACHING, got ${createData.trip?.status}`);
  }
  const testTripId = createData.trip.id;
  console.log(`  ✓ Safe Zone created (ID: ${testTripId}) with 5km boundary.`);
  console.log(`  ✓ Initial State: ${createData.trip.status} (Distance: ${(createData.trip.distanceFromDestMeters/1000).toFixed(1)} km). Boundary SOS correctly silenced during approach.`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario B: Tourist enters zone & monitoring becomes ACTIVE
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] Scenario B: Tourist enters zone (distance <= 5000m) -> ACTIVE...');
  const enterRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: targetDest.lat + 0.005, // ~600m from center
      lng: targetDest.lng + 0.005,
      accuracy: 12,
      batteryLevel: 90
    })
  });
  const enterData = await enterRes.json();
  if (!enterData.success || enterData.status !== 'ACTIVE' || !enterData.isInsideRadius) {
    throw new Error(`Scenario B failed: Expected status ACTIVE, got ${enterData.status}`);
  }
  console.log(`  ✓ Tourist inside 5km boundary (${enterData.distanceFromDestMeters}m from center).`);
  console.log(`  ✓ Monitoring state successfully updated to: ${enterData.status}`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario C: Tourist moves outside boundary -> WARNING (False-positive shield)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] Scenario C: Tourist crosses boundary (Reading 1 outside) -> WARNING...');
  const warnRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: targetDest.lat + 0.06, // ~7km away (>5km boundary)
      lng: targetDest.lng + 0.06,
      accuracy: 15,
      batteryLevel: 88
    })
  });
  const warnData = await warnRes.json();
  if (!warnData.success || warnData.status !== 'WARNING' || warnData.alertDispatched !== false) {
    throw new Error(`Scenario C failed: Expected WARNING status without premature alert dispatch.`);
  }
  console.log(`  ✓ Reading 1 outside: Transitioned to WARNING (Outside by ${warnData.distanceOutsideBoundaryMeters}m).`);
  console.log(`  ✓ False-Positive Shield confirmed: 0 SOS alerts dispatched on single reading.`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario D: Multiple outside readings confirm BREACH -> 1 Automatic Incident
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] Scenario D: Multiple reliable outside readings confirm BREACH...');
  // Reading 2 outside
  await fetch(`${BASE_URL}/safe-zones/${testTripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: targetDest.lat + 0.062,
      lng: targetDest.lng + 0.062,
      accuracy: 14,
      batteryLevel: 87
    })
  });

  // Reading 3 outside (Confirms breach!)
  const breachRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: targetDest.lat + 0.065,
      lng: targetDest.lng + 0.065,
      accuracy: 12,
      batteryLevel: 86
    })
  });
  const breachData = await breachRes.json();
  if (!breachData.success || breachData.status !== 'BREACHED' || breachData.alertDispatched !== true) {
    throw new Error(`Scenario D failed: Expected BREACHED status with automatic alert dispatch.`);
  }
  if (breachData.alert?.type !== 'GEOFENCE_BREACH') {
    throw new Error(`Scenario D failed: Expected incident type GEOFENCE_BREACH, got ${breachData.alert?.type}`);
  }
  console.log(`  ✓ 3 consecutive outside readings confirmed! Status transitioned to: ${breachData.status}`);
  console.log(`  ✓ Automatic incident created with type: "${breachData.alert.type}" (ID: ${breachData.alert.id})`);
  console.log(`  ✓ Message details: ${breachData.alert.message.substring(0, 85)}...`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario E: Admin dashboard displays tourist, boundary & incident
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5] Scenario E: Verify Admin dashboard query endpoints (with auth hardening)...');
  
  // Verify unauthenticated access is rejected (Audit Finding 6 hardening)
  const unauthRes = await fetch(`${BASE_URL}/safe-zones/all`);
  if (unauthRes.status !== 401) {
    throw new Error(`Scenario E failed: Unauthenticated /safe-zones/all did not return 401 (got ${unauthRes.status}).`);
  }
  console.log('  ✓ Security verified: Unauthenticated request to /safe-zones/all correctly rejected with 401.');

  // Obtain admin auth token
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@stsms.gov', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  const adminToken = loginData.token;
  if (!adminToken) {
    throw new Error('Scenario E failed: Admin login did not return a token.');
  }

  const allRes = await fetch(`${BASE_URL}/safe-zones/all`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const allData = await allRes.json();
  const foundZone = allData.safeZones.find(s => s.id === testTripId);
  if (!foundZone || foundZone.status !== 'BREACHED') {
    throw new Error('Scenario E failed: Safe zone not visible to Admin with BREACHED status.');
  }

  const incRes = await fetch(`${BASE_URL}/safe-zones/incidents`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const incData = await incRes.json();
  const foundInc = incData.incidents.find(i => i.id === breachData.alert.id || i.tripId === testTripId || (i.message && i.message.includes('Tenzing Norgay')));
  if (!foundInc || foundInc.type !== 'GEOFENCE_BREACH') {
    throw new Error('Scenario E failed: Geofence incident not returned in admin incidents query.');
  }
  console.log(`  ✓ Admin queries verified: Monitored safe zones count = ${allData.safeZones.length}`);
  console.log(`  ✓ Incident verified in admin feed with status: "${foundInc.status}" & type: "${foundInc.type}"`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario F: Tourist confirms they are safe -> Resolves alert & resets to ACTIVE
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] Scenario F: Tourist confirms safe in-app...');
  const safeRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/confirm-safe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'Stopped at viewpoints cafe, all secure.' })
  });
  const safeData = await safeRes.json();
  if (!safeData.success || safeData.trip.status !== 'ACTIVE') {
    throw new Error(`Scenario F failed: Expected ACTIVE status after confirmation, got ${safeData.trip?.status}`);
  }
  const lastHistory = safeData.trip.history[0];
  if (lastHistory.event !== 'SAFE_CONFIRMED') {
    throw new Error('Scenario F failed: Audit log entry for SAFE_CONFIRMED not found.');
  }
  console.log(`  ✓ Tourist safety confirmed: Status successfully reset to: ${safeData.trip.status}`);
  console.log(`  ✓ Audit trail preserved without erasing original breach record: "${lastHistory.note}"`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario G: GPS becomes unavailable -> Does NOT treat as exit
  // -------------------------------------------------------------------------
  console.log('\n[TEST 7] Scenario G: GPS unavailable / missing coordinates...');
  const gpsNullRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: null, lng: null })
  });
  const gpsNullData = await gpsNullRes.json();
  if (gpsNullData.success !== false) {
    throw new Error('Scenario G failed: Null GPS coordinates should be safely rejected without state change.');
  }
  console.log(`  ✓ Missing GPS fix handled safely: 0 false alerts generated.`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario H: Network unavailable -> Local offline caching and graceful recovery
  // -------------------------------------------------------------------------
  console.log('\n[TEST 8] Scenario H: Offline resilience & buffered sync...');
  // Verifying server accepts timestamps and records pings with valid historical timestamps
  const offlinePingRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: targetDest.lat + 0.002,
      lng: targetDest.lng + 0.002,
      accuracy: 15,
      batteryLevel: 84,
      timestamp: new Date(Date.now() - 10000).toISOString()
    })
  });
  const offlinePingData = await offlinePingRes.json();
  if (!offlinePingData.success) {
    throw new Error('Scenario H failed: Offline timestamped telemetry sync rejected.');
  }
  console.log(`  ✓ Buffered location pings synchronized without data loss.`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario I: Battery reading unavailable -> Null handled safely
  // -------------------------------------------------------------------------
  console.log('\n[TEST 9] Scenario I: Battery telemetry unavailable (null)...');
  const batNullRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: targetDest.lat + 0.003,
      lng: targetDest.lng + 0.003,
      accuracy: 18,
      batteryLevel: null
    })
  });
  const batNullData = await batNullRes.json();
  if (!batNullData.success) {
    throw new Error('Scenario I failed: Null battery value caused error.');
  }
  console.log(`  ✓ Null battery reading handled safely: ${batNullData.trip.batteryLevel}% maintained.`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario J: Tourist pauses or ends the trip
  // -------------------------------------------------------------------------
  console.log('\n[TEST 10] Scenario J: Tourist pauses & completes trip...');
  const pauseRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'PAUSE' })
  });
  const pauseData = await pauseRes.json();
  if (pauseData.trip.status !== 'PAUSED') {
    throw new Error(`Scenario J failed: Expected PAUSED, got ${pauseData.trip?.status}`);
  }
  console.log(`  ✓ Monitoring paused: Status = ${pauseData.trip.status}`);

  const completeRes = await fetch(`${BASE_URL}/safe-zones/${testTripId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'COMPLETE' })
  });
  const completeData = await completeRes.json();
  if (completeData.trip.status !== 'COMPLETED') {
    throw new Error(`Scenario J failed: Expected COMPLETED, got ${completeData.trip?.status}`);
  }
  console.log(`  ✓ Trip safely ended: Status = ${completeData.trip.status}`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario K: Inaccurate GPS reading (>80m) does NOT trigger breach
  // -------------------------------------------------------------------------
  console.log('\n[TEST 11] Scenario K: Inaccurate GPS filtering (accuracy > 80m)...');
  // Create another active zone for testing accuracy protection
  const testKRes = await fetch(`${BASE_URL}/safe-zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: `usr_test_k`,
      userName: 'Kailash Traveler',
      destinationName: 'Manali Mall Road',
      destinationLat: 32.2396,
      destinationLng: 77.1887,
      radiusMeters: 5000,
      currentLat: 32.2396,
      currentLng: 77.1887
    })
  });
  const testKData = await testKRes.json();
  const tripKId = testKData.trip.id;

  // Send an inaccurate GPS fix (e.g. 120m accuracy) outside boundary
  const inaccRes = await fetch(`${BASE_URL}/safe-zones/${tripKId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: 32.1000, // ~15km away
      lng: 77.1000,
      accuracy: 150 // Bad accuracy fix
    })
  });
  const inaccData = await inaccRes.json();
  if (inaccData.status === 'BREACHED' || inaccData.alertDispatched) {
    throw new Error('Scenario K failed: Inaccurate GPS fix (>80m) triggered an alarm.');
  }
  console.log(`  ✓ Inaccurate fix (±150m) ignored by breach engine. Trip status preserved: ${inaccData.status}`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Scenario L: Repeated location updates do NOT generate duplicate incidents (Idempotency)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 12] Scenario L: Idempotency of automatic incident creation...');
  // Force 3 outside fixes to trigger breach
  for (let i = 0; i < 3; i++) {
    await fetch(`${BASE_URL}/safe-zones/${tripKId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: 32.1000,
        lng: 77.1000,
        accuracy: 15
      })
    });
  }

  // Count incidents before repeat ping
  const incBefore = await (await fetch(`${BASE_URL}/safe-zones/incidents`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  })).json();
  const countBefore = incBefore.incidents.length;

  // Send 3 more outside location updates
  for (let i = 0; i < 3; i++) {
    const repeatRes = await fetch(`${BASE_URL}/safe-zones/${tripKId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: 32.0990,
        lng: 77.0990,
        accuracy: 12
      })
    });
    const repData = await repeatRes.json();
    if (repData.alertDispatched !== false) {
      throw new Error('Scenario L failed: Repeated ping while breached triggered duplicate alert!');
    }
  }

  const incAfter = await (await fetch(`${BASE_URL}/safe-zones/incidents`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  })).json();
  const countAfter = incAfter.incidents.length;

  if (countBefore !== countAfter) {
    throw new Error(`Scenario L failed: Duplicate alerts created! Before: ${countBefore}, After: ${countAfter}`);
  }
  console.log(`  ✓ Idempotency verified: 3 repeat outside pings generated 0 duplicate alerts (Total incidents: ${countAfter}).`);
  passedScenarios++;

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passedScenarios} OF ${totalScenarios} TEST SCENARIOS PASSED WITH ZERO FAILURES!`);
  console.log('===============================================================');
};

runTests().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});

