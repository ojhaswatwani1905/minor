import { readJson, writeJson } from '../utils/jsonDb.js';

let intervalId = null;

export const checkDeadManSwitch = async () => {
  try {
    const trips = await readJson('trips');
    const alerts = await readJson('alerts');
    const notifications = await readJson('notifications');
    
    let tripsUpdated = false;
    let alertsUpdated = false;
    let notificationsUpdated = false;
    
    const now = new Date();

    for (let trip of trips) {
      if (trip.status === 'Active' && trip.expectedArrivalDeadline) {
        const deadline = new Date(trip.expectedArrivalDeadline);
        
        // If deadline has passed and user has NOT checked in
        if (!isNaN(deadline.getTime()) && now > deadline) {
          console.log(`[DEAD MAN'S SWITCH] Trip ${trip.id} (${trip.userName}) deadline expired! Auto-dispatching emergency alert.`);
          
          // Update trip status
          trip.status = 'EXPIRED_UNCHECKED';
          trip.deadManSwitchTriggered = true;
          trip.triggeredAt = now.toISOString();
          tripsUpdated = true;

          // Check if an alert already exists for this trip
          const existingAlert = alerts.find(a => a.tripId === trip.id && a.type === "Dead Man's Switch Dispatch");
          if (!existingAlert) {
            const newAlert = {
              id: `alt_dms_${Date.now()}`,
              tripId: trip.id,
              userId: trip.userId,
              userName: trip.userName,
              type: "Dead Man's Switch Dispatch",
              severity: 'CRITICAL',
              status: 'Dispatched',
              timestamp: now.toISOString(),
              location: trip.checkpoints?.[0]?.name || 'Remote Highway Stretch (Guna-Raghogarh)',
              coordinates: [24.6467, 77.3117],
              message: `AUTOMATED EMERGENCY DISPATCH: ${trip.userName} missed safe check-in deadline (${new Date(trip.expectedArrivalDeadline).toLocaleTimeString()}). Auto-alert sent to Emergency Contact: ${trip.guardianPhone || '+91 98765 43210'}.`,
              guardianPhone: trip.guardianPhone || '+91 98765 43210',
              guardianEmail: trip.guardianEmail || 'emergency.contact@domain.com',
              smsSent: true,
              emailSent: true
            };
            alerts.unshift(newAlert);
            alertsUpdated = true;
          }

          // Push notification for dashboard
          notifications.unshift({
            id: `notif_${Date.now()}`,
            title: `DEAD MAN SWITCH TRIGGERED: ${trip.userName}`,
            message: `Safe check-in deadline expired for route ${trip.route}. Emergency dispatch activated!`,
            timestamp: now.toISOString(),
            read: false,
            type: 'EMERGENCY'
          });
          notificationsUpdated = true;
        }
      }
    }

    if (tripsUpdated) await writeJson('trips', trips);
    if (alertsUpdated) await writeJson('alerts', alerts);
    if (notificationsUpdated) await writeJson('notifications', notifications);
  } catch (err) {
    console.error('[DEAD MAN SWITCH ERROR]', err.message);
  }
};

export const startDeadManSwitchWorker = () => {
  if (intervalId) return;
  console.log('[DEAD MAN SWITCH] Cloud Automated Dispatcher Worker started (15s interval)');
  // Initial check
  checkDeadManSwitch();
  // Loop every 15 seconds
  intervalId = setInterval(checkDeadManSwitch, 15000);
};

export const stopDeadManSwitchWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
