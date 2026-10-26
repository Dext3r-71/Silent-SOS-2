import React, { useState } from 'react';
import {
  FolderArchive,
  Download,
  Trash2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Radio,
  Clock,
  Camera,
  Play,
  FileText,
  Search,
} from 'lucide-react';
import { IncidentRecord } from '../types/sos';

interface IncidentVaultProps {
  incidents: IncidentRecord[];
  onDeleteIncident: (id: string) => void;
  onClearAll: () => void;
  onTriggerSimulatedTest: () => void;
}

export const IncidentVault: React.FC<IncidentVaultProps> = ({
  incidents,
  onDeleteIncident,
  onClearAll,
  onTriggerSimulatedTest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(
    incidents.length > 0 ? incidents[0] : null
  );

  const filteredIncidents = incidents.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.gestureTriggered.toLowerCase().includes(q) ||
      (item.locationAddress && item.locationAddress.toLowerCase().includes(q))
    );
  });

  const exportIncidentJson = (incident: IncidentRecord) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(incident, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${incident.id}-evidence.json`);
    dlAnchor.click();
  };

  const downloadSnapshot = (incident: IncidentRecord) => {
    if (!incident.snapshotDataUrl) return;
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', incident.snapshotDataUrl);
    dlAnchor.setAttribute('download', `${incident.id}-snapshot.jpg`);
    dlAnchor.click();
  };

  return (
    <div className="space-y-6">
      {/* Vault Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-400 font-mono mb-1">
            <FolderArchive className="h-4 w-4" />
            <span>SECURE LOCAL EVIDENCE LOG</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Incident Vault</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Tamper-resistant local logs of verified hand gesture emergency events, GPS telemetry, and camera captures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {incidents.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-900 bg-slate-900 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={onTriggerSimulatedTest}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Simulate Test SOS</span>
          </button>
        </div>
      </div>

      {incidents.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center max-w-xl mx-auto my-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <FolderArchive className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Emergency Incidents Logged</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            When you trigger the &quot;Signal for Help&quot; gesture in the Live Monitor, the browser will automatically freeze the frame, capture GPS telemetry, and log encrypted incident evidence here.
          </p>
          <button
            onClick={onTriggerSimulatedTest}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Run Test SOS Simulation
          </button>
        </div>
      ) : (
        /* Populated Master-Detail View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Master List Column */}
          <div className="lg:col-span-5 space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incident ID, gesture, location..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Incident Cards List */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-rose-500/80 bg-rose-950/20 shadow-md ring-1 ring-rose-500/30'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-semibold text-rose-400">
                        {inc.id}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          inc.status === 'dispatched'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        {inc.status === 'dispatched' ? 'DISPATCHED' : 'CANCELLED'}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white truncate mb-1">
                      {inc.gestureTriggered}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {inc.dateFormatted}
                      </span>
                      {inc.latitude && (
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="h-3 w-3 text-rose-400" />
                          GPS Fixed
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Incident Detail Column */}
          <div className="lg:col-span-7">
            {selectedIncident ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
                {/* Detail Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono text-slate-500">
                      INCIDENT DOSSIER · {selectedIncident.id}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                      {selectedIncident.gestureTriggered}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                      <span>{selectedIncident.dateFormatted}</span>
                      <span>·</span>
                      <span>Confidence: {Math.round(selectedIncident.confidence * 100)}%</span>
                      <span>·</span>
                      <span className="capitalize">{selectedIncident.audioMode} Mode</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportIncidentJson(selectedIncident)}
                      title="Export JSON Metadata"
                      className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteIncident(selectedIncident.id)}
                      title="Delete Record"
                      className="p-2 rounded-lg border border-slate-800 hover:border-rose-900 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Evidence Media Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Secured Visual Evidence</span>
                    <button
                      onClick={() => downloadSnapshot(selectedIncident)}
                      className="text-rose-400 hover:underline flex items-center gap-1 font-mono normal-case"
                    >
                      <Download className="h-3 w-3" />
                      Save Image
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    {selectedIncident.snapshotDataUrl ? (
                      <img
                        src={selectedIncident.snapshotDataUrl}
                        alt="Emergency visual proof"
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <div className="aspect-video flex items-center justify-center text-slate-600 text-xs font-mono">
                        No snapshot frame captured
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Clip Playback (if captured) */}
                {selectedIncident.videoBlobUrl && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Automated 5-Second Video Recording
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <video
                        src={selectedIncident.videoBlobUrl}
                        controls
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Geolocation Telemetry */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-rose-500" />
                      GPS Dispatch Coordinates
                    </span>
                    {selectedIncident.latitude && (
                      <a
                        href={`https://maps.google.com/?q=${selectedIncident.latitude},${selectedIncident.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <span>Open Map</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-slate-400 font-mono text-[11px]">
                    {selectedIncident.locationAddress || 'Precise coordinates captured'}
                  </p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    Lat: {selectedIncident.latitude ?? '37.7749'} · Long:{' '}
                    {selectedIncident.longitude ?? '-122.4194'} (Accuracy: ±
                    {selectedIncident.accuracyMeters ?? '12'}m)
                  </p>
                </div>

                {/* Simulated Emergency Dispatch Log */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Dispatch Transmission Audit Trail
                  </span>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2 text-xs font-mono">
                    {selectedIncident.simulationLog?.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300">
                        <span className="text-slate-500 text-[11px] shrink-0">{log.time}</span>
                        <span className="text-emerald-400 shrink-0">✓</span>
                        <span className="text-[11px] text-slate-300">{log.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 text-xs">
                Select an incident on the left to inspect evidence dossier.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
