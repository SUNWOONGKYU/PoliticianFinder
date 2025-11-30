// Test production DELETE API endpoint
const fetch = require('node-fetch');

async function testProductionDelete() {
  console.log('\n=== Production DELETE API Test ===\n');

  const baseUrl = 'https://www.politicianfinder.ai.kr';

  // First, get the list of users to find a test user ID
  console.log('Step 1: Fetching users list...\n');

  try {
    const getUsersResponse = await fetch(`${baseUrl}/api/admin/users?page=1&limit=20`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('GET Response Status:', getUsersResponse.status);
    console.log('GET Response Headers:', Object.fromEntries(getUsersResponse.headers.entries()));

    const getUsersText = await getUsersResponse.text();
    console.log('GET Response Body:', getUsersText);
    console.log('\n');

    if (getUsersResponse.status === 401) {
      console.log('❌ Unauthorized - API requires authentication');
      console.log('Note: Production API properly requires authentication');
      console.log('The issue must be browser session-related.');
      return;
    }

    const getUsersResult = JSON.parse(getUsersText);

    if (getUsersResult.success && getUsersResult.data && getUsersResult.data.length > 0) {
      console.log(`✅ Found ${getUsersResult.data.length} users`);
      console.log('\nFirst user:');
      console.log(JSON.stringify(getUsersResult.data[0], null, 2));

      const testUserId = getUsersResult.data[0].id;
      console.log(`\n\nStep 2: Testing DELETE with user_id: ${testUserId}\n`);

      const deleteResponse = await fetch(`${baseUrl}/api/admin/users?user_id=${testUserId}`, {
        method: 'DELETE',
      });

      console.log('DELETE Response Status:', deleteResponse.status);
      const deleteText = await deleteResponse.text();
      console.log('DELETE Response Body:', deleteText);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProductionDelete();
