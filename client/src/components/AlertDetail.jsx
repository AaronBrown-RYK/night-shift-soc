import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  Server, 
  Globe, 
  Network, 
  Radio, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  ExternalLink, 
  ShieldCheck, 
  ShieldBan, 
  AlertCircle,
  Activity,
  Laptop,
  FileText,
  Lock,
  Unlock
} from 'lucide-react';
import { sound } from '../services/audio';
import LogViewerTab from './investigation/LogViewerTab';
import PcapViewerTab from './investigation/PcapViewerTab';
import ThreatIntelTab from './investigation/ThreatIntelTab';
import EndpointViewerTab from './investigation/EndpointViewerTab';

export default function AlertDetail({ 
  alert, 
  onTakeAction, 
  gameSeconds,
  isShiftCompleted,
  analystProfile 
}) {
  const [activeToolTab, setActiveToolTab] = useState('LOGS'); // 'LOGS' | 'PCAP' | 'INTEL' | 'ENDPOINT'

  const analystTier = analystProfile?.tier_level || 1;

  if (!alert) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#070c16] text-slate-500 font-mono">
        <Activity className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">No Incident Selected</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-sm">
          Select an incoming alert from the Triage Queue on the left to inspect raw telemetry, verify rules, and dispatch remediation.
        </p>
      </div>
    );
  }

  const handleActionClick = (actionName) => {
    sound.playClick();
    onTakeAction(alert.id, actionName);
  };

  const isTriaged = alert.status === 'TRIAGED';

  const toolTabs = [
    { id: 'LOGS', label: 'Log Viewer', icon: Terminal, count: alert.raw_logs?.length || 0, requiredTier: 1 },
    { id: 'PCAP', label: 'Packet Capture', icon: Radio, count: alert.pcap_packets?.length || 0, requiredTier: 2 },
    { id: 'INTEL', label: 'Threat Intel', icon: Globe, count: Object.keys(alert.threat_intel || {}).length || 1, requiredTier: 2 },
    { id: 'ENDPOINT', label: 'Endpoint Processes', icon: Laptop, count: alert.endpoint_processes?.length || 0, requiredTier: 3 }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#070c16] overflow-y-auto h-[calc(100vh-65px)]">
      {/* Alert Header Banner */}
      <div data-tutorial="alert-header" className="p-4 border-b border-[#1b263d] bg-[#0c1322] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${
            alert.severity === 'Critical' ? 'bg-red-950/60 border-red-500/60 text-red-400' :
            alert.severity === 'High' ? 'bg-orange-950/60 border-orange-500/60 text-orange-400' :
            alert.severity === 'Medium' ? 'bg-amber-950/60 border-amber-500/60 text-amber-400' :
            'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">
                {alert.id}
              </span>
              <span className="text-xs font-mono text-slate-400">
                OFFSET: T+{alert.arrivalSecond}s
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                alert.severity === 'Critical' ? 'badge-critical' :
                alert.severity === 'High' ? 'badge-high' :
                alert.severity === 'Medium' ? 'badge-medium' : 'badge-low'
              }`}>
                {alert.severity} SEVERITY
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 font-mono mt-1">
              {alert.title}
            </h2>
          </div>
        </div>

        {/* Resolved Status Stamp */}
        {isTriaged && (
          <div className="flex items-center gap-3">
            <div className={`stamp ${
              alert.actionTaken === 'Dismiss' ? 'stamp-dismissed' :
              alert.isCorrect ? 'stamp-contained' : 'stamp-breach'
            }`}>
              {alert.actionTaken}
            </div>
            <div className="text-right font-mono">
              <div className={`text-sm font-bold ${alert.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {alert.points >= 0 ? `+${alert.points}` : alert.points} PTS
              </div>
              <div className="text-[10px] text-slate-400">TRIAGED</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-4 flex-1">
        
        {/* Triage Feedback Banner (If already triaged) */}
        {isTriaged && (
          <div className={`p-4 rounded-lg border font-mono ${
            alert.isCorrect 
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200' 
              : 'bg-red-950/30 border-red-500/50 text-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {alert.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span>{alert.isCorrect ? 'DISPATCH EVALUATION: OPTIMAL REMEDIATION' : 'DISPATCH EVALUATION: INCIDENT ESCALATION ERROR'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                    Net Impact: {alert.points >= 0 ? `+${alert.points}` : alert.points} points
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {alert.feedback}
                </p>
              </div>
            </div>

            {/* Educational Deep Dive & Network+/Security+ Notes */}
            {alert.educationalRationale && (
              <div className="mt-3 pt-3 border-t border-emerald-900/60 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Curriculum Insight: {alert.educationalRationale.topic}</span>
                </div>
                <div className="text-[11px] text-cyan-300 mb-1">
                  Exam Focus: {alert.educationalRationale.certification_relevance}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded border border-slate-800">
                  {alert.educationalRationale.deep_dive}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Telemetry Attributes Grid */}
        <div data-tutorial="alert-metadata" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#0b1220] border border-[#1b263b] p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 uppercase">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Source IP / Host
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-100 flex items-center gap-1">
              {alert.source_ip}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {alert.source_ip?.startsWith('10.') || alert.source_ip?.startsWith('192.168.') ? 'Internal RFC 1918' : 'External WAN'}
            </div>
          </div>

          <div className="bg-[#0b1220] border border-[#1b263b] p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 uppercase">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Target Asset
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-100 truncate">
              {alert.hostname}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
              IP: {alert.destination_ip}
            </div>
          </div>

          <div className="bg-[#0b1220] border border-[#1b263b] p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 uppercase">
              <Network className="w-3.5 h-3.5 text-amber-400" />
              Dest Port & Proto
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-100 truncate">
              {alert.destination_port}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Protocol: {alert.protocol}
            </div>
          </div>

          <div className="bg-[#0b1220] border border-[#1b263b] p-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 uppercase">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              Triggering Rule
            </div>
            <div className="mt-1 font-mono text-xs font-bold text-purple-300 truncate" title={alert.rule_fired}>
              {alert.rule_fired}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Category: {alert.category}
            </div>
          </div>
        </div>

        {/* SIEM Incident Summary */}
        <div className="bg-[#0b1220] border border-[#1b263b] p-3 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Detection Summary
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {alert.summary}
          </p>
        </div>

        {/* PHASE 2 & 3 INVESTIGATION TOOLS SUITE TABS (TIER GATED) */}
        <div className="space-y-2">
          {/* Tool Navigation Bar */}
          <div className="flex items-center justify-between border-b border-[#1b263b] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                INVESTIGATION SUITE:
              </span>
              <div className="flex items-center gap-1 bg-[#0b1220] p-1 rounded border border-[#1e2c47]">
                {toolTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeToolTab === tab.id;
                  const isLocked = analystTier < tab.requiredTier;
                  return (
                    <button
                      key={tab.id}
                      data-tutorial={tab.id === 'LOGS' ? "log-tab" : undefined}
                      onClick={() => { setActiveToolTab(tab.id); sound.playClick(); }}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                        isActive 
                          ? 'bg-cyan-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                          : isLocked
                          ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/60'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                      <span>{tab.label}</span>
                      {isLocked ? (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-sans">
                          T{tab.requiredTier}
                        </span>
                      ) : (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                          isActive ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
                Tier {analystTier} Clearance
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Evidence Forensic Workspace
              </span>
            </div>
          </div>

          {/* Active Tool Viewport */}
          <div data-tutorial="log-viewport" className="min-h-[340px]">
            {/* Gated Lock Screen if clearance is below requirement */}
            {(() => {
              const currentTabMeta = toolTabs.find(t => t.id === activeToolTab);
              const isLocked = currentTabMeta && analystTier < currentTabMeta.requiredTier;

              if (isLocked) {
                return (
                  <div className="bg-[#080d19] border border-amber-900/40 rounded-xl p-8 flex flex-col items-center justify-center text-center font-mono space-y-4">
                    <div className="w-14 h-14 rounded-full bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <div className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">
                        CLEARANCE RESTRICTED • SECURITY OPERATIONS DIRECTIVE
                      </div>
                      <h4 className="text-base font-bold text-slate-100">
                        {currentTabMeta.label} Requires Tier {currentTabMeta.requiredTier} Authorization
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans pt-1">
                        {currentTabMeta.id === 'ENDPOINT'
                          ? 'Deep process lineage trees and Living-off-the-Land memory analysis require Tier 3 Senior Incident Responder rank (1200 XP).'
                          : 'Packet capture stream analysis and Threat Intelligence feeds require Tier 2 Threat Hunter rank (400 XP). In Tier 1, hone your perimeter firewall log parsing discipline.'}
                      </p>
                    </div>

                    <div className="bg-[#050811] border border-slate-800 px-4 py-2 rounded-lg text-xs text-slate-300 flex items-center gap-3">
                      <span>Your Rank: <strong className="text-cyan-400">{analystProfile?.rank || 'Tier 1 Triage Analyst'}</strong></span>
                      <span className="text-slate-600">|</span>
                      <span>Score: <strong className="text-emerald-400">{analystProfile?.score || 0} XP</strong></span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-sans italic">
                      Tip: You can switch ranks anytime in the Analyst Career Dossier using the Sandbox Override.
                    </p>
                  </div>
                );
              }

              return (
                <>
                  {activeToolTab === 'LOGS' && <LogViewerTab alert={alert} />}
                  {activeToolTab === 'PCAP' && <PcapViewerTab alert={alert} />}
                  {activeToolTab === 'INTEL' && <ThreatIntelTab alert={alert} />}
                  {activeToolTab === 'ENDPOINT' && <EndpointViewerTab alert={alert} />}
                </>
              );
            })()}
          </div>
        </div>

        {/* ANALYST ACTION CONTROL MATRIX */}
        <div data-tutorial="action-matrix" className="bg-[#0c1424] border border-[#1e2c47] p-4 rounded-xl shadow-xl mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Analyst Remediation Protocol
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Evaluate evidence carefully. Erroneous dismissal of active threats incurs severe breach penalties.
              </p>
            </div>
            {isTriaged && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Action Executed: <strong className="text-slate-200">{alert.actionTaken}</strong>
              </span>
            )}
          </div>

          <div data-tutorial="action-matrix" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Action 1: Dismiss */}
            <button
              data-tutorial="action-dismiss"
              disabled={isTriaged || isShiftCompleted}
              onClick={() => handleActionClick('Dismiss')}
              className="action-btn btn-dismiss flex-col items-start p-3 text-left h-auto"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  Dismiss
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  False Positive
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans mt-1 font-normal leading-tight">
                Benign noise, routine admin, or scheduled scan. Clear queue.
              </span>
            </button>

            {/* Action 2: Escalate */}
            <button
              disabled={isTriaged || isShiftCompleted}
              onClick={() => handleActionClick('Escalate')}
              className="action-btn btn-escalate flex-col items-start p-3 text-left h-auto"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  Escalate
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700">
                  Tier 2 IR
                </span>
              </div>
              <span className="text-[11px] text-cyan-300/80 font-sans mt-1 font-normal leading-tight">
                Real threat needing advanced forensic reverse engineering.
              </span>
            </button>

            {/* Action 3: Block IP */}
            <button
              data-tutorial="action-block"
              disabled={isTriaged || isShiftCompleted}
              onClick={() => handleActionClick('Block IP')}
              className="action-btn btn-block flex-col items-start p-3 text-left h-auto"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldBan className="w-4 h-4 text-amber-400" />
                  Block IP
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                  Border FW
                </span>
              </div>
              <span className="text-[11px] text-amber-300/80 font-sans mt-1 font-normal leading-tight">
                Drop all packets from source address at perimeter firewall.
              </span>
            </button>

            {/* Action 4: Isolate Host (Tier 3 Gated) */}
            <button
              disabled={isTriaged || isShiftCompleted || analystTier < 3}
              onClick={() => handleActionClick('Isolate Host')}
              className={`action-btn btn-isolate flex-col items-start p-3 text-left h-auto ${
                analystTier < 3 ? 'opacity-60 cursor-not-allowed border-dashed' : ''
              }`}
              title={analystTier < 3 ? 'Requires Tier 3 Senior Incident Responder rank' : 'Isolate Host from network'}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold flex items-center gap-1.5">
                  {analystTier < 3 ? (
                    <Lock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  Isolate Host
                </span>
                {analystTier < 3 ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                    Tier 3 Req
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-700">
                    EDR Contain
                  </span>
                )}
              </div>
              <span className="text-[11px] text-red-300/80 font-sans mt-1 font-normal leading-tight">
                {analystTier < 3 
                  ? 'Locked: Host isolation protocol restricted to Tier 3 Senior Responders.' 
                  : 'Sever host NIC to prevent lateral movement and C2 persistence.'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
