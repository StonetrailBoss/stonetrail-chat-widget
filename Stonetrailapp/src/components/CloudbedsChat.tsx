/**
 * CloudbedsChat
 *
 * Injects the Cloudbeds / Whistle Live Chat plugin script once on mount.
 * Renders nothing — the plugin manages its own DOM bubble.
 */
import { useEffect } from 'react';

const WHISTLE_COMPANY = '225269827764352';
const WHISTLE_SOURCE  = 'https://plugins.whistle.cloudbeds.com';

export default function CloudbedsChat() {
  useEffect(() => {
    // Guard: don't inject twice (e.g. React strict-mode double-invoke)
    if (document.getElementById('whistle-live-chat-script')) return;

    (window as Window & { WhistleLiveChat?: { company: string; source: string } }).WhistleLiveChat = {
      company: WHISTLE_COMPANY,
      source:  WHISTLE_SOURCE,
    };

    const script = document.createElement('script');
    script.id    = 'whistle-live-chat-script';
    script.async = true;
    script.type  = 'text/javascript';
    script.src   = `${WHISTLE_SOURCE}/live-chat/initialize.js`;

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  }, []);

  return null;
}
