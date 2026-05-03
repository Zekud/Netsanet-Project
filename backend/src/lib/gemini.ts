// Gemini API helper — handles AI triage classification for new cases.
// Uses the official @google/genai SDK with structured JSON output
// for type-safe, reliable responses (no manual JSON parsing needed).

import { GoogleGenAI } from '@google/genai';

// ─── Types ────────────────────────────────────────────────────

export interface TriageResult {
  category: 'legal' | 'medical' | 'shelter' | 'counseling' | 'other';
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  reasoning: string;
}

// ─── JSON Schema for structured output ────────────────────────
// Gemini will be forced to return exactly this shape — no code fences,
// no extra text, just valid JSON matching this schema.

const triageResponseSchema = {
  type: 'object' as const,
  properties: {
    category: {
      type: 'string' as const,
      enum: ['legal', 'medical', 'shelter', 'counseling', 'other'],
      description: 'The primary category of support the survivor needs',
    },
    urgency_level: {
      type: 'string' as const,
      enum: ['critical', 'high', 'medium', 'low'],
      description: 'How urgently the survivor needs help',
    },
    summary: {
      type: 'string' as const,
      description: 'One sentence summary of the case in plain language',
    },
    reasoning: {
      type: 'string' as const,
      description: 'Brief explanation of why this category and urgency were chosen',
    },
  },
  required: ['category', 'urgency_level', 'summary', 'reasoning'],
};

// ─── SDK Client ───────────────────────────────────────────────

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// ─── Triage Function ──────────────────────────────────────────

// Fallback when Gemini is unavailable or times out
const FALLBACK_TRIAGE: TriageResult = {
  category: 'other',
  urgency_level: 'medium',
  summary: 'Case submitted and pending manual review.',
  reasoning: 'AI triage was unavailable. A case worker will review this case.',
};

export async function triageCase(title: string, description: string): Promise<TriageResult> {
  try {
    const ai = getClient();

    const prompt = `You are a case triage assistant for a women's support platform in Ethiopia.
Analyze this incident report and classify it.

Title: ${title}
Description: ${description}

Urgency guide:
- critical: immediate physical danger, life at risk
- high: ongoing abuse, needs help within 24 hours
- medium: situation is serious but not immediately dangerous
- low: information request, past incident, no immediate risk`;

    // 10 second timeout — if Gemini is slow/unavailable, use the fallback immediately
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini triage timed out after 10s')), 10000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: triageResponseSchema,
        },
      }),
      timeout,
    ]);

    const text = response.text;
    if (!text) return FALLBACK_TRIAGE;

    return JSON.parse(text) as TriageResult;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[triageCase] Gemini failed:', errMsg);
    return FALLBACK_TRIAGE;
  }
}
