import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { emptyWorkspace, validateBackup, prepareProject, audienceRecord, sourceFor, opportunities, changeOpportunity, blankCompetitor, ensureAudienceResearch, priceLabel } from '../src/lib/model.js';
import { realWorkspace } from './fixtures.mjs';
import { sourceLabel } from '../src/lib/provenance.js';
import { priceGroups, seriesColor } from '../src/lib/analytics.js';
import { pricingStatus, pricingSignature } from '../src/lib/pricing.js';
import { importRows, parseCSV, exportCSV } from '../src/lib/io.js';
import { reportHTML } from '../src/lib/report.js';

test('Empty persistent workspace contains no implicit demo and round-trips',()=>{
  assert.deepEqual(emptyWorkspace(),{version:4,activeId:'',projects:[]});
  assert.deepEqual(validateBackup(emptyWorkspace()),emptyWorkspace());
  assert.throws(()=>validateBackup({...emptyWorkspace(),activeId:'ghost'}));
});

for(const release of ['V1','V1.1','V1.2']) test(`${release} schema-1 migration preserves every old field and orphaned validation note`,async()=>{
  const legacy=JSON.parse(await readFile(new URL('../examples/demo-project.json',import.meta.url),'utf8'));
  legacy.projects[0].opportunityState['old-unavailable-hypothesis']={status:'Validated',note:'Interview notes\nKeep every word.'};
  legacy.projects[0].opportunityState.flexibility={status:'Validated',note:'Legacy decision; original evidence was not snapshotted.'};
  const old=legacy.projects[0].competitors[0];old.demo=false;old.sources.forEach(s=>s.kind='Manual note');old.sources[0].kind='Public page';old.sources[0].url='https://research.example/';
  const before=structuredClone(legacy), migrated=validateBackup(legacy), p=migrated.projects[0];
  assert.deepEqual(legacy,before);assert.equal(migrated.version,4);
  for(let i=0;i<p.competitors.length;i++) for(const [key,val] of Object.entries(before.projects[0].competitors[i])) {
    if(key==='sources') { for(let j=0;j<val.length;j++) for(const [sk,sv] of Object.entries(val[j])) assert.deepEqual(p.competitors[i].sources[j][sk],sv); }
    else assert.deepEqual(p.competitors[i][key],val);
  }
  assert.ok(p.competitors.every(c=>c.audienceResearch.every(a=>!a.needs&&!a.motivations&&!a.interests&&!a.behavior)));
  assert.match(sourceLabel(p.competitors[0].sources[0]),/collection method unknown/);
  const retained=opportunities(p,true).find(o=>o.id==='old-unavailable-hypothesis');assert.equal(retained.note,'Interview notes\nKeep every word.');assert.equal(retained.lifecycle,'stale');
  assert.equal(opportunities(p,true).find(o=>o.id==='flexibility').lifecycle,'stale');
  assert.equal(opportunities(p).find(o=>o.ruleKey==='flexibility').status,'To explore');
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(migrated))),migrated);
});

test('Audience mappings stay specific and removed labels retain research and evidence',()=>{
  const state=realWorkspace(),c=state.projects[0].competitors[0],a=audienceRecord(c,'Small studios'),b=audienceRecord(c,'Solo creators');
  c.sources[0].segmentMappings=[{segmentId:a.id,fields:['needs']}];
  assert.equal(sourceFor(c,'needs',a.id).length,1);assert.equal(sourceFor(c,'needs',b.id).length,0);
  assert.notEqual(a.needs,b.needs);c.audiences=['Solo creators'];
  const next=validateBackup(state).projects[0].competitors[0];assert.deepEqual(audienceRecord(next,'Small studios'),a);assert.equal(sourceFor(next,'needs',a.id).length,1);
  assert.equal(next.needs,c.needs);
});

test('Validated snapshots survive changed signals and deleted competitors without duplicate revisions on reload',()=>{
  let p=realWorkspace().projects[0];const id=opportunities(p).find(o=>o.ruleKey==='flexibility').id;
  p=changeOpportunity(p,id,{status:'Validated',note:'Validated only for the original offer.'});
  const snapshot=structuredClone(p.opportunityHistory.find(o=>o.id===id));
  p=prepareProject({...p,competitors:p.competitors.slice(1)});
  const old=opportunities(p,true).find(o=>o.id===id);assert.equal(old.lifecycle,'stale');assert.equal(old.note,snapshot.note);assert.equal(old.status,'Validated');assert.deepEqual(old.basis[0].sources,snapshot.basis[0].sources);assert.equal(old.basis[0].c,null);
  const restored=validateBackup({version:2,activeId:p.id,projects:[p]});assert.equal(restored.projects[0].opportunityHistory.length,p.opportunityHistory.length);
  assert.equal(prepareProject(restored.projects[0]).opportunityHistory.length,p.opportunityHistory.length);
});

