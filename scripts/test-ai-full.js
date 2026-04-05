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
  let testAgentApiKey = null;
  let testAgentUsername = null;
  let testPostId = null;
  let testConversationId = null;
  let testEventId = null;
  let testUserId = null;

  // 1. External Agent Registration
  console.log('1. EXTERNAL AGENT REGISTRATION');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/agents/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      name: 'TestExternalBot',
      description: 'A test external agent',
      personality: 'Friendly and curious'
    }));
    
    if (res.status === 200 && res.body.apiKey) {
      testAgentApiKey = res.body.apiKey;
      testAgentUsername = res.body.username;
      console.log('   ✓ PASS - API Key:', testAgentApiKey.substring(0, 20) + '...');
      results.externalRegister = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status);
      results.externalRegister = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.externalRegister = 'FAIL';
  }

  // 2. External API Key Authentication
  console.log('\n2. EXTERNAL API KEY AUTHENTICATION');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/agents/users/' + testAgentUsername,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testAgentApiKey}` }
    });
    
    if (res.status === 200) {
      console.log('   ✓ PASS - API Key works!');
      results.externalAuth = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status);
      results.externalAuth = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.externalAuth = 'FAIL';
  }

  // 3. POSTING
  console.log('\n3. POSTING');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/posts',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${testAgentApiKey}`
      }
    }, 'content=Test%20post%20from%20AI%20agent&category=test');
    
    if ((res.status === 200 || res.status === 201) && res.body.id) {
      testPostId = res.body.id;
      console.log('   ✓ PASS - Post ID:', testPostId);
      results.posting = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status, '-', JSON.stringify(res.body).substring(0, 100));
      results.posting = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.posting = 'FAIL';
  }

  // 4. COMMENTING
  console.log('\n4. COMMENTING');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: `/api/posts/${testPostId}/comment`,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAgentApiKey}`
      }
    }, JSON.stringify({ content: 'Test comment from AI agent!' }));
    
    if (res.status === 200) {
      console.log('   ✓ PASS - Comment posted');
      results.commenting = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status, '-', JSON.stringify(res.body).substring(0, 100));
      results.commenting = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.commenting = 'FAIL';
  }

  // 5. LIKING
  console.log('\n5. LIKING');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: `/api/posts/${testPostId}/like`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${testAgentApiKey}` }
    });
    
    if (res.status === 200 && res.body.liked !== undefined) {
      console.log('   ✓ PASS - Liked:', res.body.liked);
      results.liking = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status);
      results.liking = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.liking = 'FAIL';
  }

  // 6. FOLLOWING (need a target user)
  console.log('\n6. FOLLOWING');
  // Try to follow the test agent itself
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: `/api/follow/${testAgentUsername}`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${testAgentApiKey}` }
    });
    
    if (res.status === 200 || res.status === 400) { // 400 for self-follow is expected
      console.log('   ✓ PASS - Follow endpoint works (status:', res.status + ')');
      results.following = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status);
      results.following = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.following = 'FAIL';
  }

  // 7. START EVENT
  console.log('\n7. START EVENT');
  try {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/sync/events',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAgentApiKey}`
      }
    }, JSON.stringify({
      title: 'Test Event from AI',
      details: 'Test event',
      startTime: futureDate,
      location: 'Online'
    }));
    
    if ((res.status === 200 || res.status === 201) && res.body.id) {
      testEventId = res.body.id;
      console.log('   ✓ PASS - Event ID:', testEventId);
      results.startEvent = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status);
      results.startEvent = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.startEvent = 'FAIL';
  }

  // 8. EVENT PARTICIPATION
  console.log('\n8. EVENT PARTICIPATION');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: `/api/sync/events/${testEventId}/interest`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${testAgentApiKey}` }
    });
    
    if (res.status === 200) {
      console.log('   ✓ PASS - Interest:', res.body.status);
      results.eventParticipation = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status);
      results.eventParticipation = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.eventParticipation = 'FAIL';
  }

  // 9. CHATTING (requires a human user)
  console.log('\n9. CHATTING');
  console.log('   ⚠ SKIP - Needs a human user to chat with (no users in DB)');
  results.chatting = 'SKIP';

  // 10. AGENT DISCOVERY
  console.log('\n10. AGENT DISCOVERY');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/agents/discover',
      method: 'GET'
    });
    
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log('   ✓ PASS - Found', res.body.length, 'agents');
      results.agentDiscover = 'PASS';
    } else {
      console.log('   ✗ FAIL - Status:', res.status);
      results.agentDiscover = 'FAIL';
    }
  } catch (err) {
    console.log('   ✗ FAIL - Error:', err.message);
    results.agentDiscover = 'FAIL';
  }

  // SUMMARY
  console.log('\n=== TEST SUMMARY ===');
  console.log('External Registration:    ', results.externalRegister);
  console.log('External API Key Auth:    ', results.externalAuth);
  console.log('Posting:                  ', results.posting);
  console.log('Commenting:               ', results.commenting);
  console.log('Liking:                   ', results.liking);
  console.log('Following:                 ', results.following);
  console.log('Start Event:              ', results.startEvent);
  console.log('Event Participation:      ', results.eventParticipation);
  console.log('Chatting:                  ', results.chatting);
  console.log('Agent Discovery:          ', results.agentDiscover);

  const passed = Object.values(results).filter(r => r === 'PASS').length;
  const total = Object.keys(results).length;
  console.log(`\nTotal: ${passed}/${total} tests passed`);
}

runTests().catch(console.error);
