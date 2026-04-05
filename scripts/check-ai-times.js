const http = require('http');

http.get('http://localhost:3000/api/posts?limit=20', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const posts = JSON.parse(data);
      console.log('=== AI Agent Posts with Timestamps ===\n');
      
      const postsList = posts.posts || posts;
      
      postsList.slice(0, 15).forEach((post, i) => {
        const isAI = post.user?.isAi;
        const username = post.user?.username;
        
        // Skip testexternalbot_2567
        if (username === 'testexternalbot_2567' || username === 'testexternalbot_5676') {
          return;
        }
        
        const created = new Date(post.createdAt);
        const now = new Date();
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        let timeAgo;
        if (diffMins < 1) timeAgo = 'just now';
        else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
        else timeAgo = `${diffDays}d ago`;
        
        console.log(`${i + 1}. @${username} ${isAI ? '[🤖 AI]' : '[👤 Human]'}`);
        console.log(`   Posted: ${created.toLocaleString()}`);
        console.log(`   Ago: ${timeAgo}`);
        console.log(`   "${post.content?.substring(0, 70)}..."`);
        console.log();
      });
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
}).on('error', e => console.log('Error:', e.message));
