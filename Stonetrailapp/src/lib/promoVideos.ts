const STORAGE_KEY = 'stv_promo_videos';
const ENABLED_KEY = 'stv_promo_enabled';

export interface PromoVideo {
  id: string;
  url: string;
  label: string;
}

const DEFAULT_VIDEOS: PromoVideo[] = [
  { id: '1', url: 'https://www.youtube.com/watch?v=P5bP2AOtUeU', label: 'Vincy Mas Carnival' },
];

export function getPromoVideos(): PromoVideo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PromoVideo[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_VIDEOS;
}

export function savePromoVideos(videos: PromoVideo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

export function getPromoEnabled(): boolean {
  try {
    const stored = localStorage.getItem(ENABLED_KEY);
    if (stored !== null) return stored === 'true';
  } catch {
    // ignore
  }
  return true; // enabled by default
}

export function savePromoEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, String(enabled));
}

export function getRandomPromoVideo(): PromoVideo | null {
  if (!getPromoEnabled()) return null;
  const videos = getPromoVideos();
  if (videos.length === 0) return null;
  return videos[Math.floor(Math.random() * videos.length)];
}

/** Convert any YouTube URL format to an embed URL */
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    let videoId = '';

    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1).split('?')[0];
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) {
        // already an embed URL — just strip extra params and re-add ours
        videoId = u.pathname.replace('/embed/', '').split('?')[0];
      } else {
        videoId = u.searchParams.get('v') ?? '';
      }
    }

    if (!videoId) return url; // unknown format — return as-is
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`;
  } catch {
    return url;
  }
}
