

import Constants from 'expo-constants';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }[];
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Temporary hardcoded API key for Rork environment
const OPENAI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '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';

// Debug logging
console.log('🔍 Environment Debug:');
console.log('Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY:', Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('process.env.EXPO_PUBLIC_OPENAI_API_KEY:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('Final OPENAI_API_KEY:', OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('Constants.expoConfig?.extra keys:', Object.keys(Constants.expoConfig?.extra || {}));
console.log('Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY length:', Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY?.length || 0);
console.log('Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY starts with:', Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY?.substring(0, 20) || 'NOT SET');
console.log('🔑 API Key Debug:');
console.log('API Key length:', OPENAI_API_KEY?.length || 0);
console.log('API Key starts with:', OPENAI_API_KEY?.substring(0, 20) || 'NOT SET');
console.log('API Key ends with:', OPENAI_API_KEY?.substring(OPENAI_API_KEY?.length - 10) || 'NOT SET');

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.');
}

export async function callOpenAI(messages: OpenAIMessage[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
  }

  try {
    console.log('🔑 API Key Check in callOpenAI:');
    console.log('API Key length:', OPENAI_API_KEY.length);
    console.log('API Key starts with:', OPENAI_API_KEY.substring(0, 20));
    console.log('API Key ends with:', OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10));
    
    console.log('Sending request to OpenAI API...');
    console.log('Messages:', JSON.stringify(messages, null, 2));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4 Omni for vision capabilities
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7,
      })
    });

    console.log('OpenAI API response status:', response.status);
    console.log('OpenAI API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response body:', errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your EXPO_PUBLIC_OPENAI_API_KEY.');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (response.status === 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again in a few moments.');
      } else {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
    }

    const data: OpenAIResponse = await response.json();
    console.log('OpenAI response received:', data);
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return content.trim();
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get response from OpenAI. Please try again.');
  }
}

export async function callOpenAIWithImage(prompt: string, base64Image: string): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    }
  ];

  return callOpenAI(messages);
}

export async function callOpenAIText(prompt: string): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'user',
      content: prompt
    }
  ];

  return callOpenAI(messages);
}

export async function callOpenAIWithHistory(systemPrompt: string, userMessage: string, conversationHistory: {role: 'user' | 'assistant', content: string}[]): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: 'user',
      content: userMessage
    }
  ];

  return callOpenAI(messages);
}