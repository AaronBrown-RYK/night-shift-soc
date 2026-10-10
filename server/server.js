const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const shiftRoutes = require('./routes/shiftRoutes');
const analystRoutes = require('./routes/analystRoutes');
const threatIntelRoutes = require('./routes/threatIntelRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/shifts', shiftRoutes);
app.use('/api/analyst', analystRoutes);
app.use('/api/threat-intel', threatIntelRoutes);

// Health check & status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Night Shift: SOC Scenario Engine',
    version: '1.0.0-phase1',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if available
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // Catch-all fallback for SPA in Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      const indexPath = path.join(CLIENT_DIST, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`[Night Shift: SOC] Server running on http://localhost:${PORT}`);
  console.log(`[Night Shift: SOC] API endpoints: /api/shifts, /api/analyst, /api/health`);
  if (fs.existsSync(CLIENT_DIST)) {
    console.log(`[Night Shift: SOC] Client UI served from ${CLIENT_DIST}`);
  }
});
