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
    
    // Build the analysis prompt with optional additional context
    let analysisPrompt = `Analyze this image carefully and identify if it contains a famous historical monument, landmark, or significant architectural structure. Look at architectural details, distinctive features, and any visible text or signs.`;
    
    // Add additional context if provided
    if (additionalInfo && (additionalInfo.name || additionalInfo.location || additionalInfo.building || additionalInfo.notes)) {
      analysisPrompt += `\n\nAdditional context provided by the user:`;
      if (additionalInfo.name) {
        analysisPrompt += `\n- Monument/Art Name: ${additionalInfo.name}`;
      }
      if (additionalInfo.location) {
        analysisPrompt += `\n- Location: ${additionalInfo.location}`;
      }
      if (additionalInfo.building) {
        analysisPrompt += `\n- Building/Museum: ${additionalInfo.building}`;
      }
      if (additionalInfo.notes) {
        analysisPrompt += `\n- Additional Notes: ${additionalInfo.notes}`;
      }
      analysisPrompt += `\n\nUse this context to help with your analysis, but still verify what you see in the image. If the provided information matches what you observe, increase your confidence. If there's a mismatch, trust what you see in the image.`;
    }
    
    analysisPrompt += `\n\nIf you recognize a specific monument, provide:
1. The exact name of the monument
2. Its location (city, country)
3. Historical period or construction dates
4. Brief description (2-3 sentences)
5. Historical significance (2-3 sentences)
6. 3-4 interesting facts
7. Confidence level (0-100)

If you don't recognize a specific famous monument but see architectural elements, describe what you see and suggest it might be a local landmark or historical building with lower confidence.

Be very specific about what you see in the image. Don't default to famous monuments unless you're confident.

Respond ONLY in valid JSON format:
{
  "monumentName": "Name of monument or 'Unknown Monument'",
  "confidence": 85,
  "location": "City, Country or 'Unknown'",
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

    console.log('Sending request to AI API...');
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, response.statusText, errorText);
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
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
    
    // If it's a recognized monument, get detailed description
    if (result.isRecognized && result.confidence > 70) {
      console.log('Getting detailed description for recognized monument:', result.monumentName);
      
      try {
        const detailedDescription = await getDetailedDescription(result.monumentName);
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

async function getDetailedDescription(monumentName: string): Promise<{
  quickOverview: string;
  inDepthContext: string;
  curiosities?: string;
  keyTakeaways: string[];
}> {
  const messages = [
    {
      role: 'user' as const,
      content: `Provide a structured explanation of the monument "${monumentName}" in four sections, written in an elegant, logically constructed, and easy-to-digest style. Use refined but accessible language.

Quick Overview (≈500 characters): A concise, captivating description of the monument and its immediate historical significance. This should be approximately 500 characters (about 3-4 sentences).

In-Depth Context (1000-3000 characters): A longer, detailed explanation of the monument, including its broader historical context, the era and place in which it appeared, cultural and political circumstances, and any notable architectural style or artistic importance. This must be between 1000-3000 characters.

Curiosities (if applicable): Mention only if there are famous, meaningful, or widely recognized anecdotes, legends, or curiosities tied to the monument. If none exist, write "No widely known curiosities are associated with this monument."

Quick Facts (bullet points): A short list of the most essential facts and highlights about the monument. Provide 4-5 bullet points.

IMPORTANT: Follow the character count requirements strictly. The Quick Overview should be around 500 characters, and the In-Depth Context should be 1000-3000 characters.

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
}

Ensure the content is informative, engaging, and properly formatted. Do NOT include markdown or any text outside the JSON.`
    }
  ];

  const response = await fetch('https://toolkit.rork.com/text/llm/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages
    })
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${response.statusText}`);
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