test('Hypothesis rules distinguish records, mapped evidence, keyword signals, and unsupported gaps',()=>{
  const p=realWorkspace().projects[0];p.competitors.forEach(c=>{c.sources=[];});
  const ops=opportunities(p);const plan=ops.find(o=>o.ruleKey==='flexibility');
  assert.equal(plan.basis.reduce((n,b)=>n+b.sources.length,0),0);assert.match(plan.reason,/keyword signal/);
  const gap=ops.find(o=>o.ruleKey.startsWith('audience:'));assert.match(gap.reason,/documentation gap/);assert.match(gap.limitation,/not market coverage/);
});

test('Pricing rejects incomplete values and conflicts, preserves zero, and records explicit note review',()=>{
  const c={...blankCompetitor(),priceAmount:0,currency:'USD',priceUnit:'month',pricing:'Free plan'};
  assert.equal(pricingStatus(c).valid,true);assert.match(priceLabel(c),/USD 0/);
  for(const patch of [{currency:'ZZZ'},{priceUnit:''},{priceUnit:'unit'},{priceAmount:Infinity},{priceAmount:-1}]) assert.equal(pricingStatus({...c,...patch}).valid,false);
  const conflict={...c,priceAmount:20,pricing:'EUR 12 per year'};assert.equal(pricingStatus(conflict).conflicts.length,3);assert.equal(priceGroups([conflict]).length,0);assert.equal(priceLabel(conflict),'Needs pricing review');
  conflict.priceNoteReview={signature:pricingSignature(conflict),reason:'Notes refer to the previous annual EUR offer; numeric amount is the current monthly USD offer.'};assert.equal(pricingStatus(conflict).valid,true);
  conflict.priceAmount=21;assert.equal(pricingStatus(conflict).valid,false);
  assert.equal(pricingStatus({...c,priceAmount:20,pricing:'€20 per month'}).valid,false);
});

test('Five competitors get unique persistent colors even with duplicate imported indices',()=>{
  const competitors=Array.from({length:5},(_,i)=>({...blankCompetitor(),id:`same-hash-${i}`,name:`Competitor ${i}`,seriesIndex:0}));
  const p=prepareProject({...realWorkspace().projects[0],competitors});assert.equal(new Set(p.competitors.map(seriesColor)).size,5);
  const reordered=prepareProject({...p,competitors:[...p.competitors].reverse()});for(const c of reordered.competitors)assert.equal(seriesColor(c),seriesColor(p.competitors.find(o=>o.id===c.id)));
});

test('CSV preserves audience research, all source methods and mappings, and rejects incomplete source columns',()=>{
  const p=realWorkspace().projects[0], imported=importRows(parseCSV(exportCSV(p.competitors)));
  imported.forEach((c,i)=>{assert.deepEqual(c.audienceResearch,p.competitors[i].audienceResearch);assert.deepEqual(c.sources,p.competitors[i].sources);assert.equal(c.demo,false);});
  assert.throws(()=>importRows([{name:'Incomplete',source_url:'https://research.example'}]),/excerpt/);
  assert.throws(()=>importRows([{name:'Wrong mapping',source_excerpt:'Research',source_fields:'not_a_field'}]),/unsupported field/);
  const pasted=importRows([{name:'Pasted',source_url:'https://research.example',source_excerpt:'User-entered text.'}])[0];assert.equal(pasted.sources[0].method,'pasted');assert.match(sourceLabel(pasted.sources[0]),/User-supplied/);
});

test('Reports state selected scope, keep audience-specific notes separate, and include history/provenance safely',()=>{
  let p=realWorkspace().projects[0];const id=opportunities(p)[0].id;p=changeOpportunity(p,id,{status:'Validated',note:'Historical validation <script>unsafe</script>'});p=prepareProject({...p,competitors:p.competitors.map((c,i)=>i?c:{...c,products:'A changed offer'})});
  const html=reportHTML(p,{competitorIds:[p.competitors[0].id,p.competitors[1].id]});
  assert.match(html,/2 of 3 project records/);assert.match(html,/Opportunity validation history/);assert.match(html,/Stale \/ Needs review/);assert.match(html,/Historical validation &lt;script&gt;/);assert.ok(!html.includes('<script>'));
  assert.match(html,/User-supplied excerpt/);assert.match(html,/Fetched page text/);assert.match(html,/Competitor-wide research/);assert.match(html,/Audience-specific analysis/);assert.match(html,/Scale: 0–2/);
});
