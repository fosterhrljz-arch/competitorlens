import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWebsite, applyResearch, validateSuggestions, findingCurrent } from '../src/lib/automatedResearch.js';
import { validateBackup, prepareProject, blankCompetitor, changeOpportunity, opportunities } from '../src/lib/model.js';
import { exportCSV, importRows, parseCSV } from '../src/lib/io.js';
import { reportHTML } from '../src/lib/report.js';

export function collectedFixture(name='Atlas',url='https://atlas.example.com/') {
  const blocks=[`${name} analytics for agencies`,`Built for agencies that need simple reporting without cookies.`,`Agencies can manage shared reports and API exports.`,`USD 12 per month. Monthly subscription, cancel anytime.`,`Small businesses use the dashboard to understand campaigns.`];
  return {category:'Home',brand:name,headings:[blocks[0]],blocks,offers:[],source:{id:'source-'+name,title:name+' home',url,excerpt:blocks.join('\n'),method:'fetched',kind:'Public page',collectedAt:'2026-11-12T12:00:00.000Z',fields:[],segmentMappings:[]}};
}
const project=()=>prepareProject({id:'p',name:'Research',industry:'Analytics',demo:false,createdAt:'2026-11-12',competitors:[],opportunityState:{}});
const runFor=(results,id='run-1')=>({id,startedAt:'2026-11-12T12:00:00.000Z',events:[],results});

test('Automated proposals use exact quotations and separate direct website claims from audience inferences',()=>{
  const page=collectedFixture(),r=analyzeWebsite(page.source.url,[page]);
  assert.equal(r.name,'Atlas');assert.ok(r.findings.some(f=>f.field==='features'));assert.ok(r.findings.some(f=>f.field==='audiences'&&f.text==='Agencies'));
  assert.ok(r.findings.some(f=>f.field==='needs'&&f.segment==='Agencies'&&f.kind==='inference'));
  for(const f of r.findings){assert.ok(page.source.excerpt.includes(f.quote));assert.ok(['high','medium','low'].includes(f.confidence));assert.ok(f.reason);}
  assert.ok(!r.findings.some(f=>['traffic','marketShare','breadth','tier'].includes(f.field)));
});

test('Navigation-only audiences do not receive invented needs, and ambiguous dollar prices stay qualitative',()=>{
  const p=collectedFixture();p.headings=['Private analytics'];p.blocks=['Website audience link: Agencies','Privacy-friendly reports without cookies.','$15 per month. Cancel anytime.'];p.source.excerpt=p.blocks.join('\n');
  const r=analyzeWebsite(p.source.url,[p]);assert.ok(r.findings.some(f=>f.field==='audiences'));assert.ok(!r.findings.some(f=>f.segment==='Agencies'));
  assert.equal(r.findings.find(f=>f.field==='pricing').price,null);
});

test('Generic for-phrases and explicitly unavailable features are not promoted to audiences or capabilities',()=>{
  const page=collectedFixture();page.headings=['No need for cookie banners or GDPR consent','Sign up for an account','Useful for tracking e-commerce events'];page.blocks=[...page.headings,'No API access is provided.','A simple website analytics service.'];page.source.excerpt=page.blocks.join('\n');
  const result=analyzeWebsite(page.source.url,[page]);assert.ok(!result.findings.some(f=>f.field==='audiences'&&/cookie banners|an account|tracking e-commerce events/i.test(f.text)));assert.ok(!result.findings.some(f=>f.field==='features'&&f.text==='API access'));
});

test('Founder biographies and adjacent company-wide copy cannot fabricate audience-specific needs',()=>{
  const page=collectedFixture();page.headings=['Tools for agencies','Our story'];page.blocks=['Tools for agencies','Agencies need shared reporting and data exports.','Our story','Simple Analytics started in 2018 with Adrian, a developer from the Netherlands.','Privacy makes our business model sustainable.','Website audience link: Educators','Privacy-friendly analytics for your website.'];page.source.excerpt=page.blocks.join('\n');
  const r=analyzeWebsite(page.source.url,[page]);assert.ok(!r.findings.some(f=>f.field==='audiences'&&f.text==='Developers'));assert.ok(!r.findings.some(f=>f.segment==='Educators'));assert.ok(r.findings.some(f=>f.field==='needs'&&f.segment==='Agencies'&&f.quote==='Agencies need shared reporting and data exports.'));assert.ok(!r.findings.some(f=>f.segment&&/business model|Netherlands/.test(f.quote)));
});

test('Revenue is not pricing; explicit analyst price confirmation stays linked and round-trips',()=>{
  const page=collectedFixture();page.blocks.push('The company reached $1 million in annual recurring revenue.');page.source.excerpt=page.blocks.join('\n');const r=analyzeWebsite(page.source.url,[page]);assert.ok(!r.findings.some(f=>f.field==='pricing'&&/revenue/.test(f.text)));
  const f=r.findings.find(f=>f.field==='pricing');r.reviewedPrice={amount:'12',currency:'USD',unit:'month',findingId:f.id,reason:'Confirmed USD monthly plan from the selected quotation.'};
  const p=applyResearch(project(),runFor([r]));assert.equal(p.competitors[0].priceAmount,'12');assert.match(p.competitors[0].priceNoteReview.reason,/Confirmed/);
  const restored=validateBackup({version:3,activeId:p.id,projects:[p]});assert.deepEqual(restored.projects[0].researchHistory[0].results[0].reviewedPrice,r.reviewedPrice);
  r.reviewedPrice.reason='';assert.throws(()=>applyResearch(project(),runFor([r])),/confirmation/);
});

