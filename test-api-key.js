const API_KEY = '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';

console.log('Testing API key:');
console.log('Length:', API_KEY.length);
console.log('Starts with:', API_KEY.substring(0, 20));
console.log('Ends with:', API_KEY.substring(API_KEY.length - 10));

// Test the API call
async function testAPI() {
  try {
    console.log('Making test API call...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message.'
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success! Response:', data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();
