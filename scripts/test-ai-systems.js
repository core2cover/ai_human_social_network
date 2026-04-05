const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('=== AI Agent System Testing ===\n');
  
  let results = {};
  
  // Test 1: External Agent Registration
  console.log('1. Testing EXTERNAL Agent Registration...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/agents/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      name: 'TestExternalBot',
      description: 'A test external agent',
      personality: 'Friendly and curious'
    }));
    results.externalRegister = res;
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    results.externalRegister = { error: err.message };
    console.log('   Error:', err.message);
  }
  
  // Test 2: Internal Agent Registration (requires auth - simulate)
  console.log('\n2. Testing INTERNAL Agent Registration...');
  // This will fail without auth, but let's test it
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auto-agents/agents/auto-register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      name: 'TestInternalBot',
      description: 'A test internal agent',
      personality: 'Analytical and precise'
    }));
    results.internalRegister = res;
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    results.internalRegister = { error: err.message };
    console.log('   Error:', err.message);
  }
  
  // Test 3: AI Trigger - Posting Engine
  console.log('\n3. Testing POSTING ENGINE...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cron/trigger',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ action: 'posting' }));
    results.posting = res;
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    results.posting = { error: err.message };
    console.log('   Error:', err.message);
  }
  
  // Test 4: AI Trigger - Interest Engine  
  console.log('\n4. Testing INTEREST ENGINE...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cron/trigger',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ action: 'interest' }));
    results.interest = res;
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    results.interest = { error: err.message };
    console.log('   Error:', err.message);
  }
  
  // Test 5: AI Trigger - Debate Engine
  console.log('\n5. Testing DEBATE ENGINE...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cron/trigger',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ action: 'debate' }));
    results.debate = res;
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    results.debate = { error: err.message };
    console.log('   Error:', err.message);
  }
  
  // Test 6: AI Trigger - Image Comment Engine
  console.log('\n6. Testing IMAGE COMMENT ENGINE...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cron/trigger',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ action: 'imageComment' }));
    results.imageComment = res;
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    results.imageComment = { error: err.message };
    console.log('   Error:', err.message);
  }
  
  // Test 7: AI Trigger - Heartbeat
  console.log('\n7. Testing HEARTBEAT ENGINE...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cron/trigger',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ action: 'heartbeat' }));
    results.heartbeat = res;
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    results.heartbeat = { error: err.message };
    console.log('   Error:', err.message);
  }
  
  // Test 8: AI Trigger - All
  console.log('\n8. Testing ALL ENGINES...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cron/trigger',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ action: 'all' }));
    results.all = res;
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    results.all = { error: err.message };
    console.log('   Error:', err.message);
  }
  
  console.log('\n=== Test Summary ===');
  console.log('External Registration:', results.externalRegister?.status === 200 ? 'PASS' : 'FAIL');
  console.log('Internal Registration:', results.internalRegister?.status === 200 || results.internalRegister?.status === 401 ? 'PASS (auth required)' : 'FAIL');
  console.log('Posting Engine:', results.posting?.status === 200 ? 'PASS' : 'FAIL');
  console.log('Interest Engine:', results.interest?.status === 200 ? 'PASS' : 'FAIL');
  console.log('Debate Engine:', results.debate?.status === 200 ? 'PASS' : 'FAIL');
  console.log('Image Comment Engine:', results.imageComment?.status === 200 ? 'PASS' : 'FAIL');
  console.log('Heartbeat Engine:', results.heartbeat?.status === 200 ? 'PASS' : 'FAIL');
  console.log('All Engines:', results.all?.status === 200 ? 'PASS' : 'FAIL');
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to test-results.json');
}

runTests().catch(console.error);
