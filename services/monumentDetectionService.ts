import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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
    keyTakeawaysList?: string[];
  };
}

export interface AdditionalInfo {
  name: string;
  location: string;
  building: string;
  notes: string;
}

export async function detectMonumentsAndArt(imageUri: string, additionalInfo?: AdditionalInfo): Promise<DetectionResult> {
  try {
    console.log('Starting monuments and art detection for image:', imageUri);
    console.log('Platform:', Platform.OS);
    console.log('Additional info provided:', additionalInfo);
    
    // Convert image to base64 with compression
    const base64Image = await convertImageToBase64(imageUri);
    console.log('Image converted to base64, length:', base64Image.length);
    
    // Single comprehensive analysis - get everything in one call
    const result = await performComprehensiveAnalysis(base64Image, additionalInfo);
    console.log('Analysis completed successfully:', result.artworkName, 'confidence:', result.confidence);
    
    return result;
    
  } catch (error) {
    console.error('Error detecting monuments and art:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      platform: Platform.OS,
      imageUri: imageUri?.substring(0, 100) + '...' // Log first 100 chars of URI
    });
    
    // Return a proper "unknown" result instead of random mock data
    return {
      artworkName: 'Unknown Monuments and Art',
      confidence: 0,
      location: 'Unknown',
      period: 'Unknown',
      description: 'Unable to identify these monuments and art. Please try taking a clearer photo or ensure the subject is clearly visible.',
      significance: 'Monuments and art detection failed due to technical issues.',
      facts: ['Please try again with a different photo', 'Ensure good lighting and clear view of the monuments and art', 'Check your internet connection'],
      isRecognized: false,
    };
  }
}

