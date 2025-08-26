// Test script for ElevenLabs API key configuration
// Run this with: node test-elevenlabs-setup.js

const ELEVENLABS_API_KEY = 'sk_22cbad0171315d01474f3a02c222d9d04f67c9a5d8b3eae9';

async function testElevenLabsKey() {
  console.log('🔍 Testing ElevenLabs API key...\n');
  
  try {
    // Test 1: Get available voices
    console.log('📋 Fetching available voices...');
    const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!voicesResponse.ok) {
      const error = await voicesResponse.text();
      console.error('❌ Failed to fetch voices:', error);
      return;
    }

    const voicesData = await voicesResponse.json();
    console.log(`✅ Successfully fetched ${voicesData.voices.length} voices`);
    
    // Display available voices
    console.log('\n🎤 Available ElevenLabs Voices:');
    voicesData.voices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (ID: ${voice.voice_id})`);
      if (voice.labels) {
        console.log(`   Language: ${voice.labels.language || 'Unknown'}`);
        console.log(`   Gender: ${voice.labels.gender || 'Unknown'}`);
      }
      console.log('');
    });

    // Test 2: Try text-to-speech with first voice
    if (voicesData.voices.length > 0) {
      const testVoice = voicesData.voices[0];
      console.log(`🎵 Testing TTS with voice: ${testVoice.name}`);
      
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${testVoice.voice_id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: 'Hello! This is a test of the ElevenLabs text-to-speech service.',
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (ttsResponse.ok) {
        console.log('✅ TTS test successful! Audio generated.');
        console.log('📊 Response headers:', Object.fromEntries(ttsResponse.headers.entries()));
      } else {
        const error = await ttsResponse.text();
        console.error('❌ TTS test failed:', error);
      }
    }

    // Test 3: Check usage/limits
    console.log('\n📊 Checking usage information...');
    const usageResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (usageResponse.ok) {
      const usageData = await usageResponse.json();
      console.log('✅ Usage information:');
      console.log(`   Plan: ${usageData.tier}`);
      console.log(`   Character count: ${usageData.character_count}`);
      console.log(`   Character limit: ${usageData.character_limit}`);
      console.log(`   Can extend: ${usageData.can_extend_character_limit}`);
    } else {
      console.log('⚠️ Could not fetch usage information');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run the test
testElevenLabsKey().then(() => {
  console.log('\n🎉 ElevenLabs API key test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. If all tests passed, your API key is working correctly');
  console.log('2. You can now integrate ElevenLabs into your app');
  console.log('3. Use the voice IDs shown above in your app configuration');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
