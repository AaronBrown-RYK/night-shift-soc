import React from 'react';
import { 
  Shield, 
  Clock, 
  Play, 
  Pause, 
  FastForward, 
  Volume2, 
  VolumeX, 
  Award, 
  BookOpen, 
  CheckCircle,
  AlertOctagon,
  Zap,
  Compass
} from 'lucide-react';
import { sound } from '../services/audio';

export default function Header({ 
  shift, 
  gameSeconds, 
  isRunning, 
  onToggleTimer, 
  speed, 
  onChangeSpeed, 
  onSkipNext,
  onFinishShift, 
  analystProfile,
  soundEnabled,
  onToggleSound,
  onOpenDossier,
  onOpenSOP,
  onOpenCampaign,
  onStartTutorial
}) {
  const totalSeconds = shift?.durationSeconds || 600;
  const remaining = Math.max(0, totalSeconds - Math.floor(gameSeconds));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = remaining <= 60;

  return (
    <header className="bg-[#0b101d] border-b border-[#1b263b] px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Shield className="w-5 h-5" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="beacon-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-wider font-mono text-slate-100 flex items-center gap-2">
              NIGHT SHIFT: SOC
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 uppercase tracking-widest font-sans font-semibold">
                SIEM Console v1.0
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              SURICATA IDS ONLINE
            </span>
            <span className="text-slate-600">|</span>
            <span>SECTOR 04 WATCH</span>
          </div>
        </div>
      </div>

      {/* Clock & Pacing Controls */}
      <div className="flex items-center gap-3 bg-[#070b14] border border-[#1e2a44] px-3.5 py-1.5 rounded-md shadow-inner">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider leading-none">
              Shift Clock
            </span>
            <span className={`font-mono text-lg font-bold tracking-widest leading-tight ${isLowTime ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
              {formattedTime}
            </span>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-slate-800 mx-1"></div>

        {/* Play / Pause */}
        <button 
          onClick={onToggleTimer}
          title={isRunning ? "Pause Shift" : "Resume Shift"}
          className={`p-1.5 rounded text-xs font-mono transition-all flex items-center justify-center ${
            isRunning 
              ? 'bg-amber-950/40 text-amber-300 border border-amber-600/40 hover:bg-amber-900/50' 
              : 'bg-emerald-950/40 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-900/50'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Speed multiplier toggle */}
        <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800 text-xs font-mono">
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded transition-colors ${
                speed === s 
                  ? 'bg-cyan-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Fast forward to next alert */}
        <button
          onClick={onSkipNext}
          title="Fast Forward to Next Alert"
          className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors text-xs flex items-center gap-1 font-mono"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Next Alert</span>
        </button>
      </div>

      {/* Shift Score & Triage Progress */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="bg-[#070b14] border border-[#1e2a44] px-3 py-1.5 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Shift Score</div>
          <div className={`text-base font-bold ${
            (shift?.score || 0) > 0 ? 'text-emerald-400' : (shift?.score || 0) < 0 ? 'text-red-400' : 'text-slate-200'
          }`}>
            {(shift?.score || 0) > 0 ? `+${shift?.score}` : (shift?.score || 0)} pts
          </div>
        </div>

        <div className="bg-[#070b14] border border-[#1e2a44] px-3 py-1.5 rounded hidden md:block">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Triage Queue</div>
          <div className="text-base font-bold text-cyan-400">
            {shift?.triagedCount || 0} / {shift?.totalScheduled || 5} <span className="text-xs text-slate-400 font-normal">processed</span>
          </div>
        </div>
      </div>

      {/* Analyst Profile & Tools Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onStartTutorial}
          className="px-2.5 py-1.5 rounded bg-cyan-950/40 border border-cyan-600/50 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-100 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
          title="Start or replay the 3-minute guided tutorial shift"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Tutorial</span>
        </button>

        <button
          onClick={onOpenCampaign}
          className="px-2.5 py-1.5 rounded bg-amber-950/40 border border-amber-600/50 hover:bg-amber-900/60 text-amber-300 hover:text-amber-100 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
          title="Open Tactical Campaign Shift Selector"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Campaign Ops</span>
          <span className="text-[10px] px-1 rounded bg-amber-900/80 text-amber-200">5 Missions</span>
        </button>

        <button
          onClick={onOpenSOP}
          className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
          title="Open SOP Incident Playbook Reference"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">SOP Playbook</span>
        </button>

        <button
          onClick={onOpenDossier}
          className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
          title="Analyst Dossier & Career Record"
        >
          <Award className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{analystProfile?.callsign || 'Echo-Seven'}</span>
          <span className="text-[10px] text-cyan-400 font-semibold px-1 rounded bg-cyan-950/60 border border-cyan-800">
            T{analystProfile?.tier_level || 1}
          </span>
        </button>

        <button
          onClick={onToggleSound}
          className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title={soundEnabled ? "Mute Terminal Audio" : "Unmute Terminal Audio"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        <button
          onClick={onFinishShift}
          className="px-3 py-1.5 rounded bg-red-950/40 border border-red-700/50 hover:bg-red-900/60 text-red-300 hover:text-red-100 transition-colors text-xs font-mono font-semibold flex items-center gap-1.5"
          title="Submit Shift and view debrief"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Conclude Shift</span>
        </button>
      </div>
    </header>
  );
}
