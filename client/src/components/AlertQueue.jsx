import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Terminal, 
  ShieldAlert, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { sound } from '../services/audio';

export default function AlertQueue({ 
  alerts = [], 
  selectedAlertId, 
  onSelectAlert, 
  gameSeconds 
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'TRIAGED'

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'PENDING') return a.status === 'PENDING';
    if (filter === 'TRIAGED') return a.status === 'TRIAGED';
    return true;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return <span className="badge-critical px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 animate-pulse"><Flame className="w-3 h-3" />CRITICAL</span>;
      case 'High':
        return <span className="badge-high px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" />HIGH</span>;
      case 'Medium':
        return <span className="badge-medium px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider">MEDIUM</span>;
      case 'Low':
      default:
        return <span className="badge-low px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider">LOW</span>;
    }
  };

  const pendingCount = alerts.filter(a => a.status === 'PENDING').length;
  const triagedCount = alerts.filter(a => a.status === 'TRIAGED').length;

  return (
    <div data-tutorial="alert-queue" className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col bg-[#0b111e] border-r border-[#1a253a] h-[calc(100vh-65px)]">
      {/* Queue Header & Filters */}
      <div className="p-3 border-b border-[#1a253a] bg-[#0d1424]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Incident Triage Queue
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            {pendingCount} PENDING
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => { setFilter('ALL'); sound.playClick(); }}
            className={`py-1 rounded text-center transition-colors ${filter === 'ALL' ? 'bg-cyan-900/60 text-cyan-200 font-bold border border-cyan-700/60' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ALL ({alerts.length})
          </button>
          <button
            onClick={() => { setFilter('PENDING'); sound.playClick(); }}
            className={`py-1 rounded text-center transition-colors ${filter === 'PENDING' ? 'bg-amber-950/60 text-amber-200 font-bold border border-amber-700/60' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ACTIVE ({pendingCount})
          </button>
          <button
            onClick={() => { setFilter('TRIAGED'); sound.playClick(); }}
            className={`py-1 rounded text-center transition-colors ${filter === 'TRIAGED' ? 'bg-emerald-950/60 text-emerald-200 font-bold border border-emerald-700/60' : 'text-slate-400 hover:text-slate-200'}`}
          >
            RESOLVED ({triagedCount})
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-2 space-x-0 space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 font-mono text-xs">
            <Clock className="w-8 h-8 mb-2 opacity-40 animate-pulse text-cyan-400" />
            <span>Scanning telemetry streams...</span>
            <span className="text-[10px] text-slate-600 mt-1">Incoming incidents will appear in the queue.</span>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => {
            const isSelected = alert.id === selectedAlertId;
            const isPending = alert.status === 'PENDING';
            const ageSeconds = Math.max(0, Math.floor(gameSeconds - alert.arrivalSecond));
            const ageDisplay = ageSeconds < 60 ? `+${ageSeconds}s` : `+${Math.floor(ageSeconds / 60)}m ${ageSeconds % 60}s`;

            return (
              <div
                key={alert.id}
                data-tutorial={index === 0 ? "first-alert" : undefined}
                onClick={() => {
                  onSelectAlert(alert.id);
                  sound.playClick();
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer relative group ${
                  isSelected 
                    ? 'bg-[#152037] border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50' 
                    : isPending
                      ? 'bg-[#0f172a]/90 border-slate-800/80 hover:border-slate-700 hover:bg-[#121c33]'
                      : 'bg-[#0a0f1d]/60 border-slate-900 opacity-75 hover:opacity-100 hover:border-slate-800'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r"></div>
                )}

                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {alert.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {ageDisplay}
                    </span>
                  </div>
                  <div>
                    {getSeverityBadge(alert.severity)}
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1 group-hover:text-cyan-300 transition-colors">
                  {alert.title}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="truncate max-w-[170px] text-slate-400">
                    {alert.hostname}
                  </span>
                  
                  {/* Status Badge */}
                  {alert.status === 'TRIAGED' ? (
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        alert.isCorrect 
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50' 
                          : 'bg-red-950/70 text-red-300 border-red-700/50'
                      }`}>
                        {alert.actionTaken}
                      </span>
                      <span className={`text-[10px] font-bold ${alert.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {alert.points >= 0 ? `+${alert.points}` : alert.points}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      UNRESOLVED
                    </span>
                  )}
                </div>

                {/* Sub-rule */}
                <div className="text-[10px] font-mono text-slate-400 mt-1.5 truncate border-t border-slate-800/60 pt-1 flex items-center justify-between">
                  <span>Rule: {alert.rule_fired}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400 transition-opacity" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
