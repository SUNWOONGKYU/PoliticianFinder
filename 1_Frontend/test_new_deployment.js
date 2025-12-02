const testNewDeployment = async () => {
  const urls = [
    'https://politicianfinder-i390wtfpc-finder-world.vercel.app/api/politicians/verify/send-code',
    'https://politicianfinder.com/api/politicians/verify/send-code'
  ];

  for (const url of urls) {
    console.log(`\n테스트 URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '테스트정치인',
          party: '테스트당',
          position: '국회의원'
        })
      });

      console.log(`Status: ${response.status}`);

      const text = await response.text();
      console.log(`Response: ${text || '(empty)'}`);

      if (text) {
        try {
          const json = JSON.parse(text);
          console.log(`JSON: ${JSON.stringify(json, null, 2)}`);
        } catch (e) {
          console.log('Not JSON');
        }
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
};

testNewDeployment();
