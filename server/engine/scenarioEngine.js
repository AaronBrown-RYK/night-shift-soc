const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const scoringEngine = require('./scoring');
const db = require('../db/database');

const SCENARIOS_DIR = path.join(__dirname, '../data/scenarios');
const CAMPAIGN_PATH = path.join(__dirname, '../data/campaign.json');

class ScenarioEngine {
  constructor() {
    this.scenarios = new Map();
    this.campaignShifts = [];
    this.activeShifts = new Map();
    this.loadScenarios();
    this.loadCampaign();
  }

  /**
   * Load and validate all scenario JSON files from the data directory.
   */
  loadScenarios() {
    this.scenarios.clear();
    if (!fs.existsSync(SCENARIOS_DIR)) {
      console.warn(`Scenarios directory not found: ${SCENARIOS_DIR}`);
      return;
    }

    const files = fs.readdirSync(SCENARIOS_DIR).filter(f => f.endsWith('.json'));
    console.log(`[ScenarioEngine] Loading ${files.length} scenario files...`);

    for (const file of files) {
      try {
        const fullPath = path.join(SCENARIOS_DIR, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const scenario = JSON.parse(content);

        if (!scenario.id || !scenario.title || !scenario.optimal_action) {
          console.warn(`[ScenarioEngine] Skipping invalid scenario file: ${file}`);
          continue;
        }

        this.scenarios.set(scenario.id, scenario);
        console.log(`[ScenarioEngine] Loaded scenario: [${scenario.id}] ${scenario.title} (${scenario.category})`);
      } catch (err) {
        console.error(`[ScenarioEngine] Error parsing scenario file ${file}:`, err);
      }
    }
  }

  /**
   * Load handcrafted Phase 3 campaign shifts from campaign.json
   */
  loadCampaign() {
    if (fs.existsSync(CAMPAIGN_PATH)) {
      try {
        const data = JSON.parse(fs.readFileSync(CAMPAIGN_PATH, 'utf8'));
        this.campaignShifts = data.campaign_shifts || [];
        console.log(`[ScenarioEngine] Loaded ${this.campaignShifts.length} handcrafted campaign shifts.`);
      } catch (err) {
        console.error(`[ScenarioEngine] Error loading campaign.json:`, err);
      }
    }
  }

  /**
   * List all campaign shifts with unlock and tier requirements for the analyst.
   */
  getCampaignShifts(analystCallsign = 'Echo-Seven') {
    const profile = db.getAnalystProfile(analystCallsign) || { tier_level: 1, unlocked_campaign_shift: 1 };
    return this.campaignShifts.map(cs => {
      const isUnlocked = cs.shiftNumber <= (profile.unlocked_campaign_shift || 1);
      const meetsTier = (profile.tier_level || 1) >= cs.requiredTier;
      return {
        id: cs.id,
        shiftNumber: cs.shiftNumber,
        title: cs.title,
        subtitle: cs.subtitle,
        requiredTier: cs.requiredTier,
        difficulty: cs.difficulty,
        briefing: cs.briefing,
        targetScore: cs.targetScore,
        scenarioCount: cs.scenarioIds.length,
        isUnlocked,
        meetsTier,
        canLaunch: isUnlocked && meetsTier
      };
    });
  }

  /**
   * Start a handcrafted Campaign shift (1 to 5).
   */
  startCampaignShift({ shiftNumber = 1, analystCallsign = 'Echo-Seven' } = {}) {
    const num = parseInt(shiftNumber, 10);
    const campaignDef = this.campaignShifts.find(cs => cs.shiftNumber === num || cs.id === shiftNumber);
    if (!campaignDef) {
      throw new Error(`Campaign shift #${shiftNumber} not found.`);
    }

    const shiftId = `CAMP-${num}-` + crypto.randomBytes(3).toString('hex').toUpperCase();
    const shiftAlerts = [];

    // Ensure all scenarios are loaded
    if (this.scenarios.size === 0) {
      this.loadScenarios();
    }

    campaignDef.scenarioIds.forEach((scenId, index) => {
      const scenario = this.scenarios.get(scenId);
      if (!scenario) {
        console.warn(`[ScenarioEngine] Scenario ${scenId} missing for campaign shift ${num}`);
        return;
      }
      const offset = (campaignDef.scheduledOffsets && campaignDef.scheduledOffsets[index]) ?? (index * 60 + 20);
      const alertId = `ALT-C${num}-${100 + index}`;
      shiftAlerts.push({
        id: alertId,
        scenarioId: scenario.id,
        scenario: scenario,
        arrivalSecond: offset,
        status: 'PENDING',
        actionTaken: null,
        decisionTimeSeconds: 0,
        triagedAtSecond: null,
        points: 0,
        isCorrect: false,
        feedback: null
      });
    });

    const shiftState = {
      shiftId,
      analystCallsign,
      shiftTitle: campaignDef.title,
      campaignShiftNumber: campaignDef.shiftNumber,
      campaignShiftId: campaignDef.id,
      startedAt: new Date().toISOString(),
      durationSeconds: 600,
      status: 'ACTIVE',
      alerts: shiftAlerts,
      actionsHistory: [],
      score: 0
    };

    this.activeShifts.set(shiftId, shiftState);
    return this.sanitizeShiftState(shiftState, 0);
  }

  /**
   * Start a scripted 3-alert Tutorial Shift for first-time onboarding.
   * Fixed scenarios: Port Scan, Benign Scheduled Scanner, Brute-Force Login.
   */
  startTutorialShift({ analystCallsign = 'Echo-Seven' } = {}) {
    const shiftId = 'TUTORIAL-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    if (this.scenarios.size === 0) {
      this.loadScenarios();
    }

    const portScan = this.scenarios.get('SCENARIO_PORT_SCAN_01');
    const benignScanner = this.scenarios.get('SCENARIO_BENIGN_SCANNER_01');
    const bruteForce = this.scenarios.get('SCENARIO_BRUTE_FORCE_01');

    if (!portScan || !benignScanner || !bruteForce) {
      throw new Error('Required tutorial scenarios (SCENARIO_PORT_SCAN_01, SCENARIO_BENIGN_SCANNER_01, SCENARIO_BRUTE_FORCE_01) not found.');
    }

    const tutorialScenarios = [
      { scenario: portScan, offset: 0, alertId: 'ALT-TUTORIAL-01' },
      { scenario: benignScanner, offset: 0, alertId: 'ALT-TUTORIAL-02' },
      { scenario: bruteForce, offset: 0, alertId: 'ALT-TUTORIAL-03' }
    ];

    const shiftAlerts = tutorialScenarios.map((item) => ({
      id: item.alertId,
      scenarioId: item.scenario.id,
      scenario: item.scenario,
      arrivalSecond: item.offset,
      status: 'PENDING',
      actionTaken: null,
      decisionTimeSeconds: 0,
      triagedAtSecond: null,
      points: 0,
      isCorrect: false,
      feedback: null
    }));

    const shiftState = {
      shiftId,
      analystCallsign,
      shiftTitle: 'Orientation Watch: Tactical Onboarding (Tutorial)',
      isPractice: true,
      isTutorial: true,
      startedAt: new Date().toISOString(),
      durationSeconds: 600,
      status: 'ACTIVE',
      alerts: shiftAlerts,
      actionsHistory: [],
      score: 0
    };

    this.activeShifts.set(shiftId, shiftState);
    return this.sanitizeShiftState(shiftState, 0);
  }

