/**
 * tavily.js
 *
 * Real web search for macro analyst publications via Tavily Search API.
 * Each analyst has curated source domains and an optimized query.
 * Falls back gracefully to simulation mode on error or missing key.
 */

const TAVILY_URL = 'https://api.tavily.com/search';
const BATCH_SIZE = 4; // parallel searches per batch

/* ── 22 analysts — curated sources & queries ───────────────────────── */
export const ANALYSTS_LIST = [
  {
    id: 1, name: 'Jurrien Timmer', firm: 'Fidelity',
    query: '"Jurrien Timmer" macro global market insights bull bear cycle',
    domains: ['fidelity.ca', 'fidelity.com'],
  },
  {
    id: 2, name: 'Michael Cembalest', firm: 'JPM EOTM',
    query: '"Eye on the Market" OR "Cembalest" macro investment strategy',
    domains: ['privatebank.jpmorgan.com', 'am.jpmorgan.com'],
  },
  {
    id: 3, name: 'Jeremy Grantham', firm: 'GMO',
    query: 'Grantham quarterly letter research bubble valuation',
    domains: ['gmo.com'],
  },
  {
    id: 4, name: 'Marko Papic', firm: 'BCA Research',
    query: '"Marko Papic" OR "GeoMacro" geopolitics macro strategy',
    domains: ['bcaresearch.com'],
  },
  {
    id: 5, name: 'François Trahan', firm: 'BMO Capital',
    query: '"Trahan" macro economic outlook leading indicators',
    domains: ['capitalmarkets.bmo.com'],
  },
  {
    id: 6, name: 'Howard Marks', firm: 'Oaktree Capital',
    query: '"Howard Marks" memo market risk investing',
    domains: ['oaktreecapital.com'],
  },
  {
    id: 7, name: 'Albert Edwards', firm: 'Société Générale',
    query: '"Albert Edwards" global strategy weekly macro deflation',
    domains: ['insight-public.sgmarkets.com', 'sgmarkets.com'],
  },
  {
    id: 8, name: 'Bill Ackman', firm: 'Pershing Square',
    query: '"Pershing Square" shareholder letter company report macro',
    domains: ['pershingsquareholdings.com'],
  },
  {
    id: 9, name: 'Bob Elliott', firm: 'Unlimited Funds',
    query: '"Bob Elliott" macro systematic investing regime',
    domains: ['unlimitedfunds.com'],
  },
  {
    id: 10, name: 'Chris Burniske', firm: 'Placeholder VC',
    query: '"Chris Burniske" crypto macro bitcoin ethereum cycle',
    domains: ['placeholder.vc'],
  },
  {
    id: 11, name: 'Cliff Asness', firm: 'AQR Capital',
    query: '"Asness" OR "AQR" value factor insights research quant',
    domains: ['aqr.com'],
  },
  {
    id: 12, name: 'George Saravelos', firm: 'Deutsche Bank',
    // Primary: X/Twitter (not scrapable) → coverage in financial press
    query: '"George Saravelos" FX macro strategy Deutsche Bank dollar euro',
    domains: ['reuters.com', 'bloomberg.com', 'ft.com', 'db.com'],
  },
  {
    id: 13, name: 'Jeffrey Currie', firm: 'Carlyle',
    // LinkedIn primary → Carlyle site + press coverage
    query: '"Jeffrey Currie" commodities energy macro Carlyle',
    domains: ['carlyle.com', 'reuters.com', 'bloomberg.com'],
  },
  {
    id: 14, name: 'Kevin Kelly', firm: 'Delphi Digital',
    query: '"Kevin Kelly" OR "Delphi Digital" macro digital assets crypto',
    domains: ['delphidigital.io'],
  },
  {
    id: 15, name: 'Larry Summers', firm: 'Harvard',
    // X + Bloomberg + WashPost op-eds
    query: '"Larry Summers" macroeconomics Fed monetary fiscal policy',
    domains: ['bloomberg.com', 'washingtonpost.com', 'ft.com'],
  },
  {
    id: 16, name: 'Michael Mauboussin', firm: 'Morgan Stanley IM',
    query: '"Michael Mauboussin" valuation capital allocation base rates',
    domains: ['morganstanley.com'],
  },
  {
    id: 17, name: 'Mohamed El-Erian', firm: 'Bloomberg/Allianz',
    query: '"Mohamed El-Erian" Fed macro economy central bank policy',
    domains: ['bloomberg.com'],
  },
  {
    id: 18, name: 'Nouriel Roubini', firm: 'Project Syndicate',
    query: '"Nouriel Roubini" macro economy crisis recession megathreats',
    domains: ['project-syndicate.org'],
  },
  {
    id: 19, name: 'Pierre Andurand', firm: 'Andurand Capital',
    // X primary → oil/energy news coverage
    query: '"Pierre Andurand" oil energy commodities price forecast macro',
    domains: ['reuters.com', 'bloomberg.com', 'ft.com'],
  },
  {
    id: 20, name: 'Stanley Druckenmiller', firm: 'Duquesne',
    // CNBC interviews + 13F via WisdomWhale
    query: '"Stanley Druckenmiller" macro market outlook Fed economy',
    domains: ['cnbc.com', 'whalewisdom.com', 'reuters.com', 'bloomberg.com'],
  },
  {
    id: 21, name: 'Warren Buffett', firm: 'Berkshire Hathaway',
    query: 'Berkshire Hathaway annual letter shareholder report',
    domains: ['berkshirehathaway.com'],
  },
  {
    id: 22, name: 'Zoltan Pozsar', firm: 'Indépendant',
    // X primary → coverage in financial press
    query: '"Zoltan Pozsar" macro monetary system geopolitics Bretton Woods',
    domains: ['reuters.com', 'bloomberg.com', 'ft.com', 'creditsuisse.com'],
  },
];

