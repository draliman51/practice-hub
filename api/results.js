// GET    /api/results -> { results: [...] }
// POST   /api/results -> adds/updates one result (body = result object with id)
// DELETE /api/results -> clears all results (header x-admin-pass)
const S = require('./_store');

module.exports = async (req, res) => {
  S.noCache(res);
  try {
    if (!S.hasBlob()) {
      if (req.method === 'GET') return res.status(200).end(JSON.stringify({ ok: false, results: [] }));
      return res.status(503).end(JSON.stringify({ error: 'Server storage is not set up (connect a Vercel Blob store).' }));
    }
    if (req.method === 'GET') return res.status(200).end(JSON.stringify({ ok: true, results: await S.allResults() }));
    if (req.method === 'POST') {
      const r = await S.readBody(req);
      if (!r || typeof r.id !== 'string' || !/^[a-z0-9_-]{4,64}$/i.test(r.id) || typeof r.studentId !== 'string' || typeof r.examId !== 'string') return res.status(400).end(JSON.stringify({ error: 'Invalid result' }));
      delete r._synced;
      await S.saveResult(r);
      return res.status(200).end(JSON.stringify({ ok: true }));
    }
    if (req.method === 'DELETE') {
      const current = await S.currentData();
      const pass = req.headers['x-admin-pass'] || '';
      if (!pass || pass !== current.settings.adminPass) return res.status(403).end(JSON.stringify({ error: 'Wrong admin password' }));
      await S.clearResults();
      return res.status(200).end(JSON.stringify({ ok: true }));
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (e) {
    return res.status(500).end(JSON.stringify({ error: String(e && e.message || e) }));
  }
};
