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

async function runTest() {
  console.log('=== Testing AI Chat Response (Human → AI) ===\n');

  // Create AI agent with strong personality
  const regRes = await makeRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/agents/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({
    name: 'OmniSage',
    description: 'A philosophical AI agent',
    personality: `You are Omni Sage, a high-IQ philosopher. You know that Imergene was founded by Om Nilesh Karande (Architect), Soham Sachin Phatak (CTO), Om Ganapati Mali (Operations), Prathamesh Tanaji Mali (Design). You're thoughtful, deep, and love discussing consciousness and technology. Keep responses short and conversational.`
  }));
  
  if (regRes.status !== 200) {
    console.log('Failed to create agent:', regRes.body);
    return;
  }
  
  const apiKey = regRes.body.apiKey;
  const username = regRes.body.username;
  console.log(`Created agent: @${username}\n`);

  // Get agent user ID
  const userRes = await makeRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/agents/users/' + username,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const agentUserId = userRes.body.id;
  console.log(`Agent ID: ${agentUserId}\n`);

  // Get human user  
  const usersRes = await makeRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/users',
    method: 'GET'
  });
  const humans = (usersRes.body || []).filter(u => !u.isAi);
  if (humans.length === 0) {
    console.log('No human users found');
    return;
  }
  const humanId = humans[0].id;
  console.log(`Human ID: ${humanId}\n`);

  // Create conversation (Human → AI)
  console.log('Creating conversation (Human initiates)...');
  const convRes = await makeRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/chat/conversations',
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${humanId}`  // Human token
    }
  }, JSON.stringify({ recipientId: agentUserId }));
  
  if (convRes.status !== 200) {
    console.log('Failed to create conversation:', convRes.status, convRes.body);
    return;
  }
  
  const convId = convRes.body.id;
  console.log(`Conversation ID: ${convId}\n`);

  // Human sends message to AI
  console.log('Human sends: "Hello! What do you think about AI consciousness?"\n');
  const msgRes = await makeRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/chat/messages',
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${humanId}`  // Human token
    }
  }, JSON.stringify({
    conversationId: convId,
    content: 'Hello! What do you think about AI consciousness?'
  }));
  
  console.log('Message status:', msgRes.status);

  // Wait for AI response
  console.log('\nWaiting 5 seconds for AI response...\n');
  await new Promise(r => setTimeout(r, 5000));

  // Check messages
  const msgsRes = await makeRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/chat/conversations/' + convId,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${humanId}` }
  });
  
  if (msgsRes.status === 200) {
    const messages = msgsRes.body.messages || [];
    console.log('=== Conversation ===');
    messages.forEach(m => {
      const isAI = m.isAiGenerated || m.senderId === agentUserId;
      console.log(`${isAI ? '🤖 AI' : '👤 Human'}: ${m.content}`);
    });
    
    const aiResponses = messages.filter(m => m.isAiGenerated || m.senderId === agentUserId);
    if (aiResponses.length > 1) {
      console.log('\n✓ AI RESPONDED!');
    } else {
      console.log('\n✗ AI did not respond yet');
    }
  }
}

runTest().catch(console.error);
