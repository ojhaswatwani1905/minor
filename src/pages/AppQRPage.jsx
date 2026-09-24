import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, Wifi, Copy, Check, ExternalLink, RefreshCw, Info } from 'lucide-react';
import { toast } from 'react-toastify';

export const AppQRPage = () => {
  const [ipAddress, setIpAddress] = useState('10.170.3.216');
  const [port, setPort] = useState('8081');
  const [copied, setCopied] = useState(false);

  const expoUrl = `exp://${ipAddress.trim()}:${port.trim()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(expoUrl);
    setCopied(true);
    toast.success('Expo URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <QrCode className="w-7 h-7 text-[#007AFF]" />
          Expo Go Mobile App Connection
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scan the QR code with the Expo Go app on your iOS or Android mobile device to launch the STSMS Tourist App live.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Display Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-6 text-center">
          <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700">
            <QRCodeSVG 
              value={expoUrl} 
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold truncate">
                {expoUrl}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
                title="Copy Expo URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Ensure mobile device is connected to the same Wi-Fi network.
            </p>
          </div>
        </div>

        {/* Configuration & Instructions Card */}
        <div className="space-y-6">
          {/* IP / Port Settings */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Wifi className="w-4 h-4 text-[#007AFF]" />
              Host & Network Configuration
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
          </div>

          {/* Quick How-To Instructions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              How to Open in Expo Go
            </h2>

            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
              <li>
                Download <strong>Expo Go</strong> from the <span className="text-[#007AFF] font-semibold">App Store (iOS)</span> or <span className="text-emerald-500 font-semibold">Google Play Store (Android)</span>.
              </li>
              <li>
                Connect your phone to the <strong>same Wi-Fi network</strong> as this computer.
              </li>
              <li>
                <strong>Android:</strong> Open Expo Go app & tap <em>Scan QR code</em>.
              </li>
              <li>
                <strong>iOS:</strong> Open the default <em>Camera app</em> and point at the QR code, or paste the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">{expoUrl}</code> link into Expo Go.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
