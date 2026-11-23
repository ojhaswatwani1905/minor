import { readJson, writeJson } from '../utils/jsonDb.js';
import {
  reverseGeocodeDestination,
  createSafeZoneTrip,
  getAllSafeZones,
  getGeofenceIncidents
} from '../controllers/safeZoneController.js';
import {
  startDeadManSession,
  getDeadManStatus,
  checkInDeadMan,
  pauseDeadManSession,
  resumeDeadManSession,
  stopDeadManSession,
  getAllDeadManSessions
} from '../controllers/deadManController.js';
import { checkExpiredDeadManSessions } from '../services/breachEscalationWorker.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m [${totalTests}] ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m [${totalTests}] ${message}`);
  }
}

// Mock Express req/res helper
const createMockReqRes = (reqData = {}) => {
  const req = {
    query: reqData.query || {},
    params: reqData.params || {},
    body: reqData.body || {},
    headers: reqData.headers || {},
    user: reqData.user || null
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    }
  };

  const next = (err) => {
    if (err) {
      statusCode = 500;
      responseData = { success: false, message: err.message };
    }
  };

  return { req, res, next, getResult: () => ({ status: statusCode, data: responseData }) };
};

async function runTests() {
  console.log('\n===============================================================');
  console.log('STSMS Phase 7: Universal GPS & Dead Man\'s Switch Verification');
  console.log('===============================================================\n');

  const testUserId = `usr_p7_${Date.now()}`;
  const testUserName = 'Phase 7 Test Tourist';
  const testOtherUserId = `usr_other_${Date.now()}`;

  // -------------------------------------------------------------
  // Test 1: Reverse Geocoding with Known Coordinates
  // -------------------------------------------------------------
  console.log('\n--- Section A: Universal Location Selection & Geocoding ---');
  {
    const { req, res, next, getResult } = createMockReqRes({
      query: { lat: '27.1751', lng: '78.0421' }
    });
    await reverseGeocodeDestination(req, res, next);
    const { status, data } = getResult();
    assert(status === 200 && data.success && data.location != null, '1. Reverse Geocode resolves coordinates (lat=27.1751, lng=78.0421)');
    assert(data.location.lat === 27.1751 && data.location.lng === 78.0421, '2. Returned coordinates match exact requested lat/lng');
  }

  // -------------------------------------------------------------
  // Test 2: Reverse Geocoding Fallback for Remote Coordinates
  // -------------------------------------------------------------
  {
    const { req, res, next, getResult } = createMockReqRes({
      query: { lat: '34.8872', lng: '77.2145' } // Remote mountain point
    });
    await reverseGeocodeDestination(req, res, next);
    const { status, data } = getResult();
    assert(status === 200 && data.success && data.location.name != null, '3. Remote mountain coordinate gracefully resolves or provides fallback');
    assert(data.location.displayName.length > 0, '4. Human-readable displayName is populated even in fallback mode');
  }

  // -------------------------------------------------------------
  // Test 3: Create Safe Zone with Arbitrary Coordinates & No Predefined Name
  // -------------------------------------------------------------
  let createdTripId = null;
  {
    const { req, res, next, getResult } = createMockReqRes({
      body: {
        userId: testUserId,
        userName: testUserName,
        destinationLat: 28.6139,
        destinationLng: 77.2090, // Delhi Central
        radiusMeters: 5000,
        currentLat: 28.6100,
        currentLng: 77.2050,
        guardianPhone: '+91 99887 76655'
      }
    });
    await createSafeZoneTrip(req, res, next);
    const { status, data } = getResult();
    assert((status === 200 || status === 201) && data.success && data.trip != null, '5. Safe Zone created with arbitrary lat/lng coordinates without predefined list');
    assert(data.trip.destinationCoords.lat === 28.6139 && data.trip.destinationCoords.lng === 77.2090, '6. Destination coordinates match exact source of truth');
    assert(data.trip.destination.includes('28.6139') || data.trip.destination.length > 0, '7. Fallback destination label generated automatically');
    assert(data.trip.radiusMeters === 5000, '8. Safe perimeter radius set to 5000m (5 km)');
    createdTripId = data.trip.id;
  }

  // -------------------------------------------------------------
  // Test 4: Start Dead Man's Switch Session
  // -------------------------------------------------------------
  console.log('\n--- Section B: Dead Man\'s Switch Lifecycle ---');
  let activeSessionId = null;
  {
    const { req, res, next, getResult } = createMockReqRes({
      body: {
        userId: testUserId,
        userName: testUserName,
        userPhone: '+91 98765 43210',
        intervalSeconds: 30, // 30 seconds
        lastKnownLocation: {
          lat: 28.6100,
          lng: 77.2050,
          accuracy: 8,
          timestamp: new Date().toISOString()
        },
        hardwareTelemetry: {
          batteryLevel: 85,
          networkSignal: 'Mobile GNSS',
          deviceModel: 'Pixel 8 Pro'
        }
      }
    });
    await startDeadManSession(req, res, next);
    const { status, data } = getResult();
    assert(status === 201 && data.success && data.session != null, '9. Start Dead Man\'s Switch session creates persistent record');
    assert(data.session.status === 'ACTIVE', '10. Initial session status is ACTIVE');
    assert(data.session.intervalSeconds === 30, '11. Interval recorded accurately (30s)');
    assert(new Date(data.session.nextDeadlineAt).getTime() > Date.now(), '12. nextDeadlineAt is in future (now + 30s)');
    activeSessionId = data.session.id;
  }

  // -------------------------------------------------------------
  // Test 5: Query Dead Man's Switch Status
  // -------------------------------------------------------------
  {
    const { req, res, next, getResult } = createMockReqRes({
      params: { userId: testUserId }
    });
    await getDeadManStatus(req, res, next);
    const { status, data } = getResult();
    assert(status === 200 && data.success && data.hasActiveSession, '13. getDeadManStatus retrieves active tourist session');
    assert(data.remainingSeconds > 0 && data.remainingSeconds <= 30, '14. remainingSeconds computed dynamically from authoritative deadline');
    assert(data.effectiveStatus === 'ACTIVE' || data.effectiveStatus === 'CHECK-IN REQUIRED', '15. effectiveStatus accurately reflects countdown');
  }

  // -------------------------------------------------------------
  // Test 6: Tourist Check-in ("I AM SAFE")
  // -------------------------------------------------------------
  {
    const initialSessions = await readJson('deadman_sessions');
    const prevDeadline = initialSessions.find(s => s.id === activeSessionId).nextDeadlineAt;

    // Small delay to simulate elapsed time
    await new Promise(r => setTimeout(r, 200));

    const { req, res, next, getResult } = createMockReqRes({
      body: {
        sessionId: activeSessionId,
        userId: testUserId,
        lastKnownLocation: {
          lat: 28.6120,
          lng: 77.2070,
          accuracy: 5,
          timestamp: new Date().toISOString()
        },
        hardwareTelemetry: {
          batteryLevel: 84
        }
      }
    });
    await checkInDeadMan(req, res, next);
    const { status, data } = getResult();
    assert(status === 200 && data.success, '16. Tourist "I AM SAFE" check-in succeeds');
    assert(new Date(data.session.nextDeadlineAt).getTime() > new Date(prevDeadline).getTime(), '17. Deadline advanced into future on check-in');
    assert(data.session.lastKnownLocation.lat === 28.6120, '18. Last known location updated during check-in');
  }

  // -------------------------------------------------------------
  // Test 7: Pause and Resume Session
  // -------------------------------------------------------------
  {
    const { req: pReq, res: pRes, next: pNext, getResult: pResult } = createMockReqRes({
      body: { sessionId: activeSessionId, userId: testUserId }
    });
    await pauseDeadManSession(pReq, pRes, pNext);
    const pauseRes = pResult();
    assert(pauseRes.status === 200 && pauseRes.data.session.status === 'PAUSED', '19. Pause Dead Man\'s Switch freezes status to PAUSED');
    assert(pauseRes.data.session.pausedRemainingMs > 0, '20. Remaining time preserved in pausedRemainingMs');

    const { req: rReq, res: rRes, next: rNext, getResult: rResult } = createMockReqRes({
      body: { sessionId: activeSessionId, userId: testUserId }
    });
    await resumeDeadManSession(rReq, rRes, rNext);
    const resumeRes = rResult();
    assert(resumeRes.status === 200 && resumeRes.data.session.status === 'ACTIVE', '21. Resume Dead Man\'s Switch restores ACTIVE status');
    assert(new Date(resumeRes.data.session.nextDeadlineAt).getTime() > Date.now(), '22. nextDeadlineAt recalculated from saved remaining time');
  }

  // -------------------------------------------------------------
  // Test 8: Cross-Tourist Authorization (Security Protection)
  // -------------------------------------------------------------
  console.log('\n--- Section C: Security & Atomic Escalation ---');
  {
    const { req, res, next, getResult } = createMockReqRes({
      body: {
        sessionId: activeSessionId,
        userId: testOtherUserId // Attacker/other tourist trying to tamper
      }
    });
    await checkInDeadMan(req, res, next);
    const { status, data } = getResult();
    assert(status === 403 && !data.success, '23. Cross-tourist check-in attempt blocked with HTTP 403 Forbidden');
  }

  // -------------------------------------------------------------
  // Test 9: Server-Side Background Escalation Worker
  // -------------------------------------------------------------
  let autoEscalatedSessionId = null;
  const testEscalateUserId = `usr_escalate_${Date.now()}`;
  let escalatedSession = null;
  {
    // Create a session with an expired deadline (in past)
    const expiredDeadline = new Date(Date.now() - 2000).toISOString();
    const sessions = await readJson('deadman_sessions');
    autoEscalatedSessionId = `dms_test_esc_${Date.now()}`;
    sessions.unshift({
      id: autoEscalatedSessionId,
      userId: testEscalateUserId,
      userName: 'Overdue Test Traveller',
      userPhone: '+91 91111 22222',
      intervalSeconds: 15,
      status: 'ACTIVE',
      startedAt: new Date(Date.now() - 20000).toISOString(),
      lastCheckInAt: new Date(Date.now() - 20000).toISOString(),
      nextDeadlineAt: expiredDeadline,
      pausedAt: null,
      pausedRemainingMs: null,
      lastKnownLocation: {
        lat: 27.1800,
        lng: 78.0200,
        accuracy: 12,
        timestamp: new Date(Date.now() - 20000).toISOString()
      },
      hardwareTelemetry: {
        batteryLevel: 22,
        networkSignal: 'GNSS Distress',
        deviceModel: 'Samsung Galaxy S24'
      },
      escalationProcessed: false,
      escalationIncidentId: null,
      createdAt: new Date(Date.now() - 20000).toISOString(),
      updatedAt: new Date(Date.now() - 20000).toISOString()
    });
    await writeJson('deadman_sessions', sessions);

    // Run the background escalation check
    await checkExpiredDeadManSessions();

    const updatedSessions = await readJson('deadman_sessions');
    const escalated = updatedSessions.find(s => s.id === autoEscalatedSessionId);
    escalatedSession = escalated;

    assert(escalated != null && escalated.status === 'ESCALATED', '24. Expired deadline detected and atomically escalated by backend worker');
    assert(escalated.escalationProcessed === true, '25. escalationProcessed flag set to prevent race conditions & duplicate dispatch');
    assert(escalated.escalationIncidentId != null, '26. Emergency alert incident ID generated and linked to session');

    // Verify alert dispatched to alerts.json
    const alerts = await readJson('alerts');
    const dmsAlert = alerts.find(a => a.id === escalated.escalationIncidentId);
    assert(dmsAlert != null, '27. DEADMAN_SWITCH alert stored persistently in alerts database');
    assert(dmsAlert.type === 'DEADMAN_SWITCH', '28. Alert type correctly labeled DEADMAN_SWITCH');
    assert(dmsAlert.priority === 'CRITICAL', '29. Emergency alert priority set to CRITICAL');
    assert(dmsAlert.location?.lat === 27.1800 && dmsAlert.location?.lng === 78.0200, '30. Last known GPS location correctly attached to alert');
    assert(dmsAlert.batteryLevel === 22, '31. Device battery telemetry attached to alert');
  }

  // -------------------------------------------------------------
  // Test 10: Check-In on Escalated Session Returns 409 Conflict
  // -------------------------------------------------------------
  {
    const { req, res, next, getResult } = createMockReqRes({
      body: {
        sessionId: autoEscalatedSessionId,
        userId: testEscalateUserId
      }
    });
    await checkInDeadMan(req, res, next);
    const { status, data } = getResult();
    assert(status === 409 && !data.success, '32. Check-in to an already escalated session returns 409 Conflict');
  }

  // -------------------------------------------------------------
  // Test 11: Admin Command Center Endpoints
  // -------------------------------------------------------------
  console.log('\n--- Section D: Admin Command Center Endpoints ---');
  {
    // Non-admin without req.admin
    const { req, res, next, getResult } = createMockReqRes({
      query: {},
      user: { id: 'usr_tourist_1', role: 'tourist' }
    });
    await getAllDeadManSessions(req, res, next);
    const { status, data } = getResult();
    assert(status === 403 && !data.success, '33. Non-admin GET /api/deadman/all returns 403 Forbidden');
  }

  {
    // Admin with req.admin
    const { req, res, next, getResult } = createMockReqRes({
      query: {},
      user: { id: 'usr_admin_1', role: 'Super Admin' }
    });
    req.admin = { id: 'usr_admin_1', role: 'Super Admin' };
    await getAllDeadManSessions(req, res, next);
    const { status, data } = getResult();
    assert(status === 200 && data.success && Array.isArray(data.sessions), '34. Authenticated Admin GET /api/deadman/all returns session array');
  }

  {
    const { req, res, next, getResult } = createMockReqRes({
      query: {}
    });
    await getAllSafeZones(req, res, next);
    const { status, data } = getResult();
    assert(status === 200 && data.success && Array.isArray(data.safeZones), '35. Admin GET /api/safe-zones/all returns 200 with safe zones list');
  }

  {
    const { req, res, next, getResult } = createMockReqRes({
      query: {}
    });
    await getGeofenceIncidents(req, res, next);
    const { status, data } = getResult();
    assert(status === 200 && data.success && Array.isArray(data.incidents), '36. Admin GET /api/safe-zones/incidents returns 200 with geofence incidents list');
  }

  // -------------------------------------------------------------
  // Test 12: Phase 7.1 Security Audit & Interval Hardening
  // -------------------------------------------------------------
  console.log('\n--- Section E: Phase 7.1 Security Audit & Interval Hardening ---');
  // 1. Tourist B attempting to inspect Tourist A's status
  {
    const { req, res, next, getResult } = createMockReqRes({
      params: { userId: testUserId },
      user: { id: testOtherUserId, role: 'tourist' }
    });
    await getDeadManStatus(req, res, next);
    const { status, data } = getResult();
    assert(status === 403 && !data.success, '37. Tourist B cannot view Tourist A session via /status/:userId (403 Forbidden)');
  }

  // 2. Tourist B attempting to check-in to Tourist A's session
  {
    const { req, res, next, getResult } = createMockReqRes({
      body: {
        sessionId: activeSessionId,
        userId: testOtherUserId
      },
      user: { id: testOtherUserId, role: 'tourist' }
    });
    await checkInDeadMan(req, res, next);
    const { status, data } = getResult();
    assert(status === 403 && !data.success, '38. Tourist B cannot check in to Tourist A session (403 Forbidden)');
  }

  // 3. Tourist B attempting to pause Tourist A's session
  {
    const { req, res, next, getResult } = createMockReqRes({
      body: {
        sessionId: activeSessionId,
        userId: testOtherUserId
      },
      user: { id: testOtherUserId, role: 'tourist' }
    });
    await pauseDeadManSession(req, res, next);
    const { status, data } = getResult();
    assert(status === 403 && !data.success, '39. Tourist B cannot pause Tourist A session (403 Forbidden)');
  }

  // 4. Production interval enforcement: < 900s without test bypass header
  {
    const oldNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { req, res, next, getResult } = createMockReqRes({
      body: {
        userId: `usr_prod_test_${Date.now()}`,
        userName: 'Prod Test User',
        intervalSeconds: 60 // 1 minute in production without bypass header
      },
      headers: {} // No x-test-suite header
    });
    await startDeadManSession(req, res, next);
    process.env.NODE_ENV = oldNodeEnv;
    const { status, data } = getResult();
    assert(status === 400 && !data.success, '40. Production environment rejects interval < 900s without test bypass header (400 Bad Request)');
  }

  // 5. Interval bypass enforcement: < 900s succeeds when x-test-suite header or dev environment is active
  {
    const { req, res, next, getResult } = createMockReqRes({
      body: {
        userId: `usr_prod_bypass_${Date.now()}`,
        userName: 'Prod Bypass Test',
        intervalSeconds: 60
      },
      headers: { 'x-test-suite': 'true' }
    });
    await startDeadManSession(req, res, next);
    const { status, data } = getResult();
    assert(status === 201 && data.success, '41. Test suite allows < 900s interval when x-test-suite: true header is present');
  }

  // 6. Database atomic claiming: Second check does NOT claim or duplicate escalation
  {
    const initialAlerts = await readJson('alerts');
    const countBefore = initialAlerts.filter(a => a.id === escalatedSession.escalationIncidentId).length;

    // Run escalation check second time
    await checkExpiredDeadManSessions();

    const alertsAfter = await readJson('alerts');
    const countAfter = alertsAfter.filter(a => a.id === escalatedSession.escalationIncidentId).length;
    assert(countBefore === 1 && countAfter === 1, '42. Atomic claiming prevents duplicate escalation: session is escalated exactly once');
  }

  console.log('\n===============================================================');
  console.log(`Phase 7 Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
