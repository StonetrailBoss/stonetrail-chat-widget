import type { Request, Response } from 'express';
import { getSecret } from '#airo/secrets';

const PLACE_ID = 'ChIJraDR4RRRR4wR9rPT6IIYL-w';

export default async function handler(_req: Request, res: Response) {
  const apiKey = getSecret('GOOGLE_MAPS_API_KEY');

  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  try {
    const placesUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,reviews,url&key=${apiKey}`;
    const response = await fetch(placesUrl);
    const data = await response.json() as {
      status: string;
      result?: {
        name: string;
        rating: number;
        user_ratings_total: number;
        url: string;
        reviews: Array<{
          author_name: string;
          rating: number;
          text: string;
          relative_time_description: string;
          profile_photo_url: string;
        }>;
      };
    };

    if (data.status !== 'OK' || !data.result) {
      console.error('[google-reviews] Places API error:', data.status, (data as { error_message?: string }).error_message ?? '');
      return res.status(502).json({ error: 'Failed to fetch reviews', status: data.status, detail: (data as { error_message?: string }).error_message });
    }

    const { name, rating, user_ratings_total, url, reviews } = data.result;

    res.json({
      name,
      rating,
      totalReviews: user_ratings_total,
      googleUrl: url,
      reviews: (reviews || []).slice(0, 5).map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        timeAgo: r.relative_time_description,
        photo: r.profile_photo_url,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: String(err) });
  }
}
