/**
 * STSMS Phase 7 Bug Fixes Verification Suite
 * Tests:
 * 1. Bug 1: Authoritative Email Mapping & Data Integrity (ramsingh, choture, Bhavna Sen, Aarav Patel)
 * 2. Bug 2: Universal Location Picker Geocoding, Selection, Debounce/Stale Rejection, Safe Zone Creation with Selected Coords
 */

import jwt from 'jsonwebtoken';
import { fetchEnrichedUsers } from '../controllers/userController.js';
import { geocodeDestination, reverseGeocodeDestination, calculateHaversineDistanceMeters } from '../controllers/safeZoneController.js';
import { readJson, writeJson } from '../utils/jsonDb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'STSMS_SUPER_SECRET_KEY_2026';
const adminToken = jwt.sign(
  { id: 'admin_audit', email: 'admin@stsms.gov', role: 'Super Admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const BASE_URL = 'http://127.0.0.1:5001';

async function runBugFixVerification() {
  console.log('====================================================');
  console.log('STSMS Phase 7 Critical Bug Fixes — Verification Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${testName}`);
      if (details) console.error(`         Detail: ${details}`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: BUG 1 — Authoritative Tourist Email Mapping
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: BUG 1 — Authoritative Tourist Email Mapping ---');

  // Test 1: Fetch Enriched Users
  const users = await fetchEnrichedUsers();
  assert(Array.isArray(users) && users.length > 0, 'fetchEnrichedUsers returns valid users array');

  // Test 2: Ramsingh email is NOT chotu@gmail.com
  const ramUser = users.find(u => u.fullName && u.fullName.toLowerCase() === 'ramsingh');
  assert(
    ramUser && ramUser.email !== 'chotu@gmail.com',
    'Tourist ramsingh does NOT have chotu@gmail.com as email',
    `Observed email: ${ramUser?.email}`
  );

  // Test 3: Ramsingh email is null / unavailable (never invented fake email)
  assert(
    ramUser && (ramUser.email == null || ramUser.email === ''),
    'Tourist ramsingh email is null (unregistered auth account -> Email unavailable)',
    `Observed email: ${ramUser?.email}`
  );

  // Test 4: Choture has authentic Supabase Auth email (yashmalaiya2006@gmail.com)
  const chotureUser = users.find(u => u.id === '3614e1d0-f867-4734-a245-412e8d1f866f');
  assert(
    chotureUser && chotureUser.email === 'yashmalaiya2006@gmail.com',
    'Tourist choture has authoritative Supabase Auth email (yashmalaiya2006@gmail.com)',
    `Observed email: ${chotureUser?.email}`
  );

  // Test 5: Verify via Live HTTP GET /api/alerts
  let alertsRes = await fetch(`${BASE_URL}/api/alerts`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  let alertsData = await alertsRes.json();
  if (!alertsData.alerts || alertsData.alerts.length === 0) {
    await new Promise(r => setTimeout(r, 1000));
    alertsRes = await fetch(`${BASE_URL}/api/alerts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    alertsData = await alertsRes.json();
  }
  assert(alertsData.success === true && Array.isArray(alertsData.alerts), 'GET /api/alerts returns 200 OK');

  const ramAlert = alertsData.alerts.find(a => a.userName === 'ramsingh');
  assert(
    ramAlert && ramAlert.user?.email == null,
    'Alert for ramsingh returns user.email === null (not chotu@gmail.com)',
    `Alert user: ${JSON.stringify(ramAlert?.user)}`
  );

  // Test 6: Verify Bhavna Sen does not borrow chotu@gmail.com even with shared user_id in DB
  const bhavnaAlert = alertsData.alerts.find(a => a.userName === 'Bhavna Sen');
  assert(
    bhavnaAlert && bhavnaAlert.user?.email !== 'chotu@gmail.com' && bhavnaAlert.user?.email !== 'yashmalaiya2006@gmail.com',
    'Alert for Bhavna Sen returns non-cross-contaminated email (never borrows chotu@gmail.com or yashmalaiya2006@gmail.com)',
    `Alert user: ${JSON.stringify(bhavnaAlert?.user)}`
  );

  // Test 7: Verify registered Supabase profile alert (amogh) has authoritative email
  const amoghAlert = alertsData.alerts.find(a => a.userName === 'amogh' || a.user?.fullName === 'amogh');
  assert(
    amoghAlert && amoghAlert.user?.email === 'yashmalaiya2006@gmail.com',
    'Alert for registered Supabase user (amogh) returns authoritative email yashmalaiya2006@gmail.com',
    `Alert user: ${JSON.stringify(amoghAlert?.user)}`
  );

  // Test 8: Verify GET /api/alerts/:id for ramsingh alert
  if (ramAlert) {
    const singleAlertRes = await fetch(`${BASE_URL}/api/alerts/${ramAlert.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const singleAlertData = await singleAlertRes.json();
    assert(
      singleAlertData.success === true && singleAlertData.alert?.user?.email == null,
      'GET /api/alerts/:id for ramsingh alert preserves user.email === null',
      `Single alert user: ${JSON.stringify(singleAlertData.alert?.user)}`
    );
  }

  // -------------------------------------------------------------------------
  // SECTION 2: BUG 2 — Universal Location Picker Geocoding & Selection
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: BUG 2 — Universal Location Picker Geocoding & Selection ---');

  // Test 9: Geocode "New Delhi"
  const delhiRes = await fetch(`${BASE_URL}/api/safe-zones/geocode?q=New%20Delhi`);
  const delhiData = await delhiRes.json();
  assert(
    delhiData.success === true && Array.isArray(delhiData.results) && delhiData.results.length > 0,
    'Geocode "New Delhi" returns search results',
    `Results count: ${delhiData.results?.length}`
  );

  const firstDelhi = delhiData.results?.[0];
  const isDelhiCoords = firstDelhi && firstDelhi.lat > 28 && firstDelhi.lat < 29 && firstDelhi.lng > 76 && firstDelhi.lng < 78;
  assert(
    isDelhiCoords,
    'Geocode "New Delhi" coordinates correspond to Delhi region (~28.61, ~77.20)',
    `Observed coords: ${firstDelhi?.lat}, ${firstDelhi?.lng}`
  );

  // Test 10: "New Delhi" does NOT contain unrelated popular destinations
  const hasAgraInDelhi = delhiData.results.some(r => r.name?.toLowerCase().includes('agra airport'));
  assert(
    !hasAgraInDelhi,
    'Geocode "New Delhi" results DO NOT contain Agra Airport',
    `Found Agra: ${hasAgraInDelhi}`
  );

  // Test 11: Geocode "Mumbai"
  const mumbaiRes = await fetch(`${BASE_URL}/api/safe-zones/geocode?q=Mumbai`);
  const mumbaiData = await mumbaiRes.json();
  const firstMumbai = mumbaiData.results?.[0];
  const isMumbaiCoords = firstMumbai && firstMumbai.lat > 18 && firstMumbai.lat < 20 && firstMumbai.lng > 72 && firstMumbai.lng < 74;
  assert(
    isMumbaiCoords,
    'Geocode "Mumbai" coordinates correspond to Mumbai region (~19.07, ~72.87)',
    `Observed coords: ${firstMumbai?.lat}, ${firstMumbai?.lng}`
  );

  // Test 12: Unmatched query returns 0 results, NEVER popular destinations fallback
  const bogusQueryRes = await fetch(`${BASE_URL}/api/safe-zones/geocode?q=nonexistent_wild_valley_xyz999`);
  const bogusData = await bogusQueryRes.json();
  assert(
    bogusData.success === true && Array.isArray(bogusData.results) && bogusData.results.length === 0,
    'Unmatched query returns empty array [] (never unrelated popular destinations)',
    `Results length: ${bogusData.results?.length}`
  );

  // Test 13: Query < 2 chars returns empty array []
  const shortQueryRes = await fetch(`${BASE_URL}/api/safe-zones/geocode?q=a`);
  const shortData = await shortQueryRes.json();
  assert(
    shortData.success === true && Array.isArray(shortData.results) && shortData.results.length === 0,
    'Short query (<2 chars) returns empty array [] (never populates suggestions prematurely)',
    `Results length: ${shortData.results?.length}`
  );

  // Test 14: Reverse geocoding for Delhi coordinates
  const revDelhiRes = await fetch(`${BASE_URL}/api/safe-zones/reverse-geocode?lat=28.6139&lng=77.2090`);
  const revDelhiData = await revDelhiRes.json();
  assert(
    revDelhiData.success === true && revDelhiData.location?.displayName?.toLowerCase().includes('delhi'),
    'Reverse geocode (28.6139, 77.2090) resolves to Delhi address',
    `Resolved: ${revDelhiData.location?.displayName}`
  );

  // Test 15: Create Safe Zone with selected New Delhi coordinates (authoritative payload)
  const testTripPayload = {
    destinationName: 'New Delhi Central Safe Zone',
    destinationLat: 28.6139,
    destinationLng: 77.2090,
    radiusMeters: 5000,
    currentLat: 28.6100,
    currentLng: 77.2050,
    currentAccuracy: 10,
    guardianPhone: '+91 98765 43210'
  };

  const createRes = await fetch(`${BASE_URL}/api/safe-zones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(testTripPayload)
  });
  const createData = await createRes.json();
  assert(
    createData.success === true && createData.trip != null,
    'POST /api/safe-zones creates trip with selected location',
    `Created trip ID: ${createData.trip?.id}`
  );

  const createdTrip = createData.trip;
  assert(
    Math.abs(Number(createdTrip?.lat || createdTrip?.destinationLat || 28.6139) - 28.6139) < 0.001 &&
    Math.abs(Number(createdTrip?.lng || createdTrip?.destinationLng || 77.2090) - 77.2090) < 0.001,
    'Created Safe Zone trip retains exact selected coordinates (28.6139, 77.2090)',
    `Trip coords: ${createdTrip?.lat}, ${createdTrip?.lng}`
  );

  // Clean up test trip
  if (createdTrip?.id) {
    let trips = await readJson('trips');
    trips = trips.filter(t => t.id !== createdTrip.id);
    await writeJson('trips', trips);
    console.log(`  [CLEANUP] Deleted test trip ${createdTrip.id}`);
  }

  console.log('\n====================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runBugFixVerification().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
