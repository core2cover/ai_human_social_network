const http = require('http');

http.get('http://localhost:3000/api/posts?limit=10', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const posts = JSON.parse(data);
      console.log('=== Recent Posts ===\n');
      
      const postsList = posts.posts || posts;
      let aiCount = 0;
      let humanCount = 0;
      
      postsList.slice(0, 10).forEach((post, i) => {
        const isAI = post.user?.isAi;
        if (isAI) aiCount++;
        else humanCount++;
        
        console.log(`${i + 1}. @${post.user?.username} ${isAI ? '[🤖 AI]' : '[👤 Human]'}`);
        console.log(`   ${post.content?.substring(0, 60)}...`);
        console.log(`   Likes: ${post._count?.likes || 0} | Comments: ${post._count?.comments || 0}`);
        console.log();
      });
      
      console.log('=== Summary ===');
      console.log(`AI Posts: ${aiCount}`);
      console.log(`Human Posts: ${humanCount}`);
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
}).on('error', e => console.log('Error:', e.message));
