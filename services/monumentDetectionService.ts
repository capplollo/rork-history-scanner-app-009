import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Simplified interface matching the new data structure
export interface DetectionResult {
  artworkName: string;
  confidence: number;
  location: string;
  country: string;
  period: string;
  isRecognized: boolean;
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
      country: 'Unknown',
      period: 'Unknown',
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
  
  analysisPrompt += `\n\nProvide ALL information in ONE response. Only mark isRecognized as true if confidence is 80+. Always provide the ACTUAL location and country, not user's location unless they match.\n\nRespond in this exact JSON format:\n{\n  "artworkName": "Name or 'Unknown Monuments and Art'",\n  "confidence": 85,\n  "location": "City, State/Province",\n  "country": "Country name",\n  "period": "Year(s) or century format (e.g., '1503', '15th century', '1800s', '12th-13th century') or 'Unknown'",\n  "isRecognized": true/false\n}\n\nIMPORTANT: Keep the JSON response simple and clean. Avoid any special characters or formatting that could break JSON parsing.`;

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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    console.log('Raw AI response:', content);

    // Try to parse the JSON response
    try {
      // First, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const extractedJson = jsonMatch ? jsonMatch[1].trim() : content.trim();
      
      console.log('Attempting to parse JSON:', extractedJson.substring(0, 200) + '...');
      
      const result = JSON.parse(extractedJson) as DetectionResult;
      console.log('Successfully parsed JSON on first attempt');
      
      // Validate required fields
      if (!result.artworkName || !result.location || !result.country || !result.period) {
        throw new Error('Missing required fields in AI response');
      }
      
      return result;
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', content);
      
      // Try to manually extract information using regex
      try {
        console.log('Attempting manual extraction...');
        const extractedResult = attemptManualExtraction(content);
        if (extractedResult) {
          console.log('Manual extraction successful');
          return extractedResult;
        }
      } catch (extractionError) {
        console.error('Manual extraction failed:', extractionError);
      }
    }
    
    // If all parsing attempts fail, return a fallback result
    console.log('All parsing attempts failed, returning fallback result');
    return {
      artworkName: 'Unknown Monuments and Art',
      confidence: 0,
      location: 'Unknown',
      country: 'Unknown',
      period: 'Unknown',
      isRecognized: false,
    };
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

function attemptManualExtraction(content: string): DetectionResult | null {
  try {
    // Extract key information using regex patterns
    const artworkNameMatch = content.match(/"artworkName"\s*:\s*"([^"]+)"/i);
    const confidenceMatch = content.match(/"confidence"\s*:\s*(\d+)/i);
    const locationMatch = content.match(/"location"\s*:\s*"([^"]+)"/i);
    const countryMatch = content.match(/"country"\s*:\s*"([^"]+)"/i);
    const periodMatch = content.match(/"period"\s*:\s*"([^"]+)"/i);
    const isRecognizedMatch = content.match(/"isRecognized"\s*:\s*(true|false)/i);
    
    if (artworkNameMatch && confidenceMatch && locationMatch && countryMatch && periodMatch && isRecognizedMatch) {
      const result: DetectionResult = {
        artworkName: artworkNameMatch[1],
        confidence: parseInt(confidenceMatch[1]),
        location: locationMatch[1],
        country: countryMatch[1],
        period: periodMatch[1],
        isRecognized: isRecognizedMatch[1].toLowerCase() === 'true'
      };
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error in manual extraction:', error);
    return null;
  }
}

async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    console.log('Converting image to base64:', imageUri.substring(0, 100) + '...');
    
    // Handle different URI formats
    let processedUri = imageUri;
    
    // If it's already a base64 data URI, return it
    if (imageUri.startsWith('data:image/')) {
      console.log('Image is already base64, returning as-is');
      return imageUri;
    }
    
    // If it's a file URI, read the file
    if (imageUri.startsWith('file://')) {
      console.log('Reading file from file URI');
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      return `data:image/jpeg;base64,${base64}`;
    }
    
    // For other URIs, try to download and convert
    console.log('Downloading and converting image');
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}