

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
  const { Platform } = await import('react-native');
  
  if (Platform.OS === 'web') {
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
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(finalBlob);
    });
  } else {
    // React Native implementation
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    
    try {
      // Compress and convert to base64 using expo-image-manipulator
      const manipulatedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }], // Resize to max 1024px width
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
          base64: true,
        }
      );
      
      if (!manipulatedImage.base64) {
        throw new Error('Failed to convert image to base64');
      }
      
      return manipulatedImage.base64;
    } catch (error) {
      console.error('Error processing image with expo-image-manipulator:', error);
      // Fallback: try to read the file directly
      const FileSystemModule = await import('expo-file-system');
      const base64 = await FileSystemModule.readAsStringAsync(imageUri, {
        encoding: FileSystemModule.EncodingType.Base64,
      });
      return base64;
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