  /**
   * List all registered scenario definitions.
   */
  getAvailableScenarios() {
    return Array.from(this.scenarios.values());
  }

  /**
   * Start a new 10-minute (600s game time) shift for the analyst.
   */
  startShift({ analystCallsign = 'Echo-Seven', shiftTitle = 'Sector 4 Night Triage Watch' } = {}) {
    const shiftId = 'SHIFT-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Select scenarios for this shift:
    // Core requirements: Port scan, Brute force, Phishing click, plus benign baseline alerts
    const scenariosList = Array.from(this.scenarios.values());

    // Fallback if none loaded
    if (scenariosList.length === 0) {
      this.loadScenarios();
    }

    // Staggered arrival offsets across the 10-minute shift: 15s, 75s, 140s, 220s, 310s, 420s
    const scheduledOffsets = [15, 75, 140, 220, 310, 420];
    const shiftAlerts = [];

    // Ensure Phase 1 + Phase 2 key scenarios are present:
    // Port Scan, DNS Tunneling, C2 Beaconing, Word Macro Spawn, Benign Scanner, Brute Force
    const dnsTunnel = scenariosList.find(s => s.id === 'SCENARIO_DNS_TUNNEL_01');
    const c2Beacon = scenariosList.find(s => s.id === 'SCENARIO_C2_BEACON_01');
    const macroSpawn = scenariosList.find(s => s.id === 'SCENARIO_MACRO_PS_01');
    const portScan = scenariosList.find(s => s.category === 'port_scan');
    const bruteForce = scenariosList.find(s => s.category === 'brute_force');
    const benignScanner = scenariosList.find(s => s.id === 'SCENARIO_BENIGN_SCANNER_01');
    const phishing = scenariosList.find(s => s.id === 'SCENARIO_PHISHING_CLICK_01');

    // Build balanced shift containing both Phase 1 foundational and Phase 2 featured scenarios
    const orderedScenarios = [
      portScan || scenariosList[0],
      bruteForce || scenariosList[1],
      benignScanner || scenariosList[2],
      dnsTunnel || scenariosList[3],
      c2Beacon || scenariosList[4],
      macroSpawn || scenariosList[5]
    ].filter(Boolean);

    orderedScenarios.forEach((scenario, index) => {
      const offset = scheduledOffsets[index] ?? (index * 60 + 30);
      const alertId = `ALT-${1000 + index + Math.floor(Math.random() * 899)}`;
      shiftAlerts.push({
        id: alertId,
        scenarioId: scenario.id,
        scenario: scenario,
        arrivalSecond: offset,
        status: 'PENDING', // PENDING, TRIAGED
        actionTaken: null,
        decisionTimeSeconds: 0,
        triagedAtSecond: null,
        points: 0,
        isCorrect: false,
        feedback: null
      });
    });

    const shiftState = {
      shiftId,
      analystCallsign,
      shiftTitle,
      startedAt: new Date().toISOString(),
      durationSeconds: 600, // 10 minutes game time
      status: 'ACTIVE',
      alerts: shiftAlerts,
      actionsHistory: [],
      score: 0
    };

    this.activeShifts.set(shiftId, shiftState);
    return this.sanitizeShiftState(shiftState, 0);
  }

