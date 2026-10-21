import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import googleReviewQr from '../assets/google-review-qr.png';
import tripAdvisorQr from '../../public/assets/TripAdviserReview.png';

interface Review {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
  photo: string;
}

interface ReviewsData {
  name: string;
  rating: number;
  totalReviews: number;
  googleUrl: string;
  reviews: Review[];
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`${cls} ${i < rating ? 'text-[#f4b400]' : 'text-[#1A2E28]/15'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 200;
  const displayText = isLong && !expanded ? review.text.slice(0, 200).trimEnd() + '…' : review.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' as const }}
      className="bg-white p-8 lg:p-10 flex flex-col h-full"
    >
      {/* Author row */}
      <div className="flex items-center gap-3 mb-5">
        {review.photo ? (
          <img
            src={review.photo}
            alt={review.author}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#1A2E28]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[#1A2E28]/50 text-sm font-medium">{review.author.charAt(0)}</span>
          </div>
        )}
        <div>
          <p className="font-heading text-[#1A2E28] text-sm leading-none mb-1">{review.author}</p>
          <p className="text-[#1A2E28]/35 text-[10px] tracking-[0.15em] uppercase">{review.timeAgo}</p>
        </div>
        {/* Google G logo */}
        <div className="ml-auto flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
      </div>

      {/* Stars */}
      <StarRating rating={review.rating} />

      {/* Review text */}
      <p className="text-[#1A2E28]/60 text-sm leading-relaxed font-light mt-4 flex-1">
        "{displayText}"
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#8B7355] text-[10px] tracking-[0.2em] uppercase mt-3 text-left hover:text-[#1A2E28] transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </motion.div>
  );
}

export default function GoogleReviews() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/google-reviews')
      .then(r => r.json())
      .then((d: ReviewsData & { error?: string; status?: string; detail?: string }) => {
        if (d.error) {
          console.error('[GoogleReviews] API error:', d.error, d.status, d.detail);
          setError(true);
        } else {
          setData(d as ReviewsData);
        }
        setLoading(false);
      })
      .catch((e) => { console.error('[GoogleReviews] fetch error:', e); setError(true); setLoading(false); });
  }, []);

  return (
    <section className="py-24 lg:py-36 bg-[#F7F4EF]">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
          className="mb-16"
        >
          <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">Guest Experiences</p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28]">What Our Guests Say</h2>
            {data && (
              <div className="flex items-center gap-3 sm:mb-1.5">
                <StarRating rating={Math.round(data.rating)} size="lg" />
                <span className="text-[#1A2E28] font-heading text-2xl">{data.rating.toFixed(1)}</span>
                <span className="text-[#1A2E28]/40 text-sm">({data.totalReviews} reviews)</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A2E28]/10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-8 lg:p-10 h-52 animate-pulse">
                <div className="flex gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-[#1A2E28]/8" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-[#1A2E28]/8 rounded w-2/3" />
                    <div className="h-2 bg-[#1A2E28]/5 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 bg-[#1A2E28]/6 rounded w-full" />
                  <div className="h-2.5 bg-[#1A2E28]/6 rounded w-5/6" />
                  <div className="h-2.5 bg-[#1A2E28]/6 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error fallback */}
        {error && (
          <p className="text-[#1A2E28]/40 text-sm text-center py-12">
            Reviews are temporarily unavailable. Please check back shortly.
          </p>
        )}

        {/* Reviews grid */}
        {data && !loading && (
          <>
            {/* Single row: first 4 reviews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1A2E28]/10">
              {data.reviews.slice(0, 4).map((review, i) => (
                <ReviewCard key={i} review={review} index={i} />
              ))}
            </div>

            {/* Footer row */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-14 flex flex-col sm:flex-row items-center justify-between gap-6 flex-wrap"
            >
              {/* QR code */}
              <a
                href="https://g.page/r/Cfaz0-iCGC_sEAE/review"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-6 bg-white border border-[#1A2E28]/8 px-8 py-6 hover:border-[#1A2E28]/20 transition-colors duration-300 group"
              >
                <div className="flex-shrink-0 border border-[#1A2E28]/10 p-1.5">
                  <img
                    src={googleReviewQr}
                    alt="Scan to leave a Google review for Stonetrail Villas"
                    width={600}
                    height={600}
                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain block"
                  />
                </div>
                <div>
                  <p className="font-heading text-[#1A2E28] text-base leading-snug mb-1">Enjoyed your stay?</p>
                  <p className="text-[#1A2E28]/45 text-sm font-light leading-relaxed mb-3">
                    Scan the code to share your<br className="hidden sm:block" /> experience on Google.
                  </p>
                  <p className="text-[#8B7355] text-[10px] tracking-[0.25em] uppercase font-medium group-hover:text-[#1A2E28] transition-colors duration-300">Leave a Google Review →</p>
                </div>
              </a>

              {/* TripAdvisor QR code */}
              <a
                href="https://www.tripadvisor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-6 bg-white border border-[#1A2E28]/8 px-8 py-6 hover:border-[#1A2E28]/20 transition-colors duration-300 group"
              >
                <div className="flex-shrink-0 border border-[#1A2E28]/10 p-1.5">
                  <img
                    src={tripAdvisorQr}
                    alt="Scan to leave a Tripadvisor review for Stonetrail Villas"
                    width={600}
                    height={600}
                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain block"
                  />
                </div>
                <div>
                  <p className="font-heading text-[#1A2E28] text-base leading-snug mb-1">Loved your experience?</p>
                  <p className="text-[#1A2E28]/45 text-sm font-light leading-relaxed mb-3">
                    Scan the code to share your<br className="hidden sm:block" /> experience on Tripadvisor.
                  </p>
                  <p className="text-[#8B7355] text-[10px] tracking-[0.25em] uppercase font-medium group-hover:text-[#1A2E28] transition-colors duration-300">Leave a Tripadvisor Review →</p>
                </div>
              </a>

              {/* Link to all reviews on Google */}
              <a
                href={data.googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 text-[10px] tracking-[0.25em] uppercase font-medium text-[#1A2E28]/50 hover:text-[#1A2E28] transition-colors duration-300"
              >
                <span className="border-b border-[#1A2E28]/20 group-hover:border-[#1A2E28] pb-0.5 transition-colors duration-300">
                  Read all {data.totalReviews} reviews on Google
                </span>
                <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
