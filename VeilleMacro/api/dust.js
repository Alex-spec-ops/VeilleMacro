export const config = {
  api: { bodyParser: false, responseLimit: false },
  maxDuration: 300, // 5 minutes — agents Dust peuvent être lents
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(200).end();
  }

  const dustPath = req.query.p ? `/${req.query.p}` : req.url.replace(/^\/api\/dust/, '').split('?')[0];
  const dustUrl  = `https://eu.dust.tt/api/v1${dustPath}`;

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
  if (ct.includes('event-stream') || accept?.includes('event-stream')) {
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
  }

  res.status(upstream.status);
  res.flushHeaders?.();

  const reader = upstream.body.getReader();
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
