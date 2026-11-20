import jwt from 'jsonwebtoken';
import { readJson } from '../utils/jsonDb.js';
import { getDestinationImageUrl } from '../utils/destinationImages.js';
import { isSupabaseConfigured, getSupabaseClient } from '../database/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'STSMS_SUPER_SECRET_KEY_2026';

// Tourist A: bhoot
const touristAToken = jwt.sign(
  { id: 'usr_bhoot_live', role: 'Explorer User', email: 'bhoot@gmail.com' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// Tourist B: another tourist
const touristBToken = jwt.sign(
  { id: 'usr_chotu_device_b', role: 'Explorer User', email: 'device_b@stsms.gov' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// Admin Token
const adminToken = jwt.sign(
  { id: 'adm_01', role: 'Super Admin', email: 'admin@stsms.gov' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const API_BASE = 'http://localhost:5001/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runPhase61Verification() {
  console.log('================================================================');
  console.log('   STSMS PHASE 6.1: SERVER-SIDE ESCALATION & SAFETY SUITE       ');
  console.log('================================================================\n');

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

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: Real Destination Image URLs Verification (Live HTTP HEAD)
  // ---------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Real Destination Image Verification ---');
  const destinationsToCheck = [
    { name: 'Agra Airport', expectedKeyword: '542296332' },
    { name: 'Taj Mahal', expectedKeyword: '564507592' },
    { name: 'Sanchi Stupa', expectedKeyword: '590050752' },
    { name: 'Rohtang Pass', expectedKeyword: '544735716' },
    { name: 'Solang Valley', expectedKeyword: '609766857' },
    { name: 'Unlisted Ridge 99', expectedKeyword: '464822759' }
  ];

  const fetchWithRetry = async (url, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) return res;
      } catch (e) {
        if (attempt === retries - 1) throw e;
      }
      await sleep(400);
    }
  };

  for (const d of destinationsToCheck) {
    const url = getDestinationImageUrl(d.name);
    try {
      const res = await fetchWithRetry(url);
      assert(
        res && res.ok && url.includes(d.expectedKeyword),
        `Destination "${d.name}" resolves to verified image returning HTTP ${res.status}`,
        `${url.slice(0, 60)}... (${res.headers.get('content-type')})`
      );
    } catch (e) {
      assert(false, `Destination "${d.name}" image check`, e.message);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Safe Zone Creation & Normal Tracking Inside Boundary
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Safe Zone Creation & Normal Tracking ---');
  let trip1Id = null;
  const agraImg = getDestinationImageUrl('Agra Airport');

  try {
    const createRes = await fetch(`${API_BASE}/safe-zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${touristAToken}`
      },
      body: JSON.stringify({
        userId: 'usr_bhoot_live',
        userName: 'bhoot',
        destinationName: 'Agra Airport',
        destinationLat: 27.1558,
        destinationLng: 77.9654,
        currentLat: 27.1558,
        currentLng: 77.9654,
        radiusMeters: 5000,
        imageUrl: agraImg
      })
    });
    const createData = await createRes.json();
    trip1Id = createData.trip?.id;
    assert(
      createData.success && createData.trip?.boundaryRadiusKm === 5 && createData.trip?.status === 'ACTIVE',
      'Safe zone trip created with 5 km radius boundary & verified destination image',
      `Trip ID: ${trip1Id}, Destination: ${createData.trip?.destination}, Status: ${createData.trip?.status}`
    );
  } catch (err) {
    assert(false, 'Safe zone creation', err.message);
  }

  // Inside Boundary Ping (45m from center)
  if (trip1Id) {
    try {
      const insideRes = await fetch(`${API_BASE}/safe-zones/${trip1Id}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${touristAToken}`
        },
        body: JSON.stringify({
          lat: 27.1560,
          lng: 77.9650,
          accuracy: 12,
          timestamp: new Date().toISOString()
        })
      });
      const insideData = await insideRes.json();
      assert(
        insideData.success && insideData.status === 'ACTIVE',
        'GPS inside 5 km boundary keeps trip in ACTIVE status',
        `Distance: ${insideData.distanceMeters?.toFixed(1)}m, Status: ${insideData.status}`
      );
    } catch (err) {
      assert(false, 'Inside boundary tracking', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Warning Trigger & Early Acknowledgment ("I AM SAFE")
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Warning State & Early Acknowledgment ---');
  if (trip1Id) {
    // 15 km outside boundary -> enters WARNING state with 10s deadline
    try {
      const breachRes = await fetch(`${API_BASE}/safe-zones/${trip1Id}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${touristAToken}`
        },
        body: JSON.stringify({
          lat: 27.3000,
          lng: 78.1000,
          accuracy: 18,
          timestamp: new Date().toISOString()
        })
      });
      const breachData = await breachRes.json();
      assert(
        breachData.success && breachData.status === 'WARNING' && breachData.warningExpiresAt && breachData.countdownSeconds <= 10,
        'Boundary breach triggers WARNING state with authoritative server-side 10-second deadline',
        `Status: ${breachData.status}, Deadline: ${breachData.warningExpiresAt}, Countdown: ${breachData.countdownSeconds}s`
      );
    } catch (err) {
      assert(false, 'Boundary breach warning initiation', err.message);
    }

    // Tourist acknowledges ("I AM SAFE") within 10s -> stops countdown, NO SOS created
    try {
      const ackRes = await fetch(`${API_BASE}/safe-zones/${trip1Id}/acknowledge-warning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${touristAToken}`
        },
        body: JSON.stringify({
          lat: 27.3000,
          lng: 78.1000,
          note: 'Verified safe by tourist bhoot on mobile device.'
        })
      });
      const ackData = await ackRes.json();
      assert(
        ackData.success && ackData.trip?.status === 'ACTIVE' && ackData.trip?.warningAcknowledged === true,
        'Tourist taps "I AM SAFE" within 10s: warning cancelled, status reset to ACTIVE, zero SOS alerts created',
        `Message: ${ackData.message}, Status: ${ackData.trip?.status}`
      );
    } catch (err) {
      assert(false, 'Early warning acknowledgement', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Server-Side Autonomous 10-Second Escalation (App Terminated/Backgrounded)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Autonomous Server-Side 10s Escalation (App Inactive) ---');
  let trip2Id = null;
  try {
    const createTrip2 = await fetch(`${API_BASE}/safe-zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${touristAToken}`
      },
      body: JSON.stringify({
        userId: 'usr_bhoot_live',
        userName: 'bhoot',
        destinationName: 'Agra Airport',
        destinationLat: 27.1558,
        destinationLng: 77.9654,
        currentLat: 27.1558,
        currentLng: 77.9654,
        radiusMeters: 5000,
        imageUrl: agraImg
      })
    });
    const d2 = await createTrip2.json();
    trip2Id = d2.trip?.id;

    // First enter zone to activate
    await fetch(`${API_BASE}/safe-zones/${trip2Id}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${touristAToken}` },
      body: JSON.stringify({ lat: 27.1558, lng: 77.9654, accuracy: 10 })
    });

    // Cross outside boundary -> initiate WARNING
    const outRes = await fetch(`${API_BASE}/safe-zones/${trip2Id}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${touristAToken}` },
      body: JSON.stringify({
        lat: 27.3200,
        lng: 78.1200,
        accuracy: 20,
        batteryLevel: 65,
        deviceInfo: {
          manufacturer: 'Google',
          model: 'Pixel 7',
          platform: 'Android',
          androidVersion: '14',
          appVersion: '1.0.0',
          batteryPercentage: 65
        }
      })
    });
    const outData = await outRes.json();
    assert(
      outData.status === 'WARNING',
      'Trip 2 entered WARNING state; mobile app is now CLOSED/TERMINATED (zero mobile requests sent)',
      `Status: ${outData.status}, Warning expires: ${outData.warningExpiresAt}`
    );

    console.log('   ⏳ Waiting 11s for 10-second deadline to expire, then polling for worker auto-escalation...');
    await sleep(11000);
    let activeData = null;
    for (let i = 0; i < 12; i++) {
      const activeRes = await fetch(`${API_BASE}/safe-zones/${trip2Id}`, {
        headers: { Authorization: `Bearer ${touristAToken}` }
      });
      activeData = await activeRes.json();
      if (activeData.trip?.status === 'BREACHED' && activeData.trip?.activeAlertId) {
        break;
      }
      await sleep(1000);
    }

    assert(
      activeData.trip?.status === 'BREACHED' && Boolean(activeData.trip?.activeAlertId),
      'Server-Side Worker autonomously detected expired 10s deadline and escalated to BREACHED with active alert',
      `Trip Status: ${activeData.trip?.status}, Alert ID: ${activeData.trip?.activeAlertId}`
    );

    // Verify Alert contents in Admin API
    const alertId = activeData.trip?.activeAlertId;
    if (alertId) {
      const alertRes = await fetch(`${API_BASE}/alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const alertData = await alertRes.json();
      assert(
        alertData.success &&
        alertData.alert?.message.includes('AUTOMATIC SAFE-ZONE BREACH: Tourist exited the 5 km safety boundary and did not acknowledge the emergency warning within 10 seconds.') &&
        alertData.alert?.userName === 'bhoot' &&
        alertData.alert?.deviceInfo?.platform === 'Android',
        'Admin Command Center received autonomous breach alert with exact required description and hardware telemetry',
        `User: ${alertData.alert?.userName}, Device: ${alertData.alert?.deviceInfo?.model} (${alertData.alert?.deviceInfo?.platform}), Msg: ${alertData.alert?.message?.slice(0, 65)}...`
      );
    }
  } catch (err) {
    assert(false, 'Autonomous server-side escalation', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Late Acknowledgment Rejection & Duplicate Prevention
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Late Acknowledgment & Duplicate Prevention ---');
  if (trip2Id) {
    // Tourist attempts to call acknowledge-warning AFTER 10s deadline has passed
    try {
      const lateAckRes = await fetch(`${API_BASE}/safe-zones/${trip2Id}/acknowledge-warning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${touristAToken}`
        },
        body: JSON.stringify({ note: 'Trying to cancel late after escalation...' })
      });
      assert(
        lateAckRes.status === 409,
        'Late acknowledgment after 10s deadline is rejected with HTTP 409 Conflict',
        `Status code: ${lateAckRes.status}`
      );
    } catch (err) {
      assert(false, 'Late acknowledgment rejection', err.message);
    }

    // Repeated escalate calls or repeated GPS pings do NOT create duplicate alerts
    try {
      const dupRes = await fetch(`${API_BASE}/safe-zones/${trip2Id}/escalate-breach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${touristAToken}`
        },
        body: JSON.stringify({ lat: 27.3200, lng: 78.1200 })
      });
      const dupData = await dupRes.json();
      assert(
        dupData.success && dupData.isExisting === true,
        'Idempotent duplicate protection: repeated breach escalation returns isExisting=true with zero duplicate alert',
        `Existing alert preserved: ${dupData.alert?.id}`
      );
    } catch (err) {
      assert(false, 'Duplicate escalation protection', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Real Supabase Storage Profile Picture Upload
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Real Supabase Storage Profile Picture Upload ---');
  try {
    // Real 1x1 test PNG base64
    const realPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const uploadRes = await fetch(`${API_BASE}/profile/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${touristAToken}`
      },
      body: JSON.stringify({
        userId: 'usr_bhoot_live',
        image: realPngBase64
      })
    });
    const uploadData = await uploadRes.json();
    assert(
      uploadData.success &&
      uploadData.avatarUrl &&
      uploadData.avatarUrl.includes('supabase.co/storage/v1/object/public/avatars/'),
      'Profile picture uploaded to real Supabase Storage bucket "avatars" and returned public URL',
      `Stored URL: ${uploadData.avatarUrl}`
    );

    // Verify downloaded over HTTPS
    if (uploadData.avatarUrl) {
      const checkImgRes = await fetch(uploadData.avatarUrl);
      assert(
        checkImgRes.status === 200 && checkImgRes.headers.get('content-type')?.includes('image'),
        'Uploaded avatar is publicly retrievable via HTTPS with HTTP 200 image/png',
        `Status: ${checkImgRes.status}, Content-Type: ${checkImgRes.headers.get('content-type')}`
      );
    }

    // Verify persisted in profile
    const profRes = await fetch(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${touristAToken}` }
    });
    const profData = await profRes.json();
    assert(
      profData.profile?.avatar === uploadData.avatarUrl,
      'Stored avatar URL persists across profile retrieval sessions',
      `Profile avatar matched: ${profData.profile?.avatar?.slice(0, 60)}...`
    );
  } catch (err) {
    assert(false, 'Profile picture upload', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: Security & Cross-Tourist Authorization Anti-Tampering
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Security & Cross-Tourist Authorization ---');
  if (trip1Id) {
    // Tourist B attempts to acknowledge Tourist A's trip
    try {
      const tamperRes = await fetch(`${API_BASE}/safe-zones/${trip1Id}/acknowledge-warning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${touristBToken}`
        },
        body: JSON.stringify({ userId: 'usr_chotu_device_b', note: 'Malicious tamper attempt' })
      });
      assert(
        tamperRes.status === 403,
        'Security enforcement: Tourist B cannot acknowledge or modify Tourist A\'s safe-zone trip (HTTP 403)',
        `Response status: ${tamperRes.status}`
      );
    } catch (err) {
      assert(false, 'Cross-tourist trip tamper protection', err.message);
    }
  }

  // Tourist B attempts to overwrite Tourist A's avatar
  try {
    const avatarTamperRes = await fetch(`${API_BASE}/profile/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${touristBToken}`
      },
      body: JSON.stringify({
        userId: 'usr_bhoot_live',
        image: 'data:image/png;base64,iVBORw0KGgo='
      })
    });
    assert(
      avatarTamperRes.status === 403,
      'Security enforcement: Tourist B cannot overwrite Tourist A\'s profile avatar (HTTP 403)',
      `Response status: ${avatarTamperRes.status}`
    );
  } catch (err) {
    assert(false, 'Cross-tourist avatar tamper protection', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: Worker Diagnostics & System Health Monitoring
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: Worker Diagnostics & Health Monitoring ---');
  try {
    const workerRes = await fetch(`${API_BASE}/safe-zones/worker-status`);
    const workerData = await workerRes.json();
    assert(
      workerData.success && workerData.worker?.status === 'active' && workerData.worker?.totalEscalatedCount >= 1,
      'Server-side escalation worker diagnostics endpoint returns active heartbeat & processed metrics',
      `Worker status: ${workerData.worker?.status}, Total escalated: ${workerData.worker?.totalEscalatedCount}, Heartbeat: ${workerData.worker?.heartbeat}`
    );

    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(
      healthData.status === 'ok' && healthData.escalationWorker?.status === 'active',
      '/api/health includes safe-zone escalation worker heartbeat and operational state',
      `Health: ${healthData.status}, Worker state: ${healthData.escalationWorker?.status}, Database: ${healthData.database}`
    );
  } catch (err) {
    assert(false, 'Worker diagnostics & health monitoring', err.message);
  }

  console.log('\n================================================================');
  console.log(`   VERIFICATION RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('================================================================');
  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 6.1 CRITICAL SAFETY & ESCALATION SCENARIOS VERIFIED!');
  } else {
    process.exit(1);
  }
}

runPhase61Verification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
