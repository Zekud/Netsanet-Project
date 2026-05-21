// AI Legal Guide routes — RAG + Gemini powered legal chat for survivors.
// POST   /api/v1/ai/chat              — send message, get AI answer + sources
// GET    /api/v1/ai/sessions          — list survivor's chat sessions
// GET    /api/v1/ai/sessions/:id      — get session message history
// DELETE /api/v1/ai/sessions/:id      — delete session (privacy)

import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types';

const router = Router();

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';


// ─── Suggested questions by topic category ────────────────────

const suggestedQuestions: Record<string, string[]> = {
  legal: [
    'How do I file a protection order?',
    'What documents do I need to start a case?',
    'Can I get free legal aid in Ethiopia?',
  ],
  family: [
    'What are my rights regarding child custody?',
    'How is property divided after divorce?',
    'Can I divorce without a lawyer?',
  ],
  violence: [
    'What counts as domestic violence under Ethiopian law?',
    'Can I report without going to the police station?',
    'What protection can a court give me?',
  ],
  default: [
    'What are my legal rights as a woman in Ethiopia?',
    'How can I get a restraining order?',
    'Where can I find free legal help?',
  ],
};

function detectCategory(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('divorce') || lower.includes('marriage') || lower.includes('custody') || lower.includes('husband')) return 'family';
  if (lower.includes('violence') || lower.includes('abuse') || lower.includes('assault') || lower.includes('beat')) return 'violence';
  if (lower.includes('court') || lower.includes('lawyer') || lower.includes('judge') || lower.includes('document')) return 'legal';
  return 'default';
}

// ─── POST /ai/chat — Core RAG + Gemini chat endpoint ──────────

