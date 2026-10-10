import React, { useState, useEffect } from 'react';
import { Globe, ShieldAlert, ShieldCheck, Search, AlertTriangle, ExternalLink, Database, Activity, MapPin } from 'lucide-react';
import { socApi } from '../../services/api';
import { sound } from '../../services/audio';

export default function ThreatIntelTab({ alert }) {
  const [queryIp, setQueryIp] = useState(alert?.source_ip || '');
  const [intelData, setIntelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Trigger lookup whenever queryIp changes or alert changes
  useEffect(() => {
    if (alert?.source_ip) {
      handleLookup(alert.source_ip);
    }
  }, [alert?.id]);

  const handleLookup = async (ipToSearch) => {
    if (!ipToSearch || !ipToSearch.trim()) return;
    const clean = ipToSearch.trim();
    setQueryIp(clean);
    setLoading(true);
    setError(null);

    try {
      // Check if alert already has pre-cached threat_intel for this IP
      if (alert?.threat_intel && alert.threat_intel[clean]) {
        setIntelData(alert.threat_intel[clean]);
        setLoading(false);
        return;
      }

      // Otherwise query live backend endpoint
      const res = await socApi.lookupThreatIntel(clean);
      if (res.success && res.intel) {
        setIntelData(res.intel);
      } else {
        setError('No intelligence records returned.');
      }
    } catch (err) {
      console.error('Threat intel lookup error:', err);
      setError(err.message || 'Threat intel lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const getReputationBadge = (score, verdict) => {
    if (score >= 80) {
      return {
        bg: 'bg-red-950/60 border-red-500/60 text-red-400',
        label: 'MALICIOUS / HIGH RISK',
        color: 'text-red-400'
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-amber-950/60 border-amber-500/60 text-amber-400',
        label: 'SUSPICIOUS / ELEVATED RISK',
        color: 'text-amber-400'
      };
    }
    if (score === 0) {
      return {
        bg: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400',
        label: verdict?.includes('Internal') ? 'INTERNAL RFC 1918' : 'CLEAN / VERIFIED',
        color: 'text-emerald-400'
      };
    }
    return {
      bg: 'bg-slate-900 border-slate-700 text-slate-300',
      label: 'UNRATED / NEUTRAL',
      color: 'text-slate-300'
    };
  };

  const rep = getReputationBadge(intelData?.reputation_score || 0, intelData?.verdict);

  return (
    <div className="flex flex-col h-full bg-[#040810] rounded-lg border border-[#1b263b] overflow-hidden select-text font-mono text-xs">
      {/* Header & Query Bar */}
      <div className="p-3 bg-[#0a1120] border-b border-[#1b263b] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 text-xs font-bold">
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL THREAT INTEL FEED</span>
          </div>
          <span className="text-[11px] text-slate-400">
            VirusTotal & AlienVault OTX Simulated Feeds
          </span>
        </div>

        {/* Search input + quick buttons */}
        <div className="flex items-center gap-2">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleLookup(queryIp); sound.playClick(); }}
            className="flex items-center gap-1.5"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Query IP (e.g. 203.0.113.88)..."
                value={queryIp}
                onChange={(e) => setQueryIp(e.target.value)}
                className="px-2.5 py-1 bg-[#060c18] border border-slate-700 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500 w-44 sm:w-56"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              <span>Query</span>
            </button>
          </form>

          {/* Quick buttons */}
          <div className="flex items-center gap-1 hidden md:flex">
            {alert?.source_ip && (
              <button
                onClick={() => { handleLookup(alert.source_ip); sound.playClick(); }}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px]"
              >
                Src: {alert.source_ip}
              </button>
            )}
            {alert?.destination_ip && !alert.destination_ip.includes('Subnet') && (
              <button
                onClick={() => { handleLookup(alert.destination_ip); sound.playClick(); }}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px]"
              >
                Dst: {alert.destination_ip}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Intel Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400">
            <Activity className="w-8 h-8 text-purple-400 animate-spin mb-2" />
            <span>Querying threat databases and passive DNS graphs...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded bg-red-950/40 border border-red-800 text-red-300">
            {error}
          </div>
        ) : intelData ? (
          <>
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Score Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${rep.bg}`}>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    Threat Reputation Score
                  </div>
                  <div className="text-3xl font-black font-mono mt-1 flex items-baseline gap-1">
                    <span>{intelData.reputation_score}</span>
                    <span className="text-xs font-normal opacity-70">/ 100</span>
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-wider">
                  {rep.label}
                </div>
              </div>

              {/* Network / ASN Card */}
              <div className="p-3.5 rounded-xl bg-[#09101d] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">
                    Autonomous System (ASN) & Org
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-1 truncate" title={intelData.asn}>
                    {intelData.asn}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Country: <strong className="text-slate-200">{intelData.country}</strong></span>
                  {intelData.domain && (
                    <>
                      <span>•</span>
                      <span className="truncate text-cyan-300">{intelData.domain}</span>
                    </>
                  )}
                </div>
              </div>

              {/* First Seen & Passive DNS */}
              <div className="p-3.5 rounded-xl bg-[#09101d] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">
                    Telemetry Metadata
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-1">
                    {intelData.passive_dns_count} Passive DNS Resolutions
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  First Seen in Feeds: <span className="text-slate-200">{intelData.first_seen}</span>
                </div>
              </div>
            </div>

            {/* Threat Classifications / Tags */}
            <div className="p-3 rounded-lg bg-[#09101d] border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                Identified Threat Tags & Campaign Associations:
              </div>
              <div className="flex flex-wrap gap-2">
                {intelData.threat_types?.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded text-xs font-bold border ${
                      intelData.reputation_score >= 80 
                        ? 'bg-red-950/80 text-red-300 border-red-800' 
                        : intelData.reputation_score === 0
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Community & Forensic Summary */}
            <div className="p-3.5 rounded-lg bg-[#070c17] border border-slate-800 space-y-1.5 font-sans">
              <div className="text-[11px] font-mono uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Intelligence Narrative:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {intelData.reports_summary}
              </p>
            </div>

            {/* Analyst Note */}
            <div className="p-3 rounded bg-black/40 border border-slate-800/80 text-[11px] text-slate-400 font-sans">
              <strong className="text-amber-400 font-mono block mb-0.5">Analyst Guidance (Security+ Concept):</strong>
              Do not rely solely on IP reputation scores. Threat actors continuously rotate bulletproof IPs or abuse legitimate cloud CDNs (AWS, Cloudflare, Fastly). Correlate reputation intelligence with the actual payload inside packet captures and process execution logs.
            </div>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-500 font-mono text-xs">
            Enter an IP address above or click a shortcut button to look up threat intelligence.
          </div>
        )}
      </div>
    </div>
  );
}
