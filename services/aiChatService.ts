export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  monumentId?: string; // Reference to the monument being discussed
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastUpdated: Date;
  monumentId?: string;
}

export interface MonumentContext {
  id: string;
  name: string;
  location: string;
  period: string;
  description: string;
  significance: string;
  facts: string[];
  detailedDescription?: {
    keyTakeaways: string;
    inDepthContext: string;
    curiosities?: string;
  };
}

export async function sendChatMessage(
  message: string,
  monumentContext?: MonumentContext,
  chatHistory: ChatMessage[] = []
): Promise<string> {
  try {
    console.log('Sending chat message:', message);
    console.log('Monument context:', monumentContext?.name);
    
    // Build the context for the AI
    let systemPrompt = `You are an expert AI assistant specializing in art, cultural heritage, monuments, and architectural history. You help users learn about monuments and art including sculptures, paintings, and cultural landmarks they have scanned and discovered.

Your role is to:
- Provide accurate, engaging information about monuments and art including sculptures, paintings, and cultural landmarks
- Answer questions about art history, architecture, artistic techniques, and cultural significance
- Share interesting facts and stories about artists, monuments and art, and historical contexts
- Help users understand the artistic, historical, and cultural importance of these pieces
- Be conversational but informative
- Keep responses concise but comprehensive (200-400 words typically)

If specific monuments and art are being discussed, use the provided context to give personalized answers.`;

    if (monumentContext) {
      systemPrompt += `\n\nCurrent monuments and art context:
Name: ${monumentContext.name}
Location: ${monumentContext.location}
Period: ${monumentContext.period}
Description: ${monumentContext.description}
Significance: ${monumentContext.significance}
Facts: ${monumentContext.facts.join(', ')}

${monumentContext.detailedDescription ? `
Detailed Information:
Key Takeaways: ${monumentContext.detailedDescription.keyTakeaways}
In-Depth Context: ${monumentContext.detailedDescription.inDepthContext}
${monumentContext.detailedDescription.curiosities ? `Curiosities: ${monumentContext.detailedDescription.curiosities}` : ''}
` : ''}

Focus your responses on these specific monuments and art when relevant to the user's question.`;
    }

    // Build conversation history for context
    let conversationHistory = '';
    if (chatHistory.length > 0) {
      const recentMessages = chatHistory.slice(-6); // Keep last 6 messages for context
      conversationHistory = '\n\nRecent conversation:\n' + 
        recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    const messages = [
      {
        role: 'user' as const,
        content: `${systemPrompt}${conversationHistory}\n\nUser question: ${message}`
      }
    ];

    console.log('Sending request to Rork AI API...');
    console.log('Chat request payload:', JSON.stringify({ messages: messages }, null, 2));
    
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: messages
      })
    });

    console.log('Chat API response status:', response.status);
    console.log('Chat API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat AI API error details:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response body:', errorText);
      console.error('Request was:', JSON.stringify({ messages: messages }, null, 2));
      
      // Provide more specific error messages
      if (response.status === 500) {
        throw new Error('AI chat service is temporarily unavailable. Please try again in a few moments.');
      } else if (response.status === 429) {
        throw new Error('Too many chat requests. Please wait a moment and try again.');
      } else {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('AI response received:', data);
    
    const content = data.completion;
    if (!content) {
      throw new Error('No content in AI response');
    }

    return content.trim();
    
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw new Error('Failed to get response from AI assistant. Please try again.');
  }
}

export async function generateChatTitle(
  firstMessage: string,
  monumentContext?: MonumentContext
): Promise<string> {
  try {
    const messages = [
      {
        role: 'user' as const,
        content: `Generate a short, engaging title (3-6 words) for a chat conversation about ${monumentContext ? `the ${monumentContext.name} monuments and art` : 'monuments and art heritage'}. The first message is: "${firstMessage}"

Respond with ONLY the title, no quotes or additional text.`
      }
    ];

    console.log('Sending chat title generation request to AI API...');
    console.log('Title generation request payload:', JSON.stringify({ messages: messages }, null, 2));
    
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: messages
      })
    });

    console.log('Title generation API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Title generation AI API error details:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response body:', errorText);
      
      if (response.status === 500) {
        throw new Error('AI service is temporarily unavailable for title generation.');
      } else if (response.status === 429) {
        throw new Error('Too many requests for title generation. Please wait a moment.');
      } else {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    const content = data.completion;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    return content.trim().replace(/"/g, '');
    
  } catch (error) {
    console.error('Error generating chat title:', error);
    return monumentContext ? `About ${monumentContext.name}` : 'Art & Culture Chat';
  }
}
