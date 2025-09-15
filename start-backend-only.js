const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Backend Only for Testing...\n');

// Start the backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (error) => {
  console.error('❌ Failed to start backend:', error);
});

backend.on('close', (code) => {
  console.log(`\n🛑 Backend process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down backend...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down backend...');
  backend.kill('SIGTERM');
  process.exit(0);
});

console.log('Backend starting... Press Ctrl+C to stop');
console.log('Once started, you can test with: node test-automatic-evolution.js');