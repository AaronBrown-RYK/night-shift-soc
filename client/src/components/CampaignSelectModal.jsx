import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Play, 
  CheckCircle2, 
  X, 
  Zap, 
  Terminal, 
  Radio, 
  Globe, 
  Laptop, 
  ChevronRight,
  Award,
  FlaskConical,
  RotateCcw
} from 'lucide-react';
import { socApi } from '../services/api';
import { sound } from '../services/audio';

export default function CampaignSelectModal({ 
  isOpen, 
  onClose, 
  onLaunchCampaignShift, 
  analystProfile,
  onProfileUpdated 
}) {
  const [campaignShifts, setCampaignShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [testingBypass, setTestingBypass] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCampaign();
    }
  }, [isOpen, analystProfile]);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const res = await socApi.getCampaignShifts(analystProfile?.callsign || 'Echo-Seven');
      if (res.campaignShifts) {
        setCampaignShifts(res.campaignShifts);
        // Default select the highest unlocked shift or shift 1
        const unlocked = res.campaignShifts.filter(cs => cs.canLaunch);
        if (unlocked.length > 0) {
          setSelectedShiftId(unlocked[unlocked.length - 1].id);
        } else if (res.campaignShifts.length > 0) {
          setSelectedShiftId(res.campaignShifts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load campaign shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAll = async () => {
    sound.playSuccess();
    setTestingBypass(true);
    setIsUpdating(true);
    try {
      const res = await socApi.unlockAllCampaigns(analystProfile?.callsign || 'Echo-Seven');
      if (res.profile && onProfileUpdated) {
        onProfileUpdated(res.profile);
      }
      await loadCampaign();
    } catch (err) {
      console.error('Failed to unlock all campaigns:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetProgression = async () => {
    sound.playClick();
    setTestingBypass(false);
    setIsUpdating(true);
    try {
      const res = await socApi.resetCampaignProgression(analystProfile?.callsign || 'Echo-Seven');
      if (res.profile && onProfileUpdated) {
        onProfileUpdated(res.profile);
      }
      await loadCampaign();
    } catch (err) {
      console.error('Failed to reset campaign progression:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  const selectedShift = campaignShifts.find(cs => cs.id === selectedShiftId) || campaignShifts[0];

  const isAllUnlocked = (analystProfile?.unlocked_campaign_shift || 1) >= 5;

  const isShiftPlayable = (cs) => {
    if (!cs) return false;
    if (testingBypass || isAllUnlocked) return true;
    return cs.canLaunch;
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Introductory': return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
      case 'Standard': return 'bg-cyan-950/80 text-cyan-300 border-cyan-600/60';
      case 'Advanced': return 'bg-amber-950/80 text-amber-300 border-amber-600/60';
      case 'High': return 'bg-orange-950/80 text-orange-300 border-orange-600/60';
      case 'Maximum': return 'bg-red-950/80 text-red-300 border-red-600/60 animate-pulse';
      default: return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getTierName = (tier) => {
    switch (tier) {
      case 1: return 'Tier 1 Triage';
      case 2: return 'Tier 2 Hunter';
      case 3: return 'Tier 3 Responder';
      default: return `Tier ${tier}`;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="bg-[#0b1220] border border-[#223354] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1c2a44] bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-950/60 border border-amber-600/50 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <span>INCIDENT CAMPAIGN OPERATIONS</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-400">ESCORT SECTOR DEFENSE</span>
              </div>
              <h2 className="text-lg font-bold font-mono text-slate-100">
                5-Stage Incident Campaign
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

        {/* Testing Sandbox Toolbar */}
        <div className="bg-[#091222] border-b border-[#1c2a44] px-4 py-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
              Testing Mode:
            </span>
            {isAllUnlocked || testingBypass ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 text-[10px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-3 h-3" />
                ALL CAMPAIGNS UNLOCKED (1 - 5)
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Stage {analystProfile?.unlocked_campaign_shift || 1} of 5 Unlocked (Progressive)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(!isAllUnlocked && !testingBypass) ? (
              <button
                onClick={handleUnlockAll}
                disabled={isUpdating}
                className="px-3 py-1 rounded bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer"
                title="Unlock all 5 campaign shifts immediately for testing"
              >
                <Unlock className="w-3.5 h-3.5 text-slate-950" />
                <span>Unlock All for Testing</span>
              </button>
            ) : (
              <button
                onClick={handleResetProgression}
                disabled={isUpdating}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset progression back to Shift 1 only"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset Locks</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Shift Missions List */}
          <div className="w-full md:w-1/2 border-r border-[#1c2a44] bg-[#070d18] overflow-y-auto p-3 space-y-2">
            <div className="px-2 py-1 text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Shift Operations</span>
              <span className="text-cyan-400">
                Analyst Rank: T{analystProfile?.tier_level || 1}
              </span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-400">
                Loading campaign operations...
              </div>
            ) : (
              campaignShifts.map((cs) => {
                const isSelected = cs.id === selectedShiftId;
                const userTier = analystProfile?.tier_level || 1;
                const canLaunch = isShiftPlayable(cs);
                const isLocked = !canLaunch;
                const tierLocked = userTier < cs.requiredTier && !canLaunch;
                const progressionLocked = !cs.isUnlocked && !canLaunch;

                return (
                  <div
                    key={cs.id}
                    onClick={() => {
                      setSelectedShiftId(cs.id);
                      sound.playClick();
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : isLocked
                        ? 'bg-slate-950/50 border-slate-800/80 opacity-70 hover:opacity-90'
                        : 'bg-[#0d1627] border-[#1e2e4c] hover:border-cyan-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isLocked ? (
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-500">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-400">
                            <Unlock className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold font-mono text-slate-100">
                              {cs.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans line-clamp-1">
                            {cs.subtitle}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${getDifficultyBadge(cs.difficulty)}`}>
                        {cs.difficulty}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded border ${
                          tierLocked 
                            ? 'bg-red-950/60 border-red-800 text-red-300' 
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}>
                          Req: {getTierName(cs.requiredTier)}
                        </span>
                        <span>{cs.scenarioCount} Scenarios</span>
                      </div>

                      {isLocked ? (
                        <span className="text-red-400">
                          {progressionLocked ? 'Locked (Clear Prior Shift)' : 'Locked (Rank Req)'}
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Mission Briefing & Launch Console */}
          <div className="w-full md:w-1/2 bg-[#09101d] p-5 flex flex-col justify-between overflow-y-auto">
            {selectedShift ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      OPERATIONAL BRIEFING • SHIFT #{selectedShift.shiftNumber}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getDifficultyBadge(selectedShift.difficulty)}`}>
                      {selectedShift.difficulty} Threat Level
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-mono text-slate-100 mt-1">
                    {selectedShift.title}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    {selectedShift.subtitle}
                  </div>
                </div>

                {/* Briefing Narrative */}
                <div className="bg-[#050912] border border-[#1b2842] p-3.5 rounded-lg text-xs leading-relaxed text-slate-300 font-mono">
                  <div className="text-[10px] text-cyan-400 font-bold mb-1 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> MISSION DIRECTIVE:
                  </div>
                  {selectedShift.briefing}
                </div>

                {/* Operational Details */}
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Shift Target Score:</span>
                    <span className="font-bold text-emerald-400">+{selectedShift.targetScore} PTS</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Required Clearance:</span>
                    <span className={`font-bold ${
                      (analystProfile?.tier_level || 1) >= selectedShift.requiredTier 
                        ? 'text-cyan-400' 
                        : 'text-red-400'
                    }`}>
                      {getTierName(selectedShift.requiredTier)} (Tier {selectedShift.requiredTier})
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Expected Incident Count:</span>
                    <span className="text-slate-200">{selectedShift.scenarioCount} Scheduled Alerts</span>
                  </div>
                </div>

                {/* Requirements check callout */}
                {selectedShift && !selectedShift.canLaunch && (
                  (isAllUnlocked || testingBypass) ? (
                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/50 text-cyan-200 font-mono text-xs flex items-start gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                      <FlaskConical className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[11px] uppercase text-cyan-300">Sandbox Testing Override Active</div>
                        <p className="text-[11px] text-cyan-200 mt-0.5 leading-snug">
                          Clearance and progression locks are bypassed for testing. You may launch Shift #{selectedShift.shiftNumber} immediately!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-red-950/30 border border-red-700/50 text-red-200 font-mono text-xs flex items-start gap-2">
                      <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-[11px] uppercase">Shift Locked</div>
                        <p className="text-[11px] text-red-300 mt-0.5 leading-snug">
                          {!selectedShift.isUnlocked 
                            ? `Complete Shift #${selectedShift.shiftNumber - 1} to unlock this operational stage.` 
                            : `Requires ${getTierName(selectedShift.requiredTier)} rank promotion. Earn more XP or use the Sandbox Override in your Dossier.`}
                        </p>
                        <button
                          onClick={handleUnlockAll}
                          disabled={isUpdating}
                          className="mt-2.5 px-3 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
                        >
                          <Unlock className="w-3 h-3 text-amber-400" />
                          <span>Unlock All Campaigns for Testing</span>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 text-center py-12">
                Select a shift operation to view mission briefing.
              </div>
            )}

            {/* Launch Button Action */}
            <div className="pt-4 border-t border-[#1c2a44] mt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => { onClose(); sound.playClick(); }}
                className="px-3.5 py-2 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Close
              </button>

              <button
                disabled={!isShiftPlayable(selectedShift)}
                onClick={() => {
                  sound.playSuccess();
                  onLaunchCampaignShift(selectedShift.shiftNumber);
                  onClose();
                }}
                className={`px-5 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  isShiftPlayable(selectedShift)
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>Launch Shift #{selectedShift?.shiftNumber}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
