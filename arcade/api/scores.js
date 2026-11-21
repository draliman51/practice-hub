// GET    /api/scores -> { ok, scores: [...] }
// POST   /api/scores -> saves one score (body = score object with id)
// DELETE /api/scores -> clears all scores (header x-admin-pin = Baba's PIN)
const S = require('./_store');
const ADMIN_PIN = process.env.ADMIN_PIN || '2026';
module.exports = async (req, res) => {
  S.noCache(res);
  try {
    if (!S.hasBlob()) {
      if (req.method === 'GET') return res.status(200).end(JSON.stringify({ ok: false, scores: [] }));
      return res.status(503).end(JSON.stringify({ error: 'Server storage is not set up (connect a Vercel Blob store).' }));
    }
    if (req.method === 'GET') return res.status(200).end(JSON.stringify({ ok: true, scores: await S.allScores() }));
    if (req.method === 'POST') {
      const r = await S.readBody(req);
      if (!r || typeof r.id !== 'string' || !/^[a-z0-9_-]{4,64}$/i.test(r.id) || typeof r.player !== 'string' || typeof r.game !== 'string') return res.status(400).end(JSON.stringify({ error: 'Invalid score' }));
      delete r._synced; await S.saveScore(r);
      return res.status(200).end(JSON.stringify({ ok: true }));
    }
    if (req.method === 'DELETE') {
      if ((req.headers['x-admin-pin'] || '') !== ADMIN_PIN) return res.status(403).end(JSON.stringify({ error: 'Wrong PIN' }));
      await S.clearScores(); return res.status(200).end(JSON.stringify({ ok: true }));
    }
    res.setHeader('Allow', 'GET, POST, DELETE'); return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (e) { return res.status(500).end(JSON.stringify({ error: String(e && e.message || e) })); }
};
