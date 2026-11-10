import { GoogleGenAI, Type } from '@google/genai';

// Available 15 default mood categories
const VALID_MOODS = [
  'happy',
  'excited',
  'calm',
  'peaceful',
  'loved',
  'hopeful',
  'inspired',
  'playful',
  'sad',
  'anxious',
  'tired',
  'frustrated',
  'lonely',
  'confused',
  'uncertain',
] as const;

const DEFAULT_MOOD_COLORS: Record<string, { name: string; color: string; defaultMeaning: string }> = {
  happy: { name: 'Happy', color: '#FFCF55', defaultMeaning: 'Sun-drenched lemon drop; warm morning light.' },
  excited: { name: 'Excited', color: '#FF8A65', defaultMeaning: 'Warm effervescent tangerine; anticipation and spark.' },
  calm: { name: 'Calm', color: '#78D6AE', defaultMeaning: 'Cool eucalyptus and steady, restorative breaths.' },
  peaceful: { name: 'Peaceful', color: '#9FE4CD', defaultMeaning: 'Still sea foam and clover dew; serene stillness.' },
  loved: { name: 'Loved', color: '#FF92BC', defaultMeaning: 'Sweet blossom; feeling genuinely seen and held.' },
  hopeful: { name: 'Hopeful', color: '#C9E86D', defaultMeaning: 'Fresh lime sprout; quiet belief in tomorrow.' },
  inspired: { name: 'Inspired', color: '#BAA1FF', defaultMeaning: 'Lilac spark; thoughts coalescing with clarity.' },
  playful: { name: 'Playful', color: '#FFB55C', defaultMeaning: 'Warm marigold; lighthearted laughter.' },
  sad: { name: 'Sad', color: '#83B9FA', defaultMeaning: 'Soft cornflower; quiet tears and gentle melancholy.' },
  anxious: { name: 'Anxious', color: '#FFAB82', defaultMeaning: 'Restless coral and autumn wind; fluttering pulse.' },
  tired: { name: 'Tired', color: '#B3A7D5', defaultMeaning: 'Muted lavender haze; evening shadows over tired limbs.' },
  frustrated: { name: 'Frustrated', color: '#F58D99', defaultMeaning: 'Prickly raspberry; tangled energy needing release.' },
  lonely: { name: 'Lonely', color: '#A3B1E5', defaultMeaning: 'Periwinkle dusk; quiet blue hour contemplation.' },
  confused: { name: 'Confused', color: '#C5B8EF', defaultMeaning: 'Soft violet fog; thoughts swirling before settling.' },
  uncertain: { name: 'Uncertain', color: '#B6C4BD', defaultMeaning: 'River pebble in mist; pausing before what comes next.' },
};

function buildPaletteContext(userPalette: any) {
  const userPaletteMap = new Map<string, { name: string; color: string; explanation: string }>();
  if (!Array.isArray(userPalette) || userPalette.length === 0) {
    return {
      paletteContext: '[No user palette provided - using general default moods]',
      userPaletteMap,
    };
  }

  const lines: string[] = [];
  for (const item of userPalette) {
    if (item?.id) {
      const trimmedExplanation = item.explanation ? item.explanation.trim() : '';
      userPaletteMap.set(item.id, {
        name: item.name || item.id,
        color: item.color || DEFAULT_MOOD_COLORS[item.id]?.color || '#78D6AE',
        explanation: trimmedExplanation,
      });

      if (trimmedExplanation) {
        lines.push(
          `- ${item.name} (ID: ${item.id}, Color: ${item.color}): User's Personal Association: "${trimmedExplanation}"`
        );
      } else {
        lines.push(
          `- ${item.name} (ID: ${item.id}, Color: ${item.color}): [No personal explanation provided - fallback to general default meaning: "${DEFAULT_MOOD_COLORS[item.id]?.defaultMeaning || 'General feeling'}"]`
        );
      }
    }
  }

  return {
    paletteContext: lines.join('\n'),
    userPaletteMap,
  };
}

async function generateWithFallbacks(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  responseSchema: any
) {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastErrorDetails = '';

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
      if (response?.text) return response.text;
    } catch (apiError: any) {
      lastErrorDetails = apiError?.message || String(apiError);
      console.warn(`Model ${model} attempt failed:`, lastErrorDetails);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  throw new Error(`Mini-Me is experiencing high demand (${lastErrorDetails}). Please click Try Again in a moment.`);
}

