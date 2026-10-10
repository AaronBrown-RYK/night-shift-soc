import React, { useEffect, useState } from 'react';
import { 
  Award, 
  Shield, 
  User, 
  History, 
  CheckCircle, 
  Flame, 
  X, 
  Database,
  TrendingUp,
  Lock,
  Unlock,
  CheckCircle2,
  Terminal,
  Radio,
  Globe,
  Laptop,
  AlertCircle
} from 'lucide-react';
import { socApi } from '../services/api';
import { sound } from '../services/audio';

export default function AnalystDossierModal({ isOpen, onClose, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      socApi.getAnalystProfile('Echo-Seven'),
      socApi.getShiftHistory(10)
    ]).then(([profRes, histRes]) => {
      setProfile(profRes.profile);
      setHistory(histRes.history || []);
      setLoading(false);
      if (onProfileUpdated && profRes.profile) {
        onProfileUpdated(profRes.profile);
      }
    }).catch(err => {
      console.error('Failed to load dossier:', err);
      setLoading(false);
    });
  };

  const handleSetTier = async (targetTier) => {
    try {
      setIsUpdatingTier(true);
      sound.playClick();
      const res = await socApi.setAnalystTier(targetTier, 'Echo-Seven');
      if (res.profile) {
        setProfile(res.profile);
        sound.playSuccess();
        if (onProfileUpdated) onProfileUpdated(res.profile);
      }
    } catch (err) {
      console.error('Error changing tier:', err);
      sound.playFailure();
    } finally {
      setIsUpdatingTier(false);
    }
  };

  if (!isOpen) return null;

  const getTierBadge = (tier) => {
    switch (tier) {
      case 3: return 'bg-purple-950/80 text-purple-300 border-purple-600';
      case 2: return 'bg-cyan-950/80 text-cyan-300 border-cyan-600';
      case 1:
      default: return 'bg-blue-950/80 text-blue-300 border-blue-600';
    }
  };

  const accuracyTrend = profile?.accuracyTrend || [];

  return (
    <div className="modal-backdrop">
      <div className="bg-[#0b1220] border border-[#223354] rounded-xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1c2a44] bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
                SOC PERSONNEL RECORD • SQLite PERSISTENCE
              </div>
              <h2 className="text-lg font-bold font-mono text-slate-100">
                Analyst Career Dossier
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
        <div className="p-5 overflow-y-auto space-y-5">
          {loading ? (
            <div className="h-40 flex items-center justify-center font-mono text-xs text-slate-400">
              Reading persistent analyst record from SQLite...
            </div>
          ) : (
            <>
              {/* Personnel Badge */}
              <div className="p-4 rounded-xl bg-[#08101e] border border-cyan-900/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-mono text-2xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    T{profile?.tier_level || 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-mono text-slate-100">
                        {profile?.callsign}
                      </h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getTierBadge(profile?.tier_level)}`}>
                        {profile?.rank}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      Badge: {profile?.badge_number} • Campaign Clearance: Shift #{profile?.unlocked_campaign_shift || 1}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400 uppercase">Career Score</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {profile?.score} <span className="text-xs text-slate-400">pts</span>
                  </div>
                </div>
              </div>

              {/* RANK PROGRESSION BAR */}
              <div className="bg-[#0e172a] border border-[#1e2d4a] p-4 rounded-xl font-mono">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-200 uppercase tracking-wider">
                      Clearance Progression: Tier {profile?.tier_level || 1} &rarr; {profile?.tier_level === 1 ? 'Tier 2 (400 XP)' : profile?.tier_level === 2 ? 'Tier 3 (1200 XP)' : 'Max Rank Reached'}
                    </span>
                  </div>
                  <span className="text-cyan-400 font-bold">
                    {profile?.xpProgressPercent || 0}%
                  </span>
                </div>

                {/* Progress bar track */}
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 p-0.5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${Math.max(4, profile?.xpProgressPercent || 0)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
                  <span>Current XP: <strong className="text-slate-200">{profile?.score || 0}</strong></span>
                  {profile?.nextTierPointsNeeded > 0 ? (
                    <span>Needed for next promotion: <strong className="text-amber-400">+{profile?.nextTierPointsNeeded} XP</strong></span>
                  ) : (
                    <span className="text-emerald-400 font-bold">Master Incident Responder Clearance</span>
                  )}
                </div>

                {/* Tool Unlocks at this tier */}
                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Logs & Border FW</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${profile?.tier_level >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {profile?.tier_level >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
                    <span>PCAP Dissector (T2)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${profile?.tier_level >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {profile?.tier_level >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
                    <span>Threat Intel Feed (T2)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${profile?.tier_level >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {profile?.tier_level >= 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
                    <span>Host Isolation & EDR (T3)</span>
                  </div>
                </div>
              </div>

              {/* SANDBOX RANK OVERRIDE SWITCHER */}
              <div className="bg-[#091122] border border-cyan-900/50 p-3.5 rounded-xl font-mono flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    Sandbox Rank Override (Testing Mode)
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Instantly simulate promotion to test unlocked tools and permissions.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { tier: 1, label: 'Tier 1 Triage' },
                    { tier: 2, label: 'Tier 2 Hunter' },
                    { tier: 3, label: 'Tier 3 Senior IR' }
                  ].map((t) => (
                    <button
                      key={t.tier}
                      disabled={isUpdatingTier}
                      onClick={() => handleSetTier(t.tier)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                        profile?.tier_level === t.tier
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Career Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-[#0e172a] border border-[#1e2d4a] p-3 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Shifts Concluded</div>
                  <div className="text-xl font-bold font-mono text-slate-100 mt-1">{profile?.shifts_completed}</div>
                </div>
                <div className="bg-[#0e172a] border border-[#1e2d4a] p-3 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Alerts Triaged</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{profile?.total_alerts_triaged}</div>
                </div>
                <div className="bg-[#0e172a] border border-[#1e2d4a] p-3 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Correct Actions</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{profile?.correct_actions}</div>
                </div>
                <div className="bg-[#0e172a] border border-[#1e2d4a] p-3 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Lifetime Accuracy</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {profile?.total_alerts_triaged > 0 
                      ? Math.round((profile.correct_actions / profile.total_alerts_triaged) * 100) 
                      : 0}%
                  </div>
                </div>
              </div>

              {/* ACCURACY TREND VISUAL CHART */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    Shift Accuracy Trend
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Target Baseline: &gt;= 80%
                  </span>
                </h4>

                {accuracyTrend.length === 0 ? (
                  <div className="p-4 rounded bg-[#070d18] border border-slate-800 text-center text-xs font-mono text-slate-500">
                    No historical shifts to plot. Conclude your first shift to begin logging accuracy trends.
                  </div>
                ) : (
                  <div className="bg-[#070d18] border border-slate-800 rounded-lg p-4 font-mono">
                    <div className="h-32 flex items-end gap-2 sm:gap-4 justify-between border-b border-slate-800 pb-2 pt-4 px-2">
                      {accuracyTrend.map((item, idx) => {
                        const acc = Math.max(5, Math.min(100, Math.round(item.accuracyPercent)));
                        const isHigh = acc >= 80;
                        const isMedium = acc >= 60 && acc < 80;
                        return (
                          <div key={item.shiftId || idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            {/* Hover tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                              {item.shiftTitle || item.shiftId}: {acc}% ({item.finalScore >= 0 ? `+${item.finalScore}` : item.finalScore} pts)
                            </div>

                            {/* Percentage label */}
                            <span className="text-[9px] text-slate-400 mb-1 group-hover:text-cyan-300">
                              {acc}%
                            </span>

                            {/* Bar */}
                            <div 
                              className={`w-full max-w-[36px] rounded-t transition-all ${
                                isHigh 
                                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300' 
                                  : isMedium 
                                  ? 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300'
                                  : 'bg-gradient-to-t from-red-600 to-red-400 group-hover:from-red-500 group-hover:to-red-300'
                              }`}
                              style={{ height: `${acc}%` }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-1">
                      <span>Oldest Shift</span>
                      <span className="text-slate-400">Chronological Trajectory (Last 10 Shifts)</span>
                      <span>Latest Shift</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Shift History Table */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  Recent Shift Performance Log
                </h4>

                {history.length === 0 ? (
                  <div className="p-4 rounded bg-[#070d18] border border-slate-800 text-center text-xs font-mono text-slate-500">
                    No completed shifts on record yet. Conclude your first shift to begin logging career analytics.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#0e172a] text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Shift ID</th>
                          <th className="p-2.5">Accuracy</th>
                          <th className="p-2.5">MTTT</th>
                          <th className="p-2.5">Score</th>
                          <th className="p-2.5">Caught / Missed</th>
                          <th className="p-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-[#070d18]">
                        {history.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-bold text-slate-200">
                              <div>{s.id}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{s.shift_title}</div>
                            </td>
                            <td className="p-2.5">
                              <span className={s.accuracy_percent >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                                {s.accuracy_percent}%
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-300">{s.mttt_seconds}s</td>
                            <td className="p-2.5 font-bold text-cyan-400">
                              {s.final_score > 0 ? `+${s.final_score}` : s.final_score}
                            </td>
                            <td className="p-2.5">
                              <span className="text-emerald-400">{s.caught_count}</span>
                              <span className="text-slate-600"> / </span>
                              <span className={s.missed_count > 0 ? 'text-red-400' : 'text-slate-400'}>{s.missed_count}</span>
                            </td>
                            <td className="p-2.5 text-slate-400 text-[10px]">{s.started_at?.split('T')[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1c2a44] bg-[#0c1322] flex justify-end">
          <button
            onClick={() => { onClose(); sound.playClick(); }}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
