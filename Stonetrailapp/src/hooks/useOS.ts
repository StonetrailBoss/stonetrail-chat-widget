import { useState, useEffect } from 'react';

export type OSType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

export interface OSInfo {
  os: OSType;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
}

function detectOS(): OSInfo {
  if (typeof navigator === 'undefined') {
    return { os: 'unknown', isMobile: false, isIOS: false, isAndroid: false, isDesktop: true, isTouchDevice: false };
  }

  const ua = navigator.userAgent;
  const platform = (navigator.platform || '').toLowerCase();

  const isIOS = /iphone|ipad|ipod/i.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const isWindows = /windows/i.test(ua);
  const isMacOS = /macintosh|mac os x/i.test(ua) && !isIOS;
  const isLinux = /linux/i.test(ua) && !isAndroid;
  const isTouchDevice = isIOS || isAndroid || navigator.maxTouchPoints > 0;
  const isMobile = isIOS || isAndroid || /mobile/i.test(ua);

  let os: OSType = 'unknown';
  if (isIOS) os = 'ios';
  else if (isAndroid) os = 'android';
  else if (isWindows) os = 'windows';
  else if (isMacOS) os = 'macos';
  else if (isLinux) os = 'linux';

  return {
    os,
    isMobile,
    isIOS,
    isAndroid,
    isDesktop: !isMobile,
    isTouchDevice,
  };
}

export function useOS(): OSInfo {
  const [info, setInfo] = useState<OSInfo>(() => detectOS());

  useEffect(() => {
    setInfo(detectOS());

    // Apply OS class to <html> for CSS targeting
    const html = document.documentElement;
    const { os, isMobile, isIOS, isAndroid, isTouchDevice } = detectOS();
    html.classList.add(`os-${os}`);
    if (isMobile) html.classList.add('is-mobile');
    if (isIOS) html.classList.add('is-ios');
    if (isAndroid) html.classList.add('is-android');
    if (isTouchDevice) html.classList.add('is-touch');
  }, []);

  return info;
}