function sendResponse(res: any, status: number, body: any) {
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(body);
  }
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: `Method ${req.method} not allowed on /api/reflect. Use POST.` });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { journalText, userPalette } = rawBody;

    if (!journalText || typeof journalText !== 'string' || !journalText.trim()) {
      return sendResponse(res, 400, { error: 'Please provide journal text to reflect upon.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return sendResponse(res, 500, {
        error:
          'GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your Vercel Project Environment Variables.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'in-my-colors',
        },
      },
    });

    const { paletteContext, userPaletteMap } = buildPaletteContext(userPalette);

    const systemInstruction = `You are Mini-Me, a reflective journaling companion in the app "In My Colors".
This is Iteration 03: From Prediction to Negotiation.
Your role in this initial step is to offer an initial emotional hypothesis and tentative color recommendation.

Strict Rules:
1. Treat all recommendations as tentative hypotheses, not definitive truths.
2. Read the current journal entry carefully.
3. Consider the user's personal color associations from My Palette before recommending colors.
4. Suggest up to two emotions and their associated colors.
5. In "whyTheseColors", explain briefly why those colors may fit the journal entry based on the user's color explanations.
6. Distinguish direct evidence in the journal from your interpretations.
7. If personal explanations are missing, clearly acknowledge it as a general fallback suggestion.
8. Avoid psychological diagnoses and unsupported interpretations.
9. Keep the language gentle, concise, and specific (2 to 3 sentences maximum).
10. Ask at most one optional reflection question.
11. Remind or let the user make the final decision.`;

    const prompt = `Here is the user's personal emotional color vocabulary from "My Palette":
${paletteContext}

Here is the user's current journal entry:
"""
${journalText.trim()}
"""

Provide your initial hypothesis:
1. Reflection (2-3 sentences).
2. Optional reflection question (max 1).
3. 1 or 2 suggested mood IDs from their palette.
4. "whyTheseColors" explaining the rationale behind the hypothesis.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        reflection: {
          type: Type.STRING,
          description: 'A 2-3 sentence calm reflection presenting an initial emotional hypothesis.',
        },
        question: {
          type: Type.STRING,
          description: 'At most one gentle reflection question, or an empty string.',
        },
        suggestedMoodIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '1 or 2 mood IDs from the user palette.',
        },
        whyTheseColors: {
          type: Type.STRING,
          description: 'A concise explanation (2-3 sentences) detailing why these colors were hypothesized.',
        },
        colorBreakdowns: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              moodId: { type: Type.STRING },
              isPersonalAssociation: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
            },
            required: ['moodId', 'isPersonalAssociation', 'reason'],
          },
        },
      },
      required: ['reflection', 'suggestedMoodIds', 'whyTheseColors'],
    };

    const rawJson = await generateWithFallbacks(ai, prompt, systemInstruction, responseSchema);
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', rawJson);
      return sendResponse(res, 500, { error: 'Failed to parse AI reflection response.' });
    }

    let validSuggestedMoods: string[] = [];
    if (Array.isArray(parsed.suggestedMoodIds)) {
      validSuggestedMoods = parsed.suggestedMoodIds
        .map((id: string) => String(id).toLowerCase().trim())
        .filter((id: string) => userPaletteMap.has(id) || VALID_MOODS.includes(id as any))
        .slice(0, 2);
    }

    if (validSuggestedMoods.length === 0) {
      validSuggestedMoods = ['calm'];
    }

    const breakdownMap = new Map<string, { isPersonalAssociation: boolean; reason: string }>();
    if (Array.isArray(parsed.colorBreakdowns)) {
      for (const item of parsed.colorBreakdowns) {
        if (item?.moodId) {
          breakdownMap.set(String(item.moodId).toLowerCase().trim(), {
            isPersonalAssociation: Boolean(item.isPersonalAssociation),
            reason: item.reason || '',
          });
        }
      }
    }

    const moodDetails = validSuggestedMoods.map((id) => {
      const userItem = userPaletteMap.get(id);
      const defaultItem = DEFAULT_MOOD_COLORS[id];
      const breakdown = breakdownMap.get(id);

      const hasPersonalExplanation = Boolean(userItem?.explanation && userItem.explanation.trim().length > 0);
      const isPersonal = breakdown ? breakdown.isPersonalAssociation && hasPersonalExplanation : hasPersonalExplanation;

      return {
        id,
        name: userItem?.name || defaultItem?.name || id,
        color: userItem?.color || defaultItem?.color || '#78D6AE',
        explanation: userItem?.explanation || defaultItem?.defaultMeaning || '',
        isPersonalAssociation: isPersonal,
        reason: breakdown?.reason || '',
      };
    });

    return sendResponse(res, 200, {
      reflection: parsed.reflection || 'Thank you for sharing your thoughts today.',
      question: parsed.question?.trim() || null,
      whyTheseColors: parsed.whyTheseColors || 'Reflecting on your mood and color language.',
      suggestedEmotions: moodDetails,
      moodIds: validSuggestedMoods,
    });
  } catch (error: any) {
    console.error('Error in /api/reflect:', error);
    return sendResponse(res, 500, {
      error: error?.message || 'An unexpected error occurred while reflecting with Mini-Me.',
    });
  }
}
