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
    console.error('Error detecting monument:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      platform: Platform.OS,
      imageUri: imageUri?.substring(0, 100) + '...' // Log first 100 chars of URI
    });
    
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
  let analysisPrompt = `Analyze this image and identify any artwork, monument, sculpture, painting, or cultural landmark. Include paintings that depict buildings/landmarks (identify the PAINTING, not the depicted structure).

IMPORTANT RECOGNITION GUIDELINES:
- Be especially careful with sculptures as they are always difficult to spot the exact ones since subjects are often similar across different artworks
- For sculptures, it's better to not recognize than to provide a wrong identification
- Only identify sculptures with very high confidence if you are absolutely certain of the specific piece
- The confidence returned should reflect your actual confidence in the recognition - be honest about uncertainty
- Consider that many sculptures share similar themes, poses, or subjects but are different works entirely`;
  
  // Add context if provided
  if (additionalInfo && (additionalInfo.name || additionalInfo.location || additionalInfo.building || additionalInfo.notes)) {
    analysisPrompt += `\n\n[Context if provided:`;
    if (additionalInfo.name) analysisPrompt += ` Name: ${additionalInfo.name}.`;
    if (additionalInfo.location) analysisPrompt += ` Location: ${additionalInfo.location} (weight this heavily).`;
    if (additionalInfo.building) analysisPrompt += ` Building: ${additionalInfo.building}.`;
    if (additionalInfo.notes) analysisPrompt += ` Notes: ${additionalInfo.notes}.`;
    analysisPrompt += `]`;
  }
  
  analysisPrompt += `\n\nProvide ALL information in ONE response. Only mark isRecognized as true if confidence is 80+. Always provide the ACTUAL location, not user's location unless they match.\n\nRespond in this exact JSON format:\n{\n  "artworkName": "Name or 'Unknown Artwork'",\n  "confidence": 85,\n  "location": "Actual location",\n  "period": "Year(s) or century format (e.g., '1503', '15th century', '1800s', '12th-13th century') or 'Unknown'",\n  "isRecognized": true/false,\n  "detailedDescription": {\n    "keyTakeaways": "Summary of the most important pieces of information (approximately 500 characters)",\n    "inDepthContext": "Write exactly 3 paragraphs (1400-3000 characters total). Separate paragraphs with double line breaks only - NO paragraph titles or labels. Use **bold** highlights for key terms, names, dates, and important details. Be specific and interesting. Avoid generalizations.\n\nFirst paragraph: Focus on historical origins, creation context, artist/architect background, and period significance with specific dates and historical context.\n\nSecond paragraph: Detail artistic/architectural elements, materials used, construction techniques, style characteristics, dimensions, and unique technical features.\n\nThird paragraph: Discuss cultural impact, significance over the years, notable events or stories associated with the artwork and more.",\n    "curiosities": "Interesting anecdotes, lesser-known facts, or unusual stories. If none are known, write 'No widely known curiosities are associated with this artwork.'.",\n    "keyTakeawaysList": ["Four main points summarizing the in-depth context"]\n  }\n}\n\nIMPORTANT: If not recognized with high confidence (confidence < 80), omit the entire detailedDescription object.`;

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
    
    // Validate and set defaults for detailed description if missing
    if (result.isRecognized && result.confidence > 75 && !result.detailedDescription) {
      result.detailedDescription = {
        keyTakeaways: result.description,
        inDepthContext: `**${result.artworkName}** is a significant ${result.period} artwork located in ${result.location}. This piece represents important cultural heritage and artistic achievement of its era. The work showcases the artistic techniques and cultural values of its time period, reflecting the historical context and artistic movements of the period. The creation involved specific materials and techniques characteristic of the era, and its preservation allows us to understand the cultural and artistic priorities of the time.`,
        curiosities: "No widely known curiosities are associated with this artwork.",
        keyTakeawaysList: result.facts.slice(0, 5)
      };
    }
    
    return result;
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);
    throw new Error('Invalid JSON response from AI');
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