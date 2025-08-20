

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
    keyTakeaways: string;
    inDepthContext: string;
    curiosities?: string;
    keyTakeawaysList: string[];
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
    
    // Convert image to base64 with compression
    const base64Image = await convertImageToBase64(imageUri);
    console.log('Image converted to base64, length:', base64Image.length);
    
    // Single comprehensive analysis - get everything in one call
    const result = await performComprehensiveAnalysis(base64Image, additionalInfo);
    
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

async function performComprehensiveAnalysis(base64Image: string, additionalInfo?: AdditionalInfo): Promise<DetectionResult> {
  // Build a comprehensive prompt that gets all information in one call
  let analysisPrompt = `Analyze this image and identify any artwork, monument, sculpture, painting, or cultural landmark. Include paintings that depict buildings/landmarks (identify the PAINTING, not the depicted structure).`;
  
  // Add context if provided
  if (additionalInfo && (additionalInfo.name || additionalInfo.location || additionalInfo.building || additionalInfo.notes)) {
    analysisPrompt += `\n\n[Context if provided:`;
    if (additionalInfo.name) analysisPrompt += ` Name: ${additionalInfo.name}.`;
    if (additionalInfo.location) analysisPrompt += ` Location: ${additionalInfo.location} (weight this heavily).`;
    if (additionalInfo.building) analysisPrompt += ` Building: ${additionalInfo.building}.`;
    if (additionalInfo.notes) analysisPrompt += ` Notes: ${additionalInfo.notes}.`;
    analysisPrompt += `]`;
  }
  
  analysisPrompt += `\n\nProvide ALL information in ONE response. Only mark isRecognized as true if confidence is 80+. Always provide the ACTUAL location, not user's location unless they match.\n\nRespond in this exact JSON format:\n{\n  "artworkName": "Name or 'Unknown Artwork'",\n  "confidence": 85,\n  "location": "Actual location",\n  "period": "Period/artist or 'Unknown'",\n  "isRecognized": true/false,\n  "detailedDescription": {\n    "keyTakeaways": "Summary of the most important pieces of information (approximately 500 characters)",\n    "inDepthContext": "Write exactly 3 paragraphs (1200-3000 characters total). Separate paragraphs with double line breaks only - NO paragraph titles or labels. Use **bold** highlights for key terms, names, dates, and important details. Be specific and interesting with historical facts, technical details, measurements, materials, and anecdotes. Avoid generalizations.\n\nFirst paragraph: Focus on historical origins, creation context, artist/architect background, and period significance with specific dates and historical context.\n\nSecond paragraph: Detail artistic/architectural elements, materials used, construction techniques, style characteristics, dimensions, and unique technical features.\n\nThird paragraph: Discuss cultural impact, restoration efforts, current significance, recognition, and notable events or stories associated with the artwork.",\n    "curiosities": "Interesting anecdotes, lesser-known facts, or unusual stories. If none are known, write 'No widely known curiosities are associated with this artwork.'",\n    "keyTakeawaysList": ["Four main points summarizing the in-depth context"]\n  }\n}\n\nIMPORTANT: If not recognized with high confidence (confidence < 80), omit the entire detailedDescription object.`;

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

  console.log('Sending comprehensive analysis request to AI API...');
  
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

  console.log('Raw AI response content:', content);
  
  // Clean up the response and parse JSON with better error handling
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // Remove any backticks
  cleanContent = cleanContent.replace(/`/g, '');
  
  // Fix common JSON issues
  cleanContent = cleanContent
    .replace(/\n/g, ' ') // Remove newlines that might break JSON
    .replace(/\r/g, ' ') // Remove carriage returns
    .replace(/\t/g, ' ') // Remove tabs
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
    .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets
    .trim();
  
  // Try to extract JSON from the content - look for the outermost braces
  const jsonStart = cleanContent.indexOf('{');
  const jsonEnd = cleanContent.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
  }
  
  // Fix unterminated strings by ensuring all quotes are properly closed
  let quoteCount = 0;
  let inString = false;
  let fixedContent = '';
  
  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    const prevChar = i > 0 ? cleanContent[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      quoteCount++;
      inString = !inString;
    }
    
    fixedContent += char;
  }
  
  // If we have an odd number of quotes, we have an unterminated string
  if (quoteCount % 2 !== 0) {
    console.warn('Detected unterminated string in JSON, attempting to fix...');
    // Try to close the last unterminated string
    if (inString) {
      // Find the last quote and see if we can close it properly
      const lastQuoteIndex = fixedContent.lastIndexOf('"');
      if (lastQuoteIndex !== -1) {
        // Look for the next comma, brace, or bracket after the last quote
        const afterQuote = fixedContent.substring(lastQuoteIndex + 1);
        const nextDelimiter = afterQuote.search(/[,}\]]/); 
        if (nextDelimiter !== -1) {
          // Insert a closing quote before the delimiter
          const insertPos = lastQuoteIndex + 1 + nextDelimiter;
          fixedContent = fixedContent.substring(0, insertPos) + '"' + fixedContent.substring(insertPos);
        } else {
          // Just add a quote at the end before the last brace
          const lastBrace = fixedContent.lastIndexOf('}');
          if (lastBrace !== -1) {
            fixedContent = fixedContent.substring(0, lastBrace) + '"' + fixedContent.substring(lastBrace);
          }
        }
      }
    }
  }
  
  cleanContent = fixedContent;
  console.log('Cleaned content for parsing:', cleanContent.substring(0, 500) + (cleanContent.length > 500 ? '...' : ''));

  try {
    // Validate that we have proper JSON structure
    if (!cleanContent.startsWith('{') || !cleanContent.endsWith('}')) {
      throw new Error('Response does not contain valid JSON structure');
    }
    
    const result = JSON.parse(cleanContent) as DetectionResult;
    
    // Validate required fields
    if (!result.artworkName || typeof result.confidence !== 'number' || !result.location) {
      console.error('Invalid result structure:', result);
      throw new Error('AI response missing required fields');
    }
    
    // Ensure facts is an array
    if (!Array.isArray(result.facts)) {
      result.facts = [];
    }
    
    // Validate and set defaults for detailed description if missing
    if (result.isRecognized && result.confidence > 75 && !result.detailedDescription) {
      result.detailedDescription = {
        keyTakeaways: result.description || 'No description available',
        inDepthContext: `**${result.artworkName}** is a significant ${result.period} artwork located in ${result.location}. This piece represents important cultural heritage and artistic achievement of its era. The work showcases the artistic techniques and cultural values of its time period, reflecting the historical context and artistic movements of the period. The creation involved specific materials and techniques characteristic of the era, and its preservation allows us to understand the cultural and artistic priorities of the time.`,
        curiosities: "No widely known curiosities are associated with this artwork.",
        keyTakeawaysList: result.facts.slice(0, 4)
      };
    }
    
    console.log('Successfully parsed detection result:', result);
    return result;
    
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);
    console.error('Content that failed to parse:', cleanContent);
    console.error('Original AI response:', content);
    
    // Try to extract basic information even if JSON parsing fails
    const fallbackResult = extractFallbackInfo(content);
    if (fallbackResult) {
      console.log('Using fallback extraction:', fallbackResult);
      return fallbackResult;
    }
    
    throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}





async function convertImageToBase64(imageUri: string): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  
  // Compress image if it's too large (>1MB)
  let finalBlob = blob;
  if (blob.size > 1024 * 1024) {
    console.log('Compressing large image:', blob.size, 'bytes');
    finalBlob = await compressImage(blob);
    console.log('Compressed to:', finalBlob.size, 'bytes');
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(finalBlob);
  });
}

// Fallback function to extract basic info when JSON parsing fails
function extractFallbackInfo(content: string): DetectionResult | null {
  try {
    // Try to extract basic information using regex patterns
    const nameMatch = content.match(/(?:artworkName|name)["']?\s*:\s*["']([^"']+)["']/i);
    const locationMatch = content.match(/(?:location)["']?\s*:\s*["']([^"']+)["']/i);
    const confidenceMatch = content.match(/(?:confidence)["']?\s*:\s*(\d+)/i);
    
    if (nameMatch || locationMatch) {
      return {
        artworkName: nameMatch?.[1] || 'Unknown Artwork',
        confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 0,
        location: locationMatch?.[1] || 'Unknown',
        period: 'Unknown',
        description: 'Artwork detected but full analysis unavailable due to parsing error.',
        significance: 'Unable to determine significance.',
        facts: ['Please try scanning again for detailed information'],
        isRecognized: false
      };
    }
  } catch (error) {
    console.error('Fallback extraction failed:', error);
  }
  
  return null;
}

async function compressImage(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 1024px on longest side)
      const maxSize = 1024;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((compressedBlob) => {
        resolve(compressedBlob || blob);
      }, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(blob);
  });
}