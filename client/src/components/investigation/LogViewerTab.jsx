import React, { useState, useMemo } from 'react';
import { Terminal, Filter, Search, Copy, Check, FileText, ShieldAlert, Key, Globe, Network } from 'lucide-react';
import { sound } from '../../services/audio';

export default function LogViewerTab({ alert }) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [filterText, setFilterText] = useState('');
  const [copied, setCopied] = useState(false);

  // Compile all logs according to categorized dictionaries or fallback to raw_logs
  const categorized = alert?.logs_categorized || {};

  const categories = [
    { id: 'ALL', label: 'All Logs', icon: Terminal, count: alert?.raw_logs?.length || 0 },
    { id: 'firewall', label: 'Firewall / NIDS', icon: Network, count: categorized.firewall?.length || 0 },
    { id: 'auth', label: 'Auth / Security Events', icon: Key, count: categorized.auth?.length || 0 },
    { id: 'dns', label: 'DNS Queries', icon: Globe, count: categorized.dns?.length || 0 },
    { id: 'proxy', label: 'Web Proxy / HTTP', icon: FileText, count: categorized.proxy?.length || 0 },
  ];

  const currentLogs = useMemo(() => {
    let list = [];
    if (activeCategory === 'ALL') {
      list = alert?.raw_logs || [];
    } else {
      list = categorized[activeCategory] || [];
    }

    if (!filterText.trim()) return list;

    const query = filterText.toLowerCase();
    return list.filter(line => line.toLowerCase().includes(query));
  }, [activeCategory, filterText, alert]);

  const handleCopy = () => {
    if (currentLogs.length > 0) {
      navigator.clipboard.writeText(currentLogs.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      sound.playClick();
    }
  };

  const highlightLog = (text) => {
    // Simple visual syntax parsing
    // Highlights IP addresses, timestamps, keywords
    const parts = text.split(/(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b(?:EventID=\d+|LogonType=\d+|SubStatus=0x[0-9A-Fa-f]+|DROP|ALERT|Success|Failure|Failed|Accepted|CONNECT|POST|GET|SYN|ACK|RST)\b)/gi);

    return parts.map((part, i) => {
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(part)) {
        return <span key={i} className="text-cyan-300 font-bold bg-cyan-950/40 px-1 rounded">{part}</span>;
      }
      if (/^(DROP|Failure|Failed|ALERT|SubStatus=0xC000006A)$/i.test(part)) {
        return <span key={i} className="text-red-400 font-bold bg-red-950/40 px-1 rounded">{part}</span>;
      }
      if (/^(Success|Accepted|EventID=4624)$/i.test(part)) {
        return <span key={i} className="text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded">{part}</span>;
      }
      if (/^(EventID=\d+|LogonType=\d+)$/i.test(part)) {
        return <span key={i} className="text-amber-300 font-bold">{part}</span>;
      }
      if (/^(CONNECT|POST|GET|SYN|ACK|RST)$/i.test(part)) {
        return <span key={i} className="text-purple-300 font-semibold">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#040810] rounded-lg border border-[#1b263b] overflow-hidden">
      {/* Category Tabs & Search Bar */}
      <div className="p-3 bg-[#0a1120] border-b border-[#1b263b] flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); sound.playClick(); }}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/70 shadow-[0_0_10px_rgba(6,182,212,0.2)] font-bold'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-black/50 text-slate-400">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter input & copy */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter logs (grep)..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-8 pr-3 py-1 bg-[#060c18] border border-slate-700 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Copy displayed logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Lines Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 bg-[#040810] font-mono text-xs select-text">
        {currentLogs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
            <FileText className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
            <span>No log entries match the current category / filter filter query.</span>
          </div>
        ) : (
          currentLogs.map((log, index) => (
            <div
              key={index}
              className="log-line p-1 rounded hover:bg-slate-900/60 transition-colors flex items-start gap-2.5 text-slate-300 leading-relaxed"
            >
              <span className="text-slate-600 select-none text-[10px] w-7 text-right flex-shrink-0 pt-0.5">
                {index + 1}
              </span>
              <div className="flex-1 break-all">
                {highlightLog(log)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="px-3 py-1.5 bg-[#090f1d] border-t border-[#1b263b] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div>
          Showing <strong className="text-cyan-300">{currentLogs.length}</strong> entries in {activeCategory.toUpperCase()} stream
        </div>
        <div className="text-[10px] text-slate-500">
          Source: Suricata NIDS / Sysmon / Windows Security Audit Log
        </div>
      </div>
    </div>
  );
}
