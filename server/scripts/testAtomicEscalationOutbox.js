import { readJson, writeJson } from '../utils/jsonDb.js';
import {
  dbCreateSession,
  dbGetSessionForUser,
  dbClaimExpiredDeadManSessions,
  dbConfirmDeadManEscalation
} from '../database/deadManDb.js';
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

async function runOutboxTests() {
  console.log('\n====================================================================');
  console.log('STSMS Phase 7.2: Atomic Escalation & Durable Outbox Verification');
  console.log('====================================================================\n');

  const now = Date.now();
  const testUserId = `usr_outbox_${now}`;

  // -------------------------------------------------------------
  // Test Group 1: Two Concurrent Workers Claiming Same Overdue Session
  // -------------------------------------------------------------
  console.log('--- Test Group 1: Race Condition & Concurrent Worker Lock ---');
  {
    const overdueSessionId = `dms_race_${now}`;
    const sessions = await readJson('deadman_sessions');
    sessions.unshift({
      id: overdueSessionId,
      userId: testUserId,
      userName: 'Concurrent Race Test',
      userPhone: '+91 99999 88888',
      intervalSeconds: 15,
      status: 'ACTIVE',
      startedAt: new Date(now - 30000).toISOString(),
      lastCheckInAt: new Date(now - 30000).toISOString(),
      nextDeadlineAt: new Date(now - 5000).toISOString(),
      pausedAt: null,
      pausedRemainingMs: null,
      escalationProcessed: false,
      escalationIncidentId: null,
      createdAt: new Date(now - 30000).toISOString(),
      updatedAt: new Date(now - 30000).toISOString()
    });
    await writeJson('deadman_sessions', sessions);

    // Simulate two concurrent worker instances attempting to claim at the exact same millisecond
    const claimTime = new Date().toISOString();
    const [workerAClaims, workerBClaims] = await Promise.all([
      dbClaimExpiredDeadManSessions(claimTime),
      dbClaimExpiredDeadManSessions(claimTime)
    ]);

    const claimedByA = (workerAClaims || []).filter(s => s.id === overdueSessionId);
    const claimedByB = (workerBClaims || []).filter(s => s.id === overdueSessionId);
    const totalClaimCount = claimedByA.length + claimedByB.length;

    assert(totalClaimCount === 1, '1. Race Condition Shield: Overdue session claimed by EXACTLY ONE worker instance');
    assert((claimedByA.length === 1 && claimedByB.length === 0) || (claimedByA.length === 0 && claimedByB.length === 1),
      '2. Mutual Exclusion: Second worker receives 0 claims for this session');

    // Verify session state moved to ESCALATING (Outbox Stage 1)
    const claimedSession = claimedByA[0] || claimedByB[0];
    assert(claimedSession.status === 'ESCALATING', '3. Session status atomically transitioned to ESCALATING outbox state');
    assert(claimedSession.escalationProcessed === false, '4. escalationProcessed remains false until alert is durably confirmed');
  }

  // -------------------------------------------------------------
  // Test Group 2: Incident Creation Failure & Outbox Recovery
  // -------------------------------------------------------------
  console.log('\n--- Test Group 2: Dispatch Failure & Outbox Recovery ---');
  {
    const failureSessionId = `dms_fail_retry_${now}`;
    const sessions = await readJson('deadman_sessions');
    // Stalled session claimed 20 seconds ago where alert creation crashed/failed
    sessions.unshift({
      id: failureSessionId,
      userId: `usr_fail_${now}`,
      userName: 'Stalled Dispatch Explorer',
      userPhone: '+91 99999 77777',
      intervalSeconds: 15,
      status: 'ESCALATING',
      startedAt: new Date(now - 40000).toISOString(),
      lastCheckInAt: new Date(now - 40000).toISOString(),
      nextDeadlineAt: new Date(now - 25000).toISOString(),
      pausedAt: null,
      pausedRemainingMs: null,
      escalationProcessed: false, // NOT yet confirmed!
      escalationIncidentId: null,
      escalatedAt: new Date(now - 20000).toISOString(), // 20s ago (> 15s retry window)
      createdAt: new Date(now - 40000).toISOString(),
      updatedAt: new Date(now - 20000).toISOString()
    });
    await writeJson('deadman_sessions', sessions);

    // Worker pass must detect stalled unconfirmed ESCALATING session and retry it
    const recoveryClaims = await dbClaimExpiredDeadManSessions(new Date().toISOString());
    const recovered = (recoveryClaims || []).find(s => s.id === failureSessionId);

    assert(recovered != null, '5. Outbox Retry: Stalled unconfirmed session recovered after previous dispatch failure');
    assert(recovered.status === 'ESCALATING', '6. Recovered session re-reserved for alert creation');

    // Simulate successful alert dispatch & confirm escalation (Outbox Stage 2)
    const alertId = `alt_dms_recovered_${now}`;
    const confirmed = await dbConfirmDeadManEscalation(failureSessionId, alertId, new Date().toISOString());

    assert(confirmed != null, '7. dbConfirmDeadManEscalation permanently confirms session');
    assert(confirmed.status === 'ESCALATED', '8. Confirmed session status finalized to ESCALATED');
    assert(confirmed.escalationProcessed === true, '9. escalationProcessed set to true');
    assert(confirmed.escalationIncidentId === alertId, '10. Incident ID attached to confirmed session');
  }

  // -------------------------------------------------------------
  // Test Group 3: Backend Restart During Overdue Session
  // -------------------------------------------------------------
  console.log('\n--- Test Group 3: Backend Restart Recovery ---');
  {
    const restartSessionId = `dms_restart_${now}`;
    const sessions = await readJson('deadman_sessions');
    sessions.unshift({
      id: restartSessionId,
      userId: `usr_restart_${now}`,
      userName: 'Restart Test Explorer',
      userPhone: '+91 99999 66666',
      intervalSeconds: 15,
      status: 'ACTIVE',
      startedAt: new Date(now - 30000).toISOString(),
      lastCheckInAt: new Date(now - 30000).toISOString(),
      nextDeadlineAt: new Date(now - 10000).toISOString(), // Overdue by 10s
      pausedAt: null,
      pausedRemainingMs: null,
      escalationProcessed: false,
      escalationIncidentId: null,
      createdAt: new Date(now - 30000).toISOString(),
      updatedAt: new Date(now - 30000).toISOString()
    });
    await writeJson('deadman_sessions', sessions);

    // Simulate backend startup escalation check
    await checkExpiredDeadManSessions();

    const afterRestart = await readJson('deadman_sessions');
    const processed = afterRestart.find(s => s.id === restartSessionId);

    assert(processed != null, '11. Overdue session found after backend restart');
    assert(processed.status === 'ESCALATED', '12. Overdue session successfully escalated on restart');
    assert(processed.escalationProcessed === true, '13. Escalation confirmed in database');
    assert(processed.escalationIncidentId != null, '14. Incident ID generated and linked');

    // Check alert was created
    const alerts = await readJson('alerts');
    const createdAlert = alerts.find(a => a.id === processed.escalationIncidentId);
    assert(createdAlert != null, '15. Emergency alert durably recorded in alerts store');
  }

  // -------------------------------------------------------------
  // Test Group 4: Repeated Worker Execution Idempotency
  // -------------------------------------------------------------
  console.log('\n--- Test Group 4: Idempotent Execution & Duplicate Shield ---');
  {
    const initialAlerts = await readJson('alerts');
    const initialCount = initialAlerts.length;

    // Run worker loop 3 consecutive times
    await checkExpiredDeadManSessions();
    await checkExpiredDeadManSessions();
    await checkExpiredDeadManSessions();

    const finalAlerts = await readJson('alerts');
    assert(finalAlerts.length === initialCount, '16. Idempotent Execution: Repeated worker loops create ZERO duplicate alerts');
  }

  // -------------------------------------------------------------
  // Test Group 5: Production Safe Failure (No Silent Fallback)
  // -------------------------------------------------------------
  console.log('\n--- Test Group 5: Production Safe Failure Enforcement ---');
  {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // In production, when database table is unavailable, dbCreateSession MUST fail safely
    const prodSessionData = {
      id: `dms_prod_fail_${now}`,
      userId: `usr_prod_test_${now}`,
      userName: 'Production Safety Check',
      intervalSeconds: 900,
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      lastCheckInAt: new Date().toISOString(),
      nextDeadlineAt: new Date(now + 900000).toISOString()
    };

    const result = await dbCreateSession(prodSessionData);
    process.env.NODE_ENV = oldEnv;

    assert(result.error === 'DATABASE_UNAVAILABLE', '17. Production mode refuses silent JSON fallback when DB table unavailable');
    assert(result.message.includes('public.deadman_sessions'), '18. Clear error logged specifying missing table migration');

    // Verify session was NOT saved to JSON
    const sessions = await readJson('deadman_sessions');
    const leaked = sessions.find(s => s.id === prodSessionData.id);
    assert(leaked == null, '19. No ephemeral session leaked to JSON in production mode');
  }

  console.log('\n====================================================================');
  console.log(`Atomic Escalation & Outbox Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('====================================================================\n');

  if (failedTests > 0) process.exit(1);
}

runOutboxTests().catch(err => {
  console.error('Fatal outbox test error:', err);
  process.exit(1);
});
