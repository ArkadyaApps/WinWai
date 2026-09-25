import React, { useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';

// window.adsbygoogle's type is already declared globally in
// RewardedAdManager.ts.
// In-feed ad unit created in the AdSense dashboard (Card layout, image top,
// 3-column feed) to match the raffle/sponsor card look. Same ca-pub as
// RewardedAdManager.ts - the adsbygoogle.js script is already loaded
// site-wide in app/+html.tsx.
const AD_CLIENT = 'ca-pub-3486145054830108';
const AD_SLOT = '7374708461';
const AD_LAYOUT_KEY = '-6t+ed+2i-1n-4w';

// Only applied once AdSense actually has something to show (data-ad-status
// "filled") - see the MutationObserver below. Left off by default so an
// unfilled slot takes zero space instead of showing an empty white card.
const FILLED_STYLE: Partial<CSSStyleDeclaration> = {
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  marginBottom: '12px',
  overflow: 'hidden',
  minHeight: '160px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
};

const AdCard: React.FC = () => {
  const containerRef = useRef<any>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || initialized.current) return;
    const container = containerRef.current as HTMLElement | null;
    if (!container) return;
    initialized.current = true;

    // Built with plain DOM APIs, outside React's virtual DOM, on purpose:
    // AdSense's script mutates and sometimes relocates this element (an
    // unfilled fluid unit gets moved to be a direct child of <body> and
    // hidden). If React had rendered the <ins> itself, its next re-render
    // tries to reconcile a node Google already ripped out from under it -
    // that mismatch was what made the whole card vanish, not just the ad
    // content. A container React only ever renders empty (no declared
    // children) is never re-diffed, so Google can do whatever it wants to
    // what's inside without React fighting it.
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = '100%';
    ins.style.minHeight = '160px';
    ins.setAttribute('data-ad-format', 'fluid');
    ins.setAttribute('data-ad-layout-key', AD_LAYOUT_KEY);
    ins.setAttribute('data-ad-client', AD_CLIENT);
    ins.setAttribute('data-ad-slot', AD_SLOT);
    container.appendChild(ins);

    // Show the card's visual chrome only once AdSense confirms it actually
    // filled the slot (it sets data-ad-status to "filled" or "unfilled"
    // asynchronously, often well after relocating the <ins> itself
    // elsewhere in the DOM). An unfilled slot stays a plain, styleless,
    // zero-height container instead of an empty white box.
    const applyStatus = () => {
      if (ins.getAttribute('data-ad-status') === 'filled') {
        Object.assign(container.style, FILLED_STYLE);
      } else {
        Object.keys(FILLED_STYLE).forEach((key) => {
          (container.style as any)[key] = '';
        });
      }
    };
    const observer = new MutationObserver(applyStatus);
    observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    applyStatus();

    // Google measures the container's width synchronously on push() and
    // rejects the ad outright ("Fluid responsive ads must be at least 250px
    // wide, availableWidth=0") if that happens before the surrounding
    // layout has actually settled - which this component's own mount timing
    // doesn't guarantee. Wait for a real width via rAF (capped) before
    // pushing; the full-width row this lives in (see home.tsx) should clear
    // 250px well before the cap.
    let attempts = 0;
    const tryPush = () => {
      attempts++;
      if (container.offsetWidth >= 250 || attempts > 30) {
        try {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
        } catch (error) {
          console.error('AdSense in-feed push failed:', error);
        }
        return;
      }
      requestAnimationFrame(tryPush);
    };
    requestAnimationFrame(tryPush);

    return () => observer.disconnect();
  }, []);

  if (Platform.OS !== 'web') return null;

  return <View ref={containerRef} />;
};

export default AdCard;
