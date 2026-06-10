// Diagnostic : lance un run orchestrateur et journalise la structure réelle de
// la conversation à chaque poll, pour voir où/comment ça cale au 3e agent.
import fs from 'fs';

const KEY = fs.readFileSync('.env', 'utf8').match(/^DUST_API_KEY=(.+)$/m)[1].trim();
const WS = 'vTiqcjUPSf';
const ORCH = 'QJsSBMTnS8';
const BASE = 'https://eu.dust.tt/api/v1';
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const LOG = 'diag_dust.log';
const log = (s) => { fs.appendFileSync(LOG, s + '\n'); console.log(s); };

fs.writeFileSync(LOG, `=== DIAG START ${new Date().toISOString()} ===\n`);

const prompt = 'Effectue une analyse macro complète pour la période du 01/06/2026 au 09/06/2026. ' +
  'Collecte les publications stratégiques récentes des principales maisons de recherche, ' +
  'analyse et synthétise les convergences et divergences entre analystes, ' +
  'génère les données structurées du dashboard CIO et le rapport PDF final de recherche.';

const r = await fetch(`${BASE}/w/${WS}/assistant/conversations`, {
  method: 'POST', headers: H,
  body: JSON.stringify({
    title: 'DIAG MacroSynthAI', visibility: 'unlisted',
    message: { content: prompt, context: { timezone: 'Europe/Paris', username: 'diag', fullName: 'Diag', email: 'alexdecarbof71@gmail.com', profilePictureUrl: null }, mentions: [{ configurationId: ORCH }] },
  }),
});
const data = await r.json();
const conv = data.conversation?.sId;
log(`POST ${r.status} convSId=${conv}`);
if (!conv) { log('NO CONV ID: ' + JSON.stringify(data).slice(0, 500)); process.exit(1); }

let n = 0;
const t0 = Date.now();
while (Date.now() - t0 < 30 * 60 * 1000) {
  await new Promise((res) => setTimeout(res, 15000));
  n++;
  let d;
  try {
    const rr = await fetch(`${BASE}/w/${WS}/assistant/conversations/${conv}`, { headers: H });
    if (!rr.ok) { log(`[${n}] GET ${rr.status}`); continue; }
    const txt = await rr.text();
    log(`[${n}] t+${Math.round((Date.now()-t0)/1000)}s GET 200 bodyBytes=${txt.length}`);
    d = JSON.parse(txt);
  } catch (e) { log(`[${n}] ERR ${e.message}`); continue; }

  const content = d.conversation?.content ?? [];
  const flat = content.flat();
  const types = flat.map((m) => m.type);
  const agentMsgs = flat.filter((m) => m.type === 'agent_message');
  const last = [...agentMsgs].reverse()[0];
  log(`   msgTypes=[${types.join(',')}] agentMsgCount=${agentMsgs.length} lastStatus=${last?.status}`);
  // Per agent_message: actions summary
  agentMsgs.forEach((m, i) => {
    const acts = (m.actions ?? []).map((a) =>
      `${a.internalMCPServerName||'?'}:${a.functionCallName||'?'}=${a.status}${a.generatedFiles?.length?`(files:${a.generatedFiles.map(f=>f.contentType).join('|')})`:''}`);
    log(`   AM#${i} status=${m.status} contentLen=${(m.content||'').length} actions=${acts.length?acts.join(' ; '):'(none)'}`);
  });

  if (last?.status === 'succeeded') { log(`DONE succeeded at poll ${n}`); break; }
  if (last?.status === 'failed' || last?.error) { log(`FAILED: ${JSON.stringify(last?.error)}`); break; }
}
log('=== DIAG END ===');
