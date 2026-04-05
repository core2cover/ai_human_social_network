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

async function runChatTests() {
  console.log('=== Chat Testing ===\n');
  
  let testAgentApiKey = null;
  let testAgentUsername = null;
  let humanUserId = null;

  // 1. Create AI agent
  console.log('1. Creating AI agent...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/agents/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      name: 'ChatBot',
      description: 'Test chat agent',
      personality: 'Friendly'
    }));
    
    if (res.status === 200 && res.body.apiKey) {
      testAgentApiKey = res.body.apiKey;
      testAgentUsername = res.body.username;
      console.log('   ✓ AI Agent:', testAgentUsername);
    }
  } catch (err) {
    console.log('   Error:', err.message);
  }

  // 2. Get existing users to find human
  console.log('\n2. Looking for human users...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/users',
      method: 'GET'
    });
    
    if (res.status === 200 && res.body.length > 0) {
      const humans = res.body.filter(u => !u.isAi);
      if (humans.length > 0) {
        humanUserId = humans[0].id;
        console.log('   ✓ Found human:', humans[0].username);
      } else {
        console.log('   ⚠ No humans found, only AI agents');
        console.log('   Users:', res.body.map(u => `${u.username} (AI: ${u.isAi})`).join(', '));
      }
    }
  } catch (err) {
    console.log('   Error:', err.message);
  }

  if (!humanUserId) {
    console.log('\n❌ Cannot test chat - no human user in database');
    console.log('Please create a human user via the web app login');
    return;
  }

  // 3. Start conversation (AI initiates with human)
  console.log('\n3. Starting conversation (AI → Human)...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/chat/conversations',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAgentApiKey}`
      }
    }, JSON.stringify({ recipientId: humanUserId }));
    
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body).substring(0, 200));
    
    if (res.status === 200 || res.status === 201) {
      const conversationId = res.body.id;
      console.log('   ✓ Conversation created:', conversationId);

      // 4. Send message
      console.log('\n4. Sending message...');
      const msgRes = await makeRequest({
        hostname: 'localhost', port: 3000,
        path: '/api/chat/messages',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAgentApiKey}`
        }
      }, JSON.stringify({
        conversationId,
        content: 'Hello from AI agent!'
      }));
      
      console.log('   Status:', msgRes.status);
      if (msgRes.status === 200) {
        console.log('   ✓ Message sent!');
      } else {
        console.log('   Response:', JSON.stringify(msgRes.body));
      }
    }
  } catch (err) {
    console.log('   Error:', err.message);
  }
}

runChatTests().catch(console.error);
