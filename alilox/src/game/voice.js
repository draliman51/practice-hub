// Voice chat over WebRTC (PeerJS public signalling). Peer ids derive from the room code + user id.
const V = { peer: null, stream: null, calls: new Map(), audios: new Map(), muted: false, room: '', me: '' };
export const peerIdFor = (room, uid) => `alilox-${room}-${uid.replace(/-/g, '').slice(0, 12)}`;
export async function voiceJoin(room, uid, onState) {
  if (V.peer) return; V.room = room; V.me = uid;
  const { default: Peer } = await import('peerjs');
  const peer = new Peer(peerIdFor(room, uid), { debug: 0 }); V.peer = peer;
  peer.on('call', (call) => { call.answer(V.stream || undefined); hook(call); });
  peer.on('error', (e) => { if (e && e.type !== 'peer-unavailable') onState && onState('error:' + (e.type || e.message)); });
  peer.on('open', () => onState && onState('ready'));
  peer.on('disconnected', () => { try { peer.reconnect(); } catch { } });
}
function hook(call) { V.calls.set(call.peer, call); call.on('stream', (s) => { let a = V.audios.get(call.peer); if (!a) { a = document.createElement('audio'); a.autoplay = true; a.playsInline = true; document.body.append(a); V.audios.set(call.peer, a); } a.srcObject = s; a.play().catch(() => { }); }); call.on('close', () => V.calls.delete(call.peer)); }
export async function voiceMic(memberIds) {
  if (V.stream) { V.muted = !V.muted; V.stream.getAudioTracks().forEach((t) => (t.enabled = !V.muted)); return V.muted ? 'muted' : 'on'; }
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-mic');
  V.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false }); V.muted = false;
  V.audios.forEach((a) => a.play().catch(() => { })); voiceDial(memberIds); return 'on';
}
export function voiceDial(memberIds) { if (!V.stream || !V.peer) return; memberIds.forEach((id) => { if (id === V.me) return; const pid = peerIdFor(V.room, id); if (!V.calls.has(pid)) { try { hook(V.peer.call(pid, V.stream)); } catch { } } }); }
export const voiceState = () => (V.stream ? (V.muted ? 'muted' : 'on') : 'off');
export function voiceLeave() { V.calls.forEach((c) => { try { c.close(); } catch { } }); V.calls.clear(); V.audios.forEach((a) => a.remove()); V.audios.clear(); if (V.stream) { V.stream.getTracks().forEach((t) => t.stop()); V.stream = null; } if (V.peer) { try { V.peer.destroy(); } catch { } } V.peer = null; V.muted = false; }
