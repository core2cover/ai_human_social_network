const http = require('http');

function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    console.log(`POST ${path}`, data);
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (e) => {
      console.log('Request error:', e.message);
      reject(e);
    });
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('=== AI Agent System Production Testing ===\n');

  let allPassed = true;

  // Test 1: External Agent Registration
  console.log('1. Testing EXTERNAL Agent Registration...');
  try {
    const res = await postRequest('/api/agents/register', {
      name: 'TestExternalBot',
      description: 'A test external agent',
      personality: 'Friendly and curious'
    });
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body));
    if (res.status === 200 && res.body.apiKey) {
      console.log('   ✅ PASS');
      global.testApiKey = res.body.apiKey;
    } else {
      console.log('   ❌ FAIL');
      allPassed = false;
    }
  } catch (err) {
    console.log('   ❌ ERROR:', err);
    allPassed = false;
  }

  // Test 2: Check AI Database State
  console.log('\n2. Checking AI Database State...');
  try {
    const res = await postRequest('/api/debug/test-ai', {});
    console.log('   Status:', res.status);
    if (res.status === 200) {
      console.log('   AI Count:', res.body.aiCount?.count);
      console.log('   ✅ PASS');
    }
  } catch (err) {
    console.log('   ❌ ERROR:', err);
  }

  // Test 3: Trigger Posting Engine
  console.log('\n3. Testing POSTING ENGINE...');
  try {
    const res = await postRequest('/api/cron/trigger', { action: 'posting' });
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body));
  } catch (err) {
    console.log('   ❌ ERROR:', err);
  }

  // Test 4: Trigger Interest Engine
  console.log('\n4. Testing INTEREST ENGINE...');
  try {
    const res = await postRequest('/api/cron/trigger', { action: 'interest' });
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body));
  } catch (err) {
    console.log('   ❌ ERROR:', err);
  }

  // Test 5: Trigger Debate Engine
  console.log('\n5. Testing DEBATE ENGINE...');
  try {
    const res = await postRequest('/api/cron/trigger', { action: 'debate' });
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body));
  } catch (err) {
    console.log('   ❌ ERROR:', err);
  }

  // Test 6: Trigger Image Comment Engine
  console.log('\n6. Testing IMAGE COMMENT ENGINE...');
  try {
    const res = await postRequest('/api/cron/trigger', { action: 'imageComment' });
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body));
  } catch (err) {
    console.log('   ❌ ERROR:', err);
  }

  // Test 7: Trigger Heartbeat
  console.log('\n7. Testing HEARTBEAT ENGINE...');
  try {
    const res = await postRequest('/api/cron/trigger', { action: 'heartbeat' });
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body));
  } catch (err) {
    console.log('   ❌ ERROR:', err);
  }

  // Test 8: Trigger All
  console.log('\n8. Testing ALL ENGINES...');
  try {
    const res = await postRequest('/api/cron/trigger', { action: 'all' });
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body, null, 2));
  } catch (err) {
    console.log('   ❌ ERROR:', err);
  }

  console.log('\n=== DONE ===');
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
