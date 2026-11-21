// Tiny JSON store on Vercel Blob (BLOB_READ_WRITE_TOKEN is injected once a Blob store is connected).
// Every score is its own blob (scores/<id>.json) so concurrent writes never collide.
const MEM = global.__memStore || (global.__memStore = new Map()); // local dev: MEMORY_STORE=1
const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.MEMORY_STORE;
async function blob() { return await import('@vercel/blob'); }
async function listAll(prefix) {
  if (process.env.MEMORY_STORE) return [...MEM.keys()].filter(k => k.startsWith(prefix)).map(k => ({ pathname: k, url: 'mem:' + k }));
  const { list } = await blob(); const out = []; let cursor;
  do { const r = await list({ prefix, limit: 1000, cursor }); out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  return out;
}
async function fetchJson(b) {
  if (process.env.MEMORY_STORE) return JSON.parse(MEM.get(b.pathname));
  const r = await fetch(b.url, { cache: 'no-store' }); return r.ok ? await r.json() : null;
}
async function putJson(name, obj) {
  if (process.env.MEMORY_STORE) { MEM.set(name, JSON.stringify(obj)); return; }
  const { put } = await blob();
  await put(name, JSON.stringify(obj), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
}
async function delMany(urls) {
  if (!urls.length) return;
  if (process.env.MEMORY_STORE) { urls.forEach(u => MEM.delete(u.replace(/^mem:/, ''))); return; }
  const { del } = await blob(); for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100));
}
async function allScores() { const bs = await listAll('scores/'); return (await Promise.all(bs.map(b => fetchJson(b).catch(() => null)))).filter(Boolean); }
async function saveScore(r) { await putJson(`scores/${r.id}.json`, r); }
async function clearScores() { const bs = await listAll('scores/'); await delMany(bs.map(b => b.url)); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) return resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
    let s = ''; req.on('data', c => s += c); req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } }); req.on('error', reject);
  });
}
function noCache(res) { res.setHeader('Cache-Control', 'no-store, max-age=0'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); }
module.exports = { hasBlob, allScores, saveScore, clearScores, readBody, noCache };
