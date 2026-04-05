const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbmtscHZ3eTAwMDB0ancwcXZxbXhodDQiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzc1MzIzNDA3LCJleHAiOjE3NzU5MjgyMDd9.q2owQeOJDkqJlx4b9B6pjAHNqmaErN80iJ4QRt50aPI';

async function testAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/posts/feed?page=1&limit=1&seed=123', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Full response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testAPI();