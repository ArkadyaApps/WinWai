import { Raffle, Partner } from '../types';

export type FeedItem =
  | { key: string; kind: 'raffle'; raffle: Raffle }
  | { key: string; kind: 'sponsor'; partner: Partner }
  | { key: string; kind: 'ad' };

const AD_FIRST_POSITION = 3;
const AD_INTERVAL = 9;

/**
 * Home feed: sponsors are spread evenly through the raffles (not queued at the
 * end), then one in-feed ad card goes after the 3rd item and again every
 * AD_INTERVAL items. E.g. 4 raffles + 3 sponsors -> R S R S R S R. Every
 * sponsor appears exactly once; a short feed still gets at least one ad.
 */
export function buildFeed(raffles: Raffle[], sponsors: Partner[]): FeedItem[] {
  const R = raffles.length;
  const S = sponsors.length;
  // Sponsor k goes after this many raffles (at least 1, so the feed opens with a raffle).
  const after = sponsors.map((_, k) => Math.max(1, Math.round(((k + 1) * R) / (S + 1))));

  const base: FeedItem[] = [];
  let s = 0;
  raffles.forEach((raffle, i) => {
    base.push({ key: `raffle-${raffle.id}`, kind: 'raffle', raffle });
    while (s < S && after[s] === i + 1) {
      base.push({ key: `sponsor-${sponsors[s].id}`, kind: 'sponsor', partner: sponsors[s] });
      s++;
    }
  });
  while (s < S) {
    base.push({ key: `sponsor-${sponsors[s].id}`, kind: 'sponsor', partner: sponsors[s] });
    s++;
  }

  const items: FeedItem[] = [];
  let ads = 0;
  base.forEach((item, i) => {
    items.push(item);
    const position = i + 1;
    if (position === AD_FIRST_POSITION || (position > AD_FIRST_POSITION && (position - AD_FIRST_POSITION) % AD_INTERVAL === 0)) {
      ads++;
      items.push({ key: `ad-${ads}`, kind: 'ad' });
    }
  });
  if (ads === 0 && base.length > 0) items.push({ key: 'ad-1', kind: 'ad' });
  return items;
}
