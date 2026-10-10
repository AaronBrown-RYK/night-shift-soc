const express = require('express');
const router = express.Router();
const scenarioEngine = require('../engine/scenarioEngine');

// GET /api/shifts/campaign
router.get('/campaign', (req, res) => {
  try {
    const callsign = req.query.callsign || 'Echo-Seven';
    const campaignShifts = scenarioEngine.getCampaignShifts(callsign);
    res.json({ success: true, campaignShifts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shifts/start-campaign
router.post('/start-campaign', (req, res) => {
  try {
    const { shiftNumber, analystCallsign } = req.body;
    const shift = scenarioEngine.startCampaignShift({ shiftNumber, analystCallsign });
    res.json({ success: true, shift });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shifts/start-tutorial
router.post('/start-tutorial', (req, res) => {
  try {
    const { analystCallsign } = req.body;
    const shift = scenarioEngine.startTutorialShift({ analystCallsign });
    res.json({ success: true, shift });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shifts/start
router.post('/start', (req, res) => {
  try {
    const { analystCallsign, shiftTitle } = req.body;
    const shift = scenarioEngine.startShift({ analystCallsign, shiftTitle });
    res.json({ success: true, shift });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shifts/:id
router.get('/:id', (req, res) => {
  try {
    const shiftId = req.params.id;
    const gameSecond = parseInt(req.query.gameSecond ?? '0', 10);
    const shiftState = scenarioEngine.getShiftState(shiftId, gameSecond);
    if (!shiftState) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json({ success: true, shift: shiftState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shifts/:id/action
router.post('/:id/action', (req, res) => {
  try {
    const shiftId = req.params.id;
    const { alertId, actionTaken, gameSecond } = req.body;
    if (!alertId || !actionTaken) {
      return res.status(400).json({ error: 'alertId and actionTaken are required' });
    }
    const result = scenarioEngine.processAction(shiftId, {
      alertId,
      actionTaken,
      gameSecond: Number(gameSecond) || 0
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/shifts/:id/complete
router.post('/:id/complete', (req, res) => {
  try {
    const shiftId = req.params.id;
    const finalGameSecond = parseInt(req.body.gameSecond ?? '600', 10);
    const result = scenarioEngine.completeShift(shiftId, finalGameSecond);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