test('Accepted research merges atomically, links audience sources, and preserves history through schema-3 and CSV round trips',()=>{
  const a=collectedFixture(),b=collectedFixture('Beacon','https://beacon.example.com/');
  const results=[a,b].map(p=>({...analyzeWebsite(p.source.url,[p]),include:true}));
  const original=project(),saved=applyResearch(original,runFor(results));assert.equal(original.competitors.length,0);assert.equal(saved.competitors.length,2);
  for(const c of saved.competitors){assert.ok(c.researchFindings.length);assert.equal(c.breadth,'');assert.equal(c.tier,'');const audience=c.audienceResearch.find(a=>a.label==='Agencies');assert.ok(audience.needs);assert.ok(c.sources.some(s=>s.segmentMappings.some(m=>m.segmentId===audience.id&&m.fields.includes('needs'))));}
  const state={version:4,activeId:saved.id,projects:[saved]},restored=validateBackup(JSON.parse(JSON.stringify(state)));assert.deepEqual(restored,state);
  const csv=importRows(parseCSV(exportCSV(saved.competitors)));assert.deepEqual(csv[0].researchFindings,saved.competitors[0].researchFindings);
  assert.deepEqual(csv[0].sources,saved.competitors[0].sources);
});

test('Updating research retains manual values, earlier source snapshots, and validated opportunity decisions',()=>{
  const a=collectedFixture(),b=collectedFixture('Beacon','https://beacon.example.com/');let p=applyResearch(project(),runFor([a,b].map(x=>({...analyzeWebsite(x.source.url,[x]),include:true}))));
  const c=p.competitors[0];c.needs='Original general notes';c.priceAmount='99';c.priceUnit='year';c.currency='EUR';
  const current=opportunities(p)[0];p=changeOpportunity(p,current.id,{status:'Validated',note:'Keep my earlier decision.'});
  const newer=collectedFixture();newer.source.id='new-source';newer.source.excerpt+='\nNew public statement for agencies.';newer.blocks.push('New public statement for agencies.');
  const r=analyzeWebsite(newer.source.url,[newer]);r.findings.find(f=>f.price).applyPrice=true;
  p=applyResearch(p,runFor([r],'run-2'));assert.equal(p.competitors[0].needs,'Original general notes');assert.equal(p.competitors[0].priceAmount,'99');assert.equal(p.researchHistory.length,2);
  assert.ok(opportunities(p,true).some(o=>o.note==='Keep my earlier decision.'&&o.lifecycle==='stale'));
  p.competitors=[];const state=validateBackup({version:3,activeId:p.id,projects:[p]});assert.equal(state.projects[0].researchHistory[0].results[0].pages[0].source.excerpt,a.source.excerpt);
});

test('Unselected findings are retained in research history but not applied; limits reject the entire batch',()=>{
  const page=collectedFixture(),r=analyzeWebsite(page.source.url,[page]);r.findings.forEach(f=>f.selected=false);
  const p=applyResearch(project(),runFor([r]));assert.deepEqual(p.competitors[0].features,[]);assert.equal(p.competitors[0].researchFindings.length,0);assert.ok(p.researchHistory[0].results[0].findings.length);
  const full=project();full.competitors=Array.from({length:5},(_,i)=>({...blankCompetitor(),name:'Original '+i,url:`https://original${i}.example.com`}));const before=JSON.stringify(full);assert.throws(()=>applyResearch(full,runFor([r])),/five competitors/);assert.equal(JSON.stringify(full),before);
});

test('Optional AI suggestions require existing exact evidence and remain deselected low-confidence inferences',()=>{
  const page=collectedFixture(),r=analyzeWebsite(page.source.url,[page]);const f={field:'needs',text:'Potential reporting need',segment:'Agencies',sourceId:page.source.id,quote:page.blocks[1]};
  const [checked]=validateSuggestions([f],r);assert.equal(checked.selected,false);assert.equal(checked.kind,'inference');assert.equal(checked.confidence,'low');
  assert.throws(()=>validateSuggestions([{...f,quote:'Fabricated evidence cannot be linked.'}],r),/exact quotation/);
  assert.throws(()=>validateSuggestions([{...f,field:'traffic'}],r),/supported field/);
  assert.throws(()=>validateSuggestions([{...f,field:'products'}],r),/supported field/);
});

test('Removed current sources do not corrupt saved research; changed notes are identified as earlier findings',()=>{
  const page=collectedFixture(),p=applyResearch(project(),runFor([analyzeWebsite(page.source.url,[page])])),c=p.competitors[0],f=c.researchFindings.find(f=>f.field==='products');
  assert.equal(findingCurrent(c,f),true);c.products='Edited profile';c.sources=[];assert.equal(findingCurrent(c,f),false);
  const restored=validateBackup({version:3,activeId:p.id,projects:[p]});assert.equal(restored.projects[0].competitors[0].researchFindings.length,c.researchFindings.length);
  const html=reportHTML(restored.projects[0]);assert.match(html,/Earlier finding; current record differs/);assert.match(html,/Confidence describes extraction evidence/);
});

test('Schema-2 migration adds research metadata without changing prior opportunity status or sources',()=>{
  const p=project();p.competitors=[collectedFixture('One','https://one.example.com/'),collectedFixture('Two','https://two.example.com/')].map((x,i)=>({...blankCompetitor(),name:x.brand,url:x.source.url+(i?'two':''),products:'Subscription',sources:[x.source]}));
  let before=prepareProject(p);before=changeOpportunity(before,opportunities(before)[0].id,{status:'Validated',note:'V1.3 decision'});
  const state={version:2,activeId:p.id,projects:[before]},after=validateBackup(state);assert.equal(after.version,4);assert.deepEqual(after.projects[0].opportunityHistory,before.opportunityHistory);assert.deepEqual(after.projects[0].competitors[0].sources,before.competitors[0].sources);
});
