export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  const { searchParams } = new URL(req.url);
  const target = new URL('https://www.jiosaavn.com/api.php');
  
  target.searchParams.set('_format', 'json');
  target.searchParams.set('_marker', '0');
  target.searchParams.set('api_version', '4');
  target.searchParams.set('ctx', 'web6dot0');

  searchParams.forEach((val, key) => {
    target.searchParams.set(key, val);
  });

  const lang = searchParams.get('languages') || searchParams.get('lang') || 'malayalam,tamil';

  try {
    const res = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': `L=${encodeURIComponent(lang)}`,
      },
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=300, stale-while-revalidate',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
