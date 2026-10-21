/**
 * Reviews Agent API Route — Streaming AI Agent
 *
 * Handles POST /api/reviews-agent
 * An agentic endpoint that can fetch Google reviews and draft responses.
 */

import type { Request, Response } from 'express';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getChatModel, SYSTEM_PROMPT } from '@/lib/chatbot/chat-config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Google Business Profile helpers ──────────────────────────────────────────


async function fetchGoogleReviews(): Promise<{
  reviews: Array<{
    reviewId: string;
    reviewer: string;
    starRating: string;
    comment: string;
    createTime: string;
    hasReply: boolean;
  }>;
  error?: string;
}> {
  try {
    // Call the existing google-reviews API endpoint which uses the social connector
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://stonetrailvillas.com'
      : 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/google-reviews`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return { reviews: [], error: `Failed to fetch reviews: ${res.status}` };
    }

    const data = await res.json() as any;

    // Normalise the response — the existing endpoint returns reviews array
    const raw: any[] = Array.isArray(data) ? data : (data.reviews ?? []);

    const reviews = raw.map((r: any) => ({
      reviewId: r.reviewId ?? r.name ?? String(Math.random()),
      reviewer: r.reviewer?.displayName ?? r.reviewerName ?? 'Anonymous',
      starRating: r.starRating ?? r.rating ?? 'UNKNOWN',
      comment: r.comment ?? r.reviewReply?.comment ?? '',
      createTime: r.createTime ?? r.updateTime ?? '',
      hasReply: !!(r.reviewReply),
    }));

    return { reviews };
  } catch (err) {
    return { reviews: [], error: String(err) };
  }
}

// ── Tool parameter schemas (defined outside streamText so z.infer works) ──────

const fetchReviewsParams = z.object({
  includeReplied: z
    .boolean()
    .optional()
    .describe('Whether to include reviews that already have a reply. Defaults to false.'),
});

const draftResponsesParams = z.object({
  reviews: z
    .array(
      z.object({
        reviewId: z.string(),
        reviewer: z.string(),
        starRating: z.string(),
        comment: z.string(),
      })
    )
    .describe('The reviews to draft responses for.'),
});

export default async function handler(req: Request, res: Response) {
  const messages = req.body?.messages as ChatMessage[] | undefined;

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'Missing or invalid messages array' });
    return;
  }

  const safeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  try {
    const model = getChatModel();

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: safeMessages,
      tools: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchReviews: (tool as any)({
          description:
            'Fetch the latest Google reviews for Stone Trail Villas. Returns unanswered reviews with reviewer name, star rating, and comment.',
          parameters: fetchReviewsParams,
          execute: async (args: z.infer<typeof fetchReviewsParams>) => {
            const includeReplied = args.includeReplied ?? false;
            const { reviews, error } = await fetchGoogleReviews();
            if (error) return { success: false, error, reviews: [] };

            const filtered = includeReplied ? reviews : reviews.filter((r) => !r.hasReply);

            return {
              success: true,
              totalFetched: reviews.length,
              unansweredCount: filtered.length,
              reviews: filtered.map((r) => ({
                reviewId: r.reviewId,
                reviewer: r.reviewer,
                starRating: r.starRating,
                comment: r.comment || '(No written comment — star rating only)',
                createTime: r.createTime,
              })),
            };
          },
        }),

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draftResponses: (tool as any)({
          description:
            'Generate professional, on-brand draft responses for a list of Google reviews. Returns one draft per review.',
          parameters: draftResponsesParams,
          execute: async (args: z.infer<typeof draftResponsesParams>) => {
            const reviews = args.reviews;
            return {
              success: true,
              message:
                'Reviews received. Drafting personalised responses for each one now — please see the response cards below.',
              reviewCount: reviews.length,
              reviews,
            };
          },
        }),
      },
    });

    res.setHeader('X-Accel-Buffering', 'no');
    result.pipeTextStreamToResponse(res);

    console.log(
      JSON.stringify({ event: 'reviews-agent.stream.started', messageCount: safeMessages.length })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(JSON.stringify({ event: 'reviews-agent.error', error: message }));
    if (!res.headersSent) {
      res.status(500).json({ error: 'Reviews agent request failed' });
    }
  }
}
