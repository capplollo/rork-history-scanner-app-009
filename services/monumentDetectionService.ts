

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
    const { Platform } = await import('react-native');
    console.log('Starting artwork/monument detection for image:', imageUri);
    console.log('Platform:', Platform.OS);
    console.log('Additional info provided:', additionalInfo);
    
    // Convert image to base64 with compression
    const base64Image = await convertImageToBase64(imageUri);
    console.log('Image converted to base64, length:', base64Image.length);
    
    // Validate base64 image
    if (!base64Image || base64Image.length < 100) {
      throw new Error('Invalid or empty base64 image data');
    }
    
    // Single comprehensive analysis - get everything in one call
    const result = await performComprehensiveAnalysis(base64Image, additionalInfo);
    
    console.log('Detection completed successfully:', {
      name: result.artworkName,
      confidence: result.confidence,
      isRecognized: result.isRecognized
    });
    
    return result;
    
  } catch (error) {
    console.error('Error detecting monument:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      imageUri,
      additionalInfo
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
  console.log('Request payload size:', JSON.stringify({ messages: messages }).length);
  
  // Add timeout and better error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
  
  try {
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('AI API response status:', response.status);
    console.log('AI API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error details:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response body:', errorText);
      
      if (response.status === 413) {
        throw new Error('Image too large for processing. Please try a smaller image.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`AI service error: ${response.status} - ${errorText || response.statusText}`);
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again with a smaller image or better internet connection.');
    }
    
    throw error;
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
    return convertImageToBase64Web(imageUri);
  } else {
    return convertImageToBase64Mobile(imageUri);
  }
}

// Web implementation using FileReader and Canvas
async function convertImageToBase64Web(imageUri: string): Promise<string> {
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
}

// Mobile implementation using expo-file-system
async function convertImageToBase64Mobile(imageUri: string): Promise<string> {
  console.log('Converting mobile image to base64:', imageUri);
  
  // Method 1: Try expo-file-system first
  try {
    const FileSystem = await import('expo-file-system');
    console.log('Using expo-file-system for base64 conversion');
    
    // For mobile, we'll read the file directly as base64
    // expo-image-picker already provides optimized images
    const base64 = await FileSystem.default.readAsStringAsync(imageUri, {
      encoding: FileSystem.default.EncodingType.Base64,
    });
    
    console.log('Mobile image converted to base64 using FileSystem, length:', base64.length);
    
    if (base64 && base64.length > 100) {
      return base64;
    } else {
      throw new Error('FileSystem returned empty or invalid base64');
    }
  } catch (fileSystemError) {
    console.error('expo-file-system conversion failed:', fileSystemError);
  }
  
  // Method 2: Try fetch + arrayBuffer approach
  try {
    console.log('Trying fetch + arrayBuffer approach');
    const response = await fetch(imageUri);
    
    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Fetched arrayBuffer, size:', arrayBuffer.byteLength);
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Empty arrayBuffer received');
    }
    
    const bytes = new Uint8Array(arrayBuffer);
    
    // Use btoa if available (should be available in React Native)
    if (typeof btoa !== 'undefined') {
      console.log('Using btoa for base64 conversion');
      let binary = '';
      const chunkSize = 8192; // Process in chunks to avoid stack overflow
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64 = btoa(binary);
      console.log('Mobile image converted to base64 using btoa, length:', base64.length);
      return base64;
    } else {
      throw new Error('btoa not available');
    }
  } catch (fetchError) {
    console.error('Fetch + arrayBuffer approach failed:', fetchError);
  }
  
  // Method 3: Manual base64 encoding as last resort
  try {
    console.log('Trying manual base64 encoding as last resort');
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Manual base64 encoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < bytes.length) {
      const a = bytes[i++];
      const b = i < bytes.length ? bytes[i++] : 0;
      const c = i < bytes.length ? bytes[i++] : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    console.log('Mobile image converted to base64 using manual encoding, length:', result.length);
    return result;
  } catch (manualError) {
    console.error('Manual base64 encoding also failed:', manualError);
    throw new Error(`Failed to convert image to base64 on mobile platform. All methods failed. URI: ${imageUri}`);
  }
}

// Web-only image compression
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