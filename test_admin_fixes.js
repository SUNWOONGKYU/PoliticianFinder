// Test script for admin content management fixes
// This script verifies that the admin APIs correctly query the community_posts table

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';

async function testAdminContentAPI() {
  console.log('Testing Admin Content API...');

  try {
    const response = await fetch(`${baseUrl}/api/admin/content?limit=10`);
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Admin content API working correctly');
      console.log(`Found ${data.data.length} posts`);
      console.log(`Total posts: ${data.pagination.total}`);
    } else {
      console.log('❌ Admin content API failed');
    }
  } catch (error) {
    console.error('❌ Error testing admin content API:', error.message);
  }
}

async function testCommentsAPI() {
  console.log('\nTesting Comments API...');

  try {
    const response = await fetch(`${baseUrl}/api/comments?limit=10`);
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Comments API working correctly');
      console.log(`Found ${data.data.length} comments`);

      // Check if comments include joined data
      if (data.data.length > 0) {
        const firstComment = data.data[0];
        console.log('Sample comment structure:');
        console.log('- Has profiles data:', !!firstComment.profiles);
        console.log('- Has community_posts data:', !!firstComment.community_posts);
      }
    } else {
      console.log('❌ Comments API failed');
    }
  } catch (error) {
    console.error('❌ Error testing comments API:', error.message);
  }
}

async function testNoticesAPI() {
  console.log('\nTesting Notices API...');

  try {
    const response = await fetch(`${baseUrl}/api/notices`);
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Notices API working correctly');
      console.log(`Found ${data.data.length} notices`);
    } else {
      console.log('❌ Notices API failed');
    }
  } catch (error) {
    console.error('❌ Error testing notices API:', error.message);
  }
}

async function runTests() {
  console.log('=== Admin Content Management System Tests ===\n');

  await testAdminContentAPI();
  await testCommentsAPI();
  await testNoticesAPI();

  console.log('\n=== Tests Complete ===');
}

runTests();
