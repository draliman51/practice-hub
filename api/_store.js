// Tiny JSON store on Vercel Blob. Works without configuration once a Blob store is
// connected to the project (BLOB_READ_WRITE_TOKEN is injected automatically).
// Every write creates a NEW blob (data-v<rev>.json, results/<id>.json) so the CDN cache
// never serves stale content and concurrent writes never overwrite each other.
const fs = require('fs');
const path = require('path');

const MEM = global.__memStore || (global.__memStore = new Map()); // local dev: MEMORY_STORE=1
const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.MEMORY_STORE;
async function blob() { return await import('@vercel/blob'); }

async function listAll(prefix) {
  if (process.env.MEMORY_STORE) return [...MEM.keys()].filter(k => k.startsWith(prefix)).map(k => ({ pathname: k, url: 'mem:' + k }));
  const { list } = await blob();
  const out = []; let cursor;
  do {
    const r = await list({ prefix, limit: 1000, cursor });
    out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}
async function fetchJson(b) {
  if (process.env.MEMORY_STORE) return JSON.parse(MEM.get(b.pathname));
  const r = await fetch(b.url, { cache: 'no-store' });
  if (!r.ok) return null;
  return await r.json();
}
async function putJson(name, obj) {
  if (process.env.MEMORY_STORE) { MEM.set(name, JSON.stringify(obj)); return; }
  const { put } = await blob();
  await put(name, JSON.stringify(obj), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
}
async function delMany(urls) {
  if (!urls.length) return;
  if (process.env.MEMORY_STORE) { urls.forEach(u => MEM.delete(u.replace(/^mem:/, ''))); return; }
  const { del } = await blob();
  for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100));
}

function seedData() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data.json'), 'utf8'));
}
// Current exams/settings = seed, unless a newer data-v<rev>.json was published.
async function currentData() {
  const seed = seedData();
  if (!hasBlob()) return seed;
  const blobs = await listAll('data-v');
  let best = null, bestRev = -1;
  for (const b of blobs) { const m = /data-v(\d+)\.json$/.exec(b.pathname); if (m && +m[1] > bestRev) { bestRev = +m[1]; best = b; } }
  if (best && bestRev >= (seed.rev || 0)) { const j = await fetchJson(best); if (j) return j; }
  return seed;
}
async function saveData(obj) { await putJson(`data-v${obj.rev}.json`, obj); }

async function allResults() {
  const blobs = await listAll('results/');
  const out = await Promise.all(blobs.map(b => fetchJson(b).catch(() => null)));
  return out.filter(Boolean);
}
async function saveResult(r) { await putJson(`results/${r.id}.json`, r); }
async function clearResults() { const blobs = await listAll('results/'); await delMany(blobs.map(b => b.url)); }

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) return resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
    let s = ''; req.on('data', c => s += c);
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}
module.exports = { hasBlob, seedData, currentData, saveData, allResults, saveResult, clearResults, readBody, noCache };