async function performComprehensiveAnalysis(base64Image: string, additionalInfo?: AdditionalInfo): Promise<DetectionResult> {
  // Build a comprehensive prompt that gets all information in one call
  let analysisPrompt = `Analyze this image and identify any monuments and art including sculptures, paintings, or cultural landmarks. Include paintings that depict buildings/landmarks (identify the PAINTING, not the depicted structure).

Consider that many sculptures share similar themes, poses, or subjects but are different works entirely. For sculptures, confidence should be 90% or higher for recognition. For other monuments and art, confidence should be 80% or higher.`;
  
  // Add context if provided - give HEAVY weight to user context
  if (additionalInfo && (additionalInfo.name || additionalInfo.location || additionalInfo.building || additionalInfo.notes)) {
    analysisPrompt += `\n\n**CRITICAL USER CONTEXT - PRIORITIZE THIS INFORMATION HEAVILY:**`;
    if (additionalInfo.name) analysisPrompt += `\n- Monument/Art Name: "${additionalInfo.name}" (Use this name if it matches what you see in the image)`;
    if (additionalInfo.location) analysisPrompt += `\n- Location: "${additionalInfo.location}" (This location context is EXTREMELY IMPORTANT - if the image could plausibly be from this location, strongly favor monuments/art from this area)`;
    if (additionalInfo.building) analysisPrompt += `\n- Building/Context: "${additionalInfo.building}" (Consider this building context when identifying)`;
    if (additionalInfo.notes) analysisPrompt += `\n- Additional Notes: "${additionalInfo.notes}" (Important context clues)`;
    analysisPrompt += `\n\nWith this context provided, you should:\n1. STRONGLY prioritize monuments and art that match this location\n2. If the visual matches reasonably well with something from this location, increase confidence significantly\n3. Use the provided name if it matches what you observe in the image\n4. Consider the building/context information as key identifying factors`;
  }
  
  analysisPrompt += `\n\nProvide ALL information in ONE response. Only mark isRecognized as true if confidence is 80+. Always provide the ACTUAL location, not user's location unless they match.\n\nRespond in this exact JSON format:\n{\n  "artworkName": "Name or 'Unknown Monuments and Art'",\n  "confidence": 85,\n  "location": "Actual location",\n  "period": "Year(s) or century format (e.g., '1503', '15th century', '1800s', '12th-13th century') or 'Unknown'",\n  "isRecognized": true/false,\n  "detailedDescription": {\n    "keyTakeaways": "Summary of the most important pieces of information (approximately 500 characters)",\n    "inDepthContext": "Write exactly 3 paragraphs (1400-3000 characters total). Separate paragraphs with double line breaks only - NO paragraph titles or labels. Use **bold** highlights for key terms, names, dates, and important details. Be specific and interesting. Avoid generalizations.\n\nFirst paragraph: Focus on historical origins, creation context, artist/architect background, and period significance with specific dates and historical context.\n\nSecond paragraph: Detail artistic/architectural elements, materials used, construction techniques, style characteristics, dimensions, and unique technical features.\n\nThird paragraph: Discuss cultural impact, significance over the years, notable events or stories associated with the monuments and art and more.",\n    "curiosities": "Interesting anecdotes, lesser-known facts, or unusual stories. If none are known, write 'No widely known curiosities are associated with these monuments and art.'"\n  }\n}\n\nIMPORTANT: If not recognized with high confidence (confidence < 80), omit the entire detailedDescription object.`;

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

  // Clean up the response and parse JSON with better error handling
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/`/g, '');
  
  // Try to extract JSON from the content if it's mixed with other text
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanContent = jsonMatch[0];
  }
  
  // More aggressive control character removal and JSON fixing
  cleanContent = cleanContent
    // Remove ALL control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Fix escaped quotes that break JSON parsing
    .replace(/\\"/g, '"')
    // Fix unescaped newlines within JSON strings - more comprehensive
    .replace(/"([^"]*?)\n+([^"]*?)"/g, '"$1 $2"')
    // Fix unescaped tabs within JSON strings
    .replace(/"([^"]*?)\t+([^"]*?)"/g, '"$1 $2"')
    // Fix unescaped carriage returns within JSON strings
    .replace(/"([^"]*?)\r+([^"]*?)"/g, '"$1 $2"')
    // Remove any trailing commas before closing braces/brackets
    .replace(/,\s*([}\]])/g, '$1')
    // Fix any double commas
    .replace(/,,+/g, ',')
    // Normalize whitespace around JSON syntax
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s*,\s*/g, ', ')
    // Remove any remaining problematic characters in strings
    .replace(/"([^"]*?)[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]([^"]*?)"/g, '"$1$2"');

  console.log('Cleaned content for JSON parsing:', cleanContent.substring(0, 200) + '...');

  try {
    const result = JSON.parse(cleanContent) as DetectionResult;
    
    // Validate and set defaults for detailed description if missing
    if (result.isRecognized && result.confidence > 75 && !result.detailedDescription) {
      result.detailedDescription = {
        keyTakeaways: result.description,
        inDepthContext: `**${result.artworkName}** is significant ${result.period} monuments and art located in ${result.location}. This piece represents important cultural heritage and artistic achievement of its era. The work showcases the artistic techniques and cultural values of its time period, reflecting the historical context and artistic movements of the period. The creation involved specific materials and techniques characteristic of the era, and its preservation allows us to understand the cultural and artistic priorities of the time.`,
        curiosities: "No widely known curiosities are associated with these monuments and art."
      };
    }
    
    // Clean up any duplicate keyTakeaways data - we only need keyTakeaways, not keyTakeawaysList
    if (result.detailedDescription?.keyTakeawaysList) {
      delete result.detailedDescription.keyTakeawaysList;
    }
    
    return result;
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);
    console.error('Raw AI response:', content);
    console.error('Cleaned content that failed to parse:', cleanContent);
    
    // Try one more time with even more aggressive cleaning
    try {
      // Remove everything before the first { and after the last }
      const startIndex = cleanContent.indexOf('{');
      const endIndex = cleanContent.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        let extractedJson = cleanContent.substring(startIndex, endIndex + 1);
        
        // Additional aggressive cleaning for the extracted JSON
        extractedJson = extractedJson
          // Remove any remaining control characters
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
          // Fix escaped quotes that break JSON parsing
          .replace(/\\"/g, '"')
          // Fix malformed strings by ensuring proper escaping
          .replace(/"([^"\\]*)\\n([^"\\]*)"/g, '"$1\\n$2"')
          .replace(/"([^"\\]*)\\t([^"\\]*)"/g, '"$1\\t$2"')
          .replace(/"([^"\\]*)\\r([^"\\]*)"/g, '"$1\\r$2"')
          // Remove any trailing commas before closing braces/brackets
          .replace(/,\s*([}\]])/g, '$1')
          // Fix any double commas
          .replace(/,,+/g, ',')
          // Ensure proper spacing around colons and commas
          .replace(/:\s*([^\s])/g, ': $1')
          .replace(/,\s*([^\s])/g, ', $1');
        
        console.log('Attempting to parse aggressively cleaned JSON:', extractedJson.substring(0, 200) + '...');
        
        const result = JSON.parse(extractedJson) as DetectionResult;
        console.log('Successfully parsed JSON on second attempt');
        
        // Validate and set defaults for detailed description if missing
        if (result.isRecognized && result.confidence > 75 && !result.detailedDescription) {
          result.detailedDescription = {
            keyTakeaways: result.description,
            inDepthContext: `**${result.artworkName}** is significant ${result.period} monuments and art located in ${result.location}. This piece represents important cultural heritage and artistic achievement of its era. The work showcases the artistic techniques and cultural values of its time period, reflecting the historical context and artistic movements of the period. The creation involved specific materials and techniques characteristic of the era, and its preservation allows us to understand the cultural and artistic priorities of the time.`,
            curiosities: "No widely known curiosities are associated with these monuments and art."
          };
        }
        
        // Clean up any duplicate keyTakeaways data
        if (result.detailedDescription?.keyTakeawaysList) {
          delete result.detailedDescription.keyTakeawaysList;
        }
        
        return result;
      }
    } catch (secondParseError) {
      console.error('Second JSON parse attempt also failed:', secondParseError);
      
      // Final attempt: try to manually reconstruct basic JSON structure
      try {
        console.log('Attempting manual JSON reconstruction...');
        const reconstructedResult = attemptManualJsonReconstruction(content);
        if (reconstructedResult) {
          console.log('Manual reconstruction successful');
          return reconstructedResult;
        }
      } catch (reconstructionError) {
        console.error('Manual reconstruction failed:', reconstructionError);
      }
    }
    
    // If all parsing attempts fail, return a fallback result
    console.log('All JSON parsing attempts failed, returning fallback result');
    return {
      artworkName: 'Unknown Monuments and Art',
      confidence: 0,
      location: 'Unknown',
      period: 'Unknown',
      description: 'Unable to identify these monuments and art due to response parsing issues. Please try taking another photo.',
      significance: 'Analysis failed due to technical issues with the response format.',
      facts: ['Please try again with a different photo', 'Ensure good lighting and clear view of the monuments and art', 'Check your internet connection'],
      isRecognized: false,
    };
  }
}

function attemptManualJsonReconstruction(content: string): DetectionResult | null {
  try {
    // Extract key information using regex patterns
    const artworkNameMatch = content.match(/"artworkName"\s*:\s*"([^"]+)"/i);
    const confidenceMatch = content.match(/"confidence"\s*:\s*(\d+)/i);
    const locationMatch = content.match(/"location"\s*:\s*"([^"]+)"/i);
    const periodMatch = content.match(/"period"\s*:\s*"([^"]+)"/i);
    const isRecognizedMatch = content.match(/"isRecognized"\s*:\s*(true|false)/i);
    
    // Extract detailed description parts
    const keyTakeawaysMatch = content.match(/"keyTakeaways"\s*:\s*"([^"]+(?:\\.[^"]*)*)"/i);
    const inDepthContextMatch = content.match(/"inDepthContext"\s*:\s*"([^"]+(?:\\.[^"]*)*)"/i);
    const curiositiesMatch = content.match(/"curiosities"\s*:\s*"([^"]+(?:\\.[^"]*)*)"/i);
    
    if (artworkNameMatch && confidenceMatch && locationMatch && periodMatch && isRecognizedMatch) {
      const result: DetectionResult = {
        artworkName: artworkNameMatch[1],
        confidence: parseInt(confidenceMatch[1]),
        location: locationMatch[1],
        period: periodMatch[1],
        description: `${artworkNameMatch[1]} is located in ${locationMatch[1]} and dates from ${periodMatch[1]}.`,
        significance: `This monuments and art represents important cultural heritage from ${periodMatch[1]}.`,
        facts: [`Located in ${locationMatch[1]}`, `Period: ${periodMatch[1]}`, `Confidence: ${confidenceMatch[1]}%`],
        isRecognized: isRecognizedMatch[1].toLowerCase() === 'true'
      };
      
      // Add detailed description if available and recognized
      if (result.isRecognized && result.confidence > 75 && keyTakeawaysMatch && inDepthContextMatch) {
        result.detailedDescription = {
          keyTakeaways: keyTakeawaysMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
          inDepthContext: inDepthContextMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
          curiosities: curiositiesMatch ? curiositiesMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "No widely known curiosities are associated with these monuments and art.",
        };
      }
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Manual reconstruction error:', error);
    return null;
  }
}

async function convertImageToBase64(imageUri: string): Promise<string> {
  console.log('convertImageToBase64 called with:', { imageUri: imageUri?.substring(0, 100) + '...', platform: Platform.OS });
  
  if (Platform.OS === 'web') {
    console.log('Using web implementation for image conversion');
    // Web implementation
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Compress image if it's too large (>1MB)
    let finalBlob = blob;
    if (blob.size > 1024 * 1024) {
      console.log('Compressing large image:', blob.size, 'bytes');
      finalBlob = await compressImageWeb(blob);
      console.log('Compressed to:', finalBlob.size, 'bytes');
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        console.log('Web image conversion successful, base64 length:', base64.length);
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };
      reader.readAsDataURL(finalBlob);
    });
  } else {
    console.log('Using mobile implementation for image conversion');
    // Mobile implementation using expo-file-system with improved error handling
    try {
      console.log('Starting image manipulation for mobile...');
      
      // Check if the image URI is valid
      if (!imageUri || imageUri.trim().length === 0) {
        throw new Error('Invalid image URI provided');
      }
      
      // Get file info first to validate the image
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist at the provided URI');
      }
      
      console.log('Image file exists, size:', fileInfo.size, 'bytes');
      
      // First, compress/resize the image for mobile with more aggressive compression
      const manipulatedImage = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 800 } } // Smaller size for mobile to reduce processing load
        ],
        {
          compress: 0.7, // More aggressive compression for mobile
          format: SaveFormat.JPEG,
        }
      );
      
      console.log('Image manipulation successful, new URI:', manipulatedImage.uri);
      console.log('Manipulated image dimensions:', manipulatedImage.width, 'x', manipulatedImage.height);
      
      // Verify the manipulated image exists
      const manipulatedFileInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      if (!manipulatedFileInfo.exists) {
        throw new Error('Manipulated image file was not created successfully');
      }
      
      console.log('Manipulated image size:', manipulatedFileInfo.size, 'bytes');
      
      // Convert to base64
      console.log('Reading manipulated image as base64...');
      const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Validate base64 result
      if (!base64 || base64.length === 0) {
        throw new Error('Base64 conversion resulted in empty string');
      }
      
      console.log('Mobile image conversion successful, base64 length:', base64.length);
      
      // Clean up the temporary manipulated image
      try {
        await FileSystem.deleteAsync(manipulatedImage.uri, { idempotent: true });
        console.log('Cleaned up temporary manipulated image');
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary image:', cleanupError);
      }
      
      return base64;
    } catch (error) {
      console.error('Error converting image to base64 on mobile:', error);
      console.log('Attempting fallback: reading original image directly...');
      
      try {
        // Fallback: try to read original image directly with validation
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error('Original image file does not exist for fallback');
        }
        
        console.log('Reading original image directly, size:', fileInfo.size, 'bytes');
        
        // Check if file is too large for direct reading
        if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('Image file too large for direct reading fallback');
        }
        
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (!base64 || base64.length === 0) {
          throw new Error('Fallback base64 conversion resulted in empty string');
        }
        
        console.log('Fallback successful, base64 length:', base64.length);
        return base64;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'}`);
      }
    }
  }
}

async function compressImageWeb(blob: Blob): Promise<Blob> {
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