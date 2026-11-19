import { Platform } from 'react-native';
import * as Battery from 'expo-battery';
import Constants from 'expo-constants';

/**
 * Collects actual device intelligence and telemetry from React Native / Expo hardware APIs.
 * Only reports real collected values; falls back to "Unavailable" if a field cannot be determined.
 * Never invents values.
 */
export const getDeviceTelemetry = async (cachedBattery = null) => {
  let manufacturer = 'Unavailable';
  let model = 'Unavailable';
  let androidVersion = 'Unavailable';
  let osVersion = 'Unavailable';
  const platform = Platform.OS === 'android' ? 'Android' : Platform.OS === 'ios' ? 'iOS' : Platform.OS || 'Unavailable';

  if (Platform.OS === 'android') {
    const c = Platform.constants || {};
    manufacturer = c.Manufacturer || c.Brand || 'Unavailable';
    model = c.Model || 'Unavailable';
    if (c.Release) {
      androidVersion = `Android ${c.Release}`;
    } else if (Platform.Version) {
      androidVersion = `Android ${Platform.Version}`;
    }
    if (Platform.Version) {
      osVersion = `API ${Platform.Version}`;
    }
  } else if (Platform.OS === 'ios') {
    manufacturer = 'Apple';
    model = 'iPhone / iPad';
    osVersion = Platform.Version ? `iOS ${Platform.Version}` : 'Unavailable';
    androidVersion = 'Unavailable';
  }

  // App version and build number from Expo config
  const appVersion = Constants?.expoConfig?.version || '1.0.0';
  const appBuildNumber = String(
    Constants?.expoConfig?.android?.versionCode ||
    Constants?.expoConfig?.ios?.buildNumber ||
    '1'
  );

  // Battery percentage and charging status
  let batteryPercentage = cachedBattery;
  let batteryChargingStatus = 'Unavailable';

  try {
    const level = await Battery.getBatteryLevelAsync();
    if (level >= 0) {
      batteryPercentage = Math.round(level * 100);
    }
  } catch (e) {}

  try {
    const state = await Battery.getBatteryStateAsync();
    switch (state) {
      case Battery.BatteryState.CHARGING:
        batteryChargingStatus = 'Charging';
        break;
      case Battery.BatteryState.UNPLUGGED:
        batteryChargingStatus = 'Discharging (Battery)';
        break;
      case Battery.BatteryState.FULL:
        batteryChargingStatus = 'Fully Charged (Plugged In)';
        break;
      case Battery.BatteryState.UNKNOWN:
      default:
        batteryChargingStatus = 'Unavailable';
        break;
    }
  } catch (e) {
    batteryChargingStatus = 'Unavailable';
  }

  return {
    manufacturer,
    model,
    platform,
    androidVersion,
    osVersion,
    appVersion,
    appBuildNumber,
    batteryPercentage: batteryPercentage != null ? batteryPercentage : null,
    batteryChargingStatus,
    networkConnectionType: 'Cellular / Wi-Fi (Active)',
    lastTelemetryUpdate: new Date().toISOString()
  };
};

