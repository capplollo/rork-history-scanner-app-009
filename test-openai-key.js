// Test script to verify OpenAI API key is working
// Run this with: node test-openai-key.js

// Load environment variables
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testOpenAIKey() {
  console.log('🔍 Testing OpenAI API key...\n');
  
  if (!OPENAI_API_KEY) {
    console.error('❌ No OpenAI API key found in environment variables');
    console.log('Make sure OPENAI_API_KEY is set in your .env file');
    return;
  }
  
  console.log('✅ API key found in environment');
  console.log(`🔑 Key starts with: ${OPENAI_API_KEY.substring(0, 20)}...`);
  
  try {
    // Test with a simple completion request
    console.log('📡 Testing API connection...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, API key is working!" in exactly those words.'
          }
        ],
        max_tokens: 20
      })
    });

    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid and working!');
      console.log(`🤖 AI Response: ${data.choices[0].message.content}`);
      console.log('\n🎉 Your OpenAI integration is ready!');
      console.log('📱 The app can now use OpenAI services for:');
      console.log('   - Monument detection and analysis');
      console.log('   - AI chat conversations');
      console.log('   - Text-to-speech (if configured)');
    } else {
      const error = await response.text();
      console.error('❌ API key test failed:', error);
      
      if (response.status === 401) {
        console.log('🔧 This usually means:');
        console.log('   - The API key is invalid or expired');
        console.log('   - The API key was revoked');
        console.log('   - Check your OpenAI account for key status');
      } else if (response.status === 429) {
        console.log('🔧 Rate limit exceeded - the key is valid but you\'ve hit usage limits');
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('🔧 Check your internet connection and try again');
  }
}

// Run the test
testOpenAIKey().then(() => {
  console.log('\n📝 Test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});