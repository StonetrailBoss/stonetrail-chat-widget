import { useEffect } from 'react';

const WIDGET_SRC = '/assets/stonetrail-widget.js';
const WIDGET_API = 'https://stonetrail-chat-widget.onrender.com';

export default function StonetrailChatWidget() {
  useEffect(() => {
    // Avoid injecting the script more than once
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return;

    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.defer = true;
    script.setAttribute('data-api-base-url', WIDGET_API);
    document.body.appendChild(script);

    return () => {
      // Clean up on unmount (e.g. when switching to /staff pages)
      const existing = document.querySelector(`script[src="${WIDGET_SRC}"]`);
      if (existing) existing.remove();
    };
  }, []);

  return null;
}
