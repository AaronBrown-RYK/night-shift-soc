import React, { useState } from 'react';
import { Activity, Network, ArrowRight, Radio, Search, ChevronRight, ChevronDown, Layers, Binary } from 'lucide-react';
import { sound } from '../../services/audio';

export default function PcapViewerTab({ alert }) {
  const [selectedPacketNo, setSelectedPacketNo] = useState(1);
  const [filterProto, setFilterProto] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const packets = alert?.pcap_packets || [];

  const filteredPackets = packets.filter(pkt => {
    if (filterProto !== 'ALL' && pkt.protocol.toUpperCase() !== filterProto) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        pkt.source.toLowerCase().includes(q) ||
        pkt.destination.toLowerCase().includes(q) ||
        pkt.info.toLowerCase().includes(q) ||
        pkt.protocol.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedPacket = packets.find(p => p.no === selectedPacketNo) || packets[0] || null;

  const getProtocolBadge = (proto) => {
    switch (proto.toUpperCase()) {
      case 'DNS':
        return 'bg-blue-950 text-blue-300 border-blue-700/60';
      case 'HTTP':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700/60';
      case 'TLSV1.2':
      case 'HTTPS':
        return 'bg-cyan-950 text-cyan-300 border-cyan-700/60';
      case 'RDP':
        return 'bg-purple-950 text-purple-300 border-purple-700/60';
      case 'SSH':
        return 'bg-amber-950 text-amber-300 border-amber-700/60';
      case 'TCP':
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#040810] rounded-lg border border-[#1b263b] overflow-hidden select-text">
      {/* Wireshark Header & Filter Bar */}
      <div className="p-2.5 bg-[#0a1120] border-b border-[#1b263b] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-mono font-bold">
            <Radio className="w-3.5 h-3.5" />
            <span>WIRESHARK PCAP DISSECTOR</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {packets.length} Packets Captured
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900/80 rounded border border-slate-800 p-0.5 text-[11px] font-mono">
            {['ALL', 'TCP', 'DNS', 'HTTP'].map(p => (
              <button
                key={p}
                onClick={() => { setFilterProto(p); sound.playClick(); }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterProto === p ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Display filter (e.g. port 53)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2.5 py-1 bg-[#060c18] border border-slate-700 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 w-36 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Top Half: Wireshark Packet List Table */}
      <div className="h-52 overflow-y-auto border-b border-[#1b263b] bg-[#070c18]">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead className="sticky top-0 bg-[#0d1627] text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider select-none">
            <tr>
              <th className="p-1.5 pl-2.5 w-12">No.</th>
              <th className="p-1.5 w-24">Time (s)</th>
              <th className="p-1.5 w-20">Delta</th>
              <th className="p-1.5 w-32">Source</th>
              <th className="p-1.5 w-32">Destination</th>
              <th className="p-1.5 w-16">Proto</th>
              <th className="p-1.5 w-14">Len</th>
              <th className="p-1.5">Info / Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {filteredPackets.map((pkt) => {
              const isSelected = selectedPacket?.no === pkt.no;
              return (
                <tr
                  key={pkt.no}
                  onClick={() => { setSelectedPacketNo(pkt.no); sound.playClick(); }}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-200 font-semibold border-l-2 border-cyan-400'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <td className="p-1.5 pl-2.5 text-slate-500">{pkt.no}</td>
                  <td className="p-1.5 text-slate-300">{pkt.time}</td>
                  <td className={`p-1.5 font-bold ${
                    pkt.delta && parseFloat(pkt.delta) > 28 && parseFloat(pkt.delta) < 32 
                      ? 'text-amber-400 bg-amber-950/30' 
                      : 'text-slate-400'
                  }`}>
                    {pkt.delta ? `+${pkt.delta}s` : '0.000s'}
                  </td>
                  <td className="p-1.5 truncate text-slate-200">{pkt.source}</td>
                  <td className="p-1.5 truncate text-slate-200">{pkt.destination}</td>
                  <td className="p-1.5">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border ${getProtocolBadge(pkt.protocol)}`}>
                      {pkt.protocol}
                    </span>
                  </td>
                  <td className="p-1.5 text-slate-400">{pkt.length}</td>
                  <td className="p-1.5 truncate text-slate-200" title={pkt.info}>
                    {pkt.info}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Half: Detailed Packet Dissection Split Pane */}
      {selectedPacket ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#040810]">
          {/* Left: Layer Dissection Tree */}
          <div className="w-full md:w-1/2 p-3 border-r border-[#1b263b] overflow-y-auto space-y-2 font-mono text-xs">
            <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5" />
              Frame #{selectedPacket.no} Protocol Layers
            </div>

            <div className="space-y-1.5">
              {/* Layer 2: Ethernet */}
              <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold">
                  Layer 2 • Ethernet II
                </div>
                <div className="text-slate-300 text-[11px] mt-0.5">
                  {selectedPacket.details?.layer_eth || `Source MAC -> Destination MAC`}
                </div>
              </div>

              {/* Layer 3: IPv4 */}
              <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold">
                  Layer 3 • Internet Protocol Version 4
                </div>
                <div className="text-slate-300 text-[11px] mt-0.5">
                  {selectedPacket.details?.layer_ip || `Src: ${selectedPacket.source} -> Dst: ${selectedPacket.destination}`}
                </div>
              </div>

              {/* Layer 4: TCP / UDP */}
              <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold">
                  Layer 4 • Transport Layer ({selectedPacket.protocol})
                </div>
                <div className="text-slate-300 text-[11px] mt-0.5">
                  {selectedPacket.details?.layer_trans || `Flags: ${selectedPacket.flags || 'None'}`}
                </div>
              </div>

              {/* Layer 7: Application Protocol / Payload */}
              <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/60">
                <div className="text-[11px] text-cyan-300 font-semibold">
                  Layer 7 • Application Payload ({selectedPacket.protocol})
                </div>
                <div className="text-slate-200 text-[11px] mt-0.5 leading-relaxed font-sans">
                  {selectedPacket.details?.layer_app || selectedPacket.info}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hex Dump & ASCII representation */}
          <div className="w-full md:w-1/2 p-3 overflow-y-auto font-mono text-xs bg-[#03060d]">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-purple-400" />
                Raw Packet Payload Bytes
              </span>
              <span className="text-[10px] text-slate-500">
                {selectedPacket.length} bytes
              </span>
            </div>

            <div className="p-2.5 rounded bg-black/60 border border-slate-800/80 text-[11px] space-y-1 text-slate-300 font-mono leading-relaxed break-all select-all">
              {selectedPacket.payload_preview ? (
                <div>{selectedPacket.payload_preview}</div>
              ) : (
                <div className="text-slate-500">00 00 00 00 00 00 ... [Header only / No payload data]</div>
              )}
            </div>

            <div className="mt-3 p-2 rounded bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400">
              <span className="text-amber-400 font-bold block mb-0.5">Forensic Analysis Clue:</span>
              {selectedPacket.flags?.includes('30.0s') || (selectedPacket.delta && parseFloat(selectedPacket.delta) >= 29 && parseFloat(selectedPacket.delta) <= 31) ? (
                <span className="text-amber-300">
                  Notice the exact ~30.0 second delta timing between consecutive packets with identical length ({selectedPacket.length} bytes). Programmed intervals with zero jitter denote automated C2 heartbeat polling.
                </span>
              ) : selectedPacket.protocol === 'DNS' && selectedPacket.info.includes('TXT') ? (
                <span className="text-cyan-300">
                  Notice the base64/hex chunk query payload in the TXT question record. Covert DNS tunneling encodes data in subdomains to exfiltrate database records through recursive nameservers.
                </span>
              ) : (
                <span>
                  Inspect TCP sequence numbers and flags (SYN without ACK) to differentiate reconnaissance sweeps from established connections.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
          Select a packet from the capture table to view protocol dissection.
        </div>
      )}
    </div>
  );
}
