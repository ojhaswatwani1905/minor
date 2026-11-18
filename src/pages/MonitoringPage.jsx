import React, { useState, useEffect } from 'react';
import { monitoringService } from '../services/monitoringService';
import { MonitoringFilterBar } from '../components/Monitoring/MonitoringFilterBar';
import { LiveMap } from '../components/Monitoring/LiveMap';
import { TouristTelemetryPanel } from '../components/Monitoring/TouristTelemetryPanel';
import { MeshNodeStatusPanel } from '../components/Satellite/MeshNodeStatusPanel';
import { GeofenceBroadcastModal } from '../components/Broadcast/GeofenceBroadcastModal';
import { Loader } from '../components/Common/Loader';
import { Radio, Volume2 } from 'lucide-react';
import { toast } from 'react-toastify';

export const MonitoringPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTouristId, setSelectedTouristId] = useState(null);
  const [selectedTouristData, setSelectedTouristData] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const fetchLiveData = async (isBackground = false) => {
    try {
      const res = await monitoringService.getLiveLocations();
      if (res.success && Array.isArray(res.locations)) {
        setLocations(res.locations);
      }
    } catch (err) {
      console.error('Failed to fetch live locations:', err);
      if (!isBackground) toast.error('Satellite feed sync error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTouristTelemetry = async (id) => {
    if (!id) {
      setSelectedTouristData(null);
      setMovementHistory([]);
      return;
    }
    try {
      const tour = locations.find(l => l.id === id);
      if (tour) setSelectedTouristData(tour);

      const res = await monitoringService.getMovementHistory(id);
      if (res.success) {
        setMovementHistory(res.movementHistory);
      }
    } catch (err) {
      console.error('Failed to fetch movement history:', err);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Handle tourist selection
  useEffect(() => {
    if (selectedTouristId) {
      fetchTouristTelemetry(selectedTouristId);
    } else {
      setSelectedTouristData(null);
    }
  }, [selectedTouristId, locations]);

  // Auto Refresh Interval (3 seconds)
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLiveData(true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);


  // Filter locations by status
  const filteredLocations = locations.filter((loc) => {
    if (statusFilter === 'All') return true;
    return loc.status.toLowerCase() === statusFilter.toLowerCase();
  });

  if (loading) {
    return <Loader message="Connecting to Satellite GPS Constellation..." />;
  }

  return (
    <div className="space-y-6 pb-12 min-h-[calc(100vh-100px)] flex flex-col">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#192E2A] flex items-center gap-2.5 font-sans">
            Satellite Live GPS Command
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Real-time tourist telemetry, biometric health sensors, heading compass, & hazard zone overlays
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBroadcastOpen(true)}
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Transmit Geofenced Broadcast</span>
          </button>

          <span className="px-3.5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            Live Mesh Active
          </span>
        </div>
      </div>

      {/* Satellite Mesh Node Constellation Panel */}
      <div className="flex-shrink-0">
        <MeshNodeStatusPanel />
      </div>


      {/* Filter & Control Bar */}
      <div className="flex-shrink-0">
        <MonitoringFilterBar
          locations={filteredLocations}
          selectedTouristId={selectedTouristId}
          onSelectTourist={(id) => setSelectedTouristId(id)}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          onRefresh={fetchLiveData}
        />
      </div>

      {/* Main Map & Side Telemetry Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">
        {/* Full Screen Satellite Map */}
        <div className="flex-1 min-h-[450px]">
          <LiveMap
            locations={filteredLocations}
            selectedTouristId={selectedTouristId}
            onSelectTourist={(id) => setSelectedTouristId(id)}
          />
        </div>

        {/* Selected Tourist Telemetry Panel Drawer */}
        {selectedTouristData && (
          <div className="flex-shrink-0">
            <TouristTelemetryPanel
              tourist={selectedTouristData}
              movementHistory={movementHistory}
              onClose={() => setSelectedTouristId(null)}
            />
          </div>
        )}
      </div>

      {/* Geofence Broadcast Modal */}
      <GeofenceBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />
    </div>
  );
};
