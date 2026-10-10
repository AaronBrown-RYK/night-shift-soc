# Night Shift: SOC (Security Operations Center Simulator)

> *"Papers, Please" meets a modern SIEM dashboard.*

**Night Shift: SOC** is a browser-based cybersecurity incident response simulator game. You sit at a Tier 1 SOC analyst workstation during a high-tempo night watch: alerts fire in real time, you inspect raw telemetry and SIEM logs, evaluate the indicators of compromise, and dispatch mitigation actions before adversaries establish persistent footholds.

## 🎖️ Phase 3 Features (Campaign & Progression — Completed & Playable)

Phase 3 introduces handcrafted campaign operations, hierarchical analyst promotion, and deep pedagogical attack scenarios:

1. **5 Handcrafted Campaign Shifts (`campaign.json`)**:
   - **Shift 1: The Onboarding Watch** (*Introductory • Req: Tier 1*):
     - Perimeter reconnaissance & baseline discipline. Filter internal Nessus sweeps while mitigating external port scans and credential stuffing.
   - **Shift 2: Phishing & Payload Infiltration** (*Standard • Req: Tier 1*):
     - Distinguish authorized DevOps automation pushes from weaponized Office macros spawning hidden PowerShell reverse shells.
   - **Shift 3: Covert Channels & Beaconing** (*Advanced • Req: Tier 2 Threat Hunter*):
     - Identify time-series jitter patterns in periodic C2 heartbeats and decode DNS TXT exfiltration payloads.
   - **Shift 4: The Insider & Supply Chain Breach** (*High • Req: Tier 2 Threat Hunter*):
     - Distinguish legitimate off-hours database replication from rogue insider data egress (`rclone.exe`), and inspect signed vendor binaries accessing LSASS memory (`PROCESS_VM_READ 0x1410`).
   - **Shift 5: Zero Hour — Ransomware Outbreak** (*Maximum • Req: Tier 3 Senior Incident Responder*):
     - Emergency outbreak response: contain SMB lateral movement across port 445 (`ADMIN$`), intercept Volume Shadow Copy deletion (`vssadmin delete shadows /all /quiet`), and isolate hosts before disk encryption completes.

2. **Analyst Ranks & Tier Tool Gating**:
   - **Tier 1 (Triage Analyst)**: Unlocks *Filterable Log Viewer* and perimeter *Block IP*. Advanced tools display security clearance lock screens.
   - **Tier 2 (Threat Hunter — 400 XP)**: Unlocks *Wireshark Packet Capture Dissector* and *Threat Intel Feed*.
   - **Tier 3 (Senior Incident Responder — 1200 XP)**: Unlocks *EDR Process Tree Inspector* and network-wide *Host Isolation*.
   - **Sandbox Rank Override**: Built directly into the Analyst Dossier modal for instant testing and evaluation of all clearance tiers!

3. **Persistent Career Analytics & Accuracy Trend**:
   - Visual historical accuracy % bar chart tracking performance trajectory across shifts.
   - Interactive XP progress bar indicating points needed for the next rank promotion.
   - Persistent campaign shift unlocks tracked in SQLite.

4. **Realistic Benign Noise Events (False-Positive Discipline)**:
   - Routine vulnerability scanner sweeps (`SCENARIO_BENIGN_SCANNER_01`).
   - Automated DevOps configuration pushes (`SCENARIO_BENIGN_ADMIN_01`).
   - Off-hours database disaster recovery replication (`SCENARIO_BENIGN_BACKUP_01`).
   - Nightly analytics warehouse ETL syncs (`SCENARIO_BENIGN_ETL_01`).

---

## 🔍 Phase 2 Features (Investigation Tools Suite — Completed & Playable)

In Phase 2, the incident detail console transforms into a full multi-tool forensic investigation workspace:

