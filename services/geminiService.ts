
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Using the recommended Nano Banana model for image editing/generation
const MODEL_NAME = 'gemini-2.5-flash-image';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Encodes a Base64 string to a format compatible with Gemini parts (stripping header if present).
 */
const cleanBase64 = (base64Str: string): string => {
  return base64Str.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

/**
 * Calculates the closest supported aspect ratio for the Gemini model.
 */
const getClosestAspectRatio = (width: number, height: number): string => {
  const targetRatio = width / height;
  const supportedRatios = [
    { id: "1:1", value: 1.0 },
    { id: "3:4", value: 3/4 }, // 0.75
    { id: "4:3", value: 4/3 }, // 1.33
    { id: "9:16", value: 9/16 }, // 0.5625
    { id: "16:9", value: 16/9 } // 1.77
  ];

  return supportedRatios.reduce((prev, curr) => {
    return (Math.abs(curr.value - targetRatio) < Math.abs(prev.value - targetRatio) ? curr : prev);
  }).id;
};

/**
 * Edits an image based on a text prompt using Gemini.
 */
export const editImageWithGemini = async (
  base64Image: string,
  prompt: string,
  width: number,
  height: number,
  mimeType: string = 'image/png'
): Promise<string> => {
  try {
    const cleanData = cleanBase64(base64Image);
    const aspectRatio = getClosestAspectRatio(width, height);

    // Simplified prompt to avoid confusing the model with too many negative constraints
    const promptText = `
    Generate a high-quality abstract background image based on this design and the description: "${prompt}".
    The style should be artistic and suitable for a card background. 
    Maintain the aspect ratio ${aspectRatio}.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: promptText,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanData,
            },
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    // Validating Response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      // Check if it was blocked
      if (response.promptFeedback?.blockReason) {
         throw new Error(`AI Request blocked: ${response.promptFeedback.blockReason}`);
      }
      throw new Error("AI returned no results. This might be due to safety filters or service load.");
    }
    
    // Check finish reason
    const candidate = candidates[0];
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        // e.g. SAFETY, RECITATION
        throw new Error(`Generation stopped due to: ${candidate.finishReason}. Please try a different prompt.`);
    }

    const parts = candidates[0].content.parts;
    if (!parts || parts.length === 0) {
       throw new Error("AI returned an empty content part.");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
          // Return standard data URL
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("AI generated a response but it contained no image data.");

  } catch (error: any) {
    console.error("Gemini Image Edit Error:", error);
    if (error.message?.includes('400')) {
       throw new Error("Request failed (400). The image or aspect ratio might not be supported. Try using a standard size like Square or Story.");
    }
    throw error;
  }
};

/**
 * Generates the n8n compatible JSON payload for the user to copy.
 */
export const generateN8nPayload = (base64Image: string, prompt: string) => {
  return {
    method: "POST",
    url: `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=YOUR_API_KEY`,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/png",
                data: "[BASE64_IMAGE_STRING]" // Placeholder for display brevity
              }
            }
          ]
        }
      ]
    }
  };
};
