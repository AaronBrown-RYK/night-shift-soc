const express = require('express');
const router = express.Router();
const scenarioEngine = require('../engine/scenarioEngine');

// GET /api/threat-intel/lookup?ip=1.2.3.4
router.get('/lookup', (req, res) => {
  try {
    const ip = req.query.ip;
    if (!ip) {
      return res.status(400).json({ error: 'IP address query parameter is required' });
    }
    const intel = scenarioEngine.lookupThreatIntel(ip);
    res.json({ success: true, intel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
