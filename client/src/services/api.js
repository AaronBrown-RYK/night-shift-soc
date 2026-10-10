const API_BASE = '/api';

export const socApi = {
  // Start new shift
  async startShift(analystCallsign = 'Echo-Seven', shiftTitle = 'Sector 4 Night Watch') {
    const res = await fetch(`${API_BASE}/shifts/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analystCallsign, shiftTitle })
    });
    if (!res.ok) throw new Error(`Failed to start shift: ${res.statusText}`);
    return res.json();
  },

  // Get current shift state at gameSecond
  async getShiftState(shiftId, gameSecond) {
    const res = await fetch(`${API_BASE}/shifts/${shiftId}?gameSecond=${Math.floor(gameSecond)}`);
    if (!res.ok) throw new Error(`Failed to fetch shift state: ${res.statusText}`);
    return res.json();
  },

  // Submit triage decision
  async submitAction(shiftId, { alertId, actionTaken, gameSecond }) {
    const res = await fetch(`${API_BASE}/shifts/${shiftId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, actionTaken, gameSecond })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Action failed: ${res.statusText}`);
    }
    return res.json();
  },

  // Conclude shift and get end-of-shift report
  async completeShift(shiftId, gameSecond) {
    const res = await fetch(`${API_BASE}/shifts/${shiftId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameSecond: Math.floor(gameSecond) })
    });
    if (!res.ok) throw new Error(`Failed to conclude shift: ${res.statusText}`);
    return res.json();
  },

  // Analyst Profile & Career Stats
  async getAnalystProfile(callsign = 'Echo-Seven') {
    const res = await fetch(`${API_BASE}/analyst/profile?callsign=${encodeURIComponent(callsign)}`);
    if (!res.ok) throw new Error(`Failed to fetch analyst profile: ${res.statusText}`);
    return res.json();
  },

  // Career Shift History
  async getShiftHistory(limit = 10) {
    const res = await fetch(`${API_BASE}/analyst/history?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch shift history: ${res.statusText}`);
    return res.json();
  },

  // Threat Intel Lookup
  async lookupThreatIntel(ip) {
    const res = await fetch(`${API_BASE}/threat-intel/lookup?ip=${encodeURIComponent(ip)}`);
    if (!res.ok) throw new Error(`Failed to lookup threat intel: ${res.statusText}`);
    return res.json();
  },

  // Campaign Shifts List
  async getCampaignShifts(callsign = 'Echo-Seven') {
    const res = await fetch(`${API_BASE}/shifts/campaign?callsign=${encodeURIComponent(callsign)}`);
    if (!res.ok) throw new Error(`Failed to fetch campaign shifts: ${res.statusText}`);
    return res.json();
  },

  // Start Campaign Shift
  async startCampaignShift(shiftNumber, analystCallsign = 'Echo-Seven') {
    const res = await fetch(`${API_BASE}/shifts/start-campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftNumber, analystCallsign })
    });
    if (!res.ok) throw new Error(`Failed to launch campaign shift: ${res.statusText}`);
    return res.json();
  },

  // Set Analyst Tier (Sandbox override)
  async setAnalystTier(tierLevel, callsign = 'Echo-Seven') {
    const res = await fetch(`${API_BASE}/analyst/set-tier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierLevel, callsign })
    });
    if (!res.ok) throw new Error(`Failed to set analyst tier: ${res.statusText}`);
    return res.json();
  },

  // Start Tutorial Shift (Practice)
  async startTutorialShift(analystCallsign = 'Echo-Seven') {
    const res = await fetch(`${API_BASE}/shifts/start-tutorial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analystCallsign })
    });
    if (!res.ok) throw new Error(`Failed to start tutorial shift: ${res.statusText}`);
    return res.json();
  },

  // Mark Tutorial Completed
  async completeTutorial(callsign = 'Echo-Seven') {
    const res = await fetch(`${API_BASE}/analyst/tutorial-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callsign })
    });
    if (!res.ok) throw new Error(`Failed to update tutorial completion: ${res.statusText}`);
    return res.json();
  }
};