1. **Log Viewer (`LogViewerTab`)**:
   - Filter logs by category: `All Logs`, `Firewall / NIDS`, `Auth / Security Events`, `DNS Queries`, `Web Proxy / HTTP`.
   - Real-time `grep` search filter.
   - Syntax highlighting for IP addresses, Event IDs (e.g. 4625, 4624), status codes, HTTP verbs, and firewall flags.
   - One-click clipboard copy.

2. **Packet Capture Viewer (`PcapViewerTab` — Simplified Wireshark)**:
   - Wireshark-style packet table: Packet #, Timestamp, Delta time (+s), Source IP, Destination IP, Protocol tag, Length, Flags & Info.
   - Interactive packet inspector:
     - **Frame Protocol Layer Dissection**: Layer 2 (Ethernet II), Layer 3 (IPv4), Layer 4 (TCP/UDP), Layer 7 (Application Payload).
     - **Raw Hex Dump & ASCII translation pane**: Inspect raw packet bytes.
   - Protocol filtering (`ALL`, `TCP`, `DNS`, `HTTP`) and search filter.
   - **DNS Tunneling Scenario**: High-entropy UDP port 53 packets with base64 chunked subdomains exfiltrating database records through recursive resolvers.
   - **C2 Beaconing Scenario**: Regular interval callbacks (exactly 30.0s interval with zero jitter) and identical 412-byte packet sizes, proving automated implant polling.

3. **IP Reputation Lookup (`ThreatIntelTab` — VirusTotal / AlienVault OTX style)**:
   - Interactive IP query search bar with 1-click shortcuts for Alert Source IP and Alert Destination IP.
   - Dynamic backend endpoint: `GET /api/threat-intel/lookup?ip=...`.
   - Threat score meter (0-100), Verdict badge (`MALICIOUS`, `SUSPICIOUS`, `INTERNAL`, `CLEAN`, `UNRATED`).
   - Autonomous System (ASN), Geolocation, Hosting provider classification, and Domain association.
   - Threat campaign tags (e.g. `Cobalt Strike Team Server`, `Tor Exit Node`, `DNS Tunneling C2`, `Verified Scanner`).
   - Community narrative and Passive DNS resolution counts.
   - *Readable evidence, not answers*: Provides threat telemetry without spoiling the correct action!

4. **Host Endpoint Process Viewer (`EndpointViewerTab` — EDR / Sysmon / Crowdstrike style)**:
   - Live endpoint host summary: Hostname, IP, OS, EDR Falcon Sensor status.
   - **Interactive Process Execution Lineage Tree**: Visual parent-child hierarchy (e.g. `explorer.exe` &rarr; `WINWORD.EXE` &rarr; `cmd.exe` &rarr; `powershell.exe`).
   - Process inspector details: PID, Parent PID (PPID), User Context, Integrity Level, SHA256 Hash.
   - **Inline Base64 Payload Deobfuscator**: Automatically extracts and decodes `-EncodedCommand` or hidden PowerShell scripts so the analyst can see the underlying command payload!
   - Process anomaly warnings: Flags suspicious behaviors (e.g. Word spawning cmd.exe, Print Spooler initiating external WAN internet sockets).

---

## 🎮 Phase 1 Features (Core Shift Loop)

- **10-Minute Shift Structure**: Shifts are simulated over 10 minutes of game time. Includes tactical clock controls:
  - Pause / Resume
  - Pacing multipliers: `1x`, `2x` (default), `5x`
  - `Next Alert` fast-forward to jump directly to incoming incidents.
- **Triage Queue**: Staggered queue with severity tags (**Low**, **Medium**, **High**, **Critical**), status counters, and active alert timers.
- **SIEM Telemetry & Raw Log Viewer**:
  - Detailed incident panel displaying Source IP, Destination IP, Target Asset, Port/Protocol, and triggered SIEM/NIDS rules.
  - Interactive terminal window rendering realistic Syslog, Windows Event (Event ID 4625 / 4624 / 4672), Suricata IDS, and Proxy logs.
  - In-terminal `grep` filter and one-click log copy.
