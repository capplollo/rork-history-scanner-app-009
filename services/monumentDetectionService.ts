

export interface DetectionResult {
  artworkName: string;
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

export async function detectArtwork(imageUri: string, additionalInfo?: AdditionalInfo): Promise<DetectionResult> {
  try {
    console.log('Starting artwork/monument detection for image:', imageUri);
    
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);
    console.log('Image converted to base64, length:', base64Image.length);
    
    // Single analysis attempt - no double processing
    const result = await performAnalysis(base64Image, additionalInfo);
    
    // Only get detailed description if artwork is recognized with high confidence
    if (result.isRecognized && result.confidence > 75) {
      console.log('Getting detailed description for recognized artwork:', result.artworkName);
      
      try {
        const detailedDescription = await getDetailedDescription(result.artworkName, result.location, additionalInfo);
        result.detailedDescription = detailedDescription;
      } catch (error) {
        console.error('Error getting detailed description:', error);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Error detecting monument:', error);
    
    // Return a proper "unknown" result instead of random mock data
    return {
      artworkName: 'Unknown Artwork',
      confidence: 0,
      location: 'Unknown',
      period: 'Unknown',
      description: 'Unable to identify this artwork, monument, sculpture, or cultural landmark. Please try taking a clearer photo or ensure the subject is clearly visible.',
      significance: 'Artwork detection failed due to technical issues.',
      facts: ['Please try again with a different photo', 'Ensure good lighting and clear view of the artwork/monument', 'Check your internet connection'],
      isRecognized: false,
    };
  }
}

async function performAnalysis(base64Image: string, additionalInfo?: AdditionalInfo): Promise<DetectionResult> {
  // Build the analysis prompt with optional additional context
  let analysisPrompt = `Analyze this image carefully and identify if it contains a famous artwork, monument, sculpture, painting, cultural landmark, or significant architectural structure. This includes:

- Historical monuments and landmarks
- Famous sculptures and statues
- Renowned paintings and frescoes
- Architectural masterpieces
- Cultural heritage sites
- Religious art and structures
- Public art installations
- Archaeological sites
- Museum pieces and gallery works

Look at artistic details, architectural features, distinctive characteristics, style, and any visible text, signatures, or identifying marks.`;
  
  // Add additional context if provided
  if (additionalInfo && (additionalInfo.name || additionalInfo.location || additionalInfo.building || additionalInfo.notes)) {
    analysisPrompt += `\n\nAdditional context provided by the user:`;
    if (additionalInfo.name) {
      analysisPrompt += `\n- Artwork/Monument Name: ${additionalInfo.name}`;
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
    
    analysisPrompt += `\n\nIMPORTANT: The location context provided is very valuable. Use it heavily in your analysis to identify artworks, monuments, sculptures, paintings, churches, or cultural landmarks in that specific area. If the provided location information helps you identify what's in the image, increase your confidence significantly. Always verify the actual location of any artwork or monument you identify and include it in your response.`;
  }
  
  analysisPrompt += `\n\nIf you recognize a specific artwork, monument, sculpture, painting, or cultural landmark, provide:
1. The exact name of the artwork/monument
2. Its ACTUAL location (city, country, museum, building) - not just the user-provided location, but the real location
3. Historical period, creation dates, or artist information
4. Brief description (2-3 sentences) including artistic style, medium, or architectural features
5. Historical, artistic, or cultural significance (2-3 sentences)
6. 3-4 interesting facts about the piece, artist, or historical context
7. Confidence level (0-100) - be more selective, only use high confidence (80+) if you're very sure

IMPORTANT GUIDELINES:
- Only mark isRecognized as true if you have high confidence (80+) in the identification
- Always provide the ACTUAL location of the artwork/monument you identify, not just the user's provided location
- If the user provided location context helps you identify a local artwork or monument, use that information but still verify and provide the correct location
- Be more selective - it's better to say "Unknown Artwork" than to incorrectly identify something
- Consider various art forms: sculptures, paintings, frescoes, mosaics, architectural details, monuments, etc.
- If you see artistic or architectural elements but can't confidently identify a specific piece, describe what you see with lower confidence

Respond ONLY in valid JSON format:
{
  "artworkName": "Name of artwork/monument or 'Unknown Artwork'",
  "confidence": 85,
  "location": "Actual City, Country, Museum/Building of the artwork (not user's provided location unless they match)",
  "period": "Time period, artist, or 'Unknown'",
  "description": "Description of what you see including artistic style and medium",
  "significance": "Historical, artistic, or cultural significance",
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

  console.log('Sending analysis request to AI API...');
  
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

  if (!response.ok) {
    console.error('AI API error:', response.status, response.statusText);
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.completion;
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Clean up the response and parse JSON
  let cleanContent = content.trim()
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/`/g, '');
  
  // Try to extract JSON from the content if it's mixed with other text
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanContent = jsonMatch[0];
  }

  try {
    const result = JSON.parse(cleanContent) as DetectionResult;
    return result;
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);
    throw new Error('Invalid JSON response from AI');
  }
}