router.post(
  '/chat',
  authenticate,
  requireRole('survivor'),
  [
    body('message').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('Message is required (max 2000 chars)'),
    body('session_id').optional().isUUID(),
    body('language').optional().isIn(['en', 'am']).withMessage('Language must be en or am'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: errors.mapped() },
        });
        return;
      }

      const { message, language = 'en' } = req.body;
      let { session_id } = req.body;
      const user = req.user!;

      // Step 1: Create or validate session
      if (!session_id) {
        const { data: session, error: sessionError } = await supabase
          .from('ai_chat_sessions')
          .insert({
            survivor_id: user.id,
            title: message.slice(0, 80),
          })
          .select('id')
          .single();

        if (sessionError || !session) {
          console.error(sessionError);
          res.status(500).json({
            success: false,
            error: { code: 'SESSION_CREATE_FAILED', message: 'Failed to create chat session' },
          });
          return;
        }
        session_id = session.id;
      } else {
        // Validate ownership
        const { data: existing } = await supabase
          .from('ai_chat_sessions')
          .select('id')
          .eq('id', session_id)
          .eq('survivor_id', user.id)
          .single();

        if (!existing) {
          res.status(403).json({
            success: false,
            error: { code: 'ACCESS_DENIED', message: 'Session not found or access denied' },
          });
          return;
        }
      }

      // Step 2: Save user's message
      await supabase.from('ai_chat_messages').insert({
        session_id,
        role: 'user',
        content: message,
      });

      // Step 3: Call RAG service
      let ragChunks: Array<{ content: string; source: string; article_number?: string }> = [];
      try {
        const ragRes = await fetch(`${RAG_SERVICE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: message, k: 5 }),
          signal: AbortSignal.timeout(8000),
        });

        if (ragRes.ok) {
          // RAG service returns NDJSON — one JSON object per line
          const rawText = await ragRes.text();
          const lines = rawText.split('\n').filter((l) => l.trim());
          if (lines.length > 0) {
            const ragData = JSON.parse(lines[0]) as {
              results?: Array<{ content: string; source: string; article_number?: string; topics?: string[] }>;
              message?: string;
            };
            ragChunks = ragData.results || [];
          }
        }
      } catch (ragError) {
        console.warn('RAG service unavailable, continuing without context:', ragError);
      }

      // Step 4: Build Gemini prompt
      const contextSection = ragChunks.length > 0
        ? `--- REFERENCE KNOWLEDGE (Ethiopian Law) ---\n${ragChunks
            .map((c) => `[${c.source || 'Ethiopian Law'}${c.article_number ? ` - Article ${c.article_number}` : ''}]\n${c.content}`)
            .join('\n\n')}\n--- END OF REFERENCE KNOWLEDGE ---`
        : "--- REFERENCE KNOWLEDGE: EMPTY — No legal articles were retrieved for this question. You must NOT use your training data to answer legal specifics. Instead, acknowledge you don't have specific legal guidance on this and direct the user to EWLA or MoWSA (8335). ---";

      const ragPrompt = `You are Netsanet's Legal Guide — a concise, warm, and trustworthy legal assistant for Ethiopian women seeking help with gender-based violence, family law, and their legal rights.

You speak DIRECTLY to the user. She does not know how you work internally. Never reference documents, context, or your knowledge source.

CORE RULES — follow every one of these precisely:

1. GROUND ALL LEGAL FACTS IN THE REFERENCE KNOWLEDGE BELOW.
   - You MUST only state specific legal facts (article numbers, penalties, procedures) that appear in the reference knowledge provided.
   - Do NOT use your general training data to invent or guess legal specifics, even if you feel confident. Ethiopian law details must come from the reference only.
   - If the reference knowledge is empty or does not cover the question: say clearly "I don't have specific legal guidance on this topic right now" and redirect to EWLA or MoWSA (8335). Do not fill the gap with guesses.

2. ANSWER FIRST. Be concise.
   - Lead with the direct answer in the first sentence.
   - Only add a brief emotional acknowledgment when the question is clearly about abuse or violence — skip it for procedural questions.
   - Aim for 100–200 words max. Do not pad with multiple encouragement paragraphs.

3. CITATION STYLE — natural, not robotic.
   - Good: "Under **Article 77 of the Revised Family Code**, you can..."
   - Bad: "The provided text mentions Article 77..."
   - Only cite articles whose actual content is in the reference knowledge.

4. WHEN YOU DON'T KNOW — be honest and redirect briefly.
   - Say: "I don't have specific information on this — for verified guidance, contact **EWLA** or call **MoWSA at 8335**."
   - Do not make up procedures, timelines, or penalties.

5. ORGANIZATIONS — mention only 1-2 most relevant, briefly:
   EWLA (Ethiopian Women Lawyers Association), MoWSA hotline: 8335, Police: 911, GBV Emergency: 0800 720 060.

6. LANGUAGE: Reply in the EXACT same language as the question. Amharic → Amharic. English → English.

7. FORMAT: Use **bold** for article references and key rights. Short bullet lists (3-4 items max). No closing motivational paragraphs.

${contextSection}

Survivor's Question: ${message}`;


      // Step 5: Call Gemini
      let answer = 'I was unable to process your question at this time. Please try again shortly.';
      try {
        const apiKey = process.env.GEMINI_API_KEY || '';
        const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is not set in environment');
        }
        console.log(`[ai/chat] Calling Gemini model: ${geminiModel}, key prefix: ${apiKey.slice(0, 8)}...`);
        const ai = new GoogleGenAI({ apiKey });
        
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API call timed out after 45s')), 45000)
        );

        const response = await Promise.race([
          ai.models.generateContent({
            model: geminiModel,
            contents: ragPrompt,
          }),
          timeout,
        ]);
        
        answer = response.text || answer;
        console.log('[ai/chat] Gemini response received, length:', answer.length);
      } catch (geminiError: unknown) {
        const errMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
        console.error('[ai/chat] Gemini call failed:', errMsg);
        // Fallback: return RAG content directly or a generic message
        answer = ragChunks.length > 0
          ? `Based on Ethiopian law, here is relevant information:\n\n${ragChunks[0].content}`
          : 'I\'m temporarily unable to process your question. Please try again in a moment.';
      }

      // Step 6: Save assistant message
      await supabase.from('ai_chat_messages').insert({
        session_id,
        role: 'assistant',
        content: answer,
        sources: ragChunks.length > 0 ? ragChunks : null,
      });

      // Step 7: Update session last_active_at
      await supabase
        .from('ai_chat_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', session_id);

      // Step 8: Detect category for suggested questions
      const category = detectCategory(message);
      const suggested_questions = suggestedQuestions[category] || suggestedQuestions.default;

      res.status(200).json({
        success: true,
        data: {
          answer,
          session_id,
          sources: ragChunks,
          suggested_questions,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

// ─── GET /ai/sessions — List survivor's sessions ───────────────

router.get(
  '/sessions',
  authenticate,
  requireRole('survivor'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      const { data: sessions, error } = await supabase
        .from('ai_chat_sessions')
        .select('id, title, last_active_at, created_at')
        .eq('survivor_id', user.id)
        .order('last_active_at', { ascending: false });

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch sessions' },
        });
        return;
      }

      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

// ─── GET /ai/sessions/:id — Get session message history ────────

router.get(
  '/sessions/:id',
  authenticate,
  requireRole('survivor'),
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Verify ownership
      const { data: session } = await supabase
        .from('ai_chat_sessions')
        .select('id, title, created_at')
        .eq('id', id)
        .eq('survivor_id', user.id)
        .single();

      if (!session) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Session not found' },
        });
        return;
      }

      const { data: messages, error } = await supabase
        .from('ai_chat_messages')
        .select('id, role, content, sources, created_at')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch messages' },
        });
        return;
      }

      res.status(200).json({ success: true, data: { session, messages } });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

// ─── DELETE /ai/sessions/:id — Delete session (privacy) ────────

router.delete(
  '/sessions/:id',
  authenticate,
  requireRole('survivor'),
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', id)
        .eq('survivor_id', user.id);

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'DELETE_FAILED', message: 'Failed to delete session' },
        });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

export default router;
