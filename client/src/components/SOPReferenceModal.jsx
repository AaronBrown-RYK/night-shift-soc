import React from 'react';
import { BookOpen, ShieldCheck, ShieldBan, AlertCircle, ExternalLink, X, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sound } from '../services/audio';

export default function SOPReferenceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="bg-[#0b1220] border border-[#223354] rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1c2a44] bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-950 border border-amber-700/60 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">
                SOC STANDARD OPERATING PROCEDURE • MANUAL REF 04-B
              </div>
              <h2 className="text-lg font-bold font-mono text-slate-100">
                Analyst Incident Response Handbook
              </h2>
            </div>
          </div>

          <button
            onClick={() => { onClose(); sound.playClick(); }}
            className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 font-mono text-xs">
          
          {/* Action Playbook */}
          <div className="space-y-3">
            <h3 className="text-cyan-400 font-bold uppercase tracking-wider text-xs border-b border-slate-800 pb-1 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              1. Remediation Protocols & Tradeoffs
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
              <div className="bg-[#09101d] border border-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono font-bold text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  DISMISS (False Positive)
                </div>
                <p className="text-slate-400 text-xs">
                  Apply when telemetry shows authorized activity (e.g. scheduled internal vulnerability scans with change tickets, IT DevOps Ansible SSH keys, routine DNS lookups).
                </p>
                <div className="mt-2 text-[11px] font-mono text-emerald-400">
                  Reward: +85 to +90 pts. Penalty for dismissing real attack: -250 to -300 pts!
                </div>
              </div>

              <div className="bg-[#09101d] border border-cyan-900/60 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-xs mb-1">
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  ESCALATE (Tier 2 Incident)
                </div>
                <p className="text-slate-400 text-xs">
                  Apply when suspicious activity indicates active adversary targeting or novel malware requiring deep reverse-engineering or forensic memory acquisition.
                </p>
                <div className="mt-2 text-[11px] font-mono text-cyan-400">
                  Reward: +70 to +75 pts. Escalating false alarms costs minor triage bandwidth (-25 to -30 pts).
                </div>
              </div>

              <div className="bg-[#09101d] border border-amber-900/60 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold text-xs mb-1">
                  <ShieldBan className="w-3.5 h-3.5 text-amber-400" />
                  BLOCK IP (Border Firewall)
                </div>
                <p className="text-slate-400 text-xs">
                  Apply when an untrusted external WAN IP performs hostile reconnaissance (TCP SYN scan sweeps) or remote dictionary authentication bursts.
                </p>
                <div className="mt-2 text-[11px] font-mono text-amber-400">
                  Reward: +100 to +120 pts. CAUTION: Blocking internal gateways or authorized scanners causes outages (-120 pts).
                </div>
              </div>

              <div className="bg-[#09101d] border border-red-900/60 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 text-red-300 font-mono font-bold text-xs mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  ISOLATE HOST (EDR Containment)
                </div>
                <p className="text-slate-400 text-xs">
                  Apply when an endpoint has executed malicious droppers (phishing clicks running mshta/powershell) or when adversary has gained interactive logon (Event ID 4624).
                </p>
                <div className="mt-2 text-[11px] font-mono text-red-400">
                  Reward: +140 to +150 pts. Isolating innocent servers knocks them offline (-180 to -200 pts).
                </div>
              </div>
            </div>
          </div>

          {/* Incident Cheat Sheet */}
          <div className="space-y-3 font-sans">
            <h3 className="text-amber-400 font-mono font-bold uppercase tracking-wider text-xs border-b border-slate-800 pb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              2. Incident Identification Cheat Sheet (CompTIA Network+ / Security+)
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                <strong className="text-slate-200 font-mono">TCP Port Scan (Half-Open SYN):</strong>
                <p className="text-slate-400 mt-0.5">
                  Bursts of SYN packets across low/high ports with no completed ACK. Adversary maps open services (SSH 22, RDP 3389). <em>Action: Block IP at border firewall.</em>
                </p>
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                <strong className="text-slate-200 font-mono">Brute Force & Credential Stuffing:</strong>
                <p className="text-slate-400 mt-0.5">
                  Flood of Windows Event ID 4625 (Logon Failure, Substatus 0xC000006A). Watch for Event ID 4624 (Logon Success, LogonType 10 RemoteInteractive). If success occurs, the host is breached! <em>Action: Isolate Host immediately.</em>
                </p>
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                <strong className="text-slate-200 font-mono">Phishing Link & LOLBin Droppers:</strong>
                <p className="text-slate-400 mt-0.5">
                  User navigates to look-alike domain. Browser spawns Living-off-the-Land binaries (mshta.exe, powershell.exe). <em>Action: Isolate Host via EDR to sever C2 beaconing.</em>
                </p>
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                <strong className="text-slate-200 font-mono">Benign Baseline Discipline:</strong>
                <p className="text-slate-400 mt-0.5">
                  Check source IP: is it in internal management subnets? Check HTTP User-Agent: mentions Nessus/Qualys and Change Ticket? Check auth: is it SSH public-key from Ansible? If verified legitimate, <em>Action: Dismiss</em>.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1c2a44] bg-[#0c1322] flex justify-end">
          <button
            onClick={() => { onClose(); sound.playClick(); }}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
}
