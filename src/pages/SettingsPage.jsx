import React, { useState, useEffect } from 'react';
import { settingService } from '../services/settingService';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings, 
  Shield, 
  Bell, 
  Moon, 
  Sun, 
  Database, 
  Download, 
  Save, 
  Volume2, 
  Lock, 
  Radio
} from 'lucide-react';
import { Loader } from '../components/Common/Loader';
import { toast } from 'react-toastify';

export const SettingsPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await settingService.getSettings();
        if (res.success) {
          setSettings(res.settings);
        }
      } catch (err) {
        toast.error('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await settingService.updateSettings(settings);
      if (res.success) {
        toast.success(res.message);
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = settingService.downloadBackupUrl;
    toast.success('Database backup JSON download started!');
  };

  if (loading) {
    return <Loader message="Fetching Command Settings..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            System & Security Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure emergency siren sounds, notification channels, theme parameters, & JSON database backup
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Preferences...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Card 1: Notification & Siren Preferences */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Emergency Alerts & Siren Sounds
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div>
                <p className="font-bold text-white">Emergency Siren Audio Bleep</p>
                <p className="text-[11px] text-slate-400">Play high-priority sound alarm on live SOS trigger</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.emergencySoundAlerts ?? true}
                onChange={() => handleToggle('emergencySoundAlerts')}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div>
                <p className="font-bold text-white">Automated Guardian SMS Gateway</p>
                <p className="text-[11px] text-slate-400">Automatically dispatch SMS to guardians on SOS alerts</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.smsGatewayEnabled ?? true}
                onChange={() => handleToggle('smsGatewayEnabled')}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div>
                <p className="font-bold text-white">Admin Email Alerts</p>
                <p className="text-[11px] text-slate-400">Send email notifications to administrators on geofence breaches</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.emailAlertsEnabled ?? true}
                onChange={() => handleToggle('emailAlertsEnabled')}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Security & Session Parameters */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-cyan-400" />
            Security & Authentication Control
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div>
                <p className="font-bold text-white">2-Factor Admin Authentication</p>
                <p className="text-[11px] text-slate-400">Require OTP verification on new admin logins</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.twoFactorAuthEnabled ?? true}
                onChange={() => handleToggle('twoFactorAuthEnabled')}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Session Timeout Duration</p>
                <p className="text-[11px] text-slate-400">Auto logout idle admin sessions after inactivity</p>
              </div>
              <select
                value={settings?.sessionTimeoutMinutes || 60}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) })}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Appearance Theme</p>
                <p className="text-[11px] text-slate-400">Toggle website interface color scheme</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold hover:text-cyan-400 transition-colors"
              >
                {darkMode ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span>{darkMode ? 'Dark Theme' : 'Light Theme'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: JSON Database Backup & Restore */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-cyan-400" />
            JSON Database Backup & System Snapshot
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div>
              <p className="font-bold text-white text-sm">Download Full Database Snapshot</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Exports all tourist profiles (`users.json`), expedition routes (`trips.json`), emergency alerts (`alerts.json`), and admin logs into a timestamped backup JSON file.
              </p>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
