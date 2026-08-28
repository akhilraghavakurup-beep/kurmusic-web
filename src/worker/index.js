/**
 * Cloudflare Worker CORS Proxy for JioSaavn API
 * 
 * Deploy for free on Cloudflare Workers (100,000 requests/day, free forever).
 * Allows your static GitHub Pages web app to query JioSaavn metadata with zero CORS limits.
 */
export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const targetUrl = 'https://www.jiosaavn.com' + (url.pathname === '/' ? '/api.php' : url.pathname) + url.search;

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
          'Referer': 'https://www.jiosaavn.com/',
          'Accept': 'application/json, text/plain, */*',
          'cookie': request.headers.get('cookie') || 'L=english',
        },
      });

      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', '*');

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
