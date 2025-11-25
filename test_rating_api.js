// Test rating API with real production endpoint
const https = require('https');

const testRatingAPI = () => {
  const data = JSON.stringify({
    rating: 4
  });

  const options = {
    hostname: 'politicianfinder.com',
    port: 443,
    path: '/api/politicians/c34753dd/rating',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('Testing Rating API...');
  console.log('URL: https://politicianfinder.com/api/politicians/c34753dd/rating');
  console.log('Method: POST');
  console.log('Body:', data);
  console.log('---');

  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('---');

    let responseBody = '';

    res.on('data', (chunk) => {
      responseBody += chunk;
    });

    res.on('end', () => {
      console.log('Response Body:');
      try {
        const json = JSON.parse(responseBody);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log(responseBody);
      }
      console.log('---');

      if (res.statusCode === 401) {
        console.log('✓ Expected: User not authenticated (no session cookie)');
      } else if (res.statusCode === 500) {
        console.log('✗ ERROR: Server error - this is the problem!');
      } else if (res.statusCode === 200) {
        console.log('✓ SUCCESS: Rating saved successfully');
      } else {
        console.log('? Unexpected status code');
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request Error:', error.message);
  });

  req.write(data);
  req.end();
};

testRatingAPI();
