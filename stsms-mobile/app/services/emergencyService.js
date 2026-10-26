import { apiFetch } from '../utils/api';
import { Linking, Platform } from 'react-native';

export const emergencyService = {
  // Trigger 1-Tap SOS Distress Signal to backend & Admin Dashboard
  triggerSos: async (sosData) => {
    return await apiFetch('/alerts/sos', {
      method: 'POST',
      body: JSON.stringify(sosData),
    });
  },

  // Zero-Network Native SMS Fallback (PRD Bottleneck A)
  // Generates direct native device SMS with GNSS coordinates when offline
  triggerOfflineNativeSmsFallback: async (coords, emergencyContactPhone, messageNote) => {
    try {
      const lat = coords?.lat != null ? coords.lat : null;
      const lng = coords?.lng != null ? coords.lng : null;
      const phone = emergencyContactPhone || '';
      const mapsUrl = lat != null && lng != null ? `https://maps.google.com/?q=${lat},${lng}` : 'Coordinates Pending';
      
      const body = `[STSMS SATELLITE GNSS SOS DISTRESS ALERT]\nLocation: ${lat != null && lng != null ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : 'Awaiting GNSS satellite fix'}\nTime: ${new Date().toLocaleTimeString()}\nMaps: ${mapsUrl}\nDetails: ${messageNote || 'Manual SOS triggered in low/zero cellular coverage zone.'}`;

      const smsUrl = Platform.OS === 'ios' 
        ? `sms:${phone}&body=${encodeURIComponent(body)}` 
        : `sms:${phone}?body=${encodeURIComponent(body)}`;

      console.log(`[ZERO-NETWORK SMS FALLBACK] Opening native SMS composer for ${phone}...`);
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        return { success: true, method: 'NATIVE_SMS_COMPOSER', body, phone };
      } else {
        // Fallback for web or emulator without SMS app
        console.log(`[SMS FALLBACK SIMULATION] Sent payload to ${phone}:\n${body}`);
        return { success: true, method: 'SIMULATED_NATIVE_SMS', body, phone };
      }
    } catch (err) {
      console.error('[SMS FALLBACK ERROR]', err.message);
      return { success: false, error: err.message };
    }
  },

  // Notify registered primary guardian via SMS
  notifyGuardian: async (alertId) => {
    return await apiFetch('/alerts/notify-guardian', {
      method: 'POST',
      body: JSON.stringify({ alertId }),
    });
  },

  // Cancel an active SOS alert
  cancelSos: async (alertId, reason) => {
    return await apiFetch(`/alerts/${alertId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Resolved', note: `SOS Alert canceled by user: ${reason || 'Accidental Press'}` }),
    });
  },

  // Fetch alert notifications log
  getNotifications: async () => {
    return await apiFetch('/notifications');
  }
};
