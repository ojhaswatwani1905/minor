import { apiFetch } from '../utils/api';

export const hazardService = {
  getOverview: async () => {
    return await apiFetch('/hazards/overview');
  },
  dispatchDrone: async (droneId, targetId, coordinates) => {
    return await apiFetch('/hazards/dispatch-drone', {
      method: 'POST',
      body: JSON.stringify({ droneId, targetId, coordinates })
    });
  },
  sendBroadcast: async (broadcastData) => {
    return await apiFetch('/hazards/broadcast', {
      method: 'POST',
      body: JSON.stringify(broadcastData)
    });
  }
};
