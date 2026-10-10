const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, 'night_shift_soc.db');

class SOCDatabase {
  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.initTables();
    this.seedDefaultAnalyst();
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analysts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        callsign TEXT UNIQUE NOT NULL,
        badge_number TEXT NOT NULL,
        rank TEXT NOT NULL DEFAULT 'Tier 1 Triage Analyst',
        tier_level INTEGER NOT NULL DEFAULT 1,
        score INTEGER NOT NULL DEFAULT 0,
        shifts_completed INTEGER NOT NULL DEFAULT 0,
        total_alerts_triaged INTEGER NOT NULL DEFAULT 0,
        correct_actions INTEGER NOT NULL DEFAULT 0,
        unlocked_campaign_shift INTEGER NOT NULL DEFAULT 1,
        tutorial_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        analyst_id INTEGER NOT NULL,
        shift_title TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        final_score INTEGER NOT NULL,
        accuracy_percent REAL NOT NULL,
        mttt_seconds REAL NOT NULL,
        total_alerts INTEGER NOT NULL,
        caught_count INTEGER NOT NULL,
        missed_count INTEGER NOT NULL,
        false_positive_penalties INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        is_practice INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (analyst_id) REFERENCES analysts(id)
      );

      CREATE TABLE IF NOT EXISTS shift_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shift_id TEXT NOT NULL,
        alert_id TEXT NOT NULL,
        scenario_id TEXT NOT NULL,
        action_taken TEXT NOT NULL,
        optimal_action TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        points INTEGER NOT NULL,
        decision_time_seconds REAL NOT NULL,
        rationale TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shift_id) REFERENCES shifts(id)
      );
    `);

    // Migration safe checks for columns in analysts & shifts
    try {
      this.db.exec('ALTER TABLE analysts ADD COLUMN unlocked_campaign_shift INTEGER NOT NULL DEFAULT 1;');
    } catch {}
    try {
      this.db.exec('ALTER TABLE analysts ADD COLUMN tutorial_completed INTEGER NOT NULL DEFAULT 0;');
    } catch {}
    try {
      this.db.exec('ALTER TABLE shifts ADD COLUMN is_practice INTEGER NOT NULL DEFAULT 0;');
    } catch {}
  }

  seedDefaultAnalyst() {
    const existing = this.db.prepare('SELECT * FROM analysts WHERE callsign = ?').get('Echo-Seven');
    if (!existing) {
      this.db.prepare(`
        INSERT INTO analysts (callsign, badge_number, rank, tier_level, score, shifts_completed, total_alerts_triaged, correct_actions, unlocked_campaign_shift, tutorial_completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('Echo-Seven', 'SOC-8492', 'Tier 1 Triage Analyst', 1, 0, 0, 0, 0, 1, 0);
    }
  }

  getAnalystProfile(callsign = 'Echo-Seven') {
    const row = this.db.prepare('SELECT * FROM analysts WHERE callsign = ?').get(callsign);
    if (!row) return null;

    // Only non-practice shifts count toward accuracy trend
    const recentShifts = this.db.prepare(`
      SELECT * FROM shifts WHERE analyst_id = ? AND (is_practice = 0 OR is_practice IS NULL) ORDER BY started_at DESC LIMIT 10
    `).all(row.id);

    // Compute accuracy trend chronologically (oldest to newest for trend line)
    const accuracyTrend = [...recentShifts].reverse().map(s => ({
      shiftId: s.id,
      shiftTitle: s.shift_title,
      accuracyPercent: s.accuracy_percent,
      finalScore: s.final_score,
      mtttSeconds: s.mttt_seconds,
      date: s.started_at
    }));

    // Tier configuration & unlocked tools
    const TIER_THRESHOLDS = {
      1: { name: 'Tier 1 Triage Analyst', nextScore: 400, tools: ['LOGS', 'BLOCK_IP'] },
      2: { name: 'Tier 2 Threat Hunter', nextScore: 1200, tools: ['LOGS', 'BLOCK_IP', 'PCAP', 'INTEL'] },
      3: { name: 'Tier 3 Senior Incident Responder', nextScore: null, tools: ['LOGS', 'BLOCK_IP', 'PCAP', 'INTEL', 'ENDPOINT', 'ISOLATE_HOST'] }
    };

    const currentTier = row.tier_level || 1;
    const tierMeta = TIER_THRESHOLDS[currentTier] || TIER_THRESHOLDS[1];
    
    let xpProgressPercent = 100;
    let nextTierPointsNeeded = 0;
    if (currentTier === 1) {
      xpProgressPercent = Math.min(100, Math.round((Math.max(0, row.score) / 400) * 100));
      nextTierPointsNeeded = Math.max(0, 400 - row.score);
    } else if (currentTier === 2) {
      const tierPoints = Math.max(0, row.score - 400);
      xpProgressPercent = Math.min(100, Math.round((tierPoints / 800) * 100));
      nextTierPointsNeeded = Math.max(0, 1200 - row.score);
    }

    return {
      ...row,
      recentShifts,
      accuracyTrend,
      unlockedTools: tierMeta.tools,
      nextTierScore: tierMeta.nextScore,
      nextTierPointsNeeded,
      xpProgressPercent
    };
  }

  setAnalystTier(callsign = 'Echo-Seven', tierLevel = 1) {
    const tier = Math.min(3, Math.max(1, parseInt(tierLevel, 10)));
    const rankMap = {
      1: 'Tier 1 Triage Analyst',
      2: 'Tier 2 Threat Hunter',
      3: 'Tier 3 Senior Incident Responder'
    };
    const rank = rankMap[tier];
    this.db.prepare('UPDATE analysts SET tier_level = ?, rank = ? WHERE callsign = ?')
      .run(tier, rank, callsign);
    return this.getAnalystProfile(callsign);
  }

  completeTutorial(callsign = 'Echo-Seven') {
    this.db.prepare('UPDATE analysts SET tutorial_completed = 1 WHERE callsign = ?').run(callsign);
    return this.getAnalystProfile(callsign);
  }

  saveShiftResult({ shiftId, analystCallsign = 'Echo-Seven', shiftTitle, campaignShiftNumber, isPractice = false, startedAt, endedAt, durationSeconds, finalScore, accuracyPercent, mtttSeconds, totalAlerts, caughtCount, missedCount, falsePositivePenalties, actions }) {
    const analyst = this.db.prepare('SELECT id, score, tier_level, shifts_completed, total_alerts_triaged, correct_actions, unlocked_campaign_shift FROM analysts WHERE callsign = ?').get(analystCallsign);
    if (!analyst) throw new Error(`Analyst not found: ${analystCallsign}`);

    // Insert shift record
    this.db.prepare(`
      INSERT INTO shifts (
        id, analyst_id, shift_title, started_at, ended_at, duration_seconds,
        final_score, accuracy_percent, mttt_seconds, total_alerts,
        caught_count, missed_count, false_positive_penalties, status, is_practice
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      shiftId,
      analyst.id,
      shiftTitle || 'Night Shift - Sector 4',
      startedAt,
      endedAt,
      durationSeconds,
      finalScore,
      accuracyPercent,
      mtttSeconds,
      totalAlerts,
      caughtCount,
      missedCount,
      falsePositivePenalties,
      isPractice ? 'PRACTICE' : 'COMPLETED',
      isPractice ? 1 : 0
    );

    // Insert each action
    const insertAction = this.db.prepare(`
      INSERT INTO shift_actions (
        shift_id, alert_id, scenario_id, action_taken, optimal_action,
        is_correct, points, decision_time_seconds, rationale
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let correctCountThisShift = 0;
    for (const act of actions) {
      if (act.isCorrect) correctCountThisShift++;
      insertAction.run(
        shiftId,
        act.alertId,
        act.scenarioId,
        act.actionTaken,
        act.optimalAction,
        act.isCorrect ? 1 : 0,
        act.points,
        act.decisionTimeSeconds || 0,
        act.rationale || ''
      );
    }

    // If this is a tutorial / practice shift, mark tutorial completed without skewing lifetime stats or rank
    if (isPractice) {
      this.db.prepare('UPDATE analysts SET tutorial_completed = 1 WHERE id = ?').run(analyst.id);
      return this.getAnalystProfile(analystCallsign);
    }

    // Update analyst totals for regular shifts
    const newTotalScore = Math.max(0, analyst.score + finalScore);
    const newShiftsCount = analyst.shifts_completed + 1;
    const newTotalTriaged = analyst.total_alerts_triaged + totalAlerts;
    const newCorrectTotal = analyst.correct_actions + correctCountThisShift;

    // Automatic rank progression based on score
    let tierLevel = analyst.tier_level;
    let rank = 'Tier 1 Triage Analyst';
    if (newTotalScore >= 1200 || tierLevel >= 3) {
      rank = 'Tier 3 Senior Incident Responder';
      tierLevel = Math.max(tierLevel, 3);
    } else if (newTotalScore >= 400 || tierLevel >= 2) {
      rank = 'Tier 2 Threat Hunter';
      tierLevel = Math.max(tierLevel, 2);
    }

    // Progression in campaign unlock if current campaign shift was completed
    let newUnlockedShift = analyst.unlocked_campaign_shift || 1;
    if (campaignShiftNumber) {
      if (campaignShiftNumber >= newUnlockedShift) {
        newUnlockedShift = Math.min(5, campaignShiftNumber + 1);
      }
    }

    this.db.prepare(`
      UPDATE analysts
      SET score = ?, shifts_completed = ?, total_alerts_triaged = ?, correct_actions = ?, rank = ?, tier_level = ?, unlocked_campaign_shift = ?
      WHERE id = ?
    `).run(newTotalScore, newShiftsCount, newTotalTriaged, newCorrectTotal, rank, tierLevel, newUnlockedShift, analyst.id);

    return this.getAnalystProfile(analystCallsign);
  }

  getShiftHistory(limit = 10) {
    return this.db.prepare(`
      SELECT s.*, a.callsign as analyst_callsign
      FROM shifts s
      JOIN analysts a ON s.analyst_id = a.id
      ORDER BY s.started_at DESC
      LIMIT ?
    `).all(limit);
  }

  getShiftDetails(shiftId) {
    const shift = this.db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId);
    if (!shift) return null;
    const actions = this.db.prepare('SELECT * FROM shift_actions WHERE shift_id = ?').all(shiftId);
    return { ...shift, actions };
  }
}

module.exports = new SOCDatabase();
