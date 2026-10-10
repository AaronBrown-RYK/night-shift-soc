import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  ShieldAlert, 
  BookOpen, 
  RotateCcw, 
  X,
  Flame,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { sound } from '../services/audio';

export default function ShiftReportModal({ 
  report, 
  analystProfile, 
  onStartNewShift, 
  onClose 
}) {
  if (!report) return null;

  const getGradeBadge = (grade) => {
    switch (grade) {
      case 'S':
        return {
          color: 'text-emerald-400 border-emerald-500 bg-emerald-950/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]',
          label: 'S-TIER: MASTER ANALYST'
        };
      case 'A':
        return {
          color: 'text-cyan-400 border-cyan-500 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
          label: 'A-TIER: COMMENDED'
        };
      case 'B':
        return {
          color: 'text-blue-400 border-blue-500 bg-blue-950/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
          label: 'B-TIER: PROFICIENT'
        };
      case 'C':
        return {
          color: 'text-amber-400 border-amber-500 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
          label: 'C-TIER: PROVISIONAL'
        };
      case 'F':
      default:
        return {
          color: 'text-red-500 border-red-600 bg-red-950/60 shadow-[0_0_30px_rgba(239,68,68,0.35)]',
          label: 'F-TIER: BREACH INCURRED'
        };
    }
  };

  const gradeStyle = getGradeBadge(report.grade);

  return (
    <div className="modal-backdrop">
      <div className="bg-[#0b1220] border border-[#223354] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1c2a44] bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                SOC INCIDENT RESPONSE DEBRIEF
              </div>
              <h2 className="text-xl font-bold font-mono text-slate-100">
                Shift Performance Evaluation Report
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Tutorial Graduation Summary Panel (Step 7) */}
          {(report.isTutorial || report.isPractice) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/80 via-[#0d1c33] to-blue-950/80 border border-cyan-500/70 font-mono shadow-[0_0_25px_rgba(6,182,212,0.2)] animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-900/60 border border-cyan-400 text-cyan-300">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>TUTORIAL ORIENTATION COMPLETE</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">PRACTICE SHIFT</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">SQLite Career Flag: Saved</span>
                  </div>
                  <p className="text-sm font-bold text-slate-100 leading-snug">
                    "You just did the core loop: read → investigate → decide. Real shifts add more alerts, less time, and trickier fakes."
                  </p>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Practice shifts do not count toward lifetime penalties or rank XP. Your orientation is completed and saved in SQLite. You are now prepared to tackle live shifts and escalating campaigns.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top KPI Cards & Big Grade Badge */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Grade Display */}
            <div className={`p-5 rounded-xl border flex flex-col items-center justify-center text-center ${gradeStyle.color}`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">
                Shift Rating
              </span>
              <span className="text-6xl font-black font-mono my-1 tracking-tighter">
                {report.grade}
              </span>
              <span className="text-xs font-mono font-bold uppercase">
                {gradeStyle.label}
              </span>
            </div>

            {/* Score & Summary */}
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-[#0e172a] border border-[#1e2d4a] p-3.5 rounded-lg">
                <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  Final Shift Score
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${
                  report.finalScore >= 300 ? 'text-emerald-400' :
                  report.finalScore > 0 ? 'text-cyan-400' : 'text-red-400'
                }`}>
                  {report.finalScore > 0 ? `+${report.finalScore}` : report.finalScore} <span className="text-xs text-slate-400">pts</span>
                </div>
              </div>

              <div className="bg-[#0e172a] border border-[#1e2d4a] p-3.5 rounded-lg">
                <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  Accuracy Rating
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${
                  report.accuracyPercent >= 80 ? 'text-emerald-400' :
                  report.accuracyPercent >= 60 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {report.accuracyPercent}%
                </div>
              </div>

              <div className="bg-[#0e172a] border border-[#1e2d4a] p-3.5 rounded-lg">
                <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Mean Time to Triage
                </div>
                <div className="text-2xl font-bold font-mono mt-1 text-slate-100">
                  {report.mtttSeconds}s
                </div>
              </div>

              <div className="bg-[#0e172a] border border-[#1e2d4a] p-3.5 rounded-lg">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  Threats Caught
                </div>
                <div className="text-2xl font-bold font-mono mt-1 text-emerald-400">
                  {report.caughtCount} <span className="text-xs text-slate-400 font-normal">mitigated</span>
                </div>
              </div>

              <div className="bg-[#0e172a] border border-[#1e2d4a] p-3.5 rounded-lg">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  Breaches Missed
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${report.missedCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {report.missedCount} <span className="text-xs text-slate-400 font-normal">penetrations</span>
                </div>
              </div>

              <div className="bg-[#0e172a] border border-[#1e2d4a] p-3.5 rounded-lg">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  False Alarm Penalties
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${report.falsePositivePenalties > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {report.falsePositivePenalties} <span className="text-xs text-slate-400 font-normal">disruptions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Commander Debrief Banner */}
          <div className="p-4 rounded-lg bg-[#070d18] border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-cyan-400 font-bold uppercase tracking-wider block mb-1">
              Watch Commander Log:
            </span>
            {report.statusSummary}
          </div>

          {/* Detailed Alert-by-Alert Debrief Breakdown */}
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Incident Forensic Audit & Curriculum Debrief
            </h3>

            <div className="space-y-3">
              {report.breakdown?.map((item, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border font-mono text-xs transition-all ${
                    item.isCorrect 
                      ? 'bg-[#08151f] border-emerald-800/60' 
                      : 'bg-[#180e14] border-red-800/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span className="font-bold text-slate-200">
                        {item.alertId}: {item.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        item.severity === 'Critical' ? 'badge-critical' :
                        item.severity === 'High' ? 'badge-high' :
                        item.severity === 'Medium' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {item.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">
                        Your Call: <strong className={item.isCorrect ? 'text-emerald-300' : 'text-red-300'}>{item.actionTaken}</strong>
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">
                        Optimal: <strong className="text-cyan-300">{item.optimalAction}</strong>
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        item.points >= 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                      }`}>
                        {item.points >= 0 ? `+${item.points}` : item.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Feedback summary */}
                  <p className="text-slate-300 leading-relaxed font-sans mb-2">
                    {item.feedback}
                  </p>

                  {/* Security+ & Network+ Deep Dive */}
                  {item.educationalRationale && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 bg-black/40 p-2.5 rounded text-[11px]">
                      <div className="text-amber-400 font-bold flex items-center gap-1.5 mb-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Security+ / Network+ Topic: {item.educationalRationale.topic}</span>
                      </div>
                      <div className="text-cyan-300 mb-1">
                        {item.educationalRationale.certification_relevance}
                      </div>
                      <p className="text-slate-300 font-sans leading-relaxed">
                        {item.educationalRationale.deep_dive}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1c2a44] bg-[#0c1322] flex items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400">
            Analyst Profile Updated: <strong className="text-cyan-300">{analystProfile?.rank}</strong> ({analystProfile?.score || 0} lifetime pts)
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { onClose(); sound.playClick(); }}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              Review Shift Logs
            </button>
            <button
              onClick={() => { onStartNewShift(); sound.playClick(); }}
              className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Next Shift</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
