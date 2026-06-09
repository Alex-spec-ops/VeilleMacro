export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      },
    });
  }

  const url = new URL(request.url);
  const dustPath = url.pathname.replace(/^\/api\/dust/, '') + url.search;
  const dustUrl = `https://dust.tt/api/v1${dustPath}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${process.env.DUST_API_KEY}`);
  headers.set('Content-Type', 'application/json');

  const accept = request.headers.get('Accept');
  if (accept) headers.set('Accept', accept);

  const init = { method: request.method, headers };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  const upstream = await fetch(dustUrl, init);

  const resHeaders = new Headers();
  const ct = upstream.headers.get('Content-Type');
  if (ct) resHeaders.set('Content-Type', ct);
  resHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}
