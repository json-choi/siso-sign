'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

type MarketingConsent = 'accepted' | 'declined' | null;

const CONSENT_STORAGE_KEY = 'siso-sign-marketing-consent';
const CONSENT_CHANGE_EVENT = 'siso-sign-marketing-consent-change';

function getConsentSnapshot(): MarketingConsent {
  const storedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return storedConsent === 'accepted' ? 'accepted' : storedConsent === 'declined' ? 'declined' : null;
}

function getServerConsentSnapshot(): MarketingConsent {
  return null;
}

function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  };
}

function getPixelId(): string | null {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return pixelId && /^\d+$/.test(pixelId) ? pixelId : null;
}

export default function MetaPixel() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const trackedInitialPage = useRef(false);
  const pixelId = getPixelId();

  useEffect(() => {
    if (consent !== 'accepted') return;

    if (!trackedInitialPage.current) {
      trackedInitialPage.current = true;
      return;
    }

    window.fbq?.('track', 'PageView');
  }, [consent, pathname]);

  const saveConsent = (nextConsent: Exclude<MarketingConsent, null>) => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, nextConsent);
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
  };

  if (!pixelId) return null;

  return (
    <>
      {consent === 'accepted' && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
            s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {consent === null && (
        <aside
          aria-label="마케팅 데이터 수집 설정"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-xl border border-white/15 bg-black/95 p-5 text-white shadow-2xl backdrop-blur-md"
        >
          <p className="text-sm leading-relaxed text-white/75">
            광고 성과를 측정하고 더 관련성 높은 안내를 제공하기 위해 Meta Pixel을 사용할 수 있습니다.
            허용하기 전에는 마케팅 추적을 시작하지 않습니다.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => saveConsent('declined')}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              거부
            </button>
            <button
              type="button"
              onClick={() => saveConsent('accepted')}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
            >
              허용
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
