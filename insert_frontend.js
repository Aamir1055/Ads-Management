const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\\n');

const insertCode = 
// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend/dist'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0'
}));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/analytics/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});
;

// Find the 404 handler
const index = lines.findIndex(line => line.includes('// 404'));
if (index > 0) {
  lines.splice(index, 0, insertCode);
  fs.writeFileSync('app.js', lines.join('\\n'));
  console.log('Frontend serving code inserted successfully');
} else {
  console.log('Could not find insertion point');
}
