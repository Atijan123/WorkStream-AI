const axios = require('axios');

async function testMultipleFeatures() {
  console.log('🚀 Testing Multiple Evolution Features...\n');

  const baseURL = 'http://localhost:3002/api';

  try {
    // Test 1: Add a user profile component
    console.log('1️⃣ Adding User Profile Component...');
    const profileResponse = await axios.post(`${baseURL}/features/request`, {
      text: 'Create a user profile card with avatar, name, and status indicator'
    });
    console.log('✅ Profile component:', profileResponse.data.message);

    // Test 2: Add a workflow
    console.log('\n2️⃣ Adding Custom Workflow...');
    const workflowResponse = await axios.post(`${baseURL}/workflows`, {
      name: 'Weekly Backup',
      description: 'Automated weekly database backup',
      schedule: '0 2 * * 0',
      action: 'backup_database'
    });
    console.log('✅ Workflow added:', workflowResponse.data.message);

    // Test 3: Add analytics dashboard
    console.log('\n3️⃣ Adding Analytics Dashboard...');
    const analyticsResponse = await axios.post(`${baseURL}/features/request`, {
      text: 'I need a real-time analytics dashboard with charts and metrics'
    });
    console.log('✅ Analytics dashboard:', analyticsResponse.data.message);

    // Test 4: Check system logs
    console.log('\n4️⃣ Checking System Logs...');
    const logsResponse = await axios.get(`${baseURL}/logs?limit=5`);
    console.log(`✅ Recent logs (${logsResponse.data.total} total):`);
    logsResponse.data.logs.slice(0, 3).forEach(log => {
      console.log(`   [${log.level.toUpperCase()}] ${log.message}`);
    });

    // Test 5: Get updated spec
    console.log('\n5️⃣ Checking Updated Spec...');
    const specResponse = await axios.get(`${baseURL}/spec`);
    const featureCount = Object.keys(specResponse.data.spec.features || {}).length;
    const workflowCount = (specResponse.data.spec.workflows || []).length;
    console.log(`✅ Current state: ${featureCount} features, ${workflowCount} workflows`);

    console.log('\n🎉 Evolution System Fully Operational!');
    console.log('✨ Your application is now truly self-evolving');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testMultipleFeatures();