/**
 * searchAnalyst(analyst, periodStart, periodEnd, signal)
 *
 * Searches for recent publications by one analyst on their curated domains.
 * Returns { analyst, results, status: 'found' | 'not_found' | 'error' }.
 */
export async function searchAnalyst(analyst, periodStart, periodEnd, signal) {
  const key = import.meta.env.VITE_TAVILY_API_KEY;
  if (!key) throw new Error('VITE_TAVILY_API_KEY non défini');

  const abortCtrl  = new AbortController();
  const cancelWatch = setInterval(() => {
    if (signal?.cancelled) abortCtrl.abort();
  }, 100);

  // Days back from today to cover the period + 21-day publication lag buffer
  const daysBack = Math.ceil((Date.now() - new Date(periodStart).getTime()) / 86_400_000) + 21;

  try {
    const res = await fetch(TAVILY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  abortCtrl.signal,
      body: JSON.stringify({
        api_key:             key,
        query:               analyst.query,
        include_domains:     analyst.domains,
        search_depth:        'basic',
        max_results:         3,
        include_answer:      false,
        include_raw_content: false,
        days:                Math.min(daysBack, 365),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Tavily ${res.status}: ${err.message ?? res.statusText}`);
    }

    const data    = await res.json();
    const results = (data.results || []).filter(r => r.score > 0.2);
    return { analyst, results, status: results.length > 0 ? 'found' : 'not_found' };

  } catch (e) {
    if (e.name === 'AbortError') {
      const c = new Error('cancelled'); c.cancelled = true; throw c;
    }
    // Network / CORS error → degrade gracefully, never crash the workflow
    return { analyst, results: [], status: 'error', error: e.message };
  } finally {
    clearInterval(cancelWatch);
  }
}

/**
 * searchAllAnalysts(period, signal, onProgress)
 *
 * Searches all 22 analysts in parallel batches of BATCH_SIZE.
 * Calls onProgress({ analyst, results, status }) after each analyst.
 * Returns the full results array.
 */
export async function searchAllAnalysts(period, signal, onProgress) {
  const allResults = [];

  for (let i = 0; i < ANALYSTS_LIST.length; i += BATCH_SIZE) {
    if (signal?.cancelled) {
      const e = new Error('cancelled'); e.cancelled = true; throw e;
    }

    const batch   = ANALYSTS_LIST.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(a => searchAnalyst(a, period.start, period.end, signal))
    );

    for (const r of results) {
      allResults.push(r);
      onProgress?.(r);
    }

    // Brief pause between batches to respect rate limits
    if (i + BATCH_SIZE < ANALYSTS_LIST.length) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  return allResults;
}
