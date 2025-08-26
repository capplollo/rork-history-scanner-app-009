// Simple ElevenLabs API key test
const API_KEY = 'sk_22cbad0171315d01474f3a02c222d9d04f67c9a5d8b3eae9';

async function testElevenLabs() {
  console.log('🔍 Testing ElevenLabs API key...\n');
  
  try {
    // Test 1: Get voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid!');
      console.log(`📊 Found ${data.voices.length} voices`);
      
      // Show first few voices
      data.voices.slice(0, 3).forEach((voice, i) => {
        console.log(`${i + 1}. ${voice.name} (${voice.voice_id})`);
      });
      
      console.log('\n🎉 Your ElevenLabs integration is ready!');
      console.log('📱 The voices will now appear in your app\'s voice settings.');
      
    } else {
      const error = await response.text();
      console.error('❌ API key test failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testElevenLabs();