  /**
   * Return client-safe view of the shift according to current elapsed game seconds.
   * Only reveals alerts that have arrived by gameSecond.
   */
  getShiftState(shiftId, gameSecond = 0) {
    const shift = this.activeShifts.get(shiftId);
    if (!shift) return null;
    return this.sanitizeShiftState(shift, gameSecond);
  }

  /**
   * Sanitize shift state for the client.
   * Exposes investigation tools datasets (categorized logs, PCAP, Threat Intel, Endpoint Processes).
   */
  sanitizeShiftState(shift, gameSecond) {
    const visibleAlerts = shift.alerts
      .filter(a => a.arrivalSecond <= gameSecond)
      .map(a => {
        return {
          id: a.id,
          scenarioId: a.scenarioId,
          arrivalSecond: a.arrivalSecond,
          title: a.scenario.title,
          category: a.scenario.category,
          severity: a.scenario.severity,
          source_ip: a.scenario.source_ip,
          destination_ip: a.scenario.destination_ip,
          destination_port: a.scenario.destination_port,
          protocol: a.scenario.protocol,
          rule_fired: a.scenario.rule_fired,
          hostname: a.scenario.hostname,
          summary: a.scenario.summary,
          raw_logs: a.scenario.raw_logs,
          logs_categorized: a.scenario.logs_categorized || {
            firewall: a.scenario.raw_logs || [],
            auth: [],
            dns: [],
            proxy: []
          },
          pcap_packets: a.scenario.pcap_packets || [],
          threat_intel: a.scenario.threat_intel || {},
          endpoint_processes: a.scenario.endpoint_processes || [],
          status: a.status,
          actionTaken: a.actionTaken,
          points: a.points,
          isCorrect: a.isCorrect,
          feedback: a.feedback,
          educationalRationale: a.status === 'TRIAGED' ? a.scenario.educational_rationale : null
        };
      });

    const pendingCount = visibleAlerts.filter(a => a.status === 'PENDING').length;
    const triagedCount = visibleAlerts.filter(a => a.status === 'TRIAGED').length;
    const totalScheduled = shift.alerts.length;

    return {
      shiftId: shift.shiftId,
      analystCallsign: shift.analystCallsign,
      shiftTitle: shift.shiftTitle,
      campaignShiftNumber: shift.campaignShiftNumber || null,
      campaignShiftId: shift.campaignShiftId || null,
      isPractice: Boolean(shift.isPractice),
      isTutorial: Boolean(shift.isTutorial),
      durationSeconds: shift.durationSeconds,
      status: shift.status,
      gameSecond,
      score: shift.score,
      pendingCount,
      triagedCount,
      totalScheduled,
      alerts: visibleAlerts
    };
  }

