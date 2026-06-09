export const config = {
  api: { bodyParser: false, responseLimit: false },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(200).end();
  }

  // /api/dust?p=w/WSID/assistant/...
  const dustPath = req.query.p ? `/${req.query.p}` : req.url.replace(/^\/api\/dust/, '').split('?')[0];
  const dustUrl = `https://eu.dust.tt/api/v1${dustPath}`;

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

  const upstream = await fetch(dustUrl, init);

  res.setHeader('Access-Control-Allow-Origin', '*');
  const ct = upstream.headers.get('Content-Type');
  if (ct) res.setHeader('Content-Type', ct);
  res.status(upstream.status);

  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } finally {
    res.end();
  }
}
