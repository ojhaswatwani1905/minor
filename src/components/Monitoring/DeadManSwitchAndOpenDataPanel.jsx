import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, MapPin, ThumbsUp, Award, Database, RefreshCw, AlertTriangle, Eye, ShieldX, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const DeadManSwitchAndOpenDataPanel = () => {
  const [openData, setOpenData] = useState(null);
  const [hazardsOverview, setHazardsOverview] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [openDataRes, hazardsRes, tripsRes] = await Promise.all([
        apiFetch('/hazards/open-data').catch(() => null),
        apiFetch('/hazards/overview').catch(() => null),
        apiFetch('/trips').catch(() => null)
      ]);

      if (openDataRes?.success) setOpenData(openDataRes);
      if (hazardsRes?.success) setHazardsOverview(hazardsRes);
      if (tripsRes?.success) setTrips(tripsRes.trips || []);
    } catch (e) {
      console.error('Failed to load Dead Man & Open Data panel:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOpenData = async () => {
    try {
      setSyncing(true);
      setSyncMsg('Syncing 3-tier open data pipelines...');
      const res = await apiFetch('/hazards/sync-open-data', { method: 'POST' });
      if (res?.success) {
        setSyncMsg('Synced OSM, NDMA & Review filters!');
        await loadData();
      } else {
        setSyncMsg(res?.message || 'Sync failed');
      }
    } catch (err) {
      setSyncMsg('Sync error: ' + err.message);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 4000);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const osmNodes = openData?.osmHazardNodes || hazardsOverview?.osmHazardNodes || [];
  const disasterLayers = openData?.disasterLayers || hazardsOverview?.disasterLayers || [];
  const reviewHazards = openData?.reviewPreseededHazards || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 my-6">
      {/* 1. Cloud Dead Man's Switch */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                <Clock className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Cloud Dead Man's Switch</h3>
                <p className="text-[10px] text-slate-400">PostgreSQL pg_cron Auto Dispatcher</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              Worker 15s Active
            </span>
          </div>

          <div className="space-y-3">
            {trips.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No active expedition timers monitored.</p>
            ) : (
              trips.slice(0, 3).map(trip => (
                <div key={trip.id} className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{trip.userName}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        trip.status === 'EXPIRED_UNCHECKED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}>
                        {trip.status === 'EXPIRED_UNCHECKED' ? '🚨 AUTO DISPATCHED' : trip.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Route: <span className="text-slate-200">{trip.route}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Check-in Deadline: <span className="text-sky-300 font-mono">{trip.expectedArrivalDeadline ? new Date(trip.expectedArrivalDeadline).toLocaleTimeString() : trip.expectedArrival}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Emergency Contact</span>
                    <span className="text-[11px] font-mono text-slate-300 font-bold">{trip.guardianPhone || '+91 98765 43210'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Zero-Cellular SMS Direct Target Active</span>
          <button onClick={loadData} className="text-sky-400 font-bold hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Sync Timers
          </button>
        </div>
      </div>

      {/* 2. Open Data & Hazard Ingestion Engine (OSM + Govt NDMA + Review Filter) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Open Data Ingestion</h3>
                <p className="text-[10px] text-slate-400">OSM Overpass + NDMA Layers + Review Filters</p>
              </div>
            </div>
            <button 
              onClick={handleSyncOpenData}
              disabled={syncing}
              className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Re-Sync Open Data'}
            </button>
          </div>

          {syncMsg && (
            <div className="mb-2 p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-[10px] text-purple-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> {syncMsg}
            </div>
          )}

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {/* Stream 1: OSM Infrastructure & Hazard Tags */}
            <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-2.5">
              <h4 className="text-[11px] font-extrabold text-purple-300 flex items-center justify-between mb-1 uppercase">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  1. OSM Overpass API Nodes ({osmNodes.length})
                </span>
                <span className="text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 font-mono">tourism=*</span>
              </h4>
              <div className="space-y-1">
                {osmNodes.map(node => (
                  <div key={node.id} className="text-[10px] text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>• {node.name}</span>
                      <span className="text-amber-400 text-[9px]">{node.riskLevel}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                      Issues: {node.detectedIssues?.slice(0, 2).join(' | ') || 'smoothness=bad, lit=no'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stream 2: Government Disaster Datasets (Data.gov.in / NDMA) */}
            <div className="bg-slate-950/60 border border-red-500/30 rounded-xl p-2.5">
              <h4 className="text-[11px] font-extrabold text-red-400 flex items-center justify-between mb-1 uppercase">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  2. NDMA / Data.gov.in GIS Layers ({disasterLayers.length})
                </span>
                <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 font-mono">Spatial GIS</span>
              </h4>
              <div className="space-y-1">
                {disasterLayers.map(layer => (
                  <div key={layer.id} className="text-[10px] text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                    <div className="flex items-center justify-between font-bold text-red-300">
                      <span>• {layer.name}</span>
                      <span className="text-red-400 text-[9px] font-extrabold">{layer.riskType}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5 truncate">{layer.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex justify-between">
          <span>Smoothness, Lit, Access & Disaster Layers</span>
          <span className="text-purple-400 font-bold">100% Pre-Seeded</span>
        </div>
      </div>

      {/* 3. Stream 3: Crowdsourced Review Negative Filters & Community Trust */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Review Negative Filter</h3>
                <p className="text-[10px] text-slate-400">TripAdvisor & Google Places Safety Scraper</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              Negative Keyword Seeder
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {reviewHazards.map(item => (
              <div key={item.id} className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.placeName}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {item.source}
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-200 line-clamp-2 italic">
                  "{item.review_body}"
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.matchedKeywords?.map((kw, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                      ⚠️ {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex justify-between">
          <span>Keywords: unsafe, scam, no lights, dogs...</span>
          <span className="text-amber-400 font-bold">Auto Risk Tagged</span>
        </div>
      </div>
    </div>
  );
};

