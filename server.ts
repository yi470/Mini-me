import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '1mb' }));

  // Initialize Gemini client on server
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Helper to run content generation with model fallbacks
  async function generateWithFallbacks(prompt: string, systemInstruction: string, responseSchema: any) {
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error(`Mini-Me is experiencing high demand (${lastErrorDetails}). Please click Try Again in a moment.`);
  }

  // 1. Initial Reflection API: /api/reflect (Stage 1: AI Suggestion)
  app.post('/api/reflect', async (req, res) => {
    try {
      const { journalText, userPalette } = req.body;

      if (!journalText || typeof journalText !== 'string' || !journalText.trim()) {
        return res.status(400).json({ error: 'Please provide journal text to reflect upon.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is available in the environment.',
        });
      }

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

      const rawJson = await generateWithFallbacks(prompt, systemInstruction, responseSchema);
      let parsed;
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON output:', rawJson);
        return res.status(500).json({ error: 'Failed to parse AI reflection response.' });
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

      return res.json({
        reflection: parsed.reflection || 'Thank you for sharing your thoughts today.',
        question: parsed.question?.trim() || null,
        whyTheseColors: parsed.whyTheseColors || 'Reflecting on your mood and color language.',
        suggestedEmotions: moodDetails,
        moodIds: validSuggestedMoods,
      });
    } catch (error: any) {
      console.error('Error in /api/reflect:', error);
      return res.status(500).json({
        error: error?.message || 'An unexpected error occurred while reflecting with Mini-Me.',
      });
    }
  });

  // 2. Revision API: /api/reflect/revise (Stage 2: Negotiation & Clarification)
  app.post('/api/reflect/revise', async (req, res) => {
    try {
      const { journalText, userPalette, initialSuggestions, feedbackType, feedbackLabel, userNote } = req.body;

      if (!journalText || typeof journalText !== 'string' || !journalText.trim()) {
        return res.status(400).json({ error: 'Please provide journal text.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is available in the environment.',
        });
      }

      const { paletteContext, userPaletteMap } = buildPaletteContext(userPalette);

      const isColorRightDifferentReason = feedbackType === 'color_right_different_reason';
      const hasUserNote = Boolean(userNote && typeof userNote === 'string' && userNote.trim().length > 0);
      const initialMoodIds: string[] = Array.isArray(initialSuggestions?.moodIds)
        ? initialSuggestions.moodIds
        : [];

      const systemInstruction = `You are Mini-Me, a reflective journaling companion in the app "In My Colors".
This is Iteration 03: From Prediction to Negotiation (Refined Feedback & Collaborative Sensemaking).

Crucial Behavioral Rules:
1. Human experience is the sole ground truth; treat all AI interpretations as exploratory hypotheses.
2. If the user selects "The color feels right, but for a different reason" (or agrees with colors but disagrees with reasoning):
   - You MUST preserve the existing colors/moods (${initialMoodIds.join(', ')}) unless the user explicitly requested a color change.
   - If the user has NOT provided an explanation:
     * Do NOT claim to understand their personal reasoning or invent assumptions.
     * Express genuine appreciation that the colors resonate with them.
     * State clearly that you do not yet know the personal meaning behind their choice.
     * Ask ONE focused, warm clarifying question to learn what these colors mean to them today.
     * Set needsClarificationReply to true.
   - If the user DID provide an explanation:
     * Preserve the colors and revise your reflection to directly center and celebrate their personal meaning.
     * Explicitly distinguish between what you originally inferred versus what they explicitly explained.
     * Set needsClarificationReply to false.
3. If the user selects another disagreement feedback (e.g., "The emotion doesn't quite match" or "The emotion feels right, but the color doesn't") and provided NO explanation:
   - Ask ONE focused clarifying question to understand their perspective before generating speculative new colors.
   - Set needsClarificationReply to true.
4. If the user provides an explanation for any feedback:
   * Directly integrate their exact words into your revised understanding.
   * State what changed between the initial hypothesis and this revised perspective.
5. Avoid psychological diagnoses or unwarranted assumptions.
6. Keep language gentle, concise, and reflective (2 to 3 sentences maximum for the revision response).
7. Never insist your original interpretation was right, and never over-apologize.`;

      const initialEmotionsList = (initialSuggestions?.emotions || [])
        .map((e: any) => `${e.name} (${e.color})`)
        .join(', ');

      const prompt = `Here is the user's personal emotional color vocabulary from "My Palette":
${paletteContext}

Here is the user's current journal entry:
"""
${journalText.trim()}
"""

Your previous initial suggestion was:
- Reflection: "${initialSuggestions?.reflection || ''}"
- Suggested Moods: ${initialEmotionsList} (IDs: ${initialMoodIds.join(', ')})
- Initial Rationale: "${initialSuggestions?.whyTheseColors || ''}"

The user provided this feedback:
- Feedback category: "${feedbackLabel || feedbackType}"
- Is user explanation provided?: ${hasUserNote ? 'YES' : 'NO'}
${hasUserNote ? `- User's explicit explanation: "${userNote.trim()}"` : '- User has NOT provided any written explanation yet.'}

Specific Context & Directives:
${
  isColorRightDifferentReason
    ? !hasUserNote
      ? `The user stated that the colors feel right, but for a different reason, and HAS NOT explained their reason yet.
- PRESERVE the exact same mood IDs: [${initialMoodIds.join(', ')}]. Do NOT change the colors.
- DO NOT invent or assume their reason. State that you don't know their personal association yet.
- Ask ONE focused clarifying question asking what these colors mean to them today.
- needsClarificationReply must be TRUE.
- whatChanged should state that colors were preserved while awaiting their personal reasoning.`
      : `The user stated that the colors feel right for a different reason, and PROVIDED this explanation: "${userNote.trim()}".
- PRESERVE the exact same mood IDs: [${initialMoodIds.join(', ')}].
- Revise the reflection to integrate their personal meaning into the interpretation.
- whatChanged should summarize how the reasoning shifted from your initial inference to their personal explanation.
- needsClarificationReply should be FALSE.`
    : !hasUserNote
    ? `The user gave feedback without a written explanation.
- Acknowledge their feedback gently.
- Ask ONE focused clarifying question to understand what would better fit.
- needsClarificationReply should be TRUE.`
    : `The user gave feedback and explained: "${userNote.trim()}".
- Adapt your reflection and color recommendations to honor their explicit explanation.
- needsClarificationReply should be FALSE.`
}

Generate JSON matching the schema.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          revisionResponse: {
            type: Type.STRING,
            description:
              'A 2-3 sentence gentle response acknowledging user feedback. If explanation was missing, acknowledge uncertainty without guessing; if explanation was provided, incorporate their personal meaning.',
          },
          clarifyingQuestion: {
            type: Type.STRING,
            description:
              'One focused clarifying question to learn their personal meaning or nuance, or an empty string if already crystal clear.',
          },
          suggestedMoodIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              '1 or 2 mood IDs. Must match initial mood IDs if color felt right, unless user requested a change.',
          },
          whyRevisedColors: {
            type: Type.STRING,
            description:
              'Explanation of why these colors represent the user (now grounded in their explicit meaning, or acknowledging colors are preserved awaiting their reason).',
          },
          whatChanged: {
            type: Type.STRING,
            description:
              'Clear 1-2 sentence description of what changed between the initial and revised interpretations (e.g. colors kept vs reasoning updated).',
          },
          originalInference: {
            type: Type.STRING,
            description:
              'Brief summary of what Mini-Me originally guessed or inferred in the initial suggestion.',
          },
          userExplicitMeaning: {
            type: Type.STRING,
            description:
              'The user’s explicit meaning if provided, or "(Awaiting user clarification)" if not provided.',
          },
          colorsPreserved: {
            type: Type.BOOLEAN,
            description: 'Whether the colors from the initial suggestion were preserved.',
          },
          needsClarificationReply: {
            type: Type.BOOLEAN,
            description:
              'True if Mini-Me is asking a question and waiting for the user to explain their personal meaning.',
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
        required: [
          'revisionResponse',
          'suggestedMoodIds',
          'whyRevisedColors',
          'whatChanged',
          'originalInference',
          'userExplicitMeaning',
          'colorsPreserved',
          'needsClarificationReply',
        ],
      };

      const rawJson = await generateWithFallbacks(prompt, systemInstruction, responseSchema);
      let parsed: any;
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseError) {
        console.error('Failed to parse Gemini revision JSON output:', rawJson);
        return res.status(500).json({ error: 'Failed to parse revised reflection response.' });
      }

      let validSuggestedMoods: string[] = [];

      // Requirement 1: If user said color is right but different reason, strictly preserve existing colors unless user note explicitly asked to change colors
      if (isColorRightDifferentReason && initialMoodIds.length > 0) {
        validSuggestedMoods = initialMoodIds;
      } else if (Array.isArray(parsed.suggestedMoodIds)) {
        validSuggestedMoods = parsed.suggestedMoodIds
          .map((id: string) => String(id).toLowerCase().trim())
          .filter((id: string) => userPaletteMap.has(id) || VALID_MOODS.includes(id as any))
          .slice(0, 2);
      }

      if (validSuggestedMoods.length === 0) {
        validSuggestedMoods = initialMoodIds.length > 0 ? initialMoodIds : ['calm'];
      }

      const colorsPreserved =
        initialMoodIds.length > 0 &&
        JSON.stringify(validSuggestedMoods) === JSON.stringify(initialMoodIds);

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

      // Default whatChanged summary if empty
      let whatChangedText = parsed.whatChanged?.trim();
      if (!whatChangedText) {
        if (colorsPreserved) {
          whatChangedText = hasUserNote
            ? `Colors preserved (${validSuggestedMoods.map((m) => userPaletteMap.get(m)?.name || m).join(' & ')}). Interpretation updated to center your personal meaning.`
            : `Colors preserved (${validSuggestedMoods.map((m) => userPaletteMap.get(m)?.name || m).join(' & ')}). Awaiting your explanation to understand the personal meaning behind them.`;
        } else {
          whatChangedText = `Adjusted recommendations from initial hypothesis to better align with your feedback.`;
        }
      }

      const originalInferenceText =
        parsed.originalInference?.trim() ||
        initialSuggestions?.whyTheseColors ||
        initialSuggestions?.reflection ||
        'Initial emotional hypothesis by Mini-Me.';

      const userExplicitMeaningText = hasUserNote
        ? userNote.trim()
        : '(Awaiting your explanation)';

      return res.json({
        revisionResponse: parsed.revisionResponse || 'Thank you for helping me understand your perspective.',
        clarifyingQuestion: parsed.clarifyingQuestion?.trim() || null,
        whyRevisedColors:
          parsed.whyRevisedColors ||
          (colorsPreserved
            ? 'Preserved your selected colors while grounding the interpretation in your perspective.'
            : 'Adjusted based on your feedback and palette associations.'),
        suggestedEmotions: moodDetails,
        moodIds: validSuggestedMoods,
        whatChanged: whatChangedText,
        originalInference: originalInferenceText,
        userExplicitMeaning: userExplicitMeaningText,
        colorsPreserved,
        needsClarificationReply: Boolean(parsed.needsClarificationReply || !hasUserNote),
      });
    } catch (error: any) {
      console.error('Error in /api/reflect/revise:', error);
      return res.status(500).json({
        error: error?.message || 'An unexpected error occurred while revising reflection.',
      });
    }
  });

  // In production, serve built static assets from dist; in dev, attach Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`In My Colors server listening on port ${PORT}`);
  });
}

startServer();
