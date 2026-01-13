/**
 * Test Gemini API Connection
 * Verifies that the API key is valid and working
 */

import { generateEmbedding } from '../src/services/gemini';

async function testGemini() {
  console.log('🔮 Testing Gemini API connection...\n');

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ Error: GEMINI_API_KEY not configured');
    console.error('\n📝 Please follow these steps:');
    console.error('   1. Visit: https://aistudio.google.com/app/apikey');
    console.error('   2. Create a free API key');
    console.error('   3. Edit backend/.dev.vars file');
    console.error('   4. Replace "your_gemini_api_key_here" with your actual key');
    console.error('\n📖 See GET_GEMINI_KEY.md for detailed instructions\n');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`   Length: ${apiKey.length} characters`);
  console.log(`   Starts with: ${apiKey.substring(0, 10)}...`);
  console.log('');

  try {
    console.log('🧪 Testing embedding generation...');
    console.log('   Sending test text: "wireless headphones"');
    console.log('');

    const startTime = Date.now();
    const embedding = await generateEmbedding(apiKey, 'wireless headphones');
    const duration = Date.now() - startTime;

    console.log('✅ Success! Gemini API is working correctly');
    console.log(`   Vector length: ${embedding.length} dimensions`);
    console.log(`   Response time: ${duration}ms`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log('');

    console.log('🎉 Gemini API test passed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Run: npm run vectorize');
    console.log('   2. This will generate embeddings for all products');
    console.log('   3. Then you can test the AI features in the frontend');
    console.log('');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Gemini API test failed!');
    console.error('');

    if (error.message?.includes('API_KEY_INVALID')) {
      console.error('🔑 Invalid API Key');
      console.error('   Your API key appears to be invalid or expired.');
      console.error('   Please generate a new key at:');
      console.error('   https://aistudio.google.com/app/apikey');
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      console.error('🔒 Permission Denied');
      console.error('   The API key does not have permission to use Gemini API.');
      console.error('   Make sure you created the key in Google AI Studio.');
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      console.error('📊 Quota Exceeded');
      console.error('   You have exceeded your API quota.');
      console.error('   Free tier: 1,500 requests per day');
      console.error('   Wait a few minutes or check your quota at:');
      console.error('   https://console.cloud.google.com/apis/dashboard');
    } else {
      console.error('🐛 Unknown Error');
      console.error(`   ${error.message || error}`);
    }

    console.error('');
    console.error('📞 Need help?');
    console.error('   See: GET_GEMINI_KEY.md for troubleshooting');
    console.error('');

    process.exit(1);
  }
}

// Run the test
testGemini();