  /**
   * Execute an analyst action on an alert:
   * Action must be one of: 'Dismiss', 'Escalate', 'Block IP', 'Isolate Host'
   */
  processAction(shiftId, { alertId, actionTaken, gameSecond = 0 }) {
    const shift = this.activeShifts.get(shiftId);
    if (!shift) throw new Error(`Shift not found: ${shiftId}`);
    if (shift.status !== 'ACTIVE') throw new Error(`Shift is already completed.`);

    const alert = shift.alerts.find(a => a.id === alertId);
    if (!alert) throw new Error(`Alert not found: ${alertId}`);
    if (alert.status === 'TRIAGED') throw new Error(`Alert ${alertId} has already been triaged.`);

    const validActions = ['Dismiss', 'Escalate', 'Block IP', 'Isolate Host'];
    if (!validActions.includes(actionTaken)) {
      throw new Error(`Invalid action: ${actionTaken}. Must be one of: ${validActions.join(', ')}`);
    }

    const decisionTime = Math.max(1, gameSecond - alert.arrivalSecond);

    // Evaluate action with scoring engine
    const evaluation = scoringEngine.evaluateAction(alert.scenario, actionTaken, decisionTime);

    // Update alert status
    alert.status = 'TRIAGED';
    alert.actionTaken = actionTaken;
    alert.triagedAtSecond = gameSecond;
    alert.decisionTimeSeconds = decisionTime;
    alert.points = evaluation.totalPoints;
    alert.isCorrect = evaluation.isCorrect;
    alert.feedback = evaluation.feedback;

    // Record action
    const actionRecord = {
      alertId: alert.id,
      scenarioId: alert.scenarioId,
      actionTaken,
      optimalAction: evaluation.optimalAction,
      isCorrect: evaluation.isCorrect,
      points: evaluation.totalPoints,
      decisionTimeSeconds: decisionTime,
      feedback: evaluation.feedback,
      rationale: evaluation.educationalRationale?.deep_dive || ''
    };
    shift.actionsHistory.push(actionRecord);
    shift.score += evaluation.totalPoints;

    return {
      result: evaluation,
      currentShiftScore: shift.score,
      updatedAlert: {
        id: alert.id,
        status: alert.status,
        actionTaken: alert.actionTaken,
        points: alert.points,
        isCorrect: alert.isCorrect,
        feedback: alert.feedback,
        educationalRationale: alert.scenario.educational_rationale
      }
    };
  }

