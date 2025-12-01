const testAPI = async () => {
  try {
    const response = await fetch('https://politicianfinder.com/api/politicians/verify/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '테스트정치인',
        party: '테스트당',
        position: '국회의원'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response Text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Not JSON response');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testAPI();
