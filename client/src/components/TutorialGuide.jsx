import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  HelpCircle, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  ShieldAlert, 
  Terminal, 
  Lightbulb, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { sound } from '../services/audio';

export default function TutorialGuide({
  step,
  onNextStep,
  onSkipTutorial,
  currentAlert,
  onSelectAlert,
  alerts,
  onConcludeShift
}) {
  const [showHint, setShowHint] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  // Target query mapping per step
  const getTargetSelector = (s) => {
    switch (s) {
      case 1: return '[data-tutorial="alert-queue"]';
      case 2: return '[data-tutorial="alert-header"]';
      case 3: return '[data-tutorial="log-viewport"]';
      case 4: return '[data-tutorial="action-block"]';
      case 5: return '[data-tutorial="action-dismiss"]';
      case 6: return '[data-tutorial="action-matrix"]';
      default: return null;
    }
  };

  // Track position of highlighted element
  useEffect(() => {
    const updateRect = () => {
      const selector = getTargetSelector(step);
      if (!selector) {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height
        });
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    const interval = setInterval(updateRect, 300);
    return () => {
      window.removeEventListener('resize', updateRect);
      clearInterval(interval);
    };
  }, [step]);

  // Reset hint on step change
  useEffect(() => {
    setShowHint(false);
  }, [step]);

  if (!step || step > 7) return null;

  return (
    <>
      {/* Target Element Spotlight Highlight Box */}
      {targetRect && (
        <div 
          className="fixed pointer-events-none z-40 transition-all duration-300 rounded-lg ring-4 ring-cyan-400 ring-offset-4 ring-offset-slate-950/80 shadow-[0_0_35px_rgba(6,182,212,0.6)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Floating Tutorial HUD Card */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[#0b1220]/95 backdrop-blur-md border border-cyan-500/80 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.25)] overflow-hidden font-sans">
          
          {/* Card Header */}
          <div className="bg-[#0f172a] border-b border-cyan-900/60 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-400">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-300">
                SOC ORIENTATION • STEP {step} OF 7
              </span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onSkipTutorial();
              }}
              className="text-[11px] font-mono text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
              title="Skip tutorial and continue shift independently"
            >
              <span>Skip</span>
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Step Body Content */}
          <div className="p-4 space-y-3">
            
            {/* STEP 1: The Queue */}
            {step === 1 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  The Incident Queue
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#070d18] p-3 rounded border border-slate-800">
                  "Alerts arrive here. Your job: decide which are real attacks and which are noise. You have limited time — speed matters, but wrong calls cost more."
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onNextStep();
                    }}
                    className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    <span>Read First Alert</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Reading an Alert */}
            {step === 2 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Reading An Alert
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#070d18] p-3 rounded border border-slate-800">
                  "Start with who, where, and what fired. An external IP touching five ports in seconds is reconnaissance."
                </p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Inspect the <strong>Source IP</strong> (external WAN) and the triggered rule: <code className="text-purple-300">ET SCAN Potential SSH Scan</code>.
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onNextStep();
                    }}
                    className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    <span>Investigate Logs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Investigating */}
            {step === 3 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Investigating in the Log Viewer
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#070d18] p-3 rounded border border-slate-800">
                  "The logs are your evidence. SYN packets with no completed handshake = half-open scan. You're looking at a real attack."
                </p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Notice the rapid sequence of connection attempts to ports 21, 22, 23, 80, 443 with flag <code className="text-cyan-300">[SYN]</code> and no ACKs.
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onNextStep();
                    }}
                    className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    <span>Proceed to Action</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Taking Action */}
            {step === 4 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Taking Remediation Action
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#070d18] p-3 rounded border border-slate-800">
                  "Block IP stops it at the border firewall. Dismissing a real attack is the worst mistake you can make (-300). When in doubt, escalate."
                </p>
                <div className="p-2.5 rounded bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs font-mono flex items-center gap-2 animate-pulse">
                  <span>👉 Click the highlighted <strong>Block IP</strong> button below.</span>
                </div>
              </div>
            )}

            {/* STEP 5: The False Positive */}
            {step === 5 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  The False Positive Trap
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#070d18] p-3 rounded border border-slate-800">
                  "Not everything scary is an attack. Internal scanner + valid change ticket = authorized activity. Dismissing correctly keeps the queue clean."
                </p>
                <div className="text-[11px] text-slate-300 font-mono">
                  Check the logs: internal host <code className="text-cyan-300">10.0.1.250</code> is running an authorized Nessus sweep referencing ticket <code className="text-emerald-300">CHG-99214</code>.
                </div>
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <span>👉 Click <strong>Dismiss (False Positive)</strong> to clear it.</span>
                </div>
              </div>
            )}

            {/* STEP 6: Solo Rep */}
            {step === 6 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Solo Rep: No Hand-Holding
                  </h3>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowHint(!showHint);
                    }}
                    className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/60 hover:bg-amber-900 text-amber-300 text-[11px] font-mono flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#070d18] p-3 rounded border border-slate-800">
                  "Third alert is a credential stuffing burst. Check the telemetry, read the logs, and make your decision independently."
                </p>

                {showHint && (
                  <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-600 text-cyan-200 text-xs font-mono animate-in fade-in">
                    <div className="font-bold text-[10px] text-amber-300 uppercase mb-1">Investigation Tip:</div>
                    "Check the Windows event IDs — 4625 (Logon Failure) vs 4624 (Successful Logon). If a failure flood ends with a success, the account was compromised!"
                  </div>
                )}

                <div className="text-[11px] text-slate-400 font-mono italic">
                  Take the remediation action you believe is optimal (Block IP or Isolate Host).
                </div>
              </div>
            )}

            {/* STEP 7: Debrief / Conclusion */}
            {step === 7 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Tutorial Complete!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#070d18] p-3 rounded border border-slate-800">
                  "You just did the core loop: read → investigate → decide. Real shifts add more alerts, less time, and trickier fakes."
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      sound.playSuccess();
                      onConcludeShift();
                    }}
                    className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  >
                    <span>View Debrief Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </>
  );
}
