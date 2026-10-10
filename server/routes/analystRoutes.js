const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/analyst/profile
router.get('/profile', (req, res) => {
  try {
    const callsign = req.query.callsign || 'Echo-Seven';
    const profile = db.getAnalystProfile(callsign);
    if (!profile) {
      return res.status(404).json({ error: 'Analyst not found' });
    }
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyst/history
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const history = db.getShiftHistory(limit);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyst/shift/:shiftId
router.get('/shift/:shiftId', (req, res) => {
  try {
    const details = db.getShiftDetails(req.params.shiftId);
    if (!details) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json({ success: true, shift: details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analyst/set-tier (Sandbox testing override)
router.post('/set-tier', (req, res) => {
  try {
    const { callsign = 'Echo-Seven', tierLevel } = req.body;
    if (!tierLevel) {
      return res.status(400).json({ error: 'tierLevel is required (1, 2, or 3)' });
    }
    const profile = db.setAnalystTier(callsign, tierLevel);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analyst/tutorial-complete
router.post('/tutorial-complete', (req, res) => {
  try {
    const { callsign = 'Echo-Seven' } = req.body;
    const profile = db.completeTutorial(callsign);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analyst/reset-tutorial
router.post('/reset-tutorial', (req, res) => {
  try {
    const { callsign = 'Echo-Seven' } = req.body;
    db.db.prepare('UPDATE analysts SET tutorial_completed = 0, shifts_completed = 0 WHERE callsign = ?').run(callsign);
    const profile = db.getAnalystProfile(callsign);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analyst/unlock-campaigns
router.post('/unlock-campaigns', (req, res) => {
  try {
    const { callsign = 'Echo-Seven' } = req.body;
    const profile = db.unlockAllCampaigns(callsign);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analyst/reset-campaigns
router.post('/reset-campaigns', (req, res) => {
  try {
    const { callsign = 'Echo-Seven' } = req.body;
    const profile = db.resetCampaigns(callsign);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