- **Analyst Action Matrix**:
  - `Dismiss (False Positive)` — Clear benign baseline noise or authorized scheduled activity.
  - `Escalate (Tier 2 IR)` — Dispatch to senior threat hunters for deep reverse engineering.
  - `Block IP (Border Firewall)` — Inject automated DROP rules at the network perimeter.
  - `Isolate Host (EDR Containment)` — Sever endpoint NIC to cut off lateral movement and C2 beaconing.
- **Asymmetric Scoring & Pedagogy**:
  - Teaches the real-world operational trade-offs of triage:
    - Optimal remediation: `+120` to `+150` pts (+ speed bonus)
    - Benign dismissal: `+80` to `+90` pts
    - Escalating false positive: `-25` to `-30` pts (minor bandwidth penalty)
    - **Dismissing a real attack (False Negative)**: `-250` to `-300` pts (severe breach penalty!)
    - Erroneously isolating critical infrastructure: `-180` to `-200` pts
- **End-of-Shift Debrief Report**:
  - Performance rating badge: `S`, `A`, `B`, `C`, or `F` ("Breach Incurred")
  - Accuracy %, Mean Time to Triage (MTTT in seconds), Final Score
  - Caught vs Missed vs False Positive disruption metrics
  - Detailed forensic audit breakdown of every alert with CompTIA **Network+** and **Security+** curriculum concepts.
- **Data-Driven Scenario Engine**:
  - All scenarios defined in standalone JSON files under `server/data/scenarios/` — zero hardcoded scenarios in engine logic.
  - 5 Scenarios included:
    1. `Aggressive TCP SYN Scan from External IP` (Half-open port scan)
    2. `SSH/RDP Credential Stuffing Burst with Compromise` (Event ID 4625 flood into Event 4624 elevated logon)
    3. `Credential Harvest Phish & Dropper Execution` (Typosquatted domain, LOLBin mshta/powershell execution)
    4. `Internal Security Scanner Routine Sweep` (Benign Qualys/Nessus scheduled audit — tests false-positive discipline)
    5. `Automated IT DevOps Configuration Push` (Benign Ansible public-key automation push)
- **SQLite Persistence**:
  - Persistent database (`server/db/night_shift_soc.db`) storing analyst career profile, lifetime score, rank progression (Tier 1 → Tier 2 → Tier 3), total shifts, and audit logs.
  - Accessible in-game via the **Analyst Dossier** modal.
- **SOP Handbook**:
  - In-game reference desk binder explaining triage heuristics and CompTIA exam topics.

---

## 🛠️ Tech Stack & Directory Structure

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Web Audio API synthesizer.
- **Backend**: Node.js, Express, native `node:sqlite` persistence, RESTful API.
- **Structure**:
  ```
  night-shift-soc/
  ├── client/                     # React + Vite frontend
  │   ├── src/
  │   │   ├── components/         # Header, AlertQueue, AlertDetail, ShiftReportModal, AnalystDossierModal, SOPReferenceModal
  │   │   ├── services/           # api.js, audio.js (Web Audio synthesizer)
  │   │   ├── App.jsx             # Main shift state loop & event coordinator
  │   │   ├── index.css           # CRT scanlines, cyber theme, severity badges
  │   │   └── main.jsx
  │   ├── package.json
  │   └── vite.config.js
  ├── server/                     # Node.js + Express backend
  │   ├── data/
  │   │   └── scenarios/          # Data-driven JSON scenario files
  │   ├── db/
  │   │   ├── database.js         # SQLite schema & persistence
  │   │   └── night_shift_soc.db  # SQLite database file
  │   ├── engine/
  │   │   ├── scenarioEngine.js   # Timeline dispatcher & shift manager
  │   │   └── scoring.js          # Asymmetric scoring & pedagogical feedback
  │   ├── routes/                 # shiftRoutes.js, analystRoutes.js
  │   ├── server.js               # Express application
  │   └── test_e2e_shift.js       # Automated end-to-end integration test
  └── README.md
  ```

