// GET  /api/data  -> { ok, data }   (ok=false when no Blob store is connected yet)
// POST /api/data  -> publishes exams + settings (header x-admin-pass must match the admin password)
const S = require('./_store');

module.exports = async (req, res) => {
  S.noCache(res);
  try {
    if (req.method === 'GET') {
      if (!S.hasBlob()) return res.status(200).end(JSON.stringify({ ok: false, reason: 'no_blob_store' }));
      const data = await S.currentData();
      return res.status(200).end(JSON.stringify({ ok: true, data }));
    }
    if (req.method === 'POST') {
      if (!S.hasBlob()) return res.status(503).end(JSON.stringify({ error: 'Server storage is not set up (connect a Vercel Blob store).' }));
      const current = await S.currentData();
      const pass = req.headers['x-admin-pass'] || '';
      if (!pass || pass !== current.settings.adminPass) return res.status(403).end(JSON.stringify({ error: 'Wrong admin password' }));
      const body = await S.readBody(req);
      if (!body || !Array.isArray(body.exams) || !body.settings || !body.settings.adminPass) return res.status(400).end(JSON.stringify({ error: 'Invalid data' }));
      body.results = [];
      body.rev = Math.max((body.rev || 0), (current.rev || 0) + 1);
      await S.saveData(body);
      return res.status(200).end(JSON.stringify({ ok: true, rev: body.rev }));
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (e) {
    return res.status(500).end(JSON.stringify({ error: String(e && e.message || e) }));
  }
};