async function getDetailedDescription(artworkName: string, detectedLocation?: string, additionalInfo?: AdditionalInfo): Promise<{
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
  
  const detailedPrompt = `Provide a structured explanation of the artwork/monument "${artworkName}"${locationContext} in four sections, written in an elegant, logically constructed, and easy-to-digest style. Use refined but accessible language. Highlight in bold most relevant words/pieces of info.

IMPORTANT: Make sure you are providing information about the specific artwork, monument, sculpture, painting, or cultural landmark${locationContext}. If there are multiple works with the same name in different locations, focus specifically on the one${locationContext}.

Quick Overview (≈500 characters): A concise, captivating description of the artwork/monument and its immediate historical or artistic significance. This should be approximately 500 characters (about 3-4 sentences).

In-Depth Context (1000-3000 characters): A longer, detailed explanation of the artwork/monument, including its specific broader historical context, the era and place in which it was created, cultural and political circumstances, artistic movement or style, creator/architect information, and any notable artistic techniques or architectural importance. Info should be very specific and interesting, mentioning specific names, artistic techniques, historical episodes, and cultural impact. This must be between 1000-3000 characters. Divide this section in 2-3 paragraphs.

Curiosities (if applicable): Mention only if there are famous, meaningful, or widely recognized anecdotes, legends, artistic stories, or curiosities tied to the artwork/monument. If none exist, write "No widely known curiosities are associated with this artwork."

Quick Facts (bullet points): A short list of the most essential facts and highlights about the artwork/monument. Provide 4-5 bullet points covering creation, artistic significance, cultural impact, and interesting details.

Respond ONLY in valid JSON format:
{
"quickOverview": "[Write exactly around 500 characters - 3-4 sentences describing the artwork/monument and its significance]",
"inDepthContext": "[Write 1000-3000 characters - comprehensive historical context, artistic details, cultural importance, and broader significance]",
"curiosities": "[Write interesting anecdotes, legends, or curiosities if they exist, otherwise write 'No widely known curiosities are associated with this artwork.']",
"keyTakeaways": [
  "Essential fact about creation, artist, or history",
  "Artistic, architectural, or stylistic significance",
  "Cultural, political, or religious importance",
  "Notable recognition, location, or visitor information",
  "Interesting highlight, technique, or unique feature"
]
}`;

  const messages = [
    {
      role: 'user' as const,
      content: detailedPrompt
    }
  ];

  console.log('Sending detailed description request to AI API...');
  
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
    console.error('Detailed description AI API error:', response.status);
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.completion;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Clean up the response and parse JSON
  let cleanContent = content.trim()
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/`/g, '')
    .replace(/\r/g, '');
  
  // Remove any leading/trailing text that's not JSON
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanContent = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(cleanContent);
    
    // Basic validation and fallbacks
    if (!parsed.quickOverview || !parsed.inDepthContext || !parsed.keyTakeaways) {
      throw new Error('Invalid response structure');
    }
    
    if (!parsed.curiosities) {
      parsed.curiosities = "No widely known curiosities are associated with this monument.";
    }
    
    if (!Array.isArray(parsed.keyTakeaways) || parsed.keyTakeaways.length < 3) {
      parsed.keyTakeaways = [
        "Represents a masterpiece of artistic or architectural achievement",
        "Showcases advanced techniques and creative vision of its era",
        "Serves as a symbol of cultural heritage and artistic identity",
        "Attracts visitors annually as a significant cultural destination",
        "Recognized as an important artwork with historical or artistic significance"
      ];
    }
    
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse detailed description JSON:', parseError);
    throw new Error('Invalid JSON response for detailed description');
  }
}

async function convertImageToBase64(imageUri: string): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}