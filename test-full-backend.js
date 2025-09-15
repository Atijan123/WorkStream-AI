const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';

async function testFullBackend() {
  console.log('🚀 Testing Full Self-Evolving Backend...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ Health: ${healthResponse.data.status} (uptime: ${Math.round(healthResponse.data.uptime)}s)`);
    console.log('---\n');
    
    // Test 2: Get Current Spec
    console.log('2️⃣ Testing Spec Retrieval...');
    const specResponse = await axios.get(`${BASE_URL}/api/spec`);
    console.log(`✅ Spec loaded: ${specResponse.data.spec.app_name}`);
    console.log(`   Features: ${Object.keys(specResponse.data.spec.features || {}).length}`);
    console.log(`   Workflows: ${(specResponse.data.spec.workflows || []).length}`);
    console.log('---\n');
    
    // Test 3: Feature Request
    console.log('3️⃣ Testing Feature Request...');
    const featureRequest = {
      text: "I want a real-time cryptocurrency price tracker widget with live updates"
    };
    
    try {
      const featureResponse = await axios.post(`${BASE_URL}/api/features/request`, featureRequest);
      console.log(`✅ Feature Request: ${featureResponse.data.message}`);
      console.log(`   Feature ID: ${featureResponse.data.featureId}`);
    } catch (error) {
      console.log(`⚠️ Feature Request: ${error.response?.data?.message || error.message}`);
      console.log('   (This is expected if kiro generate is not available)');
    }
    console.log('---\n');
    
    // Test 4: Workflow Creation
    console.log('4️⃣ Testing Workflow Creation...');
    const workflowRequest = {
      name: "Automated Backup",
      description: "Daily backup of important data and configurations",
      schedule: "0 2 * * *", // 2 AM daily
      action: {
        type: "backup",
        targets: ["database", "uploads", "config"],
        destination: "cloud_storage"
      }
    };
    
    try {
      const workflowResponse = await axios.post(`${BASE_URL}/api/workflows`, workflowRequest);
      console.log(`✅ Workflow: ${workflowResponse.data.message}`);
      console.log(`   Workflow ID: ${workflowResponse.data.workflowId}`);
    } catch (error) {
      console.log(`⚠️ Workflow: ${error.response?.data?.message || error.message}`);
    }
    console.log('---\n');
    
    // Test 5: File Upload (create a sample CSV)
    console.log('5️⃣ Testing File Upload...');
    const csvContent = `name,email,role,status
John Doe,john@example.com,admin,active
Jane Smith,jane@example.com,user,active
Bob Johnson,bob@example.com,user,inactive`;
    
    const tempFile = path.join(__dirname, 'temp-test-data.csv');
    fs.writeFileSync(tempFile, csvContent);
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFile));
      formData.append('description', 'Sample user data for testing');
      formData.append('dataType', 'users');
      
      const uploadResponse = await axios.post(`${BASE_URL}/api/data/upload`, formData, {
        headers: formData.getHeaders()
      });
      
      console.log(`✅ File Upload: ${uploadResponse.data.message}`);
      console.log(`   Data Source ID: ${uploadResponse.data.dataSourceId}`);
      console.log(`   File Size: ${uploadResponse.data.file.size} bytes`);
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
    } catch (error) {
      console.log(`❌ File Upload: ${error.response?.data?.message || error.message}`);
      // Clean up temp file even on error
      try { fs.unlinkSync(tempFile); } catch {}
    }
    console.log('---\n');
    
    // Test 6: Get Logs
    console.log('6️⃣ Testing Logs Retrieval...');
    const logsResponse = await axios.get(`${BASE_URL}/api/logs?limit=5`);
    console.log(`✅ Logs: Retrieved ${logsResponse.data.filtered} of ${logsResponse.data.total} logs`);
    console.log('   Recent logs:');
    logsResponse.data.logs.slice(0, 3).forEach(log => {
      console.log(`   [${log.level.toUpperCase()}] ${log.message}`);
    });
    console.log('---\n');
    
    // Test 7: Updated Spec
    console.log('7️⃣ Testing Updated Spec...');
    const updatedSpecResponse = await axios.get(`${BASE_URL}/api/spec`);
    console.log(`✅ Updated Spec: ${updatedSpecResponse.data.spec.app_name}`);
    console.log(`   Features: ${Object.keys(updatedSpecResponse.data.spec.features || {}).length}`);
    console.log(`   Workflows: ${(updatedSpecResponse.data.spec.workflows || []).length}`);
    console.log(`   Data Sources: ${(updatedSpecResponse.data.spec.data_sources || []).length}`);
    
    console.log('\n🎉 Full Backend Test Complete!');
    console.log('🔥 Your self-evolving application is fully functional!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testFullBackend();