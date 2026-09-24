import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Radio, Volume2, ShieldAlert, Send, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { hazardService } from '../../services/hazardService';

export const GeofenceBroadcastModal = ({ isOpen, onClose }) => {
  const [sector, setSector] = useState('Rohtang Pass Avalanche Sector-B');
  const [alertLevel, setAlertLevel] = useState('CRITICAL');
  const [message, setMessage] = useState('EMERGENCY ALERT: Severe avalanche threat detected in Rohtang High Altitude Sector. Seek immediate shelter or return to Base Camp Alpha.');
  const [channel, setChannel] = useState('Satellite Audio + Push Notification + Emergency SMS');
  const [sending, setSending] = useState(false);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      const res = await hazardService.sendBroadcast({
        sectorName: sector,
        alertLevel,
        messageText: message,
        channel
      });
      if (res.success) {
        toast.success(`📡 Broadcast Sent! ${res.recipientsNotified} tourists notified across ${res.sectorName}`);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to transmit geofenced broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📡 Geofenced Satellite Broadcast Alert System"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Target Sector / Polygon</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Rohtang Pass Avalanche Sector-B">Rohtang Pass Avalanche Sector-B (32.37°N, 77.25°E)</option>
              <option value="Valley of Flowers Flash Flood Corridor">Valley of Flowers Flash Flood Corridor (30.73°N, 79.61°E)</option>
              <option value="Kedarkantha High Ridge Treks">Kedarkantha High Ridge Treks (31.02°N, 78.17°E)</option>
              <option value="ALL Active High Altitude Sectors">ALL Active High Altitude Sectors (Global Mesh)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Alert Severity</label>
          <div className="grid grid-cols-3 gap-2">
            {['ADVISORY', 'HIGH', 'CRITICAL'].map((lvl) => (
              <button
                type="button"
                key={lvl}
                onClick={() => setAlertLevel(lvl)}
                className={`py-1.5 rounded-xl font-bold border transition-all ${
                  alertLevel === lvl
                    ? lvl === 'CRITICAL' ? 'bg-red-600 text-white border-red-500' : lvl === 'HIGH' ? 'bg-amber-600 text-white border-amber-500' : 'bg-cyan-600 text-white border-cyan-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Broadcast Alert Message</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-sans"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Transmission Medium</label>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 text-cyan-400 font-bold">
            <Radio className="w-5 h-5 animate-pulse" />
            <span>{channel}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold flex items-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Transmitting...' : 'Transmit Broadcast'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
