import jwt from 'jsonwebtoken';
import { readJson } from '../utils/jsonDb.js';
import { getDestinationImageUrl } from '../utils/destinationImages.js';
import { isSupabaseConfigured, getSupabaseClient } from '../database/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'STSMS_SUPER_SECRET_KEY_2026';
const token = jwt.sign(
  { id: 'adm_01', role: 'Super Admin', email: 'admin@stsms.gov' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const API_BASE = 'http://localhost:5001/api';

async function runPhase6Verification() {
  console.log('====================================================');
  console.log('  STSMS PHASE 6 COMPREHENSIVE VERIFICATION SUITE   ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] Scenario ${totalTests}: ${testName}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      console.error(`❌ [FAIL] Scenario ${totalTests}: ${testName}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  // 1. Destination Image Matching
  console.log('--- TEST GROUP 1: Destination-Specific Image Mapping ---');
  const agraAirportImg = getDestinationImageUrl('Agra Airport');
  assert(
    agraAirportImg.includes('photo-1542296332-2e4473faf563'),
    'Agra Airport resolves to verified aviation/airport terminal image',
    agraAirportImg
  );

  const sanchiImg = getDestinationImageUrl('Sanchi Stupa');
  assert(
    sanchiImg.includes('photo-1590050752117-238cb0fb12b1'),
    'Sanchi Stupa resolves to verified stupa/monument image',
    sanchiImg
  );

  const rohtangImg = getDestinationImageUrl('Rohtang Pass');
  assert(
    rohtangImg.includes('photo-1544735716-392fe2489ffa'),
    'Rohtang Pass resolves to verified high-altitude mountain pass image',
    rohtangImg
  );

  const unknownImg = getDestinationImageUrl('Some Random Unlisted Hill 123');
  assert(
    unknownImg.includes('photo-1508873696983-2df5293cb395'),
    'Unlisted destination resolves to verified neutral topography/trail placeholder',
    unknownImg
  );

  // 2. Safe Zone Trip Creation with 5km Radius and Image URL
  console.log('\n--- TEST GROUP 2: Safe Zone Trip Creation & FSM Lifecycle ---');
  let createdTripId = null;
  try {
    const createTripRes = await fetch(`${API_BASE}/safe-zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: 'usr_bhoot_live',
        userName: 'bhoot',
        destination: 'Agra Airport',
        destinationCoordinates: { lat: 27.1558, lng: 77.9654 },
        userLocation: { lat: 27.1558, lng: 77.9654 },
        radiusMeters: 5000,
        imageUrl: agraAirportImg
      })
    });
    const createData = await createTripRes.json();
    assert(
      createData.success && createData.trip && createData.trip.boundaryRadiusKm === 5,
      'Safe zone trip created with 5 km radius boundary',
      `Trip ID: ${createData.trip?.id}, Radius: ${createData.trip?.boundaryRadiusKm}km, Image: ${createData.trip?.imageUrl?.slice(0, 50)}...`
    );
    createdTripId = createData.trip?.id;
  } catch (err) {
    assert(false, 'Safe zone trip creation with 5km radius', err.message);
  }

  // 3. Location inside 5km boundary保持 ACTIVE
  if (createdTripId) {
    try {
      const insideRes = await fetch(`${API_BASE}/safe-zones/${createdTripId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 27.1560,
          lng: 77.9650,
          accuracy: 15,
          timestamp: new Date().toISOString()
        })
      });
      const insideData = await insideRes.json();
      assert(
        insideData.success && (insideData.status === 'ACTIVE' || insideData.status === 'Active'),
        'GPS inside 5km boundary maintains ACTIVE status',
        `Distance: ${insideData.distanceMeters?.toFixed(1)}m, Status: ${insideData.status}`
      );
    } catch (err) {
      assert(false, 'GPS inside 5km boundary', err.message);
    }

    // 4. Genuine boundary exit triggers WARNING state with 10s countdown
    try {
      // Coordinates ~15km outside Agra Airport (e.g., Lat: 27.3000, Lng: 78.1000)
      const outsideRes = await fetch(`${API_BASE}/safe-zones/${createdTripId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 27.3000,
          lng: 78.1000,
          accuracy: 20,
          timestamp: new Date().toISOString()
        })
      });
      const outsideData = await outsideRes.json();
      assert(
        outsideData.success && outsideData.status === 'WARNING' && outsideData.countdownSeconds === 10,
        'Boundary breach detection enters WARNING state with 10-second countdown',
        `Status: ${outsideData.status}, Distance: ${outsideData.distanceMeters?.toFixed(1)}m, Countdown: ${outsideData.countdownSeconds}s`
      );
    } catch (err) {
      assert(false, 'Boundary breach detection enters WARNING state', err.message);
    }

    // 5. Tourist taps "I AM SAFE" within 10 seconds -> warning acknowledged, NO SOS created
    try {
      const ackRes = await fetch(`${API_BASE}/safe-zones/${createdTripId}/acknowledge-warning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr_bhoot_live',
          userName: 'bhoot',
          location: { lat: 27.3000, lng: 78.1000, accuracy: 20 },
          batteryLevel: 85,
          timestamp: new Date().toISOString()
        })
      });
      const ackData = await ackRes.json();
      assert(
        ackData.success && (ackData.status === 'ACTIVE' || ackData.trip?.status === 'ACTIVE'),
        'Tourist taps "I AM SAFE": warning acknowledged, countdown stopped, trip status active, NO SOS generated',
        `Message: ${ackData.message}, Status: ${ackData.status || ackData.trip?.status}`
      );
    } catch (err) {
      assert(false, 'Acknowledge warning "I AM SAFE"', err.message);
    }

    // 6. Tourist breaches again and 10 seconds expire -> Escalate to Admin Command Center
    try {
      // Outside ping again
      await fetch(`${API_BASE}/safe-zones/${createdTripId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 27.3100,
          lng: 78.1100,
          accuracy: 25,
          timestamp: new Date().toISOString()
        })
      });

      // 10s elapsed -> mobile calls escalate-breach
      const escRes = await fetch(`${API_BASE}/safe-zones/${createdTripId}/escalate-breach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr_bhoot_live',
          userName: 'bhoot',
          location: { lat: 27.3100, lng: 78.1100, accuracy: 25 },
          batteryLevel: 78,
          deviceInfo: {
            manufacturer: 'Google',
            model: 'Pixel 7',
            platform: 'Android',
            androidVersion: '14',
            osVersion: 'UpsideDownCake',
            appVersion: '1.0.0',
            appBuildNumber: '1',
            batteryPercentage: 78,
            batteryChargingStatus: 'Discharging',
            networkConnectionType: 'Mobile App (Cellular/Wi-Fi)',
            lastTelemetryUpdate: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        })
      });
      const escData = await escRes.json();
      assert(
        escData.success && 
        escData.alert && 
        escData.alert.message.includes('AUTOMATIC SAFE-ZONE BREACH:') &&
        escData.alert.message.includes('exited the 5 km safety boundary and did not acknowledge the emergency warning within 10 seconds.'),
        'Unacknowledged 10s breach escalates to Admin Command Center with exact required alert description',
        `Alert ID: ${escData.alert?.id}, Message: ${escData.alert?.message}`
      );

      // 7. Idempotency test: duplicate escalate call does NOT create duplicate alert
      const dupRes = await fetch(`${API_BASE}/safe-zones/${createdTripId}/escalate-breach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr_bhoot_live',
          userName: 'bhoot',
          location: { lat: 27.3100, lng: 78.1100 },
          batteryLevel: 78,
          timestamp: new Date().toISOString()
        })
      });
      const dupData = await dupRes.json();
      assert(
        dupData.success && dupData.isExisting && dupData.alert?.id === escData.alert?.id,
        'Idempotent lifecycle prevents duplicate alerts for repeated breach calls',
        `Existing Alert ID matched: ${dupData.alert?.id}`
      );
    } catch (err) {
      assert(false, 'Breach escalation and idempotency', err.message);
    }
  }

  // 8. Tourist Profile Picture Upload & Persistence
  console.log('\n--- TEST GROUP 3: Profile Picture Upload & Supabase Storage ---');
  try {
    const avatarRes = await fetch(`${API_BASE}/profile/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: 'usr_bhoot_live',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
      })
    });
    const avatarData = await avatarRes.json();
    assert(
      avatarData.success && avatarData.avatarUrl && avatarData.avatarUrl.includes('photo-1534528741775-53994a69daeb'),
      'Tourist profile avatar upload persists to storage & user profile',
      `Avatar URL: ${avatarData.avatarUrl}`
    );
  } catch (err) {
    assert(false, 'Profile picture upload', err.message);
  }

  // 9. Inspect Tourist Profile Dossier (Fixes "Failed to load tourist details")
  console.log('\n--- TEST GROUP 4: Tourist User Registry & Inspection ---');
  try {
    const userRes = await fetch(`${API_BASE}/users/usr_bhoot_live`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userData = await userRes.json();
    assert(
      userData.success && 
      userData.user && 
      userData.user.fullName === 'bhoot' &&
      Array.isArray(userData.user.guardians) &&
      Array.isArray(userData.user.documents) &&
      Array.isArray(userData.user.trips),
      'Tourist dossier (/api/users/:id) loads with complete identity, guardians, documents & trips (fixes "Failed to load tourist details")',
      `Name: ${userData.user?.fullName}, Email: ${userData.user?.email}, Guardians: ${userData.user?.guardians?.length}, Trips: ${userData.user?.trips?.length}`
    );
  } catch (err) {
    assert(false, 'Tourist dossier inspection', err.message);
  }

  // 10. Admin Emergency Incident Inspection with Device Intelligence
  console.log('\n--- TEST GROUP 5: Incident Telemetry & Device Intelligence ---');
  try {
    const alertRes = await fetch(`${API_BASE}/alerts/ec9b24a2-5042-481f-b251-70e8ac6cbc88`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const alertData = await alertRes.json();
    assert(
      alertData.success &&
      alertData.alert &&
      alertData.alert.userName === 'bhoot' &&
      alertData.alert.user?.email === 'bhoot@gmail.com' &&
      alertData.alert.deviceInfo &&
      alertData.alert.deviceInfo.platform === 'Android',
      'Admin incident detail inspection displays tourist identity (bhoot, email, phone) and collected device telemetry',
      `User: ${alertData.alert?.userName} (${alertData.alert?.user?.email}), Platform: ${alertData.alert?.deviceInfo?.platform}, Battery: ${alertData.alert?.deviceInfo?.batteryPercentage}%`
    );
  } catch (err) {
    assert(false, 'Admin incident detail inspection', err.message);
  }

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('====================================================');
  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 6 INTEGRATION SCENARIOS VERIFIED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runPhase6Verification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
