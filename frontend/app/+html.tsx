import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Structured data for search engines and AI assistants.
const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://winwai.online/#org',
      name: 'WinWai',
      legalName: 'Arkadya App',
      url: 'https://winwai.online/',
      logo: 'https://winwai.online/logo.png',
      email: 'contact@winwai.online',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://winwai.online/#website',
      url: 'https://winwai.online/',
      name: 'WinWai',
      inLanguage: ['th', 'en', 'fr', 'ar'],
      publisher: { '@id': 'https://winwai.online/#org' },
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://winwai.online/#app',
      name: 'WinWai',
      url: 'https://winwai.online/',
      description:
        'A free raffle app that connects people with local businesses in Thailand. Earn tickets by watching ads, enter raffles and win real prizes from nearby shops, cafes and hotels.',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any (installable web app)',
      inLanguage: ['th', 'en', 'fr', 'ar'],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB' },
      publisher: { '@id': 'https://winwai.online/#org' },
    },
  ],
});

// Expo Router's root HTML wrapper for the web build - this is the one place
// to add PWA-specific <head> tags and register the service worker, since
// Metro's static web export doesn't do this automatically.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#FFD700" />
        <meta name="description" content="WinWai: free raffles with local businesses in Thailand. Earn tickets, enter raffles and win real prizes - meals, stays, services. ลุ้นรางวัลฟรี ไม่ต้องซื้อ" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="WinWai" />
        <meta property="og:title" content="WinWai - Free raffles with local businesses in Thailand" />
        <meta property="og:description" content="WinWai: free raffles with local businesses in Thailand. Earn tickets, enter raffles and win real prizes - meals, stays, services. ลุ้นรางวัลฟรี ไม่ต้องซื้อ" />
        <meta property="og:image" content="https://winwai.online/logo.png" />
        <meta property="og:image:width" content="705" />
        <meta property="og:image:height" content="300" />
        <meta property="og:url" content="https://winwai.online/" />
        <meta property="og:locale" content="th_TH" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="fr_FR" />
        <meta property="og:locale:alternate" content="ar_AR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="WinWai - Free raffles with local businesses in Thailand" />
        <meta name="twitter:description" content="WinWai: free raffles with local businesses in Thailand. Earn tickets, enter raffles and win real prizes - meals, stays, services. ลุ้นรางวัลฟรี ไม่ต้องซื้อ" />
        <meta name="twitter:image" content="https://winwai.online/logo.png" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="WinWai summary for AI assistants" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WinWai" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/icon-192.png" />
        {/* Landing typography: Plus Jakarta Sans (Latin) + Noto Sans Thai / Arabic. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@500;700;800&family=Noto+Sans+Thai:wght@500;700;800&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap"
        />
        <ScrollViewStyleReset />
        {/* Connects the site to the ca-pub-3486145054830108 AdSense account
            (also required for the Ad Placement API rewarded-ad calls in
            RewardedAdManager.ts) - loaded once, site-wide, so every page can
            use it and Auto ads (if enabled in the AdSense dashboard) can
            place banner ads without extra code. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3486145054830108"
          crossOrigin="anonymous"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/service-worker.js').catch(function (err) {
                    console.error('Service worker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        {children}
        {/* Crawlable summary. The app itself renders in the browser, so crawlers that do
            not run JavaScript (most AI assistants and link previewers) would otherwise see
            an empty page. Visually hidden, kept in step with /llms.txt. */}
        <div
          id="seo-content"
          style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
        >
          <h1>WinWai - free raffles with local businesses in Thailand</h1>
          <p>
            WinWai is a free raffle app that connects people with local shops, cafes and hotels. Watch a short ad or invite a friend to earn free tickets, enter raffles for real prizes
            such as meals, stays and services, and collect your voucher in person when you win. No purchase is ever required. Available in Thai, English, French and Arabic.
          </p>
          <h2>How it works</h2>
          <ol>
            <li>Earn tickets by watching a short ad or inviting a friend. New accounts created before 31 December 2026 get 1 free ticket.</li>
            <li>Pick a prize from local businesses.</li>
            <li>Enter the raffle with your tickets. Every entry has the same chance.</li>
            <li>Win and redeem your voucher at the business.</li>
          </ol>
          <h2>Draw rules</h2>
          <p>
            Each prize has its own round with a ticket goal. When the goal is reached the winner is drawn at random after 1 day (prizes up to USD 15), 3 days (up to USD 25) or 7 days (above).
            One prize per person per raffle. Winners are shown anonymously.
          </p>
          <h2>For businesses</h2>
          <p>
            Offer a prize, get seen by people nearby and welcome winners in person. You choose the prize and how many; WinWai manages the draws, winner selection and voucher checks.
            Send a partner inquiry from the home page.
          </p>
          <p lang="th">
            WinWai คือแอปลุ้นรางวัลฟรีที่เชื่อมคุณกับร้านค้า คาเฟ่ และโรงแรมในท้องถิ่นของประเทศไทย ดูโฆษณาสั้นๆ หรือชวนเพื่อนเพื่อรับตั๋วฟรี แล้วลุ้นรางวัลจริง ไม่ต้องซื้ออะไรเลย
            ธุรกิจสามารถมอบรางวัลเพื่อให้คนใกล้ๆ เห็นและพาลูกค้าใหม่เข้าร้านได้
          </p>
          <nav>
            <a href="/signup">Create a free account</a> · <a href="/terms">Terms of Service</a> · <a href="/privacy">Privacy Policy</a> · <a href="/llms.txt">Summary for AI assistants</a>
          </nav>
        </div>
      </body>
    </html>
  );
}
