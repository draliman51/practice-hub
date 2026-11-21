// GET  /api/kv?key=<key>          -> { ok, value }
// POST /api/kv {key, value}       -> saves (used for Alilox avatar profiles)
const S = require('./_store');
const OK = k => typeof k === 'string' && /^[a-z0-9_-]{2,64}$/i.test(k);
module.exports = async (req, res) => {
  S.noCache(res);
  try {
    if (!S.hasBlob()) return res.status(req.method === 'GET' ? 200 : 503).end(JSON.stringify({ ok: false, value: null, error: 'Server storage is not set up.' }));
    if (req.method === 'GET') { const key = new URL(req.url, 'http://x').searchParams.get('key'); if (!OK(key)) return res.status(400).end(JSON.stringify({ error: 'Bad key' })); return res.status(200).end(JSON.stringify({ ok: true, value: await S.getKv(key) })); }
    if (req.method === 'POST') { const b = await S.readBody(req); if (!b || !OK(b.key) || typeof b.value !== 'object') return res.status(400).end(JSON.stringify({ error: 'Bad body' })); if (JSON.stringify(b.value).length > 20000) return res.status(413).end(JSON.stringify({ error: 'Too big' })); await S.setKv(b.key, b.value); return res.status(200).end(JSON.stringify({ ok: true })); }
    res.setHeader('Allow', 'GET, POST'); return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (e) { return res.status(500).end(JSON.stringify({ error: String(e && e.message || e) })); }
};
