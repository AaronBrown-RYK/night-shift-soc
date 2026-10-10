import React, { useState } from 'react';
import { Laptop, Terminal, AlertTriangle, ShieldAlert, Cpu, Eye, Code, CornerDownRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { sound } from '../../services/audio';

export default function EndpointViewerTab({ alert }) {
  const [selectedPid, setSelectedPid] = useState(null);
  const [decodedPayload, setDecodedPayload] = useState(null);

  const processes = alert?.endpoint_processes || [];
  const selectedProc = processes.find(p => p.pid === selectedPid) || processes[processes.length - 1] || processes[0] || null;

  // Attempt base64 decoding if command contains encoded flags
  const handleInspectBase64 = (cmd) => {
    sound.playClick();
    // Look for -enc, -EncodedCommand or raw base64 chunks
    const match = cmd.match(/(?:-enc|-EncodedCommand)\s+([A-Za-z0-9+/=]+)/i);
    if (match && match[1]) {
      try {
        // Base64 decode (often UTF-16LE in Windows PowerShell)
        const binaryStr = atob(match[1]);
        // Strip null bytes if UTF-16LE
        const decoded = binaryStr.replace(/\0/g, '');
        setDecodedPayload(decoded);
      } catch (err) {
        setDecodedPayload(`[Decode Failed]: Raw parameter: ${match[1]}`);
      }
    } else {
      setDecodedPayload('[No standard Base64 EncodedCommand flag found in parameter string]');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#040810] rounded-lg border border-[#1b263b] overflow-hidden select-text font-mono text-xs">
      {/* Endpoint Header Bar */}
      <div className="p-3 bg-[#0a1120] border-b border-[#1b263b] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold">
            <Laptop className="w-3.5 h-3.5" />
            <span>EDR ENDPOINT TELEMETRY</span>
          </div>
          <span className="text-xs text-slate-300 font-bold">
            {alert?.hostname || 'TARGET-HOST'}
          </span>
          <span className="text-[10px] text-slate-400">
            ({alert?.destination_ip || alert?.source_ip})
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            FALCON EDR SENSOR ACTIVE
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{processes.length} Active Processes Monitored</span>
        </div>
      </div>

      {/* Main Process Inspector Split Pane */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#040810]">
        
        {/* Left Column: Process Tree & Process List */}
        <div className="w-full md:w-1/2 p-3 border-r border-[#1b263b] overflow-y-auto space-y-2">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Process Execution Lineage (Parent &rarr; Child)</span>
            <span className="text-[10px] text-slate-500">Click to inspect</span>
          </div>

          <div className="space-y-1.5">
            {processes.map((proc, idx) => {
              const isSelected = selectedProc?.pid === proc.pid;
              const isSuspicious = proc.note || proc.command.includes('powershell') || proc.command.includes('iodine') || proc.name.toLowerCase().includes('python');
              
              // Visual tree indentation based on parent
              const indentLevel = idx > 0 ? (idx * 16) : 0;

              return (
                <div
                  key={proc.pid}
                  onClick={() => { setSelectedPid(proc.pid); setDecodedPayload(null); sound.playClick(); }}
                  style={{ marginLeft: `${Math.min(indentLevel, 48)}px` }}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.2)] text-slate-100 ring-1 ring-cyan-500/40'
                      : isSuspicious
                        ? 'bg-[#140e16] border-red-900/60 hover:border-red-700/80 text-slate-200'
                        : 'bg-[#09101d] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      {idx > 0 && <CornerDownRight className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                      <span className={isSuspicious ? 'text-red-400' : 'text-slate-200'}>
                        {proc.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        (PID: {proc.pid})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500">PPID: {proc.ppid}</span>
                      <span className={`px-1.5 py-0.2 rounded border ${
                        proc.integrity === 'System' || proc.integrity === 'Root' 
                          ? 'bg-purple-950/60 text-purple-300 border-purple-800' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {proc.integrity || 'Medium'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate" title={proc.command}>
                    {proc.command}
                  </div>

                  {proc.note && (
                    <div className="mt-1 text-[10px] text-red-300 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <span className="truncate">{proc.note}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Selected Process Inspector */}
        {selectedProc ? (
          <div className="w-full md:w-1/2 p-3.5 overflow-y-auto space-y-3 bg-[#03060d]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase text-cyan-400 font-bold">Process Inspector</span>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>{selectedProc.name}</span>
                  <span className="text-xs text-slate-400 font-normal">PID {selectedProc.pid}</span>
                </h4>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                selectedProc.status === 'Running' 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {selectedProc.status}
              </span>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Parent PID (PPID)</span>
                <span className="font-bold text-slate-200">{selectedProc.ppid}</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">User Account Context</span>
                <span className="font-bold text-slate-200 truncate block">{selectedProc.user}</span>
              </div>
            </div>

            {/* Full Command Line Box */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Full Command Line Arguments:</span>
                {selectedProc.command.includes('-Enc') || selectedProc.command.includes('-enc') ? (
                  <button
                    onClick={() => handleInspectBase64(selectedProc.command)}
                    className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Code className="w-3 h-3" />
                    <span>Decode Base64 Payload</span>
                  </button>
                ) : null}
              </div>
              <div className="p-2.5 rounded bg-black/60 border border-slate-800 text-slate-200 text-xs break-all select-all font-mono leading-relaxed">
                {selectedProc.command}
              </div>
            </div>

            {/* Decoded Base64 Output Drawer */}
            {decodedPayload && (
              <div className="p-2.5 rounded bg-[#091522] border border-cyan-800/80 space-y-1">
                <span className="text-[10px] text-cyan-300 font-bold uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                  Deobfuscated Script Payload:
                </span>
                <div className="text-[11px] text-emerald-300 font-mono break-all select-all leading-relaxed p-1.5 rounded bg-black/50">
                  {decodedPayload}
                </div>
              </div>
            )}

            {/* Anomaly Note / Security Analysis */}
            {selectedProc.note && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-800 text-xs text-red-200 font-sans leading-relaxed">
                <strong className="font-mono text-red-400 block mb-0.5">EDR Threat Detection Rule Triggered:</strong>
                {selectedProc.note}
              </div>
            )}

            {/* Hash */}
            {selectedProc.hash && (
              <div className="text-[10px] text-slate-500 font-mono truncate">
                SHA256: {selectedProc.hash}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
            No running processes captured for this endpoint.
          </div>
        )}
      </div>
    </div>
  );
}