  /**
   * Complete shift, compile debrief report, and record to SQLite database.
   */
  completeShift(shiftId, finalGameSecond = 600) {
    const shift = this.activeShifts.get(shiftId);
    if (!shift) throw new Error(`Shift not found: ${shiftId}`);

    shift.status = 'COMPLETED';
    shift.endedAt = new Date().toISOString();

    // Compile comprehensive end-of-shift report
    const report = scoringEngine.compileShiftReport(shift, shift.actionsHistory);

    // Persist into SQLite
    try {
      db.saveShiftResult({
        shiftId: shift.shiftId,
        analystCallsign: shift.analystCallsign,
        shiftTitle: shift.shiftTitle,
        campaignShiftNumber: shift.campaignShiftNumber || null,
        isPractice: Boolean(shift.isPractice),
        startedAt: shift.startedAt,
        endedAt: shift.endedAt,
        durationSeconds: finalGameSecond,
        finalScore: report.finalScore,
        accuracyPercent: report.accuracyPercent,
        mtttSeconds: report.mtttSeconds,
        totalAlerts: report.totalAlerts,
        caughtCount: report.caughtCount,
        missedCount: report.missedCount,
        falsePositivePenalties: report.falsePositivePenalties,
        actions: shift.actionsHistory
      });
    } catch (dbErr) {
      console.error('[ScenarioEngine] Error persisting shift to database:', dbErr);
    }

    // Get updated analyst career profile
    const updatedAnalyst = db.getAnalystProfile(shift.analystCallsign);

    return {
      shiftId: shift.shiftId,
      report,
      analystProfile: updatedAnalyst
    };
  }

  /**
   * Threat Intel Lookup for any queried IP.
   * Returns readable intelligence evidence without spoiling answers.
   */
  lookupThreatIntel(ip) {
    if (!ip) return null;
    const cleanIp = ip.trim();

    // 1. Search across scenario threat intel dictionaries
    for (const scenario of this.scenarios.values()) {
      if (scenario.threat_intel && scenario.threat_intel[cleanIp]) {
        return scenario.threat_intel[cleanIp];
      }
    }

    // 2. RFC 1918 Private Internal
    if (cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)) {
      return {
        ip: cleanIp,
        reputation_score: 0,
        verdict: 'Internal Corporate Address',
        threat_level: 'CLEAN',
        asn: 'RFC 1918 Private Intranet',
        country: 'LOCAL',
        domain: 'intranet.corp.local',
        threat_types: ['Corporate LAN Asset'],
        passive_dns_count: 0,
        first_seen: '2024-01-01',
        reports_summary: 'Private corporate IP address space. Not routable on the public internet.'
      };
    }

    // 3. Known Public DNS
    if (cleanIp === '8.8.8.8' || cleanIp === '8.8.4.4') {
      return {
        ip: cleanIp,
        reputation_score: 0,
        verdict: 'Trusted Public Resolver',
        threat_level: 'CLEAN',
        asn: 'AS15169 (Google LLC)',
        country: 'US',
        domain: 'dns.google',
        threat_types: ['Public Recursive Anycast DNS'],
        passive_dns_count: 120000,
        first_seen: '2009-12-03',
        reports_summary: 'Verified benign global anycast resolver operated by Google.'
      };
    }
    if (cleanIp === '1.1.1.1' || cleanIp === '1.0.0.1') {
      return {
        ip: cleanIp,
        reputation_score: 0,
        verdict: 'Trusted Public Resolver',
        threat_level: 'CLEAN',
        asn: 'AS13335 (Cloudflare, Inc.)',
        country: 'US',
        domain: 'one.one.one.one',
        threat_types: ['Public Recursive Anycast DNS'],
        passive_dns_count: 95000,
        first_seen: '2018-04-01',
        reports_summary: 'Verified benign privacy-first public anycast resolver operated by Cloudflare and APNIC.'
      };
    }

    // 4. Default Unknown / Neutral Public IP
    return {
      ip: cleanIp,
      reputation_score: 18,
      verdict: 'Unknown / Insufficient Telemetry',
      threat_level: 'UNRATED',
      asn: 'AS7922 (Comcast Cable Communications)',
      country: 'US',
      domain: 'dynamic-cust.net',
      threat_types: ['Residential ISP Pool'],
      passive_dns_count: 3,
      first_seen: '2026-06-20',
      reports_summary: 'No active malicious abuse reports found in community feeds. Insufficient historical telemetry to classify as hostile.'
    };
  }
}

module.exports = new ScenarioEngine();
