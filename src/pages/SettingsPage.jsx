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
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#192E2A] flex items-center gap-2 font-sans">
            System & Security Settings
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Configure emergency siren sounds, notification channels, theme parameters, & JSON database backup
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-pine hover:bg-pine-600 text-white font-extrabold text-xs shadow-md shadow-pine/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4 text-honey" />
          <span>{saving ? 'Saving Preferences...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Card 1: Notification & Siren Preferences */}
        <div className="glass-card p-6 md:p-7 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-[#192E2A] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
            <Volume2 className="w-4 h-4 text-honey" />
            Emergency Alerts & Siren Sounds
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
              <div>
                <p className="font-extrabold text-[#192E2A] font-sans">Emergency Siren Audio Bleep</p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Play high-priority sound alarm on live SOS trigger</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.emergencySoundAlerts ?? true}
                onChange={() => handleToggle('emergencySoundAlerts')}
                className="w-5 h-5 rounded-md accent-[#E5A93C] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
              <div>
                <p className="font-extrabold text-[#192E2A] font-sans">Automated Guardian SMS Gateway</p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Automatically dispatch SMS to guardians on SOS alerts</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.smsGatewayEnabled ?? true}
                onChange={() => handleToggle('smsGatewayEnabled')}
                className="w-5 h-5 rounded-md accent-[#E5A93C] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
              <div>
                <p className="font-extrabold text-[#192E2A] font-sans">Admin Email Alerts</p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Send email notifications to administrators on geofence breaches</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.emailAlertsEnabled ?? true}
                onChange={() => handleToggle('emailAlertsEnabled')}
                className="w-5 h-5 rounded-md accent-[#E5A93C] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Security & Session Parameters */}
        <div className="glass-card p-6 md:p-7 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-[#192E2A] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
            <Lock className="w-4 h-4 text-pine" />
            Security & Authentication Control
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
              <div>
                <p className="font-extrabold text-[#192E2A] font-sans">2-Factor Admin Authentication</p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Require OTP verification on new admin logins</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.twoFactorAuthEnabled ?? true}
                onChange={() => handleToggle('twoFactorAuthEnabled')}
                className="w-5 h-5 rounded-md accent-[#E5A93C] cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <p className="font-extrabold text-[#192E2A] font-sans">Session Timeout Duration</p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Auto logout idle admin sessions after inactivity</p>
              </div>
              <select
                value={settings?.sessionTimeoutMinutes || 60}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) })}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[#192E2A] font-bold shadow-2xs cursor-pointer focus:outline-none focus:border-pine"
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <p className="font-extrabold text-[#192E2A] font-sans">Appearance Theme</p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Toggle interface color mode</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[#192E2A] font-extrabold hover:text-honey shadow-2xs transition-colors cursor-pointer"
              >
                {darkMode ? <Moon className="w-4 h-4 text-honey" /> : <Sun className="w-4 h-4 text-[#E5A93C]" />}
                <span>{darkMode ? 'Dark Theme' : 'Light Theme'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: JSON Database Backup & Restore */}
        <div className="lg:col-span-2 glass-card p-6 md:p-7 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-[#192E2A] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
            <Database className="w-4 h-4 text-pine" />
            JSON Database Backup & System Snapshot
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <div>
              <p className="font-extrabold text-[#192E2A] text-sm font-sans">Download Full Database Snapshot</p>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Exports all tourist profiles (`users.json`), expedition routes (`trips.json`), emergency alerts (`alerts.json`), and admin logs into a timestamped backup JSON file.
              </p>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="px-5 py-2.5 rounded-2xl bg-pine hover:bg-pine-600 text-white font-extrabold text-xs shadow-md flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-honey" />
              <span>Download Backup JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
