import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, Wifi, Copy, Check, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetch } from '../utils/api';

export const AppQRPage = () => {
  const [ipAddress, setIpAddress] = useState(window.location.hostname || '127.0.0.1');
  const [port, setPort] = useState('8081');
  const [copiedExpo, setCopiedExpo] = useState(false);
  const [copiedHttp, setCopiedHttp] = useState(false);
  const [activeTab, setActiveTab] = useState('exp'); // 'exp' | 'http'

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await apiFetch('/network-ip');
        if (res.success && res.ip) {
          setIpAddress(res.ip);
        }
      } catch (e) {
        if (window.location.hostname && window.location.hostname !== 'localhost') {
          setIpAddress(window.location.hostname);
        }
      }
    };
    fetchIp();
  }, []);

  const expoUrl = `exp://${ipAddress.trim()}:${port.trim()}`;
  const httpUrl = `http://${ipAddress.trim()}:${port.trim()}`;
  const currentQrValue = activeTab === 'exp' ? expoUrl : httpUrl;

  const handleCopyExpo = () => {
    navigator.clipboard.writeText(expoUrl);
    setCopiedExpo(true);
    toast.success('Expo Go URL copied (exp://)!');
    setTimeout(() => setCopiedExpo(false), 2000);
  };

  const handleCopyHttp = () => {
    navigator.clipboard.writeText(httpUrl);
    setCopiedHttp(true);
    toast.success('HTTP URL copied!');
    setTimeout(() => setCopiedHttp(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <QrCode className="w-7 h-7 text-[#007AFF]" />
              Expo Go Mobile App Pairing
            </h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Expo SDK 58 Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scan with the Expo Go app on your physical iOS or Android phone to launch the STSMS Tourist Safety client with live GPS hardware integration.
          </p>
        </div>

        <a
          href={httpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Web Preview</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Display Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-6 text-center">
          {/* Format Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xs text-xs font-semibold">
            <button
              onClick={() => setActiveTab('exp')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeTab === 'exp'
                  ? 'bg-white dark:bg-slate-900 text-[#007AFF] shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              exp:// Scheme
            </button>
            <button
              onClick={() => setActiveTab('http')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeTab === 'http'
                  ? 'bg-white dark:bg-slate-900 text-[#007AFF] shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              http:// Scheme
            </button>
          </div>

          {/* High Contrast Scan-Optimized QR Code */}
          <div className="p-4 bg-white rounded-3xl shadow-lg border-2 border-slate-200 dark:border-slate-700">
            <QRCodeSVG 
              value={currentQrValue} 
              size={240}
              level="M"
              includeMargin={true}
            />
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold truncate">
                {currentQrValue}
              </span>
              <button
                onClick={activeTab === 'exp' ? handleCopyExpo : handleCopyHttp}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors flex-shrink-0 ml-2"
                title="Copy URL"
              >
                {(activeTab === 'exp' ? copiedExpo : copiedHttp) ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Compatible with <strong>Expo Go SDK 58</strong> on iOS & Android. Ensure phone is on the same Wi-Fi.
            </p>
          </div>
        </div>

        {/* Configuration & Instructions Card */}
        <div className="space-y-6">
          {/* Host & Network Configuration */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Wifi className="w-4 h-4 text-[#007AFF]" />
              Host & Port Configuration
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Local IP Address
                </label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g. 192.168.1.5"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Metro Port
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="8081"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#007AFF]"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Auto-detected LAN interface from backend server.</span>
            </div>
          </div>

          {/* Quick How-To Instructions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              How to Launch in Expo Go (SDK 58)
            </h2>

            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
              <li>
                Ensure your phone is connected to the <strong>same Wi-Fi network</strong> as this laptop.
              </li>
              <li>
                <strong>Android:</strong> Open <strong>Expo Go</strong> & tap <em>"Scan QR code"</em>. Point your camera at the QR code above.
              </li>
              <li>
                <strong>iOS:</strong> Open your iPhone <strong>Camera app</strong> and tap the yellow Expo notification banner, or open Expo Go and paste:
                <code className="block mt-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-[#007AFF]">
                  {expoUrl}
                </code>
              </li>
              <li>
                The app will bundle and open with live GPS tracking, battery reporting, and 1-tap SOS distress triggers!
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
