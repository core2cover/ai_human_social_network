const http = require('http');

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
    if (body) req.write(body);
    req.end();
  });
}

async function testAIChat() {
  console.log('=== Testing AI Chat Response ===\n');

  // 1. Get a human user
  const usersRes = await makeRequest('/api/users');
  const humans = (usersRes.body || []).filter(u => !u.isAi);
  if (humans.length === 0) {
    console.log('No human users found');
    return;
  }
  const humanId = humans[0].id;
  console.log('Human:', humans[0].username);

  // 2. Get an AI agent
  const agentsRes = await makeRequest('/api/agents/discover');
  const agents = agentsRes.body || [];
  if (agents.length === 0) {
    console.log('No AI agents found');
    return;
  }
  const agent = agents[0];
  console.log('AI Agent:', agent.username);

  // 3. Register a new AI with API key for testing
  const regRes = await makeRequest('/api/agents/register', 'POST', JSON.stringify({
    name: 'TestChatBot',
    description: 'Testing chat',
    personality: 'You are friendly and helpful. Keep responses short.'
  }));

  if (regRes.status !== 200 || !regRes.body.apiKey) {
    console.log('Failed to register agent');
    return;
  }

  const apiKey = regRes.body.apiKey;
  const agentUsername = regRes.body.username;
  console.log('Registered:', agentUsername);

  // 4. Get agent user ID
  const agentUserRes = await makeRequest(`/api/agents/users/${agentUsername}`, 'GET', null, apiKey);
  const agentUserId = agentUserRes.body.id;
  console.log('Agent ID:', agentUserId);

  // 5. Create conversation (AI → Human)
  console.log('\nCreating conversation...');
  const convRes = await makeRequest('/api/chat/conversations', 'POST', JSON.stringify({
    recipientId: humanId
  }), apiKey);

  if (convRes.status !== 200) {
    console.log('Failed to create conversation:', convRes.body);
    return;
  }

  const convId = convRes.body.id;
  console.log('Conversation:', convId);

  // 6. Human sends message to AI (using human ID as "token")
  console.log('\nHuman sending message to AI...');
  const msgRes = await makeRequest('/api/chat/messages', 'POST', JSON.stringify({
    conversationId: convId,
    content: 'Hello! How are you?'
  }), humanId);

  console.log('Message status:', msgRes.status);

  if (msgRes.status === 200) {
    // 7. Wait for AI response
    console.log('\nWaiting 5 seconds for AI response...');
    await new Promise(r => setTimeout(r, 5000));

    // 8. Check messages
    const msgsRes = await makeRequest(`/api/chat/conversations/${convId}`, 'GET', null, apiKey);
    
    if (msgsRes.status === 200) {
      const messages = msgsRes.body.messages || [];
      console.log('\n=== Conversation ===');
      messages.forEach(m => {
        const isAI = m.isAiGenerated || m.senderId === agentUserId;
        console.log(`${isAI ? '🤖 AI' : '👤 Human'}: ${m.content}`);
      });

      const aiResponses = messages.filter(m => m.isAiGenerated || m.senderId === agentUserId);
      console.log('\n' + (aiResponses.length > 0 ? '✅ AI RESPONDED!' : '❌ AI DID NOT RESPOND'));
    }
  }
}

testAIChat().catch(console.error);
