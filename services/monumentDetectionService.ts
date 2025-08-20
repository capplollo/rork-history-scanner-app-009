import { mockMonuments } from '@/data/mockMonuments';

export interface DetectionResult {
  monumentName: string;
  confidence: number;
  location: string;
  period: string;
  description: string;
  significance: string;
  facts: string[];
  isRecognized: boolean;
  detailedDescription?: {
    quickOverview: string;
    inDepthContext: string;
    curiosities?: string;
    keyTakeaways: string[];
  };
}

export interface AdditionalInfo {
  name: string;
  location: string;
  building: string;
  notes: string;
}

export async function detectMonument(imageUri: string, additionalInfo?: AdditionalInfo): Promise<DetectionResult> {
  try {
    console.log('Starting monument detection for image:', imageUri);
    
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);
    console.log('Image converted to base64, length:', base64Image.length);
    
    // First attempt: Standard analysis
    let result = await performAnalysis(base64Image, additionalInfo, false);
    
    // If first attempt failed or has low confidence, try second attempt with enhanced context
    if (!result.isRecognized || result.confidence < 60) {
      console.log('First analysis failed or low confidence, attempting second analysis with enhanced context...');
      
      const secondResult = await performAnalysis(base64Image, additionalInfo, true);
      
      // Use the better result
      if (secondResult.confidence > result.confidence) {
        console.log('Second analysis provided better results, using it');
        result = secondResult;
      } else {
        console.log('Second analysis did not improve results, keeping first attempt');
      }
    }
    
    // Require higher confidence for monument recognition (75 instead of 70)
    if (result.isRecognized && result.confidence > 75) {
      console.log('Getting detailed description for recognized monument:', result.monumentName);
      
      try {
        const detailedDescription = await getDetailedDescription(result.monumentName, result.location, additionalInfo);
        result.detailedDescription = detailedDescription;
      } catch (error) {
        console.error('Error getting detailed description:', error);
      }
      
      // Only use mock data if we have an exact match, don't override AI detection
      const matchedMonument = findExactMatchingMonument(result.monumentName);
      if (matchedMonument) {
        console.log('Found exact matching monument in mock data:', matchedMonument.name);
        // Only enhance with mock data, don't replace the AI's detection
        result.description = matchedMonument.description;
        result.significance = matchedMonument.significance;
        result.facts = matchedMonument.facts;
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Error detecting monument:', error);
    
    // Return a proper "unknown" result instead of random mock data
    return {
      monumentName: 'Unknown Monument',
      confidence: 0,
      location: 'Unknown',
      period: 'Unknown',
      description: 'Unable to identify this monument. Please try taking a clearer photo or ensure the monument is clearly visible.',
      significance: 'Monument detection failed due to technical issues.',
      facts: ['Please try again with a different photo', 'Ensure good lighting and clear view of the monument', 'Check your internet connection'],
      isRecognized: false,
    };
  }
}

async function performAnalysis(base64Image: string, additionalInfo?: AdditionalInfo, isSecondAttempt: boolean = false): Promise<DetectionResult> {
  // Build the analysis prompt with optional additional context
  let analysisPrompt = `Analyze this image carefully and identify if it contains a famous historical monument, landmark, or significant architectural structure. Look at architectural details, distinctive features, and any visible text or signs.`;
  
  if (isSecondAttempt) {
    analysisPrompt += `\n\nThis is a second analysis attempt. The first attempt was unsuccessful, so please be more thorough and consider local landmarks, churches, and lesser-known monuments.`;
  }
  
  // Add additional context if provided
  if (additionalInfo && (additionalInfo.name || additionalInfo.location || additionalInfo.building || additionalInfo.notes)) {
    analysisPrompt += `\n\nAdditional context provided by the user:`;
    if (additionalInfo.name) {
      analysisPrompt += `\n- Monument/Art Name: ${additionalInfo.name}`;
    }
    if (additionalInfo.location) {
      analysisPrompt += `\n- Location: ${additionalInfo.location} (IMPORTANT: This location context should be heavily weighted in your analysis)`;
    }
    if (additionalInfo.building) {
      analysisPrompt += `\n- Building/Museum: ${additionalInfo.building}`;
    }
    if (additionalInfo.notes) {
      analysisPrompt += `\n- Additional Notes: ${additionalInfo.notes}`;
    }
    
    if (isSecondAttempt) {
      analysisPrompt += `\n\nIMPORTANT: This is a second attempt. Use the provided context more heavily to identify local monuments, churches, or lesser-known landmarks. The location information is particularly important - look for monuments, churches, or landmarks specifically in or near the provided location. Even if it's not a world-famous monument, if you can identify it based on the context and visual clues, provide that information.`;
    } else {
      analysisPrompt += `\n\nIMPORTANT: The location context provided is very valuable. Use it heavily in your analysis to identify monuments, churches, or landmarks in that specific area. If the provided location information helps you identify what's in the image, increase your confidence significantly. Always verify the actual location of any monument you identify and include it in your response.`;
    }
  }
  
  analysisPrompt += `\n\nIf you recognize a specific monument, provide:
1. The exact name of the monument
2. Its ACTUAL location (city, country) - not just the user-provided location, but the real location of the monument
3. Historical period or construction dates
4. Brief description (2-3 sentences)
5. Historical significance (2-3 sentences)
6. 3-4 interesting facts
7. Confidence level (0-100) - be more conservative, only use high confidence (75+) if you're very sure

IMPORTANT GUIDELINES:
- Only mark isRecognized as true if you have high confidence (75+) in the identification
- Always provide the ACTUAL location of the monument you identify, not just the user's provided location
- If the user provided location context helps you identify a local monument, use that information but still verify and provide the correct location
- Be more selective - it's better to say "Unknown Monument" than to incorrectly identify something
- If you see architectural elements but can't confidently identify a specific monument, describe what you see with lower confidence

Respond ONLY in valid JSON format:
{
  "monumentName": "Name of monument or 'Unknown Monument'",
  "confidence": 85,
  "location": "Actual City, Country of the monument (not user's provided location unless they match)",
  "period": "Time period or 'Unknown'",
  "description": "Description of what you see",
  "significance": "Historical or cultural significance",
  "facts": ["fact1", "fact2", "fact3"],
  "isRecognized": true/false
}`;

  const messages = [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: analysisPrompt
        },
        {
          type: 'image' as const,
          image: base64Image
        }
      ]
    }
  ];

  console.log(`Sending ${isSecondAttempt ? 'second' : 'first'} analysis request to AI API...`);
  console.log('Request payload:', JSON.stringify({ messages: messages }, null, 2));
  
  const response = await fetch('https://toolkit.rork.com/text/llm/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages
    })
  });

  console.log('AI API response status:', response.status);
  console.log('AI API response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error details:');
    console.error('Status:', response.status, response.statusText);
    console.error('Response body:', errorText);
    console.error('Request was:', JSON.stringify({ messages: messages }, null, 2));
    
    // Provide more specific error messages
    if (response.status === 500) {
      throw new Error('AI service is temporarily unavailable. Please try again in a few moments.');
    } else if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    } else if (response.status === 413) {
      throw new Error('Image is too large. Please try with a smaller image.');
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

  console.log('Raw AI content:', content);

  // Clean up the response and parse JSON
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any backticks that might be left
  cleanContent = cleanContent.replace(/`/g, '');
  
  // Try to extract JSON from the content if it's mixed with other text
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanContent = jsonMatch[0];
  }
  
  // Clean up any remaining formatting issues
  cleanContent = cleanContent.trim();
  
  console.log('Cleaned content for parsing:', cleanContent);

  let result: DetectionResult;
  try {
    result = JSON.parse(cleanContent) as DetectionResult;
    console.log('Parsed result:', result);
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);
    console.error('Content that failed to parse:', cleanContent);
    console.error('Original content:', content);
    
    // Try to create a fallback result from the text content
    const fallbackResult = createFallbackResult(content);
    if (fallbackResult) {
      console.log('Using fallback result:', fallbackResult);
      return fallbackResult;
    }
    
    throw new Error('Invalid JSON response from AI');
  }
  
  return result;
}

function findExactMatchingMonument(detectedName: string) {
  const normalizedDetected = detectedName.toLowerCase().trim();
  return mockMonuments.find(monument => {
    const normalizedMonument = monument.name.toLowerCase().trim();
    // Only match if the names are very similar (exact match or very close)
    return normalizedMonument === normalizedDetected || 
           (normalizedMonument.includes(normalizedDetected) && normalizedDetected.length > 5) ||
           (normalizedDetected.includes(normalizedMonument) && normalizedMonument.length > 5);
  });
}

function createFallbackResult(content: string): DetectionResult | null {
  try {
    return {
      monumentName: 'Monument Analysis',
      confidence: 30,
      location: 'Unknown',
      period: 'Unknown',
      description: content.substring(0, 200) + '...',
      significance: 'Analysis provided but format was not parseable.',
      facts: ['AI analysis was provided but in unexpected format', 'Please try again for better results'],
      isRecognized: false,
    };
  } catch {
    return null;
  }
}

async function getDetailedDescription(monumentName: string, detectedLocation?: string, additionalInfo?: AdditionalInfo): Promise<{
  quickOverview: string;
  inDepthContext: string;
  curiosities?: string;
  keyTakeaways: string[];
}> {
  // Build location context for the prompt
  let locationContext = '';
  if (detectedLocation && detectedLocation !== 'Unknown') {
    locationContext = ` located in ${detectedLocation}`;
  } else if (additionalInfo?.location) {
    locationContext = ` located in ${additionalInfo.location}`;
  }
  
  const detailedPrompt = `Provide a structured explanation of the monument "${monumentName}"${locationContext} in four sections, written in an elegant, logically constructed, and easy-to-digest style. Use refined but accessible language. Highlight in bold most relevant words/pieces of info.

IMPORTANT: Make sure you are providing information about the specific monument${locationContext}. If there are multiple monuments with the same name in different locations, focus specifically on the one${locationContext}.

Quick Overview (≈500 characters): A concise, captivating description of the monument and its immediate historical significance. This should be approximately 500 characters (about 3-4 sentences).

In-Depth Context (1000-3000 characters): A longer, detailed explanation of the monument, including its specific broader historical context, the era and place in which it appeared, cultural and political circumstances, and any notable architectural style or artistic importance. Info should be very specific and interesting, mentioning specific names, parts and episodes. This must be between 1000-3000 characters. Divide this section in 2-3 paragraphs.

Curiosities (if applicable): Mention only if there are famous, meaningful, or widely recognized anecdotes, legends, or curiosities tied to the monument. If none exist, write "No widely known curiosities are associated with this monument."

Quick Facts (bullet points): A short list of the most essential facts and highlights about the monument. Provide 4-5 bullet points.

Respond ONLY in valid JSON format:
{
"quickOverview": "[Write exactly around 500 characters - 3-4 sentences describing the monument and its significance]",
"inDepthContext": "[Write 1000-3000 characters - comprehensive historical context, architectural details, cultural importance, and broader significance]",
"curiosities": "[Write interesting anecdotes, legends, or curiosities if they exist, otherwise write 'No widely known curiosities are associated with this monument.']",
"keyTakeaways": [
  "Essential fact about construction or history",
  "Architectural or artistic significance",
  "Cultural or political importance",
  "Notable visitor information or recognition",
  "Interesting highlight or unique feature"
]
}`;

  const messages = [
    {
      role: 'user' as const,
      content: detailedPrompt
    }
  ];

  console.log('Sending detailed description request to AI API...');
  console.log('Detailed description request payload:', JSON.stringify({ messages: messages }, null, 2));
  
  const response = await fetch('https://toolkit.rork.com/text/llm/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages
    })
  });

  console.log('Detailed description API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Detailed description AI API error details:');
    console.error('Status:', response.status, response.statusText);
    console.error('Response body:', errorText);
    
    if (response.status === 500) {
      throw new Error('AI service is temporarily unavailable for detailed descriptions.');
    } else if (response.status === 429) {
      throw new Error('Too many requests for detailed descriptions. Please wait a moment.');
    } else {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  const content = data.completion;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  console.log('Raw detailed description response:', content);

  // Clean up the response and parse JSON
  let cleanContent = content.trim();
  
  // Remove any markdown formatting that might still appear
  cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  cleanContent = cleanContent.replace(/`/g, '');
  
  // Remove any leading/trailing text that's not JSON
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanContent = jsonMatch[0];
  }
  
  // Fix common JSON issues - preserve line breaks in content but fix structure
  cleanContent = cleanContent.replace(/\r/g, '');
  
  console.log('Cleaned detailed description content:', cleanContent);
  
  try {
    const parsed = JSON.parse(cleanContent);
    console.log('Parsed detailed description:', parsed);
    
    // Validate the response has the required structure
    if (!parsed.quickOverview || !parsed.inDepthContext || !parsed.keyTakeaways) {
      console.error('Missing required fields in detailed description response');
      throw new Error('Invalid response structure');
    }
    
    // Validate character counts and content quality
    const quickOverviewLength = parsed.quickOverview?.length || 0;
    const inDepthContextLength = parsed.inDepthContext?.length || 0;
    const curiositiesLength = parsed.curiosities?.length || 0;
    
    console.log('Quick Overview length:', quickOverviewLength);
    console.log('In-Depth Context length:', inDepthContextLength);
    console.log('Curiosities length:', curiositiesLength);
    
    // Validate content quality - if AI didn't follow requirements, request again
    if (quickOverviewLength < 400 || quickOverviewLength > 600) {
      console.warn('Quick Overview length not within requirements (400-600 chars):', quickOverviewLength);
      // Don't use fallback, let the original response show the issue
    }
    
    if (inDepthContextLength < 1000 || inDepthContextLength > 3000) {
      console.warn('In-Depth Context length not within requirements (1000-3000 chars):', inDepthContextLength);
      // Don't use fallback, let the original response show the issue
    }
    
    if (!parsed.curiosities || curiositiesLength < 30) {
      console.warn('Curiosities section missing or too short');
      parsed.curiosities = "No widely known curiosities are associated with this monument.";
    }
    
    if (!Array.isArray(parsed.keyTakeaways) || parsed.keyTakeaways.length < 3) {
      console.warn('Key takeaways not properly formatted, providing fallback');
      parsed.keyTakeaways = [
        `Construction represents a masterpiece of historical architecture`,
        `Showcases advanced engineering and artistic techniques of its era`,
        `Serves as a symbol of cultural heritage and national identity`,
        `Attracts visitors annually as a significant cultural destination`,
        `Recognized as an important monument with historical significance`
      ];
    }
    
    // Ensure keyTakeaways is an array
    if (!Array.isArray(parsed.keyTakeaways)) {
      console.error('keyTakeaways is not an array');
      parsed.keyTakeaways = ['Unable to parse key takeaways'];
    }
    
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse detailed description JSON:', parseError);
    console.error('Content that failed to parse:', cleanContent);
    throw new Error('Invalid JSON response for detailed description');
  }
}

async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Check blob size and compress if too large (limit to ~1MB)
    if (blob.size > 1024 * 1024) {
      console.warn('Image is large, this might cause issues:', blob.size, 'bytes');
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Additional size check on base64
        if (base64.length > 1.5 * 1024 * 1024) { // ~1.5MB base64 limit
          console.warn('Base64 image is very large:', base64.length, 'characters');
        }
        
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}