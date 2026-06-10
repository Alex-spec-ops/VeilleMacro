// Reprend le polling sur la conversation déjà lancée pour observer la transition
// vers le 3e agent (dashboard) sans relancer un run.
import fs from 'fs';
const KEY = fs.readFileSync('.env', 'utf8').match(/^DUST_API_KEY=(.+)$/m)[1].trim();
const WS = 'vTiqcjUPSf';
const CONV = 'dwV6NZM4zq';
const BASE = 'https://eu.dust.tt/api/v1';
const H = { Authorization: `Bearer ${KEY}` };
const LOG = 'diag_dust.log';
const log = (s) => { fs.appendFileSync(LOG, s + '\n'); console.log(s); };
log(`=== RESUME ${new Date().toISOString()} conv=${CONV} ===`);
const t0 = Date.now();
let n = 0;
while (Date.now() - t0 < 28 * 60 * 1000) {
  await new Promise((r) => setTimeout(r, 15000));
  n++;
  try {
    const rr = await fetch(`${BASE}/w/${WS}/assistant/conversations/${CONV}`, { headers: H });
    if (!rr.ok) { log(`[R${n}] GET ${rr.status}`); continue; }
    const txt = await rr.text();
    const d = JSON.parse(txt);
    const flat = (d.conversation?.content ?? []).flat();
    const agentMsgs = flat.filter((m) => m.type === 'agent_message');
    const last = [...agentMsgs].reverse()[0];
    log(`[R${n}] t+${Math.round((Date.now()-t0)/1000)}s bytes=${txt.length} agentMsgs=${agentMsgs.length} lastStatus=${last?.status}`);
    agentMsgs.forEach((m, i) => {
      const acts = (m.actions ?? []).map((a) => `${a.internalMCPServerName||'?'}:${(a.functionCallName||'?').slice(0,40)}=${a.status}${a.generatedFiles?.length?`(files:${a.generatedFiles.map(f=>f.contentType).join('|')})`:''}`);
      log(`   AM#${i} status=${m.status} contentLen=${(m.content||'').length} actions=${acts.length?acts.join(' ; '):'(none)'}`);
    });
    if (last?.status === 'succeeded') { log(`DONE succeeded R${n}`); break; }
    if (last?.status === 'failed' || last?.error) { log(`FAILED ${JSON.stringify(last?.error)}`); break; }
  } catch (e) { log(`[R${n}] ERR ${e.message}`); }
}
log('=== RESUME END ===');
