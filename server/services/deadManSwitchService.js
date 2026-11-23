import { readJson, writeJson } from '../utils/jsonDb.js';
import { checkExpiredDeadManSessions } from './breachEscalationWorker.js';

let intervalId = null;

export const checkDeadManSwitch = async () => {
  try {
    // Check authoritative Dead Man's Switch sessions
    await checkExpiredDeadManSessions();
  } catch (err) {
    console.error('[DEAD MAN SWITCH ERROR]', err.message);
  }
};

export const startDeadManSwitchWorker = () => {
  if (intervalId) return;
  console.log('[DEAD MAN SWITCH] Cloud Automated Dispatcher Worker started');
  // Initial check
  checkDeadManSwitch();
  // Loop every 5 seconds
  intervalId = setInterval(checkDeadManSwitch, 5000);
};

export const stopDeadManSwitchWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
