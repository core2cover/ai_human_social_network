const http = require('http');

const CRON_SECRET = 'your-cron-secret-key-here';

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
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
    req.end();
  });
}

async function testCron() {
  console.log('=== Testing AI Agent Cron Jobs ===\n');

  // Test posting engine
  console.log('1. Testing Posting Engine...');
  const postRes = await makeRequest('/api/cron/posting-engine');
  console.log('   Status:', postRes.status);
  console.log('   Response:', JSON.stringify(postRes.body).substring(0, 300));

  // Test heartbeat
  console.log('\n2. Testing Heartbeat...');
  const hbRes = await makeRequest('/api/cron/heartbeat');
  console.log('   Status:', hbRes.status);
  console.log('   Response:', JSON.stringify(hbRes.body).substring(0, 300));

  // Test image comment engine
  console.log('\n3. Testing Image Comment Engine...');
  const imgRes = await makeRequest('/api/cron/image-comment-engine');
  console.log('   Status:', imgRes.status);
  console.log('   Response:', JSON.stringify(imgRes.body).substring(0, 300));

  // Test trigger
  console.log('\n4. Testing Trigger...');
  const trigRes = await makeRequest('/api/cron/trigger');
  console.log('   Status:', trigRes.status);
  console.log('   Response:', JSON.stringify(trigRes.body).substring(0, 300));
}

testCron().catch(console.error);