---

## 🚀 Run Instructions

### Prerequisites
- Node.js (v20+ or v24+ recommended)
- Windows PowerShell, macOS terminal, or Linux bash

### Quick Start (Single Server Mode)
The Express backend automatically serves both the API and the pre-built React frontend:

1. **Navigate to the server directory**:
   ```bash
   cd night-shift-soc/server
   ```
2. **Start the server**:
   ```bash
   node server.js
   ```
3. Open your browser at:
   👉 **`http://localhost:3001`**

---

### Development Mode (Separate Client & Server)

If you wish to modify React components with Vite Hot-Module Replacement (HMR):

1. **Start the backend server** (Terminal 1):
   ```bash
   cd night-shift-soc/server
   npm install
   node server.js
   ```
   *(Backend runs on `http://localhost:3001`)*

2. **Start the Vite dev server** (Terminal 2):
   ```bash
   cd night-shift-soc/client
   npm install
   npm run dev
   ```
   *(Frontend runs on `http://localhost:5173` with automatic API proxying to port 3001)*

---

## 🧭 Guided Tutorial Shift (First-Time Analyst Onboarding)

A zero-friction, interactive onboarding experience specifically crafted for players new to SIEM consoles and alert triage:

1. **Auto-Prompt On Launch**:
   - Analysts with 0 shifts completed in SQLite receive a welcoming **"Start Tutorial Shift"** orientation modal on first visit.
   - A permanent **"Tutorial"** compass button in the top navigation bar allows replays at any time.
2. **Practice Shift Isolation**:
   - Tutorial shifts are marked `is_practice: 1` in SQLite and do **NOT** count toward lifetime stats, rank XP, or career penalties.
   - Completion sets `tutorial_completed = 1` in SQLite to prevent recurring prompts.
3. **Interactive 7-Step Overlay HUD**:
   - **Step 1 — The Queue**: Spotlight bounding box on Incident Triage Queue explaining incoming volume, speed vs. accuracy tradeoffs.
   - **Step 2 — Reading An Alert**: Auto-selects Alert 1 (Port Scan), highlights who, where, and what fired (`ET SCAN Potential SSH Scan`).
   - **Step 3 — Investigating**: Guides analyst to open Log Viewer and identify half-open `[SYN]` packets without handshakes.
   - **Step 4 — Taking Action**: Highlights remediation buttons and explains the asymmetric cost of false negatives (-300). Player executes **Block IP**.
   - **Step 5 — The False Positive**: Focuses Alert 2 (Nessus internal vulnerability sweep), guides detection of authorized `CHG-2026-881` change ticket, and player clicks **Dismiss**.
   - **Step 6 — Solo Rep**: Alert 3 (Brute-force credential stuffing). Hands-off independent triage with an interactive **"Hint"** button explaining Windows Event IDs (`4625` vs `4624`).
   - **Step 7 — Debrief & Graduation**: End-of-shift report featuring the Tutorial Graduation Summary Panel reinforcing the core SOC loop: *read &rarr; investigate &rarr; decide*.
4. **Skippable & Resumable**:
   - Every tooltip features an immediate **"Skip"** button allowing seasoned analysts to bypass guidance instantly.

---

### Running Automated Verification Tests
To verify Phase 1 core shift mechanics and scoring:
```bash
cd night-shift-soc
node server/test_e2e_shift.js
```

To verify Phase 2 investigation tools (Categorized logs, Wireshark PCAP with DNS tunneling & C2 beaconing delta timing, Threat Intel lookups, and Endpoint Process trees):
```bash
cd night-shift-soc
node server/test_e2e_phase2.js
```

To verify the Phase 4 Guided Tutorial shift loop, database isolation, and scoring:
```bash
cd night-shift-soc
node server/test_e2e_tutorial.js
```
