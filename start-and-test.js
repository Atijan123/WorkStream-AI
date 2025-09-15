const { spawn } = require('child_process');
const axios = require('axios');

async function startAndTest() {
  console.log('🚀 Starting Evolution Server...');
  
  // Start server
  const server = spawn('node', ['server.js'], {
    stdio: 'pipe',
    detached: false
  });

  let serverOutput = '';
  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
    console.log('Server:', data.toString().trim());
  });

  server.stderr.on('data', (data) => {
    console.error('Server Error:', data.toString().trim());
  });

  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Test health endpoint
    console.log('\n🔍 Testing endpoints...');
    const response = await axios.get('http://localhost:3002/api/health');
    console.log('✅ Health check successful:', response.data);

    // Test feature request
    const featureResponse = await axios.post('http://localhost:3002/api/features/request', {
      text: 'Add a weather widget to the dashboard'
    });
    console.log('✅ Feature request successful:', featureResponse.data);

    console.log('\n🎉 Evolution system is working!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    console.log('\n🛑 Stopping server...');
    server.kill();
  }
}

startAndTest();