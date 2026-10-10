import React from 'react';
import { Compass, Play, Shield, X, Sparkles, Terminal } from 'lucide-react';
import { sound } from '../services/audio';

export default function TutorialPromptModal({ isOpen, onStartTutorial, onStartRegular, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="bg-[#0b1220] border border-cyan-500/60 rounded-xl max-w-lg w-full p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                SECTOR 4 ONBOARDING
              </span>
              <h2 className="text-lg font-bold font-mono text-slate-100">
                Welcome to Night Shift: SOC
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative Message */}
        <div className="space-y-3 mb-6 font-mono text-xs text-slate-300 leading-relaxed bg-[#070d18] p-4 rounded-lg border border-slate-800">
          <p>
            Welcome to the watch, Analyst Echo-Seven. You're sitting in the hot seat of an enterprise Security Operations Center.
          </p>
          <p>
            If you've never worked a SIEM before or aren't sure what "triaging an alert" means, we highly recommend taking the <strong>3-minute Guided Tutorial Shift</strong>.
          </p>
          <p className="text-[11px] text-slate-400 italic">
            *Tutorial shifts are practice: they will walk you through the core loop with overlay guidance and do not affect your career score or rank.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              sound.playClick();
              onStartRegular();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 text-xs font-mono font-semibold transition-colors"
          >
            Skip to Regular Shift
          </button>

          <button
            onClick={() => {
              sound.playSuccess();
              onStartTutorial();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>Start Tutorial Shift</span>
          </button>
        </div>

      </div>
    </div>
  );
}
