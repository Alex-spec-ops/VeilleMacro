export const config = {
  api: { bodyParser: false, responseLimit: false },
  // Un run complet de l'orchestrateur (4 sous-agents + recherches web) peut être
  // long ; on tient le stream SSE le plus longtemps possible. 300s = défaut/Hobby,
  // augmentable jusqu'à 800 sur Pro si besoin.
  maxDuration: 300,
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(200).end();
  }

  const dustPath = req.query.p ? `/${req.query.p}` : req.url.replace(/^\/api\/dust/, '').split('?')[0];
  // Préserver les query params (ex. ?action=view pour les fichiers) — le rewrite
  // Vercel les place dans req.query à côté de `p`.
  const extraQs = Object.entries(req.query ?? {})
    .filter(([k]) => k !== 'p')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const dustUrl  = `https://eu.dust.tt/api/v1${dustPath}${extraQs ? `?${extraQs}` : ''}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${process.env.DUST_API_KEY}`);
  headers.set('Content-Type', 'application/json');
  const accept = req.headers['accept'];
  if (accept) headers.set('Accept', accept);

  const init = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    init.body = Buffer.concat(chunks);
  }

  let upstream;
  try {
    upstream = await fetch(dustUrl, init);
  } catch (err) {
    res.status(502).json({ error: { message: `Dust unreachable: ${err.message}` } });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-transform');

  const ct = upstream.headers.get('Content-Type') ?? 'application/json';
  res.setHeader('Content-Type', ct);

  // SSE : désactiver la mise en tampon Vercel/nginx
  const isSSE = ct.includes('event-stream') || accept?.includes('event-stream');
  if (isSSE) {
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
  }

  res.status(upstream.status);
  res.flushHeaders?.();

  const reader = upstream.body.getReader();

  if (isSSE) {
    // Pendant qu'un sous-agent tourne, Dust reste silencieux plusieurs minutes
    // (aucun token) → le timeout d'inactivité du client/proxy coupe la connexion.
    // On forwarde uniquement des lignes complètes et on injecte un commentaire
    // ': ping' quand le flux est inactif, pour qu'un heartbeat ne coupe jamais
    // un événement partiel en deux.
    const dec = new TextDecoder();
    let pending = '';
    let lastWrite = Date.now();
    const heartbeat = setInterval(() => {
      if (res.writableEnded) return;
      if (pending === '' && Date.now() - lastWrite >= 15000) {
        res.write(': ping\n\n');
        lastWrite = Date.now();
      }
    }, 5000);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += dec.decode(value, { stream: true });
        const nl = pending.lastIndexOf('\n');
        if (nl >= 0) {
          const out = pending.slice(0, nl + 1);
          pending = pending.slice(nl + 1);
          const ok = res.write(out);
          lastWrite = Date.now();
          if (!ok) await new Promise(r => res.once('drain', r));
        }
      }
      if (pending) res.write(pending);
    } catch {
      // connexion coupée côté client — normal
    } finally {
      clearInterval(heartbeat);
      res.end();
    }
    return;
  }

  // Réponse non-SSE : on relaie les octets bruts tels quels.
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const ok = res.write(value);
      if (!ok) await new Promise(r => res.once('drain', r));
    }
  } catch (err) {
    // connexion coupée côté client — normal
  } finally {
    res.end();
  }